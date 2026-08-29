import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPHPhoneNumber(phoneStr?: string | null): string {
  if (!phoneStr) return "N/A"
  
  // Extract all digits
  const raw = phoneStr.replace(/\D/g, "")
  
  // Handle 09XXXXXXXXX (11 digits) -> 09XX-XXX-XXXX
  if (raw.startsWith("09") && raw.length === 11) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 7)}-${raw.slice(7, 11)}`
  }
  
  // Handle 639XXXXXXXXX (12 digits) -> +63 9XX-XXX-XXXX
  if (raw.startsWith("639") && raw.length === 12) {
    return `+63 ${raw.slice(2, 5)}-${raw.slice(5, 8)}-${raw.slice(8, 12)}`
  }
  
  // Handle 9XXXXXXXXX (10 digits) -> 09XX-XXX-XXXX
  if (raw.startsWith("9") && raw.length === 10) {
    return `0${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6, 10)}`
  }

  // Fallback if partial length with 09
  if (raw.startsWith("09") && raw.length > 4) {
    if (raw.length <= 7) {
      return `${raw.slice(0, 4)}-${raw.slice(4)}`
    }
    return `${raw.slice(0, 4)}-${raw.slice(4, 7)}-${raw.slice(7)}`
  }

  return phoneStr
}
