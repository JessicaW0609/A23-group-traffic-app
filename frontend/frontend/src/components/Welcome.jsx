import React, { useState } from 'react'

export default function Welcome({ onSkip, onNext }) {
  const [step, setStep] = useState(0)
  const pages = [
    {
      title: 'Welcome To Parkify',
      desc: 'Find the best possible parking space nearby your desired destination.',
     
      art: (
        <svg width="360" height="220" viewBox="0 0 360 220">
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#6aa1ff"/><stop offset="1" stopColor="#3651ff"/>
            </linearGradient>
          </defs>
          <rect x="14" y="40" rx="16" width="140" height="180" fill="#e9efff"/>
          <polyline points="42,66 84,120 110,98 130,130 146,116" stroke="url(#g1)" strokeWidth="6" fill="none"/>
          <circle cx="84" cy="120" r="7" fill="#3651ff"/>
          <ellipse cx="260" cy="180" rx="110" ry="14" fill="#e7edff"/>
          <rect x="180" y="110" width="160" height="60" rx="12" fill="#1f48ff"/>
          <rect x="230" y="100" width="30" height="12" rx="6" fill="#ffb703"/>
          <circle cx="208" cy="176" r="12" fill="#0d1b4c"/>
          <circle cx="312" cy="176" r="12" fill="#0d1b4c"/>
          <path d="M320 84 a16 16 0 1 1 -32 0 a16 16 0 1 1 32 0" fill="#fff"/>
          <text x="302" y="90" textAnchor="middle" fontFamily="ui-sans-serif" fontSize="14" fill="#3651ff">P</text>
        </svg>
      )
    },
    {
      title: 'Real-time Availability',
      desc: 'Live data and predictions help you decide faster.',
      art: <div style={{height:220, display:'grid', placeItems:'center', color:'#3651ff'}}>📈</div>
    },
    {
      title: 'Smart Alerts',
      desc: 'Price changes, time limits and nearby options—never miss out.',
      art: <div style={{height:220, display:'grid', placeItems:'center', color:'#3651ff'}}>🔔</div>
    }
  ]

  const ui = {
    wrap: {
      width: 'min(420px, 92vw)', background: '#fff', border: '1px solid #e6e8f0',
      borderRadius: 28, boxShadow: '0 18px 50px rgba(30,45,90,.12)', padding: 24
    },
    art: { display:'grid', placeItems:'center', marginTop: 12 },
    title: { textAlign:'center', fontSize: 22, fontWeight: 800, color: '#1f2937', marginTop: 8 },
    desc: { textAlign:'center', color:'#64748b', margin:'8px 0 18px' },
    dots: { display:'flex', gap:8, justifyContent:'center', margin: '10px 0 18px' },
    dot: (active)=>({ width:10, height:10, borderRadius:'999px', background: active? '#3651ff':'#d6d9e6' }),
    row: { display:'flex', justifyContent:'space-between', alignItems:'center' },
    textBtn: { background:'transparent', border:'none', color:'#64748b', cursor:'pointer' },
    next: {
      padding:'10px 16px', borderRadius: 12, border:'1px solid #3651ff',
      background:'linear-gradient(180deg,#5b7cfa,#3651ff)', color:'#fff',
      cursor:'pointer', fontWeight:700, boxShadow:'0 8px 20px rgba(54,81,255,.25)'
    }
  }

  const p = pages[step]

  return (
    <div style={ui.wrap}>
      <div style={ui.art}>{p.art}</div>
      <div style={ui.title}>{p.title}</div>
      <div style={ui.desc}>{p.desc}</div>

      <div style={ui.dots}>
        {pages.map((_, i) => <span key={i} style={ui.dot(i===step)} />)}
      </div>

      <div style={ui.row}>
        <button style={ui.textBtn} onClick={onSkip}>Skip</button>
        <button
          style={ui.next}
          onClick={() => step < pages.length - 1 ? setStep(step + 1) : onNext()}
        >
          {step < pages.length - 1 ? 'Next' : 'Get Started'}
        </button>
      </div>
    </div>
  )
}