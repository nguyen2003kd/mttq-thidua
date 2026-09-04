import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function daysBetween(from: string | Date, to: string | Date): number {
  const d1 = typeof from === 'string' ? new Date(from) : from
  const d2 = typeof to === 'string' ? new Date(to) : to
  return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}
