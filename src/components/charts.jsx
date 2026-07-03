import React, { useState } from 'react'
import { fmtCompactINR, fmtINR0 } from '../utils/format'

// ---------- Monthly bar chart (single series — no legend; title names it) ----------

export function BarChart({ data, height = 220 }) {
  const [hover, setHover] = useState(null)
  const W = 720
  const H = height
  const pad = { top: 16, right: 8, bottom: 26, left: 52 }
  const iw = W - pad.left - pad.right
  const ih = H - pad.top - pad.bottom
  const max = Math.max(...data.map((d) => d.value), 1)
  // round the axis top up to a clean step
  const step = niceStep(max / 4)
  const top = Math.max(step * Math.ceil(max / step), step)
  const ticks = [0, 1, 2, 3, 4].map((i) => (top / 4) * i)

  const bw = Math.min(28, (iw / data.length) * 0.55)
  const x = (i) => pad.left + (iw / data.length) * (i + 0.5)
  const y = (v) => pad.top + ih - (v / top) * ih

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Monthly revenue bar chart">
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)}
              stroke={i === 0 ? 'var(--color-baseline)' : 'var(--color-grid)'} strokeWidth="1" />
            <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--color-ink-muted)" className="tnum">
              {fmtCompactINR(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const h = Math.max((d.value / top) * ih, d.value > 0 ? 3 : 0)
          const active = hover === i
          return (
            <g key={d.key}>
              {d.value > 0 && (
                <path
                  d={roundedTopBar(x(i) - bw / 2, y(0), bw, h, 4)}
                  fill={active ? 'var(--color-series-1-deep)' : 'var(--color-series-1)'}
                />
              )}
              {/* hover hit target wider than the mark */}
              <rect
                x={x(i) - (iw / data.length) / 2} y={pad.top} width={iw / data.length} height={ih}
                fill="transparent"
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              />
              <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--color-ink-muted)">
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
      {hover !== null && data[hover] && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-grid bg-surface-1 px-3 py-1.5 text-xs shadow-md"
          style={{ left: `${(x(hover) / W) * 100}%`, top: 0 }}
        >
          <div className="font-medium">{data[hover].full || data[hover].label}</div>
          <div className="tnum mt-0.5 text-ink-2">{fmtINR0(data[hover].value)}</div>
        </div>
      )}
    </div>
  )
}

function roundedTopBar(x, baseY, w, h, r) {
  const rr = Math.min(r, h, w / 2)
  const yTop = baseY - h
  return `M ${x} ${baseY}
    L ${x} ${yTop + rr}
    Q ${x} ${yTop} ${x + rr} ${yTop}
    L ${x + w - rr} ${yTop}
    Q ${x + w} ${yTop} ${x + w} ${yTop + rr}
    L ${x + w} ${baseY} Z`
}

function niceStep(raw) {
  if (raw <= 0) return 1
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const n = raw / mag
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return step * mag
}

// ---------- Donut (status-colored segments, 2px surface gap, legend beside) ----------

export function Donut({ segments, centerLabel, centerValue }) {
  const [hover, setHover] = useState(null)
  const total = segments.reduce((s, x) => s + x.value, 0)
  const R = 62
  const r = 44
  const C = 75
  let angle = -90

  const arcs = segments.filter((s) => s.value > 0).map((s) => {
    const sweep = total > 0 ? (s.value / total) * 360 : 0
    const a0 = angle
    const a1 = angle + sweep
    angle = a1
    return { ...s, a0, a1 }
  })

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0">
        <svg viewBox="0 0 150 150" width="150" height="150" role="img" aria-label={centerLabel}>
          {total === 0 && <circle cx={C} cy={C} r={(R + r) / 2} fill="none" stroke="var(--color-grid)" strokeWidth={R - r} />}
          {arcs.map((a, i) => (
            <path
              key={a.label}
              d={donutArc(C, C, R, r, a.a0, a.a1)}
              fill={a.color}
              stroke="var(--color-surface-1)"
              strokeWidth="2"
              opacity={hover === null || hover === i ? 1 : 0.35}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-lg font-semibold leading-tight">
            {hover !== null && arcs[hover] ? fmtCompactINR(arcs[hover].value) : centerValue}
          </div>
          <div className="text-[11px] text-ink-muted">
            {hover !== null && arcs[hover] ? arcs[hover].label : centerLabel}
          </div>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {segments.map((s, i) => (
          <li key={s.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden />
              <span className="truncate text-ink-2">{s.label}</span>
            </span>
            <span className="tnum shrink-0 font-medium">{fmtCompactINR(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function donutArc(cx, cy, R, r, a0deg, a1deg) {
  // full circle needs two arcs to render
  if (a1deg - a0deg >= 359.99) {
    return [
      `M ${cx + R} ${cy}`,
      `A ${R} ${R} 0 1 1 ${cx - R} ${cy}`, `A ${R} ${R} 0 1 1 ${cx + R} ${cy}`,
      `M ${cx + r} ${cy}`,
      `A ${r} ${r} 0 1 0 ${cx - r} ${cy}`, `A ${r} ${r} 0 1 0 ${cx + r} ${cy}`,
      'Z',
    ].join(' ')
  }
  const rad = (d) => (d * Math.PI) / 180
  const p = (rr, a) => `${cx + rr * Math.cos(rad(a))} ${cy + rr * Math.sin(rad(a))}`
  const large = a1deg - a0deg > 180 ? 1 : 0
  return [
    `M ${p(R, a0deg)}`,
    `A ${R} ${R} 0 ${large} 1 ${p(R, a1deg)}`,
    `L ${p(r, a1deg)}`,
    `A ${r} ${r} 0 ${large} 0 ${p(r, a0deg)}`,
    'Z',
  ].join(' ')
}
