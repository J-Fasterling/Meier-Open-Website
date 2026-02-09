'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'

type Cup = { id: number; x: number; y: number; r: number; hit: boolean; vanish: number }

const BASE_W = 900
const BASE_H = 600
const PHYSICS_SUBSTEPS = 4
const TABLE_RESTITUTION = 0.44
const TABLE_FRICTION = 0.12
const CUP_RESTITUTION = 0.62
const CUP_FRICTION = 0.16
const CUP_COLLISION_COOLDOWN = 0.045

type Props = {
  onWin?: () => void
}

export default function BeerPongPractice({ onWin }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef<number | null>(null)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [angleDeg, setAngleDeg] = useState(38)
  const [power, setPower] = useState(65)
  const gravity = 3000
  const [running, setRunning] = useState(false)
  const [won, setWon] = useState(false)

  const ballRef = useRef({
    x: 90,
    y: BASE_H - 100,
    px: 90,
    py: BASE_H - 100,
    vx: 0,
    vy: 0,
    r: 9,
    active: false,
    lastCupId: -1,
    cupCooldown: 0,
  })
  const cupsRef = useRef<Cup[]>([])
  const needsResetRef = useRef(false)

  const initialCups = useMemo<Cup[]>(() => {
    const cups: Cup[] = []
    const baseR = 20
    const GAP = 28
    const D = 2 * baseR + GAP
    const dx = D
    const dy = Math.round((Math.sqrt(3) / 2) * D + 8)
    const TABLE_Y_LOCAL = BASE_H - 110
    const startX = BASE_W - (3.5 * dx + 60)
    const startY = TABLE_Y_LOCAL - 10
    let id = 0
    for (let i = 0; i < 4; i++) cups.push({ id: id++, x: startX + i * dx, y: startY, r: baseR, hit: false, vanish: 0 })
    for (let i = 0; i < 3; i++) cups.push({ id: id++, x: startX + dx / 2 + i * dx, y: startY - dy, r: baseR, hit: false, vanish: 0 })
    for (let i = 0; i < 2; i++) cups.push({ id: id++, x: startX + dx + i * dx, y: startY - 2 * dy, r: baseR, hit: false, vanish: 0 })
    cups.push({ id: id++, x: startX + 1.5 * dx, y: startY - 3 * dy, r: baseR, hit: false, vanish: 0 })
    return cups
  }, [])

  useEffect(() => {
    cupsRef.current = initialCups.map(c => ({ ...c }))
  }, [initialCups])

  useEffect(() => {
    const c = canvasRef.current!
    const dpr = Math.max(1, window.devicePixelRatio || 1)
    c.width = Math.round(BASE_W * dpr)
    c.height = Math.round(BASE_H * dpr)
    c.style.width = '100%'
    c.style.aspectRatio = `${BASE_W} / ${BASE_H}`
  }, [])

  const bounceWithImpulse = (
    vx: number,
    vy: number,
    nx: number,
    ny: number,
    restitution: number,
    friction: number
  ) => {
    const vn = vx * nx + vy * ny
    if (vn >= 0) return { vx, vy }
    const vtx = vx - vn * nx
    const vty = vy - vn * ny
    const postVn = -vn * restitution
    const tangentialScale = Math.max(0, 1 - friction)
    const postVtx = vtx * tangentialScale
    const postVty = vty * tangentialScale
    return {
      vx: postVn * nx + postVtx,
      vy: postVn * ny + postVty,
    }
  }

  const segmentCircleHit = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    cx: number,
    cy: number,
    r: number
  ) => {
    const dx = x1 - x0
    const dy = y1 - y0
    const fx = x0 - cx
    const fy = y0 - cy
    const a = dx * dx + dy * dy
    const b = 2 * (fx * dx + fy * dy)
    const c = fx * fx + fy * fy - r * r
    const disc = b * b - 4 * a * c
    if (a <= 1e-8 || disc < 0) return null
    const s = Math.sqrt(disc)
    const t1 = (-b - s) / (2 * a)
    const t2 = (-b + s) / (2 * a)
    if (t1 >= 0 && t1 <= 1) return t1
    if (t2 >= 0 && t2 <= 1) return t2
    return null
  }

  const scheduleReset = (delay = 700) => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    resetTimerRef.current = setTimeout(() => {
      const b = ballRef.current
      b.x = 90; b.y = BASE_H - 100; b.px = 90; b.py = BASE_H - 100; b.vx = 0; b.vy = 0; b.active = false; b.lastCupId = -1; b.cupCooldown = 0
      setRunning(false)
    }, delay)
  }

  const allHit = () => cupsRef.current.every(c => c.hit)

  const drawCup = (ctx: CanvasRenderingContext2D, cup: Cup, alpha = 1) => {
    const cx = cup.x, cy = cup.y, rr = cup.r
    const rimRy = rr * 0.52
    const cupHeightMultiplier = 2.2
    
    ctx.beginPath()
    ctx.ellipse(cx, cy + rr + 10, rr * 1.35, rr * 0.38, 0, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(0,0,0,${0.22 * alpha})`
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(cx - rr, cy)
    ctx.lineTo(cx + rr, cy)
    ctx.lineTo(cx + rr * 0.78, cy + rr * cupHeightMultiplier)
    ctx.lineTo(cx - rr * 0.78, cy + rr * cupHeightMultiplier)
    ctx.closePath()
    const grad = ctx.createLinearGradient(cx, cy - rr, cx, cy + rr * cupHeightMultiplier)
    grad.addColorStop(0, `rgba(255,66,94,${alpha})`)
    grad.addColorStop(1, `rgba(193,11,46,${alpha})`)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx, cy, rr, rimRy, 0, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${0.95 * alpha})`
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx, cy + rimRy * 0.25, rr * 0.9, rimRy * 0.7, 0, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(0,0,0,${0.12 * alpha})`
    ctx.fill()
    ctx.strokeStyle = `rgba(176,48,42,${0.85 * alpha})`
    ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.moveTo(cx - rr * 0.9, cy + rr * 0.72); ctx.lineTo(cx + rr * 0.9, cy + rr * 0.72); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx - rr * 0.85, cy + rr * 1.30); ctx.lineTo(cx + rr * 0.85, cy + rr * 1.30); ctx.stroke()
  }

  useEffect(() => {
    const c = canvasRef.current!
    const ctx = c.getContext('2d')!
    const dpr = Math.max(1, window.devicePixelRatio || 1)
    const TABLE_Y = BASE_H - 110

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 2)

    const draw = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts
      const dt = Math.min(0.032, (ts - lastTsRef.current) / 1000)
      lastTsRef.current = ts

      if (needsResetRef.current) {
        cupsRef.current = initialCups.map(c => ({ ...c }))
        const b = ballRef.current
        b.x = 90; b.y = BASE_H - 100; b.px = 90; b.py = BASE_H - 100; b.vx = 0; b.vy = 0; b.active = false; b.lastCupId = -1; b.cupCooldown = 0
        needsResetRef.current = false
        setRunning(false)
        setWon(false)
      }

      const b = ballRef.current
      if (b.active) {
        b.px = b.x
        b.py = b.y
        b.cupCooldown = Math.max(0, b.cupCooldown - dt)

        const subDt = dt / PHYSICS_SUBSTEPS
        const floorY = TABLE_Y - b.r

        for (let step = 0; step < PHYSICS_SUBSTEPS && b.active; step++) {
          b.vy += gravity * subDt
          const x0 = b.x
          const y0 = b.y
          const x1 = b.x + b.vx * subDt
          const y1 = b.y + b.vy * subDt

          let hitType: 'none' | 'table' | 'cup' = 'none'
          let hitT = 1
          let hitCup: Cup | null = null

          if (y0 <= floorY && y1 > floorY && b.vy > 0) {
            const denom = y1 - y0
            if (Math.abs(denom) > 1e-8) {
              const t = (floorY - y0) / denom
              if (t >= 0 && t <= hitT) {
                hitType = 'table'
                hitT = t
              }
            }
          }

          for (const cup of cupsRef.current) {
            if (cup.hit) continue
            if (b.cupCooldown > 0 && cup.id === b.lastCupId) continue
            const t = segmentCircleHit(x0, y0, x1, y1, cup.x, cup.y, b.r + cup.r)
            if (t != null && t <= hitT) {
              hitType = 'cup'
              hitT = t
              hitCup = cup
            }
          }

          if (hitType === 'none') {
            b.x = x1
            b.y = y1
            continue
          }

          const hitX = x0 + (x1 - x0) * hitT
          const hitY = y0 + (y1 - y0) * hitT

          if (hitType === 'table') {
            b.x = hitX
            b.y = floorY
            const next = bounceWithImpulse(b.vx, b.vy, 0, -1, TABLE_RESTITUTION, TABLE_FRICTION)
            b.vx = next.vx
            b.vy = next.vy
            if (Math.abs(b.vy) < 55) {
              b.vy = 0
            }
            if (Math.hypot(b.vx, b.vy) < 90) {
              b.active = false
              setRunning(false)
              scheduleReset(600)
            }
            continue
          }

          if (hitCup) {
            const cx = hitX - hitCup.x
            const cy = hitY - hitCup.y
            const clen = Math.hypot(cx, cy)
            const nx = clen > 1e-6 ? cx / clen : 0
            const ny = clen > 1e-6 ? cy / clen : -1

            const downward = b.vy > 140
            const cameFromAbove = y0 < hitCup.y && hitY >= hitCup.y - b.r * 0.2
            const centerDist = Math.hypot(hitX - hitCup.x, hitY - hitCup.y)
            const innerGate = hitCup.r * 0.92
            const isSink = downward && cameFromAbove && centerDist <= innerGate

            if (isSink) {
              hitCup.hit = true
              hitCup.vanish = 0
              b.active = false
              setRunning(false)
              scheduleReset(650)
              if (allHit()) {
                setTimeout(() => { setWon(true); onWin?.() }, 300)
              }
              continue
            }

            b.x = hitX + nx * 0.6
            b.y = hitY + ny * 0.6
            const next = bounceWithImpulse(b.vx, b.vy, nx, ny, CUP_RESTITUTION, CUP_FRICTION)
            b.vx = next.vx
            b.vy = next.vy
            b.lastCupId = hitCup.id
            b.cupCooldown = CUP_COLLISION_COOLDOWN
          }
        }

        if (b.y > BASE_H + 40 || b.x > BASE_W + 60 || b.x < -60) {
          b.active = false
          setRunning(false)
          scheduleReset(600)
        }
      }

      for (const cup of cupsRef.current) {
        if (cup.hit && cup.vanish < 1) cup.vanish = Math.min(1, cup.vanish + dt / 0.22)
      }

      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, BASE_W, BASE_H)

      const g = ctx.createLinearGradient(0, 0, 0, BASE_H)
      g.addColorStop(0, '#0e0f14')
      g.addColorStop(1, '#0b0c10')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, BASE_W, BASE_H)

      ctx.fillStyle = '#1b1d23'
      ctx.fillRect(40, TABLE_Y - 16, BASE_W - 80, 16)
      ctx.fillStyle = '#22252d'
      ctx.fillRect(40, TABLE_Y, BASE_W - 80, 8)

      for (const cup of cupsRef.current) {
        const alpha = 1 - easeOut(cup.vanish)
        if (alpha <= 0.01) continue
        drawCup(ctx, cup, alpha)
      }

      ctx.beginPath()
      ctx.arc(ballRef.current.x, ballRef.current.y, ballRef.current.r, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = 'rgba(0,0,0,0.25)'
      ctx.shadowBlur = 6
      ctx.fill()
      ctx.shadowBlur = 0

      if (!ballRef.current.active) {
        const v0 = 800 + (power / 100) * 900
        const a = (angleDeg * Math.PI) / 180
        const vx = Math.cos(a) * v0
        const vy0 = -Math.sin(a) * v0
        const sx = 90, sy = BASE_H - 100
        ctx.beginPath()
        for (let i = 0; i <= 60; i++) {
          const t = (i / 60) * 1.8
          const x = sx + vx * t
          const y = sy + vy0 * t + 0.5 * gravity * t * t
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.33)'
        ctx.setLineDash([6, 6]); ctx.stroke(); ctx.setLineDash([])
      }

      ctx.fillStyle = 'rgba(255,255,255,0.78)'
      ctx.font = '14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto'
      const left = cupsRef.current.filter(c => !c.hit).length
      ctx.fillText(`Treffer übrig: ${left}`, 16, 24)

      ctx.restore()
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      lastTsRef.current = null
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    }
  }, [angleDeg, power, gravity, onWin, initialCups]) // <-- HIER WAR DER FEHLER, JETZT KORRIGIERT

  const throwBall = () => {
    if (running || won) return
    const v0 = 800 + (power / 100) * 900
    const a = (angleDeg * Math.PI) / 180
    const b = ballRef.current
    b.x = 90; b.y = BASE_H - 100
    b.vx = Math.cos(a) * v0
    b.vy = -Math.sin(a) * v0
    b.px = b.x
    b.py = b.y
    b.lastCupId = -1
    b.cupCooldown = 0
    b.active = true
    setRunning(true)
  }

  const resetGame = () => {
    needsResetRef.current = true
  }

  return (
    <section className="w-full">
      <div className="mx-auto max-w-[900px]">
        <div className="rounded-2xl bg-[#0f1014] p-4 shadow-lg ring-1 ring-black/10">
          <div className="relative w-full">
            <canvas ref={canvasRef} className="w-full h-auto block rounded-xl bg-[#0b0c10]" />
            {won && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-xl bg-black/70 px-6 py-4 text-white text-center shadow-lg">
                  <p className="text-lg font-semibold mb-2">Sehr gut, du bist bereit für die nächsten Meier Open!</p>
                  <button
                    onClick={() => { setWon(false); resetGame() }}
                    className="rounded-md bg-white/10 hover:bg-white/20 px-4 py-2"
                  >
                    Nochmal spielen
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Winkel: {angleDeg}°</label>
              <input type="range" min={0} max={80} value={angleDeg} onChange={(e) => setAngleDeg(parseInt(e.target.value))} className="w-full accent-white" />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Stärke: {power}</label>
              <input type="range" min={0} max={100} value={power} onChange={(e) => setPower(parseInt(e.target.value))} className="w-full accent-white" />
            </div>
            <div className="flex gap-2">
              <button onClick={throwBall} disabled={running || won} className="flex-1 rounded-lg bg-white/10 hover:bg-white/15 text-white py-2 disabled:opacity-50">Werfen</button>
              <button onClick={resetGame} className="rounded-lg bg-white/5 hover:bg-white/10 text-white px-3 py-2">Reset</button>
            </div>
          </div>

          <p className="text-xs text-neutral-400 mt-2">
            Tipp: Stärke hoch, Winkel 30–45° ist meist gut. Triff die Mitte – am Rand prallt der Ball ab.
          </p>
        </div>
      </div>
    </section>
  )
}
