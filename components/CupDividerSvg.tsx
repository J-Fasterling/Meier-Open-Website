import React from 'react'

const NUM_CUPS = 10
const CUP_W = 28
const CUP_H = 34
const CUP_SPACING = 20
const VIEW_W = 900
const VIEW_H = 160
const CUP_Y = 70

const TOTAL_W = NUM_CUPS * CUP_W + (NUM_CUPS - 1) * CUP_SPACING
const CUP_OFFSET_X = Math.max(0, (VIEW_W - TOTAL_W) / 2) // -> exakt zentriert

const cupX = (i: number) => CUP_OFFSET_X + i * (CUP_W + CUP_SPACING)

export default function CupDividerSvg() {
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <defs>
        <linearGradient id="cupGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF1A1A" />
          <stop offset="100%" stopColor="#CC0000" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.3" />
        </filter>
      </defs>

      <g filter="url(#shadow)" stroke="#8A1A1A" strokeWidth="1">
        {Array.from({ length: NUM_CUPS }, (_, i) => {
          const x = cupX(i)
          return (
            <g key={i} transform={`translate(${x}, ${CUP_Y})`}>
              <polygon points={`0,0 ${CUP_W},0 ${CUP_W - 4},${CUP_H} 4,${CUP_H}`} fill="url(#cupGrad)" />
              <path d={`M2,8 H${CUP_W - 2}`} stroke="#B0302A" />
              <path d={`M4,16 H${CUP_W - 4}`} stroke="#B0302A" />
              <path d={`M6,24 H${CUP_W - 6}`} stroke="#B0302A" />
              <rect id={`cup-rim-${i}`} x="0" y="-4" width={CUP_W} height="4" fill="#FFF" />
              <rect data-cup-anchor x={CUP_W / 2} y={-2} width="1" height="1" fill="none" />
            </g>
          )
        })}
      </g>
    </svg>
  )
}