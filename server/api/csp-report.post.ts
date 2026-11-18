import type { H3Event } from 'h3'
import { getRequestHeader, getRequestWebStream, sendNoContent } from 'h3'

const MAX_BODY_BYTES = 64 * 1024
const MAX_REPORTS_PER_REQUEST = 10
const MAX_FIELD_LENGTH = 300
const WINDOW_MS = 60_000
const MAX_REQUESTS_PER_CLIENT = 20
// Addresses are cheap to rotate, so the log has a limit of its own.
const MAX_REQUESTS_PER_INSTANCE = 300

const DIRECTIVE = /^[a-z-]{1,40}$/
const EXTENSION = /-extension$/

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/**
 * The part of a reported URL that is safe to log. A query string or fragment
 * can carry a visitor's token. Keywords like `inline` and `eval` are no URLs
 * and pass through, other schemes (`data:`, `blob:`) keep only their name.
 */
function cleanUrl(value: unknown): string {
  if (typeof value !== 'string') return ''
  if (!URL.canParse(value)) {
    const [path = ''] = value.split(/[?#]/, 1)
    return path.replace(/[^\x21-\x7e]/g, '').slice(0, MAX_FIELD_LENGTH)
  }

  const { protocol, origin, pathname } = new URL(value)
  const isWeb = protocol === 'http:' || protocol === 'https:'
  return (isWeb ? origin + pathname : protocol.slice(0, -1)).slice(0, MAX_FIELD_LENGTH)
}

/**
 * Browsers send two formats: the Reporting API (`report-to`) posts an array of
 * `{ type: 'csp-violation', body }`, the older `report-uri` one
 * `{ 'csp-report': {...} }` with kebab-case keys.
 */
function readReport(report: unknown) {
  if (!isRecord(report)) return

  if (report.type === 'csp-violation' && isRecord(report.body)) {
    const { effectiveDirective, blockedURL, documentURL, sourceFile, lineNumber } = report.body
    return {
      directive: effectiveDirective,
      blocked: blockedURL,
      document: documentURL,
      source: sourceFile,
      line: lineNumber,
    }
  }

  const legacy = report['csp-report']
  if (isRecord(legacy)) {
    return {
      directive: legacy['effective-directive'] ?? legacy['violated-directive'],
      blocked: legacy['blocked-uri'],
      document: legacy['document-uri'],
      source: legacy['source-file'],
      line: legacy['line-number'],
    }
  }
}

function toViolation(report: unknown) {
  const raw = readReport(report)
  // An old `violated-directive` carries the directive's whole value.
  const directive = typeof raw?.directive === 'string' ? raw.directive.split(' ', 1)[0] : undefined
  if (!raw || !directive || !DIRECTIVE.test(directive)) return

  const blocked = cleanUrl(raw.blocked)
  const source = cleanUrl(raw.source)
  // Extensions inject their own scripts, which is nothing this site can fix.
  if (EXTENSION.test(blocked) || EXTENSION.test(source)) return

  return {
    directive,
    blocked,
    document: cleanUrl(raw.document),
    source: source || undefined,
    line: typeof raw.line === 'number' && Number.isSafeInteger(raw.line) ? raw.line : undefined,
  }
}

/** The body as text, or undefined above the cap. Never holds more than the cap in memory. */
async function readCappedBody(event: H3Event): Promise<string | undefined> {
  if (Number(getRequestHeader(event, 'content-length')) > MAX_BODY_BYTES) return

  const reader = getRequestWebStream(event)?.getReader()
  if (!reader) return

  const chunks: Uint8Array[] = []
  let size = 0
  // Read to the end even above the cap: the stream cannot be cancelled while
  // the request is still delivering data.
  for (let part = await reader.read(); !part.done; part = await reader.read()) {
    size += part.value.byteLength
    if (size <= MAX_BODY_BYTES) chunks.push(part.value)
  }

  return size <= MAX_BODY_BYTES ? Buffer.concat(chunks).toString() : undefined
}

function parseReports(body: string | undefined): unknown[] {
  if (!body) return []
  try {
    const payload: unknown = JSON.parse(body)
    return Array.isArray(payload) ? payload : [payload]
  } catch {
    return []
  }
}

/**
 * Writes one JSON line per Content-Security-Policy violation to stdout. A
 * script or embed that starts calling a new host shows up in the log instead of
 * failing silently in visitors' browsers.
 *
 * Always answers 204, also for a report it drops: browsers do nothing with the
 * answer, and a sender learns nothing about the limits. Everything logged comes
 * from the visitor, so it is reduced to known fields and serialized as JSON,
 * which keeps a line break in a value from starting a forged log line.
 */
export default defineEventHandler(async (event) => {
  const allowed =
    checkRateLimit(`csp:${rateLimitAddress(event)}`, MAX_REQUESTS_PER_CLIENT, WINDOW_MS) &&
    checkRateLimit('csp', MAX_REQUESTS_PER_INSTANCE, WINDOW_MS)

  if (allowed) {
    const reports = parseReports(await readCappedBody(event))
    for (const report of reports.slice(0, MAX_REPORTS_PER_REQUEST)) {
      const violation = toViolation(report)
      if (violation) console.log(JSON.stringify({ csp: violation }))
    }
  }

  return sendNoContent(event)
})
