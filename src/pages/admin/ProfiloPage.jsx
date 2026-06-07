import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import { Field, Input, Btn, RuoloBadge } from '../../components/ui'
import { Camera, Eye, EyeOff, Save, CheckCircle2, AlertCircle, Clock, Shield, Loader2 } from 'lucide-react'

function Avatar({ url, username, size=72, onClick }) {
  const initials = (username||'?').slice(0,2).toUpperCase()
  return (
    <div onClick={onClick} style={{
      width:`${size}px`, height:`${size}px`, borderRadius:'50%',
      overflow:'hidden', flexShrink:0, cursor:onClick?'pointer':'default',
      backgroundColor:'#003DA5', display:'flex', alignItems:'center',
      justifyContent:'center', fontSize:`${size*0.35}px`, fontWeight:'900',
      color:'#FFF', position:'relative', border:'3px solid #FFFFFF',
      boxShadow:'0 2px 12px rgba(0,0,0,.15)',
    }}>
      {url
        ? <img src={url} alt={username} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
        : initials}
      {onClick && (
        <div style={{ position:'absolute', inset:0, backgroundColor:'rgba(0,0,0,.4)',
          display:'flex', alignItems:'center', justifyContent:'center',
          opacity:0, transition:'opacity .15s' }}
          onMouseEnter={e=>e.currentTarget.style.opacity='1'}
          onMouseLeave={e=>e.currentTarget.style.opacity='0'}>
          <Camera size={size*0.3} style={{ color:'#FFF' }}/>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'10px', padding:'24px', marginBottom:'20px' }}>
      <h3 style={{ fontSize:'15px', fontWeight:'700', color:'#0A0A0A', letterSpacing:'-.01em', margin:'0 0 20px', paddingBottom:'12px', borderBottom:'1px solid #F3F4F6' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [])
  return (
    <div style={{
      position:'fixed', bottom:'24px', right:'24px', zIndex:200,
      backgroundColor: type==='ok' ? '#F0FDF4' : '#FEF2F2',
      border:`1px solid ${type==='ok'?'#86EFAC':'#FECACA'}`,
      borderRadius:'10px', padding:'14px 18px',
      display:'flex', alignItems:'center', gap:'10px',
      boxShadow:'0 8px 32px rgba(0,0,0,.12)', fontFamily:"'Inter',sans-serif",
      fontSize:'14px', fontWeight:'600',
      color: type==='ok' ? '#15803D' : '#DC2626',
      animation:'slideUp .25s ease',
    }}>
      {type==='ok' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
      {msg}
    </div>
  )
}

export default function ProfiloPage() {
  const { user, supabase: sb } = useAuth()
  const { profile, ruolo, loading: roleLoading } = useRole()
  const fileRef = useRef()

  const [form, setForm] = useState({ nome:'', cognome:'', username:'', email:'', avatar_url:'' })
  const [pwd,  setPwd]  = useState({ current:'', new:'', confirm:'' })
  const [log,  setLog]  = useState([])
  const [showPwd, setShowPwd] = useState({ cur:false, nw:false, cf:false })
  const [saving, setSaving] = useState({ profile:false, pwd:false, avatar:false })
  const [toast, setToast]   = useState(null)
  const [errors, setErrors]  = useState({})

  useEffect(() => {
    if (profile) {
      setForm({
        nome:       profile.nome       || '',
        cognome:    profile.cognome    || '',
        username:   profile.username   || '',
        email:      profile.email      || user?.email || '',
        avatar_url: profile.avatar_url || '',
      })
    }
    loadLog()
  }, [profile])

  async function loadLog() {
    const { data } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending:false })
      .limit(50)
    setLog(data || [])
  }

  function toast_ok(msg) { setToast({ msg, type:'ok' }) }
  function toast_err(msg){ setToast({ msg, type:'err' }) }

  async function saveProfile() {
    if (!form.username.trim()) { setErrors({ username:'Campo obbligatorio' }); return }
    setSaving(p=>({...p,profile:true}))
    const { error } = await supabase.from('admin_profiles').update({
      nome:       form.nome.trim()    || null,
      cognome:    form.cognome.trim() || null,
      username:   form.username.trim(),
      avatar_url: form.avatar_url    || null,
    }).eq('id', user.id)
    if (error) {
      console.error('saveProfile error:', error)
      toast_err('Errore: ' + (error.message || 'Riprova'))
    } else {
      // Aggiorna anche user_metadata di Supabase Auth
      await supabase.auth.updateUser({
        data: { username: form.username.trim() }
      })
      await supabase.rpc('log_activity', {
        p_azione: 'profilo_aggiornato',
        p_dettagli: { username: form.username }
      }).catch(() => {})
      toast_ok('Profilo aggiornato!')
    }
    setSaving(p=>({...p,profile:false}))
  }

  async function savePassword() {
    const e = {}
    if (!pwd.current)           e.current = 'Campo obbligatorio'
    if (!pwd.new)               e.new     = 'Campo obbligatorio'
    if (pwd.new.length < 8)     e.new     = 'Minimo 8 caratteri'
    if (pwd.new !== pwd.confirm) e.confirm = 'Le password non corrispondono'
    if (Object.keys(e).length)  { setErrors(e); return }
    setSaving(p=>({...p,pwd:true}))
    const { error } = await supabase.auth.updateUser({ password: pwd.new })
    if (error) toast_err('Errore cambio password: ' + error.message)
    else {
      await supabase.rpc('log_activity', { p_azione:'password_cambiata' })
      setPwd({ current:'', new:'', confirm:'' })
      toast_ok('Password aggiornata!')
    }
    setSaving(p=>({...p,pwd:false}))
  }

  async function uploadAvatar(file) {
    if (!file || !file.type.startsWith('image/')) return
    setSaving(p=>({...p,avatar:true}))
    const ext  = file.name.split('.').pop()
    const path = `${user.id}/avatar-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert:true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      setForm(p=>({...p, avatar_url: data.publicUrl}))
      await supabase.from('admin_profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id)
      await supabase.rpc('log_activity', { p_azione:'avatar_aggiornato' })
      toast_ok('Foto profilo aggiornata!')
    } else { toast_err('Errore upload immagine') }
    setSaving(p=>({...p,avatar:false}))
  }

  const RUOLO_COL = { admin:'#003DA5', supervisore:'#D97706', utente:'#6B7280' }

  if (roleLoading) return (
    <div style={{ padding:'40px', textAlign:'center', color:'#9CA3AF' }}>Caricamento…</div>
  )

  return (
    <div style={{ maxWidth:'720px' }}>
      <div style={{ marginBottom:'28px' }}>
        <h1 style={{ fontSize:'32px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-.03em', margin:0 }}>
          Il mio account
        </h1>
        <p style={{ fontSize:'14px', color:'#6B7280', margin:'4px 0 0' }}>Gestisci il tuo profilo, la password e visualizza l'attività</p>
      </div>

      {/* ── CARD PROFILO ────────────────────────────────── */}
      <Section title="Foto e identità">
        <div style={{ display:'flex', alignItems:'center', gap:'20px', marginBottom:'24px' }}>
          <div style={{ position:'relative' }}>
            {saving.avatar
              ? <div style={{ width:'72px', height:'72px', borderRadius:'50%', backgroundColor:'#F3F4F6', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Loader2 size={24} style={{ color:'#003DA5', animation:'spin .8s linear infinite' }}/>
                </div>
              : <Avatar url={form.avatar_url} username={form.username} size={72} onClick={() => fileRef.current?.click()}/>
            }
          </div>
          <div>
            <p style={{ fontSize:'16px', fontWeight:'800', color:'#0A0A0A', margin:'0 0 4px', letterSpacing:'-.02em' }}>
              {form.nome && form.cognome ? `${form.nome} ${form.cognome}` : form.username || 'Utente'}
            </p>
            <p style={{ fontSize:'13px', color:'#6B7280', margin:'0 0 8px' }}>{form.email}</p>
            <RuoloBadge ruolo={ruolo}/>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
            onChange={e => uploadAvatar(e.target.files[0])}/>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
          <Field label="Nome">
            <Input value={form.nome} onChange={e=>setForm(p=>({...p,nome:e.target.value}))} placeholder="Mario"/>
          </Field>
          <Field label="Cognome">
            <Input value={form.cognome} onChange={e=>setForm(p=>({...p,cognome:e.target.value}))} placeholder="Rossi"/>
          </Field>
          <div style={{ gridColumn:'1/-1' }}>
            <Field label="Username" required error={errors.username}>
              <Input value={form.username}
                onChange={e=>{setForm(p=>({...p,username:e.target.value}));setErrors(p=>({...p,username:''}))}}
                placeholder="mario.rossi"/>
            </Field>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <Field label="Email">
              <Input value={form.email} disabled style={{ backgroundColor:'#F9FAFB', color:'#9CA3AF' }}/>
              <p style={{ fontSize:'11px', color:'#9CA3AF', margin:'4px 0 0' }}>L'email non può essere modificata da qui. Contatta un admin.</p>
            </Field>
          </div>
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'16px' }}>
          <Btn onClick={saveProfile} disabled={saving.profile}>
            {saving.profile ? <><Loader2 size={15} style={{ animation:'spin .8s linear infinite' }}/> Salvataggio…</> : <><Save size={15}/> Salva profilo</>}
          </Btn>
        </div>
      </Section>

      {/* ── CAMBIO PASSWORD ─────────────────────────────── */}
      <Section title="🔒 Sicurezza — Cambia password">
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          {[
            { key:'current', label:'Password attuale', placeholder:'••••••••' },
            { key:'new',     label:'Nuova password',   placeholder:'Minimo 8 caratteri' },
            { key:'confirm', label:'Conferma password', placeholder:'Ripeti la nuova password' },
          ].map(({ key, label, placeholder }) => (
            <Field key={key} label={label} error={errors[key]}>
              <div style={{ position:'relative' }}>
                <Input type={showPwd[key==='current'?'cur':key==='new'?'nw':'cf'] ? 'text':'password'}
                  value={pwd[key]}
                  onChange={e=>{setPwd(p=>({...p,[key]:e.target.value}));setErrors(p=>({...p,[key]:''  }))}}
                  placeholder={placeholder}
                  style={{ paddingRight:'40px' }}/>
                <button onClick={()=>setShowPwd(p=>({...p,[key==='current'?'cur':key==='new'?'nw':'cf']:!p[key==='current'?'cur':key==='new'?'nw':'cf']}))}
                  style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#6B7280', display:'flex' }}>
                  {showPwd[key==='current'?'cur':key==='new'?'nw':'cf'] ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </Field>
          ))}
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <Btn onClick={savePassword} disabled={saving.pwd}>
              {saving.pwd ? <><Loader2 size={15} style={{ animation:'spin .8s linear infinite' }}/> Aggiornamento…</> : '🔒 Aggiorna password'}
            </Btn>
          </div>
        </div>
      </Section>

      {/* ── LOG ATTIVITÀ ─────────────────────────────────── */}
      <Section title="📋 Log attività recente">
        {log.length === 0 ? (
          <p style={{ fontSize:'14px', color:'#9CA3AF', textAlign:'center', padding:'20px 0' }}>Nessuna attività registrata.</p>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>
            {log.map((entry, i) => (
              <div key={entry.id} style={{ display:'flex', gap:'14px', alignItems:'flex-start', padding:'12px 0',
                borderBottom: i<log.length-1 ? '1px solid #F3F4F6' : 'none' }}>
                <div style={{ width:'32px', height:'32px', borderRadius:'50%', backgroundColor:'#EEF3FF',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'1px' }}>
                  <span style={{ fontSize:'14px' }}>{LOG_ICONS[entry.azione] || '🔹'}</span>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:'13px', fontWeight:'600', color:'#0A0A0A', margin:0 }}>
                    {LOG_LABELS[entry.azione] || entry.azione}
                  </p>
                  {entry.dettagli && Object.keys(entry.dettagli).length > 0 && (
                    <p style={{ fontSize:'12px', color:'#9CA3AF', margin:'2px 0 0', fontFamily:'monospace' }}>
                      {JSON.stringify(entry.dettagli)}
                    </p>
                  )}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'4px', color:'#9CA3AF', flexShrink:0 }}>
                  <Clock size={12}/>
                  <span style={{ fontSize:'11px' }}>
                    {new Date(entry.created_at).toLocaleString('it-IT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  )
}

const LOG_ICONS = {
  login:                '🔑',
  logout:               '👋',
  profilo_aggiornato:   '✏️',
  avatar_aggiornato:    '📸',
  password_cambiata:    '🔒',
  evento_creato:        '📅',
  evento_modificato:    '✏️',
  evento_eliminato:     '🗑️',
  iscritto_eliminato:   '👤',
  checkin_effettuato:   '✅',
  utente_creato:        '👤',
  utente_eliminato:     '🗑️',
  email_inviata:        '📧',
}
const LOG_LABELS = {
  login:                'Accesso effettuato',
  logout:               'Disconnessione',
  profilo_aggiornato:   'Profilo aggiornato',
  avatar_aggiornato:    'Foto profilo aggiornata',
  password_cambiata:    'Password modificata',
  evento_creato:        'Evento creato',
  evento_modificato:    'Evento modificato',
  evento_eliminato:     'Evento eliminato',
  iscritto_eliminato:   'Iscritto eliminato',
  checkin_effettuato:   'Check-in effettuato',
  utente_creato:        'Utente creato',
  utente_eliminato:     'Utente eliminato',
  email_inviata:        'Email inviata',
}
