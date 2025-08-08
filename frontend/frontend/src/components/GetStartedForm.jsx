import React, { useState } from 'react'

export default function GetStartedForm() {
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')

  const box = { display:'grid', gap:12 }
  const input = {
    width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid #d7dbe8',
    outline:'none'
  }
  const btn = {
    padding:'12px 16px', borderRadius:12, border:'1px solid #3651ff',
    background:'linear-gradient(180deg,#5b7cfa,#3651ff)', color:'#fff', cursor:'pointer',
    fontWeight:700, boxShadow:'0 8px 20px rgba(54,81,255,.25)'
  }

  function submit(e){
    e.preventDefault()
    setErr('')
    if(!/\S+@\S+\.\S+/.test(email)) return setErr('Please enter a valid email.')
    if(pwd.length < 6) return setErr('Password must be at least 6 characters.')
    alert('Demo login success: ' + email)
  }

  return (
    <form onSubmit={submit} style={box}>
      <input style={input} placeholder="you@monash.edu" value={email} onChange={e=>setEmail(e.target.value)} />
      <input style={input} type="password" placeholder="••••••••" value={pwd} onChange={e=>setPwd(e.target.value)} />
      {err && <div style={{color:'#b91c1c', background:'#fee2e2', padding:'8px 10px', borderRadius:10, border:'1px solid #fecaca'}}>{err}</div>}
      <button style={btn}>Sign up</button>
    </form>
  )
}
