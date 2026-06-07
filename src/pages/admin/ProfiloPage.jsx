import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import { Field, Input, Btn } from '../../components/ui'
import { Camera, Eye, EyeOff, Save, CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react'

/* ── Toast ─────────────────────────────────────────── */
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [])
  const ok = type === 'ok'
  return (
    <div style={{
      position:'fixed', bottom:'24px', left:'50%', transform:'translateX(-50%)',
      zIndex:300, display:'flex', alignItems:'center', gap:'10px',
      backgroundColor: ok ? '#F0FDF4' : '#FEF2F2',
      border:`1px solid ${ok ? '#86EFAC' : '#FECACA'}`,
      borderRadius:'12px', padding:'14px 20px',
      boxShadow:'0 8px 32px rgba(0,0,0,.15)',
      fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:'600',
      color: ok ? '#15803D' : '#DC2626',
      whiteSpace:'nowrap', animation:'slideUp .25s ease',
    }}>
      {ok ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
      {msg}
    </div>
  )
}

/* ── Avatar ─────────────────────────────────────────── */
function Avatar({ url, initials, uploading, onClick }) {
  return (
    <div style={{ position:'relative', cursor:'pointer' }} onClick={onClick}>
      <div style={{
        width:'84px', height:'84px', borderRadius:'50%',
        backgroundColor:'#003DA5', overflow:'hidden',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:'28px', fontWeight:'900', color:'#FFF',
        border:'3px solid #FFFFFF', boxShadow:'0 4px 16px rgba(0,61,165,.2)',
      }}>
        {uploading ? (
          <Loader2 size={28} style={{ animation:'spin .8s linear infinite', color:'#FFF' }}/>
        ) : url ? (
          <img src={url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
        ) : initials}
      </div>
      {!uploading && (
        <div style={{
          position:'absolute', bottom:0, right:0,
          width:'26px', height:'26px', borderRadius:'50%',
          backgroundColor:'#003DA5', border:'2px solid #FFF',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Camera size={12} style={{ color:'#FFF' }}/>
        </div>
      )}
    </div>
  )
}

/* ── Card sezione ────────────────────────────────────── */
function Card({ title, icon, children }) {
  return (
    <div style={{ backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'12px', overflow:'hidden', marginBottom:'16px' }}>
      <div style={{ padding:'16px 20px', borderBottom:'1px solid #F3F4F6', display:'flex', alignItems:'center', gap:'8px' }}>
        <span style={{ fontSize:'16px' }}>{icon}</span>
        <h3 style={{ fontSize:'15px', fontWeight:'700', color:'#0A0A0A', margin:0, letterSpacing:'-.01em' }}>{title}</h3>
      </div>
      <div style={{ padding:'20px' }}>
        {children}
      </div>
    </div>
  )
}

const LOG_ICONS  = { login:'🔑', logout:'👋', profilo_aggiornato:'✏️', avatar_aggiornato:'📸', password_cambiata:'🔒', evento_creato:'📅', evento_modificato:'✏️', evento_eliminato:'🗑️', checkin_effettuato:'✅', utente_creato:'👤', utente_eliminato:'🗑️' }
const LOG_LABELS = { login:'Accesso effettuato', logout:'Disconnessione', profilo_aggiornato:'Profilo aggiornato', avatar_aggiornato:'Foto profilo aggiornata', password_cambiata:'Password modificata', evento_creato:'Evento creato', evento_modificato:'Evento modificato', evento_eliminato:'Evento eliminato', checkin_effettuato:'Check-in effettuato', utente_creato:'Utente creato', utente_eliminato:'Utente eliminato' }
const RUOLO_COL  = { admin:'#003DA5', supervisore:'#D97706', utente:'#6B7280' }

export default function ProfiloPage() {
  const { user }                   = useAuth()
  const { profile, ruolo }         = useRole()
  const fileRef                    = useRef()

  const [form,    setForm]    = useState({ nome:'', cognome:'', username:'', avatar_url:'' })
  const [pwd,     setPwd]     = useState({ new:'', confirm:'' })
  const [log,     setLog]     = useState([])
  const [showPwd, setShowPwd] = useState({ nw:false, cf:false })
  const [saving,  setSaving]  = useState({ profile:false, pwd:false, avatar:false })
  const [toast,   setToast]   = useState(null)
  const [errors,  setErrors]  = useState({})

  useEffect(() => {
    if (profile) {
      setForm({
        nome:       profile.nome       || '',
        cognome:    profile.cognome    || '',
        username:   profile.username   || '',
        avatar_url: profile.avatar_url || '',
      })
    }
    loadLog()
  }, [profile])

  async function loadLog() {
    if (!user?.id) return
    const { data } = await supabase
      .from('activity_log').select('*').eq('user_id', user.id)
      .order('created_at', { ascending:false }).limit(30)
    setLog(data || [])
  }

  const ok  = msg => setToast({ msg, type:'ok'  })
  const err = msg => setToast({ msg, type:'err' })

  async function saveProfile() {
    if (!form.username.trim()) { setErrors({ username:'Obbligatorio' }); return }
    setSaving(p => ({...p, profile:true}))
    setErrors({})

    const { error } = await supabase.from('admin_profiles')
      .update({
        nome:       form.nome.trim()    || null,
        cognome:    form.cognome.trim() || null,
        username:   form.username.trim(),
        avatar_url: form.avatar_url     || null,
      })
      .eq('id', user.id)

    if (error) {
      console.error('saveProfile:', error)
      err('Errore: ' + error.message)
    } else {
      await supabase.rpc('log_activity', { p_azione:'profilo_aggiornato', p_dettagli:{ username:form.username } }).catch(()=>{})
      ok('Profilo salvato!')
      loadLog()
    }
    setSaving(p => ({...p, profile:false}))
  }

  async function savePassword() {
    const e = {}
    if (!pwd.new)               e.new     = 'Obbligatorio'
    if (pwd.new.length < 8)     e.new     = 'Minimo 8 caratteri'
    if (pwd.new !== pwd.confirm) e.confirm = 'Le password non corrispondono'
    if (Object.keys(e).length)  { setErrors(e); return }
    setSaving(p => ({...p, pwd:true}))
    setErrors({})

    // supabase.auth.updateUser non tocca auth.users direttamente dal client
    const { error } = await supabase.auth.updateUser({ password: pwd.new })
    if (error) {
      console.error('savePassword:', error)
      err('Errore: ' + error.message)
    } else {
      await supabase.rpc('log_activity', { p_azione:'password_cambiata' }).catch(()=>{})
      setPwd({ new:'', confirm:'' })
      ok('Password aggiornata!')
      loadLog()
    }
    setSaving(p => ({...p, pwd:false}))
  }

  async function uploadAvatar(file) {
    if (!file || !file.type.startsWith('image/')) return
    setSaving(p => ({...p, avatar:true}))
    const ext  = file.name.split('.').pop()
    const path = `${user.id}/avatar-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert:true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const avatarUrl = data.publicUrl
      setForm(p => ({...p, avatar_url: avatarUrl}))
      await supabase.from('admin_profiles').update({ avatar_url: avatarUrl }).eq('id', user.id)
      await supabase.rpc('log_activity', { p_azione:'avatar_aggiornato' }).catch(()=>{})
      ok('Foto aggiornata!')
    } else {
      err('Errore upload: ' + error.message)
    }
    setSaving(p => ({...p, avatar:false}))
  }

  const initials = ((form.nome||'').charAt(0) + (form.cognome||'').charAt(0)).toUpperCase() || (form.username||'?').charAt(0).toUpperCase()
  const displayName = form.nome && form.cognome ? `${form.nome} ${form.cognome}` : form.username || 'Utente'

  return (
    <div style={{ maxWidth:'560px', margin:'0 auto' }}>

      {/* ── HEADER PROFILO ── */}
      <div style={{ backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'12px', padding:'24px 20px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'20px' }}>
        <Avatar
          url={form.avatar_url} initials={initials}
          uploading={saving.avatar}
          onClick={() => fileRef.current?.click()}
        />
        <div style={{ flex:1, minWidth:0 }}>
          <h2 style={{ fontSize:'20px', fontWeight:'900', color:'#0A0A0A', margin:'0 0 4px', letterSpacing:'-.02em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {displayName}
          </h2>
          <p style={{ fontSize:'13px', color:'#6B7280', margin:'0 0 8px' }}>{profile?.email || user?.email}</p>
          <span style={{ fontSize:'12px', fontWeight:'700', backgroundColor: (RUOLO_COL[ruolo]||'#6B7280') + '18', color: RUOLO_COL[ruolo]||'#6B7280', padding:'3px 10px', borderRadius:'20px', textTransform:'capitalize' }}>
            {ruolo}
          </span>
        </div>
        <div style={{ textAlign:'center' }}>
          <button onClick={() => fileRef.current?.click()}
            style={{ background:'none', border:'1px solid #E5E7EB', borderRadius:'8px', padding:'8px 12px', cursor:'pointer', fontSize:'12px', fontWeight:'600', color:'#374151', fontFamily:"'Inter',sans-serif", display:'flex', alignItems:'center', gap:'5px' }}>
            <Camera size={14}/> Foto
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
          onChange={e => uploadAvatar(e.target.files[0])}/>
      </div>

      {/* ── DATI PERSONALI ── */}
      <Card title="Dati personali" icon="👤">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
          <Field label="Nome">
            <Input value={form.nome} onChange={e=>setForm(p=>({...p,nome:e.target.value}))} placeholder="Mario"/>
          </Field>
          <Field label="Cognome">
            <Input value={form.cognome} onChange={e=>setForm(p=>({...p,cognome:e.target.value}))} placeholder="Rossi"/>
          </Field>
        </div>
        <Field label="Username" required error={errors.username}>
          <Input value={form.username}
            onChange={e=>{setForm(p=>({...p,username:e.target.value}));setErrors(p=>({...p,username:''}))}}
            placeholder="mario.rossi"/>
        </Field>
        <div style={{ marginTop:'12px' }}>
          <Field label="Email">
            <Input value={profile?.email || user?.email || ''} disabled
              style={{ backgroundColor:'#F9FAFB', color:'#9CA3AF', cursor:'not-allowed' }}/>
            <p style={{ fontSize:'11px', color:'#9CA3AF', margin:'4px 0 0' }}>
              L'email non può essere modificata da qui.
            </p>
          </Field>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'16px' }}>
          <Btn onClick={saveProfile} disabled={saving.profile}>
            {saving.profile
              ? <><Loader2 size={15} style={{ animation:'spin .8s linear infinite' }}/> Salvataggio…</>
              : <><Save size={15}/> Salva profilo</>}
          </Btn>
        </div>
      </Card>

      {/* ── PASSWORD ── */}
      <Card title="Sicurezza" icon="🔒">
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {[
            { key:'new',     label:'Nuova password',    ph:'Minimo 8 caratteri',     toggle:'nw' },
            { key:'confirm', label:'Conferma password', ph:'Ripeti la nuova password', toggle:'cf' },
          ].map(({ key, label, ph, toggle }) => (
            <Field key={key} label={label} error={errors[key]}>
              <div style={{ position:'relative' }}>
                <Input
                  type={showPwd[toggle] ? 'text' : 'password'}
                  value={pwd[key]}
                  onChange={e => { setPwd(p=>({...p,[key]:e.target.value})); setErrors(p=>({...p,[key]:''})) }}
                  placeholder={ph}
                  style={{ paddingRight:'44px' }}/>
                <button onClick={() => setShowPwd(p=>({...p,[toggle]:!p[toggle]}))}
                  style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#6B7280', display:'flex' }}>
                  {showPwd[toggle] ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </Field>
          ))}
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <Btn onClick={savePassword} disabled={saving.pwd}>
              {saving.pwd
                ? <><Loader2 size={15} style={{ animation:'spin .8s linear infinite' }}/> Aggiornamento…</>
                : '🔒 Aggiorna password'}
            </Btn>
          </div>
        </div>
      </Card>

      {/* ── LOG ATTIVITÀ ── */}
      <Card title="Attività recente" icon="📋">
        {log.length === 0 ? (
          <p style={{ fontSize:'13px', color:'#9CA3AF', textAlign:'center', padding:'16px 0', margin:0 }}>
            Nessuna attività registrata.
          </p>
        ) : (
          <div>
            {log.map((entry, i) => (
              <div key={entry.id} style={{
                display:'flex', gap:'12px', alignItems:'flex-start',
                padding:'10px 0',
                borderBottom: i < log.length-1 ? '1px solid #F3F4F6' : 'none'
              }}>
                <span style={{ fontSize:'18px', flexShrink:0, marginTop:'1px' }}>
                  {LOG_ICONS[entry.azione] || '🔹'}
                </span>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:'13px', fontWeight:'600', color:'#0A0A0A', margin:0 }}>
                    {LOG_LABELS[entry.azione] || entry.azione.replace(/_/g,' ')}
                  </p>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'4px', color:'#9CA3AF', flexShrink:0 }}>
                  <Clock size={11}/>
                  <span style={{ fontSize:'11px' }}>
                    {new Date(entry.created_at).toLocaleString('it-IT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      <style>{`
        @keyframes spin    { from{transform:rotate(0)}   to{transform:rotate(360deg)} }
        @keyframes slideUp { from{transform:translateX(-50%) translateY(16px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }
      `}</style>
    </div>
  )
}
