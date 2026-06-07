import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../hooks/useRole'
import { useAuth } from '../../hooks/useAuth'
import { Modal, RuoloBadge, Field, Input, Select, Btn, EmptyState } from '../../components/ui'
import { Users, Plus, Pencil, Trash2, ShieldCheck, Eye, EyeOff, Clock, Activity, ToggleLeft, ToggleRight } from 'lucide-react'

const EMPTY_USER = { username:'', email:'', password:'', ruolo:'utente', nome:'', cognome:'' }
const RUOLO_DESC = {
  admin:       'Accesso completo: crea, modifica, elimina, esporta, gestisce utenti.',
  supervisore: 'Può creare e modificare eventi e iscritti, esportare. Non elimina.',
  utente:      'Sola lettura.',
}
const RUOLO_COL = { admin:'#003DA5', supervisore:'#D97706', utente:'#6B7280' }
const LOG_LABELS = {
  login:'Accesso effettuato', logout:'Disconnessione',
  profilo_aggiornato:'Profilo aggiornato', avatar_aggiornato:'Foto profilo aggiornata',
  password_cambiata:'Password modificata', evento_creato:'Evento creato',
  evento_modificato:'Evento modificato', evento_eliminato:'Evento eliminato',
  checkin_effettuato:'Check-in effettuato', utente_creato:'Utente creato',
  utente_eliminato:'Utente eliminato', email_inviata:'Email inviata',
}
const LOG_ICONS = {
  login:'🔑', logout:'👋', profilo_aggiornato:'✏️', avatar_aggiornato:'📸',
  password_cambiata:'🔒', evento_creato:'📅', evento_modificato:'✏️',
  evento_eliminato:'🗑️', checkin_effettuato:'✅', utente_creato:'👤',
  utente_eliminato:'🗑️', email_inviata:'📧',
}

function UserAvatar({ user, size=38 }) {
  const bg  = RUOLO_COL[user.ruolo] || '#6B7280'
  return (
    <div style={{ width:`${size}px`, height:`${size}px`, borderRadius:'50%', overflow:'hidden',
      flexShrink:0, backgroundColor:bg, display:'flex', alignItems:'center',
      justifyContent:'center', fontSize:`${Math.round(size*0.38)}px`, fontWeight:'800', color:'#FFF' }}>
      {user.avatar_url
        ? <img src={user.avatar_url} alt={user.username} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
        : (user.username||'?').charAt(0).toUpperCase()}
    </div>
  )
}

export default function UtentiPage() {
  const [users,       setUsers]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [modal,       setModal]       = useState(null)
  const [current,     setCurrent]     = useState(EMPTY_USER)
  const [saving,      setSaving]      = useState(false)
  const [errors,      setErrors]      = useState({})
  const [showPwd,     setShowPwd]     = useState(false)
  const [logUser,     setLogUser]     = useState(null)
  const [log,         setLog]         = useState([])
  const [logLoading,  setLogLoading]  = useState(false)
  const { isAdmin }  = useRole()
  const { user: me } = useAuth()

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    const { data } = await supabase.from('admin_profiles').select('*').order('created_at',{ascending:false})
    setUsers(data || [])
    setLoading(false)
  }

  async function openLog(u) {
    setLogUser(u); setModal('log'); setLogLoading(true); setLog([])
    const { data } = await supabase.from('activity_log').select('*').eq('user_id', u.id)
      .order('created_at',{ascending:false}).limit(100)
    setLog(data || [])
    setLogLoading(false)
  }

  function openCreate() { setCurrent({...EMPTY_USER}); setErrors({}); setShowPwd(false); setModal('create') }
  function openEdit(u)  { setCurrent({...u, password:''}); setErrors({}); setShowPwd(false); setModal('edit') }

  function validate() {
    const e = {}
    if (!current.username.trim()) e.username = 'Obbligatorio'
    if (!current.email.trim())    e.email    = 'Obbligatorio'
    if (modal==='create' && !current.password.trim()) e.password = 'Obbligatorio'
    if (current.password && current.password.length < 8) e.password = 'Minimo 8 caratteri'
    return e
  }

  async function saveUser() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    if (modal === 'create') {
      const { data, error } = await supabase.rpc('create_admin_user', {
        p_email:    current.email.trim(),
        p_password: current.password,
        p_username: current.username.trim(),
        p_ruolo:    current.ruolo,
      })
      if (error) {
        console.error('create_admin_user error:', error)
        setErrors({ general: error.message || 'Errore nella creazione utente' })
        setSaving(false); return
      }
      await supabase.rpc('log_activity', {
        p_azione: 'utente_creato',
        p_dettagli: { email: current.email }
      }).catch(() => {})
    } else {
      const { error } = await supabase.from('admin_profiles').update({
        username: current.username.trim(),
        nome:     current.nome?.trim()    || null,
        cognome:  current.cognome?.trim() || null,
        ruolo:    current.ruolo,
        attivo:   current.attivo !== false,
      }).eq('id', current.id)
      if (error) {
        console.error('update profile error:', error)
        setErrors({ general: error.message || 'Errore nel salvataggio' })
        setSaving(false); return
      }
      await supabase.rpc('update_admin_user_meta', {
        p_user_id:  current.id,
        p_ruolo:    current.ruolo,
        p_username: current.username.trim()
      }).catch(() => {})
    }
    setSaving(false); setModal(null); loadUsers()
  }

  async function toggleAttivo(u) {
    await supabase.from('admin_profiles').update({ attivo: !u.attivo }).eq('id', u.id)
    loadUsers()
  }

  async function deleteUser() {
    await supabase.rpc('delete_admin_user', { p_user_id: current.id })
    await supabase.rpc('log_activity', { p_azione:'utente_eliminato', p_dettagli:{ username:current.username } })
    setModal(null); loadUsers()
  }

  if (!isAdmin) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', textAlign:'center' }}>
      <ShieldCheck size={48} style={{ color:'#D1D5DB', marginBottom:'12px' }}/>
      <div style={{ marginTop:'12px' }}>
        <p style={{ fontSize:'18px', fontWeight:'700', color:'#0A0A0A' }}>Accesso non autorizzato</p>
        <p style={{ fontSize:'14px', color:'#6B7280' }}>Solo gli amministratori possono gestire gli utenti.</p>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.hdr}>
        <div>
          <h1 style={s.title}>Gestione Utenti</h1>
          <p style={s.sub}>{users.length} utenti registrati</p>
        </div>
        <Btn onClick={openCreate}><Plus size={18}/> Nuovo utente</Btn>
      </div>

      <div style={s.legend}>
        <div style={{ display:'flex', gap:'16px', flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontSize:'11px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.06em' }}>Ruoli:</span>
          {Object.entries(RUOLO_DESC).map(([r]) => (
            <div key={r} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
              <RuoloBadge ruolo={r}/>
            </div>
          ))}
        </div>
      </div>

      <div style={s.card}>
        {loading ? (
          <div style={s.empty}>Caricamento…</div>
        ) : users.length === 0 ? (
          <EmptyState icon={Users} title="Nessun utente" desc="Aggiungi il primo utente admin"
            action={<Btn onClick={openCreate}><Plus size={16}/>Crea utente</Btn>}/>
        ) : (
          <table style={s.table}>
            <thead><tr>
              {['Utente','Ruolo','Stato','Ultimo accesso','Azioni'].map(h=>(
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={s.tr}
                  onMouseEnter={e=>e.currentTarget.style.backgroundColor='#F9FAFB'}
                  onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}>
                  <td style={s.td}>
                    <div style={{ display:'flex', alignItems:'center', gap:'11px' }}>
                      <UserAvatar user={u}/>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                          <p style={s.name}>
                            {u.nome&&u.cognome ? `${u.nome} ${u.cognome}` : u.username}
                          </p>
                          {u.id===me?.id && <span style={s.meBadge}>Tu</span>}
                        </div>
                        <p style={s.emailTxt}>{u.email}</p>
                        {(u.nome||u.cognome) && <p style={s.handle}>@{u.username}</p>}
                      </div>
                    </div>
                  </td>
                  <td style={s.td}><RuoloBadge ruolo={u.ruolo}/></td>
                  <td style={s.td}>
                    <button onClick={()=>u.id!==me?.id&&toggleAttivo(u)}
                      disabled={u.id===me?.id}
                      style={{ display:'flex', alignItems:'center', gap:'5px', background:'none', border:'none',
                        cursor:u.id===me?.id?'default':'pointer', fontFamily:"'Inter',sans-serif",
                        fontSize:'13px', fontWeight:'600', color:u.attivo?'#16A34A':'#9CA3AF',
                        opacity:u.id===me?.id?0.5:1 }}>
                      {u.attivo
                        ? <ToggleRight size={20} style={{ color:'#16A34A' }}/>
                        : <ToggleLeft  size={20}/>}
                      {u.attivo ? 'Attivo' : 'Inattivo'}
                    </button>
                  </td>
                  <td style={s.td}>
                    <span style={{ fontSize:'13px', color:'#6B7280' }}>
                      {u.ultimo_accesso
                        ? new Date(u.ultimo_accesso).toLocaleString('it-IT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})
                        : '—'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <div style={{ display:'flex', gap:'5px' }}>
                      <button style={s.iconBtn} title="Log attività" onClick={()=>openLog(u)}>
                        <Activity size={14}/>
                      </button>
                      <button style={s.iconBtn} title="Modifica" onClick={()=>openEdit(u)}>
                        <Pencil size={14}/>
                      </button>
                      {u.id!==me?.id && (
                        <button style={{...s.iconBtn,color:'#DC2626'}} title="Elimina"
                          onClick={()=>{setCurrent(u);setModal('delete')}}>
                          <Trash2 size={14}/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL CREA/MODIFICA */}
      {(modal==='create'||modal==='edit') && (
        <Modal title={modal==='create'?'Nuovo utente admin':'Modifica utente'} onClose={()=>setModal(null)} width="520px">
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            {errors.general && <div style={s.errBox}>{errors.general}</div>}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <Field label="Nome">
                <Input value={current.nome||''} onChange={e=>setCurrent(p=>({...p,nome:e.target.value}))} placeholder="Mario"/>
              </Field>
              <Field label="Cognome">
                <Input value={current.cognome||''} onChange={e=>setCurrent(p=>({...p,cognome:e.target.value}))} placeholder="Rossi"/>
              </Field>
              <div style={{ gridColumn:'1/-1' }}>
                <Field label="Username" required error={errors.username}>
                  <Input value={current.username}
                    onChange={e=>{setCurrent(p=>({...p,username:e.target.value}));setErrors(p=>({...p,username:''}))}}
                    placeholder="mario.rossi"/>
                </Field>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <Field label="Email" required error={errors.email}>
                  <Input type="email" value={current.email}
                    onChange={e=>{setCurrent(p=>({...p,email:e.target.value}));setErrors(p=>({...p,email:''}))}}
                    placeholder="mario@cnaroma.it" disabled={modal==='edit'}/>
                </Field>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <Field label={modal==='create'?'Password':'Nuova password (opzionale)'} error={errors.password}>
                  <div style={{ position:'relative' }}>
                    <Input type={showPwd?'text':'password'} value={current.password||''}
                      onChange={e=>{setCurrent(p=>({...p,password:e.target.value}));setErrors(p=>({...p,password:''}))}}
                      placeholder={modal==='create'?'Minimo 8 caratteri':'Lascia vuoto per non cambiare'}
                      style={{ paddingRight:'44px' }}/>
                    <button onClick={()=>setShowPwd(!showPwd)}
                      style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#6B7280', display:'flex' }}>
                      {showPwd?<EyeOff size={16}/>:<Eye size={16}/>}
                    </button>
                  </div>
                </Field>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <Field label="Ruolo">
                  <Select value={current.ruolo} onChange={e=>setCurrent(p=>({...p,ruolo:e.target.value}))}>
                    <option value="utente">👁 Utente — solo lettura</option>
                    <option value="supervisore">✏️ Supervisore — crea e modifica</option>
                    <option value="admin">⚡ Admin — accesso completo</option>
                  </Select>
                  <p style={{ fontSize:'12px', color:'#6B7280', margin:'4px 0 0' }}>{RUOLO_DESC[current.ruolo]}</p>
                </Field>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px', paddingTop:'8px', borderTop:'1px solid #F3F4F6' }}>
              <Btn variant="ghost" onClick={()=>setModal(null)}>Annulla</Btn>
              <Btn onClick={saveUser} disabled={saving}>{saving?'Salvataggio…':modal==='create'?'Crea utente':'Salva modifiche'}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL DELETE */}
      {modal==='delete' && (
        <Modal title="Elimina utente" onClose={()=>setModal(null)} width="420px">
          <p style={{ fontSize:'14px', color:'#374151', margin:'0 0 8px' }}>
            Elimina <strong>{current.username}</strong> ({current.email})?
          </p>
          <p style={{ fontSize:'13px', color:'#DC2626', margin:'0 0 24px' }}>Operazione irreversibile.</p>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px' }}>
            <Btn variant="ghost" onClick={()=>setModal(null)}>Annulla</Btn>
            <Btn variant="danger" onClick={deleteUser} disabled={saving}>Elimina definitivamente</Btn>
          </div>
        </Modal>
      )}

      {/* MODAL LOG ATTIVITÀ */}
      {modal==='log' && logUser && (
        <Modal title={`Log attività`} onClose={()=>setModal(null)} width="560px">
          <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', backgroundColor:'#F9FAFB', borderRadius:'8px', marginBottom:'16px' }}>
            <UserAvatar user={logUser} size={42}/>
            <div>
              <p style={{ fontSize:'14px', fontWeight:'700', color:'#0A0A0A', margin:0 }}>
                {logUser.nome&&logUser.cognome?`${logUser.nome} ${logUser.cognome}`:logUser.username}
              </p>
              <p style={{ fontSize:'12px', color:'#6B7280', margin:'1px 0 0' }}>{logUser.email}</p>
            </div>
            <div style={{ marginLeft:'auto' }}><RuoloBadge ruolo={logUser.ruolo}/></div>
          </div>

          {logLoading ? (
            <p style={{ textAlign:'center', color:'#9CA3AF', padding:'32px 0', fontSize:'14px' }}>Caricamento log…</p>
          ) : log.length === 0 ? (
            <p style={{ textAlign:'center', color:'#9CA3AF', padding:'32px 0', fontSize:'14px' }}>Nessuna attività registrata per questo utente.</p>
          ) : (
            <div style={{ maxHeight:'420px', overflowY:'auto' }}>
              {log.map((entry, i) => (
                <div key={entry.id} style={{ display:'flex', gap:'12px', alignItems:'flex-start',
                  padding:'10px 0', borderBottom:i<log.length-1?'1px solid #F3F4F6':'none' }}>
                  <span style={{ fontSize:'16px', width:'26px', flexShrink:0, textAlign:'center', marginTop:'1px' }}>
                    {LOG_ICONS[entry.azione] || '🔹'}
                  </span>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:'13px', fontWeight:'600', color:'#0A0A0A', margin:0 }}>
                      {LOG_LABELS[entry.azione] || entry.azione.replace(/_/g,' ')}
                    </p>
                    {entry.dettagli && Object.keys(entry.dettagli).length > 0 && (
                      <p style={{ fontSize:'11px', color:'#9CA3AF', margin:'2px 0 0', fontFamily:'monospace' }}>
                        {JSON.stringify(entry.dettagli)}
                      </p>
                    )}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'3px', color:'#9CA3AF', flexShrink:0 }}>
                    <Clock size={11}/>
                    <span style={{ fontSize:'11px' }}>
                      {new Date(entry.created_at).toLocaleString('it-IT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

const s = {
  page:    { maxWidth:'1000px' },
  hdr:     { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'12px' },
  title:   { fontSize:'32px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-.03em', margin:0 },
  sub:     { fontSize:'14px', color:'#6B7280', margin:'4px 0 0' },
  legend:  { backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'8px', padding:'10px 16px', marginBottom:'16px' },
  card:    { backgroundColor:'#FFFFFF', borderRadius:'8px', border:'1px solid #E5E7EB', overflow:'hidden' },
  empty:   { padding:'40px', textAlign:'center', color:'#9CA3AF', fontSize:'14px' },
  table:   { width:'100%', borderCollapse:'collapse', fontSize:'14px' },
  th:      { padding:'10px 16px', textAlign:'left', fontSize:'11px', fontWeight:'600', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', borderBottom:'1px solid #E5E7EB', whiteSpace:'nowrap', backgroundColor:'#FAFAFA' },
  tr:      { transition:'background-color .1s' },
  td:      { padding:'12px 16px', borderBottom:'1px solid #F3F4F6', verticalAlign:'middle' },
  name:    { fontWeight:'700', color:'#0A0A0A', margin:0, fontSize:'14px', letterSpacing:'-.01em' },
  emailTxt:{ fontSize:'12px', color:'#6B7280', margin:'1px 0 0' },
  handle:  { fontSize:'11px', color:'#9CA3AF', margin:'1px 0 0' },
  meBadge: { fontSize:'10px', fontWeight:'700', backgroundColor:'#EEF3FF', color:'#003DA5', padding:'1px 7px', borderRadius:'10px' },
  iconBtn: { background:'none', border:'1px solid #E5E7EB', borderRadius:'4px', padding:'5px 6px', cursor:'pointer', color:'#6B7280', display:'flex', alignItems:'center' },
  errBox:  { backgroundColor:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'6px', padding:'10px 14px', fontSize:'13px', color:'#DC2626' },
}
