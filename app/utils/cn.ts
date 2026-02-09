import { clsx, type ClassValue } from 'clsx'

// cheap version of real cn
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
