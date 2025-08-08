import React, { useState } from 'react'
import Welcome from './components/Welcome.jsx'
import GetStartedForm from './components/GetStartedForm.jsx'
import AddVehicleForm from './components/AddVehicleForm.jsx'

export default function App() {
  const [view, setView] = useState('welcome') // 'welcome' | 'signup' | 'addVehicle'

  const ui = {
    app: {
      minHeight: '100vh',
      margin: 0,
      background:
        'radial-gradient(1100px 700px at 10% 10%, #7aa7ff22, transparent 60%),' +
        'radial-gradient(900px 700px at 90% 20%, #7cffd922, transparent 60%),' +
        'linear-gradient(180deg, #f5f7fb, #eef2f9)',
      display: 'flex',
      flexDirection: 'column',
    },
    nav: {
      position: 'sticky', top: 0, zIndex: 10,
      display: 'flex', justifyContent: 'center', gap: 12,
      padding: '14px 16px', background: '#ffffffaa',
      backdropFilter: 'saturate(130%) blur(8px)',
      borderBottom: '1px solid #e6e9f2',
    },
    tab: (active) => ({
      padding: '10px 16px', borderRadius: 10,
      border: '1px solid ' + (active ? '#3651ff' : '#d6d9e6'),
      background: active ? 'linear-gradient(180deg,#5b7cfa,#3651ff)' : '#fff',
      color: active ? '#fff' : '#475569', cursor: 'pointer',
      fontWeight: 700, boxShadow: active ? '0 8px 20px rgba(54,81,255,.25)' : 'none'
    }),
    main: { flex: 1, display: 'grid', placeItems: 'center', padding: 24 },
    card: {
      width: 'min(900px, 94vw)',
      background: '#fff', border: '1px solid #e6e8f0',
      borderRadius: 20, boxShadow: '0 18px 50px rgba(30,45,90,.12)',
      padding: 24
    },
    head: { fontSize: 22, fontWeight: 800, color: '#1f2937', marginBottom: 8 },
    sub: { color: '#64748b', marginBottom: 12 }
  }

  return (
    <div style={ui.app}>
      <nav style={ui.nav}>
        <button style={ui.tab(view === 'welcome')} onClick={() => setView('welcome')}>Welcome</button>
        <button style={ui.tab(view === 'signup')} onClick={() => setView('signup')}>Sign Up</button>
        <button style={ui.tab(view === 'addVehicle')} onClick={() => setView('addVehicle')}>Add Vehicle</button>
      </nav>

      <main style={ui.main}>
        {view === 'welcome' && (
          <Welcome onSkip={() => setView('signup')} onNext={() => setView('signup')} />
        )}

        {view !== 'welcome' && (
          <div style={ui.card}>
            <div style={ui.head}>{view === 'signup' ? 'Create your account' : 'Add your vehicle'}</div>
            <div style={ui.sub}>
              {view === 'signup'
                ? 'Use your email to get started.（接后端时把这里换成真实 API 说明）'
                : 'Provide plate number and basic info to save your vehicle.'}
            </div>
            {view === 'signup' ? <GetStartedForm /> : <AddVehicleForm />}
          </div>
        )}
      </main>
    </div>
  )
}