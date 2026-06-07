import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import { adminApi } from '../../lib/adminApi'
import { Field, Input, Btn } from '../../components/ui'
import { Camera, Eye, EyeOff, Save, CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react'

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [])
  const ok = type === 'ok'
  return (
    <div style={{
      position:'fixed', bottom:'24px', left:'50%', transform:'translateX(-50%)',
      zIndex:300, display:'flex', alignItems:'center', gap:'10px',
      backgroundColor: ok?'#F0FDF4':'#FEF2F2',
      border:`1px solid ${ok?'#86EFAC':'#FECACA'}`,
      borderRadius:'12px', padding:'14px 20px',
      boxShadow:'0 8px 32px rgba(0,0,0,.15)',
      fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:'600',
      color: ok?'#15803D':'#DC2626', whiteSpace:'nowrap',
    }}>
      {ok ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
      {msg}
    </div>
  )
}

function Card({ title, icon, children }) {
  return (
    <div style={{ backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'12px', overflow:'hidden', marginBottom:'16px' }}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid #F3F4F6', display:'flex', alignItems:'center', gap:'8px', backgroundColor:'#FAFAFA' }}>
        <span style={{ fontSize:'16px' }}>{icon}</span>
        <h3 style={{ fontSize:'14px', fontWeight:'700', color:'#0A0A0A', margin:0 }}>{title}</h3>
      </div>
      <div style={{ padding:'20px' }}>{children}</div>
    </div>
  )
}

const RUOLO_COL = { admin:'#003DA5', supervisore:'#D97706', utente:'#6B7280' }
const LOG_ICONS = { login:'🔑',logout:'👋',profilo_aggiornato:'✏️',avatar_aggiornato:'📸',password_cambiata:'🔒',evento_creato:'📅',evento_modificato:'✏️',evento_eliminato:'🗑️',checkin_effettuato:'✅',utente_creato:'👤',utente_eliminato:'🗑️' }
const LOG_LABELS = { login:'Accesso',logout:'Disconnessione',profilo_aggiornato:'Profilo aggiornato',avatar_aggiornato:'Foto aggiornata',password_cambiata:'Password modificata',evento_creato:'Evento creato',evento_modificato:'Evento modificato',evento_eliminato:'Evento eliminato',checkin_effettuato:'Check-in',utente_creato:'Utente creato',utente_eliminato:'Utente eliminato' }

export default function ProfiloPage() {
  const { user }           = useAuth()
  const { profile, ruolo } = useRole()
  const fileRef            = useRef()

  const [form,    setForm]    = useState({ nome:'', cognome:'', username:'' })
  const [pwd,     setPwd]     = useState({ new:'', confirm:'' })
  const [log,     setLog]     = useState([])
  const [showPwd, setShowPwd] = useState({ nw:false, cf:false })
  const [saving,  setSaving]  = useState({ profile:false, pwd:false, avatar:false })
  const [toast,   setToast]   = useState(null)
  const [errors,  setErrors]  = useState({})

  useEffect(() => {
    if (profile) {
      setForm({ nome:profile.nome||'', cognome:profile.cognome||'', username:profile.username||'' })
    }
    if (user?.id) {
      supabase.from('activity_log').select('*').eq('user_id', user.id)
        .order('created_at',{ascending:false}).limit(30)
        .then(({ data }) => setLog(data||[]))
    }
  }, [profile, user])

  const ok  = msg => setToast({ msg, type:'ok'  })
  const err = msg => setToast({ msg, type:'err' })

  async function saveProfile() {
    if (!form.username.trim()) { setErrors({ username:'Obbligatorio' }); return }
    setSaving(p=>({...p,profile:true})); setErrors({})
    try {
      await adminApi.updateMyProfile(form.nome, form.cognome, form.username)
      await supabase.rpc('log_activity', { p_azione:'profilo_aggiornato', p_dettagli:{} }).catch(()=>{})
      ok('Profilo salvato!')
    } catch(e) { err(e.message) }
    setSaving(p=>({...p,profile:false}))
  }

  async function savePassword() {
    const e = {}
    if (!pwd.new)                e.new     = 'Obbligatorio'
    if (pwd.new.length < 8)      e.new     = 'Minimo 8 caratteri'
    if (pwd.new !== pwd.confirm)  e.confirm = 'Non corrispondono'
    if (Object.keys(e).length)   { setErrors(e); return }
    setSaving(p=>({...p,pwd:true})); setErrors({})
    try {
      await adminApi.changeMyPassword(pwd.new)
      await supabase.rpc('log_activity', { p_azione:'password_cambiata', p_dettagli:{} }).catch(()=>{})
      setPwd({ new:'', confirm:'' })
      ok('Password aggiornata!')
    } catch(e) { err(e.message) }
    setSaving(p=>({...p,pwd:false}))
  }

  async function uploadAvatar(file) {
    if (!file) return
    setSaving(p=>({...p,avatar:true}))
    try {
      const ext  = file.name.split('.').pop()
      const path = `${user.id}/avatar-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert:true })
      if (error) throw error
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('admin_profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id)
      setForm(p=>({...p})) // trigger re-render
      ok('Foto aggiornata!')
    } catch(e) { err('Errore upload: ' + e.message) }
    setSaving(p=>({...p,avatar:false}))
  }

  const avatarUrl  = profile?.avatar_url
  const initials   = ((form.nome||'').charAt(0)+(form.cognome||'').charAt(0)).toUpperCase() || (form.username||'?').charAt(0).toUpperCase()
  const displayName = form.nome&&form.cognome ? `${form.nome} ${form.cognome}` : form.username||'Utente'
  const email       = profile?.email || user?.email || ''

  return (
    <div style={{ maxWidth:'540px', margin:'0 auto' }}>

      {/* Header profilo */}
      <div style={{ backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'12px', padding:'20px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'16px' }}>
        <div style={{ position:'relative', cursor:'pointer', flexShrink:0 }} onClick={()=>fileRef.current?.click()}>
          <div style={{ width:'72px', height:'72px', borderRadius:'50%', backgroundColor: RUOLO_COL[ruolo]||'#003DA5', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', fontWeight:'900', color:'#FFF', border:'3px solid #FFF', boxShadow:'0 2px 12px rgba(0,0,0,.15)' }}>
            {saving.avatar
              ? <Loader2 size={24} style={{ animation:'spin .8s linear infinite' }}/>
              : avatarUrl ? <img src={avatarUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : initials}
          </div>
          <div style={{ position:'absolute', bottom:0, right:0, width:'22px', height:'22px', borderRadius:'50%', backgroundColor:'#003DA5', border:'2px solid #FFF', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Camera size={11} style={{ color:'#FFF' }}/>
          </div>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <h2 style={{ fontSize:'18px', fontWeight:'900', color:'#0A0A0A', margin:'0 0 2px', letterSpacing:'-.02em' }}>{displayName}</h2>
          <p style={{ fontSize:'13px', color:'#6B7280', margin:'0 0 6px' }}>{email}</p>
          <span style={{ fontSize:'11px', fontWeight:'700', backgroundColor:(RUOLO_COL[ruolo]||'#6B7280')+'18', color:RUOLO_COL[ruolo]||'#6B7280', padding:'2px 10px', borderRadius:'20px', textTransform:'capitalize' }}>{ruolo}</span>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>uploadAvatar(e.target.files[0])}/>
      </div>

      {/* Dati personali */}
      <Card title="Dati personali" icon="👤">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
          <Field label="Nome"><Input value={form.nome} onChange={e=>setForm(p=>({...p,nome:e.target.value}))} placeholder="Mario"/></Field>
          <Field label="Cognome"><Input value={form.cognome} onChange={e=>setForm(p=>({...p,cognome:e.target.value}))} placeholder="Rossi"/></Field>
        </div>
        <Field label="Username" required error={errors.username}>
          <Input value={form.username} onChange={e=>{setForm(p=>({...p,username:e.target.value}));setErrors(p=>({...p,username:''}))}} placeholder="mario.rossi"/>
        </Field>
        <Field label="Email" style={{ marginTop:'12px' }}>
          <Input value={email} disabled style={{ backgroundColor:'#F9FAFB', color:'#9CA3AF', cursor:'not-allowed' }}/>
          <p style={{ fontSize:'11px', color:'#9CA3AF', margin:'3px 0 0' }}>Non modificabile — contatta un admin</p>
        </Field>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'14px' }}>
          <Btn onClick={saveProfile} disabled={saving.profile}>
            {saving.profile ? <><Loader2 size={15} style={{ animation:'spin .8s linear infinite' }}/> Salvo…</> : <><Save size={15}/> Salva profilo</>}
          </Btn>
        </div>
      </Card>

      {/* Password */}
      <Card title="Cambia password" icon="🔒">
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {[{key:'new',label:'Nuova password',ph:'Minimo 8 caratteri',t:'nw'},{key:'confirm',label:'Conferma password',ph:'Ripeti la nuova password',t:'cf'}].map(({key,label,ph,t})=>(
            <Field key={key} label={label} error={errors[key]}>
              <div style={{ position:'relative' }}>
                <Input type={showPwd[t]?'text':'password'} value={pwd[key]}
                  onChange={e=>{setPwd(p=>({...p,[key]:e.target.value}));setErrors(p=>({...p,[key]:''  }))}}
                  placeholder={ph} style={{ paddingRight:'44px' }}/>
                <button onClick={()=>setShowPwd(p=>({...p,[t]:!p[t]}))}
                  style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#6B7280', display:'flex' }}>
                  {showPwd[t]?<EyeOff size={16}/>:<Eye size={16}/>}
                </button>
              </div>
            </Field>
          ))}
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <Btn onClick={savePassword} disabled={saving.pwd}>
              {saving.pwd ? <><Loader2 size={15} style={{ animation:'spin .8s linear infinite' }}/> Aggiorno…</> : '🔒 Aggiorna password'}
            </Btn>
          </div>
        </div>
      </Card>

      {/* Log */}
      <Card title="Attività recente" icon="📋">
        {log.length === 0 ? (
          <p style={{ fontSize:'13px', color:'#9CA3AF', textAlign:'center', padding:'12px 0', margin:0 }}>Nessuna attività registrata.</p>
        ) : log.map((entry,i) => (
          <div key={entry.id} style={{ display:'flex', gap:'10px', alignItems:'center', padding:'9px 0', borderBottom:i<log.length-1?'1px solid #F3F4F6':'none' }}>
            <span style={{ fontSize:'16px', flexShrink:0 }}>{LOG_ICONS[entry.azione]||'🔹'}</span>
            <span style={{ flex:1, fontSize:'13px', fontWeight:'600', color:'#0A0A0A' }}>{LOG_LABELS[entry.azione]||entry.azione}</span>
            <span style={{ fontSize:'11px', color:'#9CA3AF', display:'flex', alignItems:'center', gap:'3px', flexShrink:0 }}>
              <Clock size={11}/>{new Date(entry.created_at).toLocaleString('it-IT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
            </span>
          </div>
        ))}
      </Card>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
