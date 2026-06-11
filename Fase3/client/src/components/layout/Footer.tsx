import { Film } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border py-8" style={{ backgroundColor: '#1B1717' }}>
      <div className="container mx-auto px-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Film className="h-4 w-4" style={{ color: '#810100' }} />
          <span style={{ fontFamily: 'Playfair Display, Georgia, serif' }} className="text-white font-medium">
            CineMax
          </span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
        <p className="text-xs text-white/40">
          Práctica 2 · Software Avanzado 
        </p>
      </div>
    </footer>
  )
}