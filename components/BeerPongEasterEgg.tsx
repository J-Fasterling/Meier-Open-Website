'use client'
import { useCallback, useEffect, useRef } from 'react'

type Props = {
  containerSelector?: string // Wrapper mit position:relative
  durationSec?: number
  gravity?: number
}

type BeerThrowWindow = Window & {
  __beerThrow?: () => void | Promise<void>
}

export default function BeerPongEasterEgg({
  containerSelector = '#beer-egg-wrap',
  durationSec = 2.0,
  gravity = 2000,
}: Props) {
  const armed = useRef(false)
  const busy = useRef(false)         // verhindert parallele Würfe
  const keyBuf = useRef<string>('')  // Tipp-Puffer (roh)
  const lastTap = useRef<number[]>([]) // 3×-Tap (Mobile)

  const throwOnce = useCallback(async (wrap: HTMLElement) => {
    const anchors = Array.from(wrap.querySelectorAll<SVGGraphicsElement>('[data-cup-anchor]'))
    const wrapRect = wrap.getBoundingClientRect()
    let endX: number, endY: number

    if (anchors.length) {
      const anchor = anchors[Math.floor(Math.random() * anchors.length)]
      const aRect = anchor.getBoundingClientRect()
      endX = aRect.left - wrapRect.left
      endY = aRect.top - wrapRect.top
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[BeerPongEasterEgg] Keine data-cup-anchor Elemente gefunden – fallback zur Wrapper-Mitte')
      }
      // Fallback: ziele auf die Mitte knapp über dem unteren Rand
      endX = Math.round(wrapRect.width / 2)
      endY = Math.max(16, wrapRect.height - 18)
    }

    const startX = Math.max(16, endX - 110)
    const startY = Math.max(12, endY - 36)

    const ball = document.createElement('div')
    Object.assign(ball.style, {
      position: 'absolute',
      left: '0px',
      top: '0px',
      width: '26px',
      height: '26px',
      borderRadius: '50%',
      background: '#fff',
      boxShadow: '0 0 6px rgba(0,0,0,.25)',
      pointerEvents: 'none',
      willChange: 'transform',
      transform: `translate(${startX}px, ${startY}px) scale(1)`,
      zIndex: '999',
    } as CSSStyleDeclaration)
    wrap.appendChild(ball)

    const T = durationSec
    const g = gravity
    const vx0 = (endX - startX) / T
    const vy0 = (endY - startY - 0.5 * g * T * T) / T

    const N = 160
    const frames = Array.from({ length: N }, (_, i) => {
      const t = (i / (N - 1)) * T
      const x = Math.round(startX + vx0 * t)
      const y = Math.round(startY + vy0 * t + 0.5 * g * t * t)
      const s = 1 - 0.18 * (t / T)
      return { transform: `translate(${x}px, ${y}px) scale(${s})`, offset: i / (N - 1) }
    })

    await ball
      .animate(frames, { duration: T * 1000, easing: 'linear', iterations: 1, fill: 'forwards' })
      .finished.catch(() => {})

    await ball
      .animate(
        [{ transform: `${frames[N - 1]!.transform} scale(0.9)`, opacity: 1 }, { opacity: 0 }],
        { duration: 220, easing: 'ease-in', fill: 'forwards' }
      )
      .finished.catch(() => {})

    ball.remove()
  }, [durationSec, gravity])

  useEffect(() => {
    if (armed.current) return
    armed.current = true
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[BeerPongEasterEgg] armed')
    }

    const wrap = document.querySelector(containerSelector) as HTMLElement | null
    if (!wrap) return
    // Fallback: stelle sicher, dass absolute Kinder relativ positioniert werden können
    if (getComputedStyle(wrap).position === 'static') {
      wrap.style.position = 'relative'
    }

    const normalize = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Ü -> u

    const trigger = async () => {
      if (busy.current) return
      busy.current = true
      try {
        await throwOnce(wrap)
      } finally {
        busy.current = false
      }
    }

    const onKey = (e: KeyboardEvent) => {
      const ch = e.key ?? ''
      if (ch.length !== 1) return
      keyBuf.current = (keyBuf.current + ch).slice(-8)
      const norm = normalize(keyBuf.current)
      if (norm.includes('uben') || norm.includes('ueben')) trigger()
    }

    const onTouch = () => {
      const now = Date.now()
      lastTap.current = [...lastTap.current, now].slice(-3)
      if (lastTap.current.length === 3 && now - lastTap.current[0] < 1200) trigger()
    }

    // Extra-Trigger: Doppelklick im Wrapper (Desktop)
    const onDblClick = () => trigger()
    wrap.addEventListener('dblclick', onDblClick)

    // Debug: manuell aus der Konsole startbar: window.__beerThrow()
    ;(window as BeerThrowWindow).__beerThrow = trigger

    document.addEventListener('keydown', onKey)
    wrap.addEventListener('touchend', onTouch)

    if (location.hash.includes('egg') || location.search.includes('egg')) {
      trigger()
    } else if (process.env.NODE_ENV !== 'production') {
      // Dev-Komfort: automatischer Testwurf nach Mount
      setTimeout(() => trigger(), 400)
    }

    return () => {
      document.removeEventListener('keydown', onKey)
      wrap.removeEventListener('touchend', onTouch)
      wrap.removeEventListener('dblclick', onDblClick)
      const debugWindow = window as BeerThrowWindow
      if (debugWindow.__beerThrow) delete debugWindow.__beerThrow
    }
  }, [containerSelector, throwOnce])

  return null
}
