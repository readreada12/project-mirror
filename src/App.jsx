import { useState, useEffect, useRef } from 'react'
import { CONDITIONS, CRISIS, AFFIRMATIONS, SIGNAL_SCENES } from './data.js'
import { DB } from './db.js'

// ─── Design tokens ────────────────────────────────────────────
const T = {
  bg:      '#060d18',
  surface: '#0c1624',
  card:    '#0f1e30',
  border:  'rgba(255,255,255,0.07)',
  text:    '#e8edf5',
  muted:   'rgba(232,237,245,0.5)',
  dim:     'rgba(232,237,245,0.22)',
}

// ─── Hook: ambient particle background ───────────────────────
function useParticles(ref, accentHex) {
  const accentRef = useRef(accentHex)
  accentRef.current = accentHex

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const pts = Array.from({ length: 65 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      t:  Math.random() * Math.PI * 2,
      base: Math.random() * 0.28 + 0.04,
    }))

    let raf
    const tick = () => {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      const hex = accentRef.current || '#4A9EDE'
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      pts.forEach(p => {
        p.t += 0.007
        p.x = (p.x + p.vx + W) % W
        p.y = (p.y + p.vy + H) % H
        const a = p.base + Math.sin(p.t) * 0.07
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},${a})`
        ctx.fill()
      })
      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])
}

// ─── Hook: Glass Storm game engine ───────────────────────────
function useGlassStorm(ref, onComplete, sessionId) {
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()

    const W = () => canvas.width
    const H = () => canvas.height

    // Stars
    const stars = Array.from({ length: 90 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.1 + 0.2,
      a: Math.random() * 0.45 + 0.08,
    }))

    // Glass pane factory
    const mkCracks = () => {
      const count = 4 + Math.floor(Math.random() * 4)
      return Array.from({ length: count }, (_, i) => {
        const ang = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.7
        const len = 0.25 + Math.random() * 0.45
        return { x2: 0.5 + Math.cos(ang) * len, y2: 0.5 + Math.sin(ang) * len }
      })
    }

    const initPanes = () => {
      const pad = 80
      return Array.from({ length: 10 }, () => {
        const w = 55 + Math.random() * 65
        const h = 55 + Math.random() * 65
        return {
          x: pad + Math.random() * (W() - pad * 2),
          y: pad + Math.random() * (H() - pad * 2),
          w, h,
          rot: (Math.random() - 0.5) * 0.45,
          cracks: mkCracks(),
          shattered: false,
        }
      })
    }

    let panes = initPanes()
    let particles = []
    let trail = []
    let ptr = { x: 0, y: 0, t: 0, down: false }
    let allGone = false, reveal = 0, done = false
    let swipes = 0, velocities = []
    let raf

    // Shatter a pane
    const shatter = (pane, vx, vy) => {
      pane.shattered = true
      swipes++
      for (let i = 0; i < 13 + Math.floor(Math.random() * 7); i++) {
        const ang = Math.random() * Math.PI * 2
        const spd = 1.5 + Math.random() * 4.5
        particles.push({
          x: pane.x, y: pane.y,
          vx: vx * 0.25 + Math.cos(ang) * spd,
          vy: vy * 0.25 + Math.sin(ang) * spd,
          w: 5 + Math.random() * 18, h: 4 + Math.random() * 13,
          rot: Math.random() * Math.PI * 2,
          rotv: (Math.random() - 0.5) * 0.12,
          life: 1, decay: 0.008 + Math.random() * 0.013,
          type: 'shard',
        })
      }
      for (let i = 0; i < 5; i++) {
        const ang = Math.random() * Math.PI * 2
        particles.push({
          x: pane.x, y: pane.y,
          vx: Math.cos(ang) * (3 + Math.random() * 5),
          vy: Math.sin(ang) * (3 + Math.random() * 5),
          life: 1, decay: 0.04, type: 'spark',
        })
      }
    }

    // Draw calls
    const drawBg = (rev) => {
      ctx.fillStyle = '#060d18'
      ctx.fillRect(0, 0, W(), H())
      stars.forEach(s => {
        ctx.beginPath()
        ctx.arc(s.x * W(), s.y * H(), s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,220,255,${s.a})`
        ctx.fill()
      })
      if (rev > 0) {
        const g = ctx.createLinearGradient(0, 0, 0, H())
        g.addColorStop(0, `rgba(12,35,65,${rev * 0.95})`)
        g.addColorStop(0.6, `rgba(18,55,40,${rev * 0.8})`)
        g.addColorStop(1, `rgba(8,28,20,${rev})`)
        ctx.fillStyle = g
        ctx.fillRect(0, 0, W(), H())
      }
      if (rev > 0.6) {
        const a = (rev - 0.6) * 2.5 * 0.12
        ctx.fillStyle = `rgba(160,210,160,${a})`
        for (let i = 0; i < 5; i++) {
          ctx.beginPath()
          ctx.arc(W() * (0.1 + i * 0.2), H() * 0.72 + Math.sin(i * 1.3) * 18, 28 + i * 14, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    const drawPane = (p) => {
      if (p.shattered) return
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      const hw = p.w / 2, hh = p.h / 2
      ctx.fillStyle = 'rgba(140,200,255,0.09)'
      ctx.strokeStyle = 'rgba(180,225,255,0.55)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.rect(-hw, -hh, p.w, p.h); ctx.fill(); ctx.stroke()
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'
      ctx.lineWidth = 0.5
      ctx.beginPath(); ctx.moveTo(-hw, -hh); ctx.lineTo(hw, -hh); ctx.stroke()
      ctx.strokeStyle = 'rgba(155,215,255,0.32)'
      ctx.lineWidth = 0.7
      p.cracks.forEach(c => {
        ctx.beginPath(); ctx.moveTo(0, 0)
        ctx.lineTo(c.x2 * p.w - hw, c.y2 * p.h - hh); ctx.stroke()
      })
      ctx.restore()
    }

    const drawParticle = (p) => {
      ctx.save()
      ctx.globalAlpha = Math.max(0, p.life)
      if (p.type === 'shard') {
        ctx.translate(p.x, p.y); ctx.rotate(p.rot)
        ctx.fillStyle = 'rgba(145,205,255,0.55)'
        ctx.strokeStyle = 'rgba(200,235,255,0.7)'
        ctx.lineWidth = 0.5
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h)
      } else {
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = '#ffefa0'; ctx.fill()
      }
      ctx.restore()
    }

    // Input
    const xy = (e) => {
      const rect = canvas.getBoundingClientRect()
      const src = e.touches ? e.touches[0] : e
      return { x: src.clientX - rect.left, y: src.clientY - rect.top }
    }
    const onDown = (e) => {
      e.preventDefault()
      const { x, y } = xy(e)
      ptr = { x, y, t: Date.now(), down: true }
      trail = [{ x, y }]
    }
    const onMove = (e) => {
      e.preventDefault()
      if (!ptr.down) return
      const { x, y } = xy(e)
      const now = Date.now(), dt = Math.max(1, now - ptr.t)
      const dx = x - ptr.x, dy = y - ptr.y
      const vel = Math.sqrt(dx * dx + dy * dy) / dt
      velocities.push(vel)
      if (vel > 0.35) {
        panes.forEach(p => {
          if (p.shattered) return
          if (x > p.x - p.w / 2 - 10 && x < p.x + p.w / 2 + 10 &&
              y > p.y - p.h / 2 - 10 && y < p.y + p.h / 2 + 10) {
            shatter(p, (dx / dt) * 10, (dy / dt) * 10)
          }
        })
      }
      trail.push({ x, y })
      if (trail.length > 18) trail.shift()
      ptr = { x, y, t: now, down: true }
    }
    const onUp = () => { ptr.down = false; trail = [] }

    canvas.addEventListener('pointerdown', onDown, { passive: false })
    canvas.addEventListener('pointermove', onMove, { passive: false })
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointerleave', onUp)
    canvas.addEventListener('touchstart', onDown, { passive: false })
    canvas.addEventListener('touchmove', onMove, { passive: false })
    canvas.addEventListener('touchend', onUp)

    // Game loop
    const tick = () => {
      if (done) return
      drawBg(reveal)
      panes.forEach(drawPane)

      particles = particles.filter(p => p.life > 0)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        p.vy += 0.045; p.vx *= 0.97
        p.life -= p.decay
        if (p.rot !== undefined) p.rot += p.rotv
        drawParticle(p)
      })

      // Swipe trail
      if (trail.length > 1) {
        for (let i = 1; i < trail.length; i++) {
          ctx.beginPath()
          ctx.moveTo(trail[i - 1].x, trail[i - 1].y)
          ctx.lineTo(trail[i].x, trail[i].y)
          ctx.strokeStyle = `rgba(255,255,255,${(i / trail.length) * 0.42})`
          ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.stroke()
        }
      }

      // Progress dots
      const total = panes.length
      const shattered = panes.filter(p => p.shattered).length
      const dotStart = (W() - total * 14) / 2
      panes.forEach((p, i) => {
        ctx.beginPath()
        ctx.arc(dotStart + i * 14 + 7, H() - 28, 4, 0, Math.PI * 2)
        ctx.fillStyle = p.shattered ? '#E06B3A' : 'rgba(255,255,255,0.18)'
        ctx.fill()
      })

      // Hint
      if (shattered === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.28)'
        ctx.font = '13px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('Swipe through the glass', W() / 2, H() - 50)
        ctx.textAlign = 'left'
      }

      if (!allGone && shattered === total) allGone = true
      if (allGone) {
        reveal = Math.min(1, reveal + 0.007)
        if (reveal >= 0.72) {
          ctx.fillStyle = `rgba(230,240,230,${(reveal - 0.72) * 3.5})`
          ctx.font = 'bold 17px system-ui'
          ctx.textAlign = 'center'
          ctx.fillText('There was calm beneath it all', W() / 2, H() / 2)
          ctx.textAlign = 'left'
        }
        if (reveal >= 1 && !done) {
          done = true
          const avg = velocities.length
            ? velocities.reduce((a, b) => a + b, 0) / velocities.length
            : 0
          DB.recordTelemetry(sessionId, {
            game_id: 'glass_storm',
            avg_velocity: Math.round(avg * 100) / 100,
            max_velocity: Math.round(Math.max(...velocities, 0) * 100) / 100,
            touch_count: swipes,
            jitter_score: 0,
            pause_count: 0,
          })
          cancelAnimationFrame(raf)
          setTimeout(onComplete, 700)
          return
        }
      }
      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      done = true
      cancelAnimationFrame(raf)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointerleave', onUp)
      canvas.removeEventListener('touchstart', onDown)
      canvas.removeEventListener('touchmove', onMove)
      canvas.removeEventListener('touchend', onUp)
    }
  }, [])
}

// ─── Component: CrisisFooter ──────────────────────────────────
function CrisisFooter({ alwaysOpen = false }) {
  const [open, setOpen] = useState(alwaysOpen)
  return (
    <div style={{ marginTop: 16 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'block', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '7px 0' }}
      >
        <span style={{ fontSize: 11, color: T.dim }}>
          💙 Need support? You're not alone {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div style={{ borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, padding: '12px 14px', marginTop: 4 }}>
          <p style={{ margin: '0 0 8px', fontSize: 11, color: T.muted, textAlign: 'center' }}>
            Free helplines — India — available 24 / 7
          </p>
          {CRISIS.map((c, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < CRISIS.length - 1 ? `1px solid ${T.border}` : 'none' }}>
              <span style={{ fontSize: 12, color: T.muted }}>{c.name}</span>
              <a href={`tel:${c.number.replace(/-/g, '')}`} style={{ fontSize: 12, color: '#4A9EDE', fontWeight: 500, textDecoration: 'none' }}>{c.number}</a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Screen: Disclaimer ───────────────────────────────────────
function DisclaimerScreen({ onAccept }) {
  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
      <div style={{ maxWidth: 380, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 42, marginBottom: 16 }}>🌿</div>
          <h1 style={{ margin: '0 0 8px', fontSize: 21, fontWeight: 600, color: T.text }}>Before you begin</h1>
          <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
            This is a wellness companion, not a medical tool. It does not replace professional mental health support, therapy, or emergency care.
          </p>
        </div>

        <div style={{ borderRadius: 10, background: 'rgba(74,158,222,0.08)', border: '1px solid rgba(74,158,222,0.25)', padding: '12px 14px', marginBottom: 14 }}>
          <p style={{ margin: '0 0 5px', fontSize: 11, fontWeight: 700, color: '#4A9EDE', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            📊 Development notice
          </p>
          <p style={{ margin: 0, fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
            To improve this app, we anonymously collect how you interact with games, completion rates, and before / after feeling scores.{' '}
            <strong style={{ color: T.text }}>No personal information is ever collected.</strong>
          </p>
        </div>

        <div style={{ borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, padding: '12px 14px', marginBottom: 20 }}>
          <p style={{ margin: '0 0 8px', fontSize: 11, color: T.muted }}>Free helplines if you need support right now</p>
          {CRISIS.map((c, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < CRISIS.length - 1 ? `1px solid ${T.border}` : 'none' }}>
              <span style={{ fontSize: 12, color: T.muted }}>{c.name}</span>
              <a href={`tel:${c.number.replace(/-/g, '')}`} style={{ fontSize: 12, color: '#4A9EDE', fontWeight: 500, textDecoration: 'none' }}>{c.number}</a>
            </div>
          ))}
        </div>

        <button
          onClick={onAccept}
          style={{ width: '100%', padding: 14, borderRadius: 12, background: '#4A9EDE', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          I understand — let's begin
        </button>
      </div>
    </div>
  )
}

// ─── Screen: Landing ──────────────────────────────────────────
function LandingScreen({ onSelect, onUnknown }) {
  const [hov, setHov] = useState(null)
  const bgRef = useRef(null)
  useParticles(bgRef, hov !== null ? CONDITIONS[hov].color : '#4A9EDE')

  return (
    <div style={{ minHeight: '100vh', background: T.bg, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <canvas ref={bgRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', padding: '36px 20px 20px', maxWidth: 640, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, color: '#4A9EDE', textTransform: 'uppercase', letterSpacing: '0.18em' }}>
            The Adaptive Mindscape
          </p>
          <h1 style={{ margin: '0 0 6px', fontSize: 27, fontWeight: 300, color: T.text, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            How are you feeling<br /><strong style={{ fontWeight: 700 }}>right now?</strong>
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: T.muted }}>Pick the one that feels closest. No wrong answers.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1 }}>
          {CONDITIONS.map((c, i) => (
            <button
              key={c.id}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(null)}
              onClick={() => c.id === 'unknown' ? onUnknown() : onSelect(c)}
              style={{
                borderRadius: 14,
                border: c.dashed
                  ? '1px dashed rgba(168,158,138,0.35)'
                  : `1px solid ${hov === i ? c.color + '55' : T.border}`,
                background: hov === i ? `${c.color}12` : T.card,
                padding: '15px 14px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.22s',
                transform: hov === i ? 'translateY(-2px)' : 'none',
                boxShadow: hov === i ? `0 8px 28px ${c.color}18` : 'none',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: hov === i ? c.color : 'transparent', transition: 'background 0.22s', borderRadius: '14px 14px 0 0' }} />
              {c.built && (
                <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 9, color: c.color, background: `${c.color}18`, padding: '1px 7px', borderRadius: 20, fontWeight: 700, letterSpacing: '0.04em' }}>
                  LIVE
                </span>
              )}
              <div style={{ fontSize: 20, marginBottom: 9 }}>{c.icon}</div>
              <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.3 }}>{c.label}</p>
              <p style={{ margin: '0 0 8px', fontSize: 10, color: T.dim }}>{c.clinical}</p>
              <p style={{ margin: 0, fontSize: 11, color: c.color, fontWeight: 500 }}>{c.game} →</p>
            </button>
          ))}
        </div>
        <CrisisFooter />
      </div>
    </div>
  )
}

// ─── Screen: Signal (I Don't Know) ───────────────────────────
function SignalScreen({ onRoute, onBack }) {
  const [picked, setPicked]   = useState(null)
  const [stage, setStage]     = useState(0)
  const bgRef = useRef(null)
  useParticles(bgRef, picked !== null ? SIGNAL_SCENES[picked].color : '#A89E8A')

  const handleScene = (i) => {
    setPicked(i)
    setTimeout(() => setStage(1), 380)
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <canvas ref={bgRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', padding: '36px 20px 20px', maxWidth: 500, margin: '0 auto', width: '100%' }}>
        <button onClick={onBack} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: T.muted, fontSize: 13, cursor: 'pointer', marginBottom: 28, padding: 0 }}>
          ← Back
        </button>

        {stage === 0 ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <p style={{ margin: '0 0 6px', fontSize: 11, color: '#A89E8A', textTransform: 'uppercase', letterSpacing: '0.12em' }}>The Signal</p>
              <h2 style={{ margin: '0 0 6px', fontSize: 21, fontWeight: 600, color: T.text }}>Which feels most like right now?</h2>
              <p style={{ margin: 0, fontSize: 13, color: T.muted }}>Not the one you prefer — the one that resonates.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SIGNAL_SCENES.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleScene(i)}
                  style={{ borderRadius: 14, border: `1px solid ${picked === i ? s.color + '70' : T.border}`, background: picked === i ? `${s.color}18` : T.card, padding: '18px 20px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s' }}
                >
                  <span style={{ fontSize: 26 }}>{s.emoji}</span>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 600, color: T.text }}>{s.label}</p>
                    <p style={{ margin: 0, fontSize: 12, color: T.muted }}>{s.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <p style={{ margin: '0 0 6px', fontSize: 11, color: SIGNAL_SCENES[picked].color, textTransform: 'uppercase', letterSpacing: '0.12em' }}>One more</p>
              <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 600, color: T.text, lineHeight: 1.4 }}>Which is closer to what you're feeling?</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SIGNAL_SCENES[picked].followup.map((f, i) => {
                const cond = CONDITIONS.find(c => c.id === f.conditionId)
                return (
                  <button
                    key={i}
                    onClick={() => {
                      DB.recordSignalRoute('pending', SIGNAL_SCENES[picked].label, f.answer, cond.id)
                      onRoute(cond)
                    }}
                    style={{ borderRadius: 14, border: `1px solid ${T.border}`, background: T.card, padding: '16px 20px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}
                  >
                    <div>
                      <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 500, color: T.text }}>{f.answer}</p>
                      <p style={{ margin: 0, fontSize: 11, color: cond.color }}>→ {cond.game}</p>
                    </div>
                    <span style={{ fontSize: 20 }}>{cond.icon}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}
        <CrisisFooter />
      </div>
    </div>
  )
}

// ─── Game: Glass Storm ────────────────────────────────────────
function GlassStormGame({ sessionId, onDone }) {
  const ref = useRef(null)
  useGlassStorm(ref, onDone, sessionId)
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 20px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>💥</span>
        <div>
          <p style={{ margin: '0 0 1px', fontSize: 13, fontWeight: 600, color: T.text }}>Glass Storm</p>
          <p style={{ margin: 0, fontSize: 11, color: '#E06B3A' }}>Swipe through the glass panes</p>
        </div>
      </div>
      <canvas ref={ref} style={{ flex: 1, width: '100%', touchAction: 'none', cursor: 'crosshair' }} />
    </div>
  )
}

// ─── Game: Placeholder (for unbuilt games) ────────────────────
function GamePlaceholder({ condition, sessionId, onDone }) {
  const bgRef = useRef(null)
  useParticles(bgRef, condition.color)
  const handleContinue = () => {
    DB.recordTelemetry(sessionId, { game_id: condition.id, avg_velocity: 0, max_velocity: 0, touch_count: 0, jitter_score: 0, pause_count: 0 })
    onDone()
  }
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20, position: 'relative' }}>
      <canvas ref={bgRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 320 }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: `${condition.color}18`, border: `1px solid ${condition.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 36 }}>
          {condition.icon}
        </div>
        <p style={{ margin: '0 0 4px', fontSize: 11, color: condition.color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{condition.clinical}</p>
        <h2 style={{ margin: '0 0 10px', fontSize: 24, fontWeight: 600, color: T.text }}>{condition.game}</h2>
        <p style={{ margin: '0 0 22px', fontSize: 13, color: T.muted, lineHeight: 1.7 }}>{condition.desc}</p>
        <div style={{ borderRadius: 10, border: `1px dashed ${condition.color}44`, padding: '10px 16px', marginBottom: 22, background: `${condition.color}08` }}>
          <p style={{ margin: 0, fontSize: 12, color: condition.color }}>🚧 This game is being built in the next phase</p>
        </div>
        <button onClick={handleContinue} style={{ padding: '12px 28px', borderRadius: 12, background: condition.color, border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Continue →
        </button>
      </div>
    </div>
  )
}

// ─── Screen: Check-in ─────────────────────────────────────────
function CheckinScreen({ condition, sessionId, onDone }) {
  const [val, setVal] = useState(50)
  const barRef = useRef(null)

  const updateVal = (e) => {
    const rect = barRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const pct = Math.max(0, Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)))
    setVal(pct)
  }

  const submit = () => {
    DB.recordCheckin(sessionId, val, 'post_game')
    onDone(val)
  }

  const msg = val < 30 ? "You're still carrying it — and that's okay." : val < 60 ? 'A little lighter than before.' : 'You found some relief in there.'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 28 }}>
      <h2 style={{ margin: '0 0 8px', fontSize: 21, fontWeight: 600, color: T.text }}>How do you feel now?</h2>
      <p style={{ margin: '0 0 36px', fontSize: 13, color: T.muted }}>Drag along the line</p>
      <div style={{ width: '100%', maxWidth: 320, marginBottom: 16 }}>
        <div
          ref={barRef}
          style={{ position: 'relative', height: 8, borderRadius: 4, background: `linear-gradient(to right, rgba(255,255,255,0.08), ${condition.color})`, cursor: 'pointer', marginBottom: 18 }}
          onClick={updateVal}
          onMouseMove={e => { if (e.buttons) updateVal(e) }}
          onTouchMove={updateVal}
        >
          <div style={{ position: 'absolute', top: '50%', left: `${val}%`, transform: 'translate(-50%,-50%)', width: 22, height: 22, borderRadius: '50%', background: '#fff', border: `2.5px solid ${condition.color}`, boxShadow: `0 0 14px ${condition.color}90`, pointerEvents: 'none', transition: 'left 0.06s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: T.dim }}>Still heavy</span>
          <span style={{ fontSize: 11, color: condition.color }}>Feeling lighter</span>
        </div>
      </div>
      <p style={{ margin: '0 0 28px', fontSize: 13, color: T.muted }}>{msg}</p>
      <button onClick={submit} style={{ padding: '12px 32px', borderRadius: 12, background: condition.color, border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
        Done
      </button>
    </div>
  )
}

// ─── Screen: Session Close ────────────────────────────────────
function SessionClose({ condition, sessionId, feeling, onHome }) {
  const [showData, setShowData] = useState(false)
  const stats = DB.getStats()

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px 20px' }}>
      <div style={{ maxWidth: 380, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 42, marginBottom: 18 }}>{feeling > 55 ? '🌿' : '💙'}</div>
        <h2 style={{ margin: '0 0 10px', fontSize: 21, fontWeight: 600, color: T.text }}>
          {feeling > 55 ? 'You did something kind for yourself today' : 'You showed up. That's enough.'}
        </h2>
        <p style={{ margin: '0 0 28px', fontSize: 14, color: T.muted, lineHeight: 1.8, fontStyle: 'italic' }}>
          "{AFFIRMATIONS[condition.id]}"
        </p>

        <div style={{ borderRadius: 12, border: `1px solid ${condition.color}33`, background: `${condition.color}0a`, padding: '14px 16px', marginBottom: 16, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ margin: 0, fontSize: 11, color: condition.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your Mindscape</p>
            <button onClick={() => setShowData(d => !d)} style={{ background: 'none', border: `1px solid ${condition.color}44`, borderRadius: 20, color: condition.color, fontSize: 11, padding: '2px 10px', cursor: 'pointer' }}>
              {showData ? 'hide' : 'view data'}
            </button>
          </div>
          {!showData ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {[['Feeling', `${feeling}%`], ['Sessions', stats.sessions.length], ['Records', stats.telemetry.length]].map(([label, val], i) => (
                <div key={i} style={{ flex: 1, borderRadius: 8, background: T.surface, padding: '8px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 3px', fontSize: 16, fontWeight: 600, color: T.text }}>{val}</p>
                  <p style={{ margin: 0, fontSize: 10, color: T.dim }}>{label}</p>
                </div>
              ))}
            </div>
          ) : (
            <div>
              {[
                ['Sessions total', stats.sessions.length],
                ['Completed sessions', stats.sessions.filter(s => s.completed).length],
                ['Telemetry records', stats.telemetry.length],
                ['Feeling check-ins', stats.checkins.length],
              ].map(([label, val], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < 3 ? `1px solid ${T.border}` : 'none' }}>
                  <span style={{ fontSize: 12, color: T.muted }}>{label}</span>
                  <span style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{val}</span>
                </div>
              ))}
              <p style={{ margin: '8px 0 0', fontSize: 10, color: T.dim }}>
                Stored locally. Will sync to Supabase once backend is connected.
              </p>
            </div>
          )}
        </div>

        <button onClick={onHome} style={{ width: '100%', padding: 13, borderRadius: 12, background: condition.color, border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 12 }}>
          Return home
        </button>
        <CrisisFooter alwaysOpen={feeling < 30} />
      </div>
    </div>
  )
}

// ─── Screen: Game Router (orchestrates flow) ──────────────────
function GameRouter({ condition, sessionId, onBack }) {
  const [phase, setPhase] = useState('game')
  const [feeling, setFeeling] = useState(50)
  const bgRef = useRef(null)
  useParticles(bgRef, condition.color)

  if (phase === 'close') {
    return (
      <SessionClose
        condition={condition}
        sessionId={sessionId}
        feeling={feeling}
        onHome={() => { DB.completeSession(sessionId, feeling); onBack() }}
      />
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <canvas ref={bgRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 680, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 0' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: T.muted, fontSize: 13, cursor: 'pointer', padding: 0 }}>← Back</button>
          <span style={{ fontSize: 11, color: T.dim }}>{phase === 'game' ? 'Play' : 'Check-in'}</span>
          <span style={{ width: 50 }} />
        </div>

        {phase === 'game' && (
          condition.built && condition.id === 'stress'
            ? <GlassStormGame sessionId={sessionId} onDone={() => setPhase('checkin')} />
            : <GamePlaceholder condition={condition} sessionId={sessionId} onDone={() => setPhase('checkin')} />
        )}

        {phase === 'checkin' && (
          <CheckinScreen
            condition={condition}
            sessionId={sessionId}
            onDone={score => { setFeeling(score); setPhase('close') }}
          />
        )}

        <div style={{ padding: '0 20px 16px' }}>
          <CrisisFooter />
        </div>
      </div>
    </div>
  )
}

// ─── Root App ─────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]       = useState(() => localStorage.getItem('pm_seen') ? 'landing' : 'disclaimer')
  const [condition, setCondition] = useState(null)
  const [sessionId, setSessionId] = useState(null)

  const startSession = (cond) => {
    const id = DB.startSession(cond.id)
    setSessionId(id)
    setCondition(cond)
    setScreen('game')
  }

  if (screen === 'disclaimer') {
    return <DisclaimerScreen onAccept={() => { localStorage.setItem('pm_seen', '1'); setScreen('landing') }} />
  }
  if (screen === 'landing') {
    return <LandingScreen onSelect={startSession} onUnknown={() => setScreen('signal')} />
  }
  if (screen === 'signal') {
    return <SignalScreen onRoute={startSession} onBack={() => setScreen('landing')} />
  }
  if (screen === 'game') {
    return <GameRouter condition={condition} sessionId={sessionId} onBack={() => setScreen('landing')} />
  }
  return null
}
