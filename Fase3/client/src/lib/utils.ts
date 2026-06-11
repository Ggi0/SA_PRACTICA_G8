import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Función utilitaria de shadcn para combinar clases de Tailwind sin conflictos
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}