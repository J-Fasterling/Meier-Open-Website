'use client'
import { useEffect } from 'react'

export function useKonamiConfetti() {
  useEffect(() => {
    const seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
    let pos = 0

    const fire = () => {
      const host = document.createElement('div')
      host.style.position = 'fixed'
      host.style.inset = '0'
      host.style.pointerEvents = 'none'
      host.style.zIndex = '9999'
      document.body.appendChild(host)

      const colors = ['#f43f5e', '#f59e0b', '#06b6d4', '#22c55e', '#ffffff']
      const pieces = 60
      for (let i = 0; i < pieces; i += 1) {
        const piece = document.createElement('span')
        const size = 4 + Math.random() * 7
        piece.style.position = 'absolute'
        piece.style.left = `${50 + (Math.random() - 0.5) * 30}%`
        piece.style.top = '12%'
        piece.style.width = `${size}px`
        piece.style.height = `${size * 1.4}px`
        piece.style.borderRadius = '2px'
        piece.style.background = colors[Math.floor(Math.random() * colors.length)] || '#fff'
        piece.style.opacity = '0.96'
        host.appendChild(piece)

        const x = (Math.random() - 0.5) * 480
        const y = 360 + Math.random() * 260
        piece.animate(
          [
            { transform: 'translate3d(0, 0, 0) rotate(0deg)', opacity: 1 },
            { transform: `translate3d(${x}px, ${y}px, 0) rotate(${360 + Math.random() * 480}deg)`, opacity: 0.2 },
          ],
          { duration: 1200 + Math.random() * 600, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'forwards' }
        )
      }

      setTimeout(() => host.remove(), 2100)
    }

    function handler(e: KeyboardEvent) {
      if (e.key !== seq[pos]) {
        pos = 0
        return
      }

      pos += 1
      if (pos === seq.length) {
        fire()
        pos = 0
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
