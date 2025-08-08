import React, { useState } from 'react'

export default function AddVehicleForm(){
  const [plate, setPlate] = useState('')
  const [model, setModel] = useState('')

  const box = { display:'grid', gap:12 }
  const input = { width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid #d7dbe8', outline:'none' }
  const btn = {
    padding:'12px 16px', borderRadius:12, border:'1px solid #10b981',
    background:'linear-gradient(180deg,#34d399,#10b981)', color:'#fff', cursor:'pointer',
    fontWeight:700, boxShadow:'0 8px 20px rgba(16,185,129,.25)'
  }

  function save(e){ e.preventDefault(); alert(`Saved: ${plate} / ${model}`) }

  return (
    <form onSubmit={save} style={box}>
      <input style={input} placeholder="Plate number (e.g. ABC-123)" value={plate} onChange={e=>setPlate(e.target.value)} />
      <input style={input} placeholder="Model (e.g. Toyota Camry)" value={model} onChange={e=>setModel(e.target.value)} />
      <button style={btn}>Save vehicle</button>
    </form>
  )
}