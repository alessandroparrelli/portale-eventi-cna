import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import { Field, Input, Btn } from '../../components/ui'
import { Camera, Eye, EyeOff, Save, CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react'

const RUOLO_COL = { admin:'#E11D48', supervisore:'#D97706', utente:'#6B7280' }

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [])
  return (
    <div style={{
      position:'fixed', bottom:'28px', left:'50%', transform:'translateX(-50%)',
      zIndex:999, display:'flex', alignItems:'center', gap:'10px',
      backgroundColor: type==='ok' ? '#F0FDF4' : '#FEF2F2',
      border:`1.5px solid ${type==='ok' ? '#86EFAC' : '#FECACA'}`,
      borderRadius:'12px', padding:'14px 22px',
      boxShadow:'0 8px 32px rgba(0,0,0,.18)',
      fontFamily:"'Outfit',sans-serif", fontSize:'14px', fontWeight:'700',
      color: type==='ok' ? '#15803D' : '#DC2626', whiteSpace:'nowrap',
    }}>
      {type==='ok' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
      {msg}
    </div>
  )
}

function Card({ title, icon, children }) {
  return (
    <div style={{ backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'12px', marginBottom:'16px', overflow:'hidden' }}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid #F3F4F6', backgroundColor:'#FAFAFA', display:'flex', alignItems:'center', gap:'8px' }}>
        <span style={{ fontSize:'16px' }}>{icon}</span>
        <h3 style={{ margin:0, fontSize:'14px', fontWeight:'700', color:'#0A0A0A' }}>{title}</h3>
      </div>
      <div style={{ padding:'20px' }}>{children}</div>
    </div>
  )
}

export default function ProfiloPage() {
  const { user }           = useAuth()
  const { profile, ruolo } = useRole()
  const fileRef            = useRef()

  const [nome,     setNome]     = useState('')
  const [cognome,  setCognome]  = useState('')
  const [username, setUsername] = useState('')
  const [avatarUrl,setAvatarUrl]= useState('')
  const [pwdNew,   setPwdNew]   = useState('')
  const [pwdConf,  setPwdConf]  = useState('')
  const [showN,    setShowN]    = useState(false)
  const [showC,    setShowC]    = useState(false)
  const [log,      setLog]      = useState([])

  const [savingP,  setSavingP]  = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [savingAv, setSavingAv] = useState(false)
  const [toast,    setToast]    = useState(null)
  const [errU,     setErrU]     = useState('')
  const [errPw,    setErrPw]    = useState('')

  // Carica dati profilo
  useEffect(() => {
    if (!profile) return
    setNome(profile.nome || '')
    setCognome(profile.cognome || '')
    setUsername(profile.username || '')
    setAvatarUrl(profile.avatar_url || '')
  }, [profile])

  // Carica log
  useEffect(() => {
    if (!user?.id) return
    supabase.from('activity_log').select('azione,created_at')
      .eq('user_id', user.id).order('created_at', { ascending:false }).limit(20)
      .then(({ data }) => setLog(data || []))
  }, [user])

  const ok  = msg => setToast({ msg, type:'ok'  })
  const err = msg => setToast({ msg, type:'err' })

  // ── SALVA PROFILO ────────────────────────────────────────
  async function saveProfile() {
    if (!username.trim()) { setErrU('Obbligatorio'); return }
    setErrU(''); setSavingP(true)

    const { error } = await supabase
      .from('admin_profiles')
      .update({ nome: nome||null, cognome: cognome||null, username: username.trim() })
      .eq('id', user.id)

    setSavingP(false)
    if (error) {
      console.error('saveProfile error:', error)
      err('Errore: ' + error.message)
    } else {
      ok('Profilo salvato! ✓')
    }
  }

  // ── CAMBIA PASSWORD ──────────────────────────────────────
  async function savePassword() {
    if (!pwdNew)                 { setErrPw('Inserisci la nuova password'); return }
    if (pwdNew.length < 8)       { setErrPw('Minimo 8 caratteri'); return }
    if (pwdNew !== pwdConf)      { setErrPw('Le password non corrispondono'); return }
    setErrPw(''); setSavingPw(true)

    // Usa la edge function solo per il cambio password (unica operazione che richiede service role)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        'https://hnkhckcclgabunkqfmrz.supabase.co/functions/v1/admin-users',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: 'change_my_password', password: pwdNew }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Errore')
      setPwdNew(''); setPwdConf('')
      ok('Password aggiornata! ✓')
    } catch (e) {
      console.error('savePassword error:', e)
      err('Errore: ' + e.message)
    }
    setSavingPw(false)
  }

  // ── UPLOAD AVATAR ────────────────────────────────────────
  async function uploadAvatar(file) {
    if (!file || !file.type.startsWith('image/')) return
    setSavingAv(true)
    const ext  = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`
    const { error: upErr } = await supabase.storage
      .from('avatars').upload(path, file, { upsert:true })
    if (upErr) { err('Errore upload: ' + upErr.message); setSavingAv(false); return }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = data.publicUrl + '?t=' + Date.now() // cache bust
    const { error: dbErr } = await supabase
      .from('admin_profiles').update({ avatar_url: url }).eq('id', user.id)
    if (dbErr) { err('Errore salvataggio foto: ' + dbErr.message) }
    else { setAvatarUrl(url); ok('Foto aggiornata! ✓') }
    setSavingAv(false)
  }

  const initials    = ((nome||'').charAt(0)+(cognome||'').charAt(0)).toUpperCase()
                   || (username||'?').charAt(0).toUpperCase()
  const displayName = nome&&cognome ? `${nome} ${cognome}` : username || 'Utente'
  const email       = profile?.email || user?.email || ''

  const LOG_MAP = {
    login:'🔑 Accesso', logout:'👋 Disconnessione',
    profilo_aggiornato:'✏️ Profilo aggiornato', avatar_aggiornato:'📸 Foto aggiornata',
    password_cambiata:'🔒 Password modificata', evento_creato:'📅 Evento creato',
    evento_modificato:'✏️ Evento modificato', checkin_effettuato:'✅ Check-in',
    utente_creato:'👤 Utente creato',
  }

  return (
    <div style={{ maxWidth:'520px', margin:'0 auto', fontFamily:"'Outfit',sans-serif", width:'100%', boxSizing:'border-box' }}>

      {/* ── HEADER PROFILO ── */}
      <div style={{ backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'12px', padding:'20px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'16px' }}>
        {/* Avatar */}
        <div style={{ position:'relative', flexShrink:0, cursor:'pointer' }} onClick={() => fileRef.current?.click()}>
          <div style={{
            width:'72px', height:'72px', borderRadius:'50%',
            backgroundColor: RUOLO_COL[ruolo]||'#E11D48',
            overflow:'hidden', display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:'26px', fontWeight:'900', color:'#FFF',
            border:'3px solid #FFF', boxShadow:'0 2px 12px rgba(0,0,0,.12)',
          }}>
            {savingAv
              ? <Loader2 size={26} style={{ animation:'spin .8s linear infinite' }}/>
              : avatarUrl
                ? <img src={avatarUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                : initials}
          </div>
          <div style={{ position:'absolute', bottom:0, right:0, width:'22px', height:'22px', borderRadius:'50%', backgroundColor:'#E11D48', border:'2px solid #FFF', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Camera size={11} style={{ color:'#FFF' }}/>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => uploadAvatar(e.target.files[0])}/>

        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <h2 style={{ fontSize:'18px', fontWeight:'900', color:'#0A0A0A', margin:'0 0 2px', letterSpacing:'-.02em' }}>{displayName}</h2>
          <p style={{ fontSize:'13px', color:'#6B7280', margin:'0 0 6px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{email}</p>
          <span style={{ fontSize:'11px', fontWeight:'700', backgroundColor:(RUOLO_COL[ruolo]||'#6B7280')+'20', color:RUOLO_COL[ruolo]||'#6B7280', padding:'3px 10px', borderRadius:'20px', textTransform:'capitalize' }}>
            {ruolo}
          </span>
        </div>
      </div>

      {/* ── DATI PERSONALI ── */}
      <Card title="Dati personali" icon="👤">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }} className="grid-2col">
          <Field label="Nome">
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Mario"/>
          </Field>
          <Field label="Cognome">
            <Input value={cognome} onChange={e => setCognome(e.target.value)} placeholder="Rossi"/>
          </Field>
        </div>
        <Field label="Username *" error={errU}>
          <Input value={username} onChange={e => { setUsername(e.target.value); setErrU('') }} placeholder="mario.rossi"/>
        </Field>
        <div style={{ marginTop:'12px' }}>
          <label style={{ fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'4px' }}>Email</label>
          <div style={{ padding:'10px 12px', backgroundColor:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'6px', fontSize:'14px', color:'#9CA3AF' }}>{email}</div>
          <p style={{ fontSize:'11px', color:'#9CA3AF', margin:'3px 0 0' }}>Non modificabile</p>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'16px' }}>
          <Btn onClick={saveProfile} disabled={savingP}>
            {savingP ? <><Loader2 size={15} style={{ animation:'spin .8s linear infinite' }}/> Salvo…</> : <><Save size={15}/> Salva profilo</>}
          </Btn>
        </div>
      </Card>

      {/* ── CAMBIA PASSWORD ── */}
      <Card title="Cambia password" icon="🔒">
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {[
            { val:pwdNew, set:setPwdNew, show:showN, setShow:setShowN, label:'Nuova password', ph:'Minimo 8 caratteri' },
            { val:pwdConf, set:setPwdConf, show:showC, setShow:setShowC, label:'Conferma password', ph:'Ripeti la nuova password' },
          ].map(({ val, set, show, setShow, label, ph }) => (
            <Field key={label} label={label} error={label==='Nuova password'?errPw:''}>
              <div style={{ position:'relative' }}>
                <Input type={show?'text':'password'} value={val}
                  onChange={e => { set(e.target.value); setErrPw('') }}
                  placeholder={ph} style={{ paddingRight:'44px' }}/>
                <button onClick={() => setShow(!show)}
                  style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#6B7280', display:'flex' }}>
                  {show ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </Field>
          ))}
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <Btn onClick={savePassword} disabled={savingPw}>
              {savingPw ? <><Loader2 size={15} style={{ animation:'spin .8s linear infinite' }}/> Aggiorno…</> : '🔒 Aggiorna password'}
            </Btn>
          </div>
        </div>
      </Card>

      {/* ── LOG ATTIVITÀ ── */}
      {log.length > 0 && (
        <Card title="Attività recente" icon="📋">
          {log.map((e, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 0', borderBottom: i < log.length-1 ? '1px solid #F3F4F6' : 'none' }}>
              <span style={{ flex:1, fontSize:'13px', fontWeight:'500', color:'#374151' }}>
                {LOG_MAP[e.azione] || e.azione}
              </span>
              <span style={{ fontSize:'11px', color:'#9CA3AF', display:'flex', alignItems:'center', gap:'3px', flexShrink:0 }}>
                <Clock size={11}/>
                {new Date(e.created_at).toLocaleString('it-IT', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
              </span>
            </div>
          ))}
        </Card>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}
      <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}
