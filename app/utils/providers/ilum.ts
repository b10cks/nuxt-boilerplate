import { defineProvider } from '@nuxt/image/runtime'

export type IlumCropMode = 'fill' | 'fit' | 'crop'
type IlumGravityPreset = 'face' | 'center' | 'auto'
type IlumGravityPoint = { x: number; y: number }
type IlumGravityString = `${number}${'' | 'p'}_${number}${'' | 'p'}`

export type IlumGravity = IlumGravityPreset | IlumGravityString | IlumGravityPoint

export interface IlumTransformations {
  width?: number
  height?: number
  crop?: IlumCropMode
  gravity?: IlumGravity
  x?: number
  y?: number
  targetWidth?: number
  targetHeight?: number
}

export interface IlumModifiers extends IlumTransformations {
  quality?: number
  format?: string
  path?: string
}

interface IlumProviderOptions {
  modifiers?: IlumModifiers
  baseURL?: string
}

function isGravityPoint(value: IlumGravity | undefined): value is IlumGravityPoint {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.x === 'number' &&
    typeof value.y === 'number'
  )
}

function serializeGravity(gravity: IlumGravity | undefined): string | undefined {
  if (!gravity) {
    return undefined
  }

  if (isGravityPoint(gravity)) {
    return `${Math.round(gravity.x)}p_${Math.round(gravity.y)}p`
  }

  return gravity
}

function serializeOperation(key: string, value: string | number | undefined): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  return `${key}_${value}`
}

function buildOperations(modifiers: IlumTransformations): string {
  return [
    serializeOperation('w', modifiers.width),
    serializeOperation('h', modifiers.height),
    serializeOperation('c', modifiers.crop),
    serializeOperation('g', serializeGravity(modifiers.gravity)),
    serializeOperation('x', modifiers.x),
    serializeOperation('y', modifiers.y),
    serializeOperation('tw', modifiers.targetWidth),
    serializeOperation('th', modifiers.targetHeight),
  ]
    .filter((value): value is string => Boolean(value))
    .join(',')
}

function normalizeBaseURL(baseURL: string): string {
  return baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL
}

function normalizePath(src: string): string {
  return src.startsWith('/') ? src : `/${src}`
}

export default defineProvider({
  getImage(src: string, { modifiers = {}, baseURL = '' }: IlumProviderOptions = {}) {
    const { format, quality, path: _path, ...transformations } = modifiers

    const [rawPath, rawQuery = ''] = normalizePath(src).split('?', 2)
    const operations = buildOperations(transformations)
    const searchParams = new URLSearchParams(rawQuery)

    if (format) {
      searchParams.set('format', format)
    }

    if (quality !== undefined) {
      searchParams.set('quality', String(quality))
    }

    const finalPath = operations ? `${rawPath}/${operations}` : rawPath
    const queryString = searchParams.toString()

    return {
      url: `${normalizeBaseURL(baseURL)}${finalPath}${queryString ? `?${queryString}` : ''}`,
    }
  },
})
