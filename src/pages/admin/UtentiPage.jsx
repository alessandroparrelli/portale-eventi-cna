import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../hooks/useRole'
import { useAuth } from '../../hooks/useAuth'
import { adminApi } from '../../lib/adminApi'
import { Modal, RuoloBadge, Field, Input, Select, Btn, EmptyState } from '../../components/ui'
import { Users, Plus, Pencil, Trash2, ShieldCheck, Eye, EyeOff, Activity, Clock, ToggleLeft, ToggleRight } from 'lucide-react'

const RUOLO_COL  = { admin:'#003DA5', supervisore:'#D97706', utente:'#6B7280' }
const RUOLO_DESC = {
  admin:       'Accesso completo: crea, modifica, elimina, gestisce utenti.',
  supervisore: 'Crea e modifica eventi. Non elimina né gestisce utenti.',
  utente:      'Sola lettura.',
}
const LOG_ICONS  = { login:'🔑',logout:'👋',profilo_aggiornato:'✏️',avatar_aggiornato:'📸',password_cambiata:'🔒',evento_creato:'📅',evento_modificato:'✏️',evento_eliminato:'🗑️',checkin_effettuato:'✅',utente_creato:'👤',utente_eliminato:'🗑️' }
const LOG_LABELS = { login:'Accesso',logout:'Disconnessione',profilo_aggiornato:'Profilo aggiornato',avatar_aggiornato:'Foto aggiornata',password_cambiata:'Password modificata',evento_creato:'Evento creato',evento_modificato:'Evento modificato',evento_eliminato:'Evento eliminato',checkin_effettuato:'Check-in',utente_creato:'Utente creato',utente_eliminato:'Utente eliminato' }

const EMPTY = { username:'', email:'', password:'', ruolo:'utente', nome:'', cognome:'' }

function Av({ u, size=38 }) {
  const bg  = RUOLO_COL[u.ruolo]||'#6B7280'
  const ini = (u.username||'?').charAt(0).toUpperCase()
  return (
    <div style={{ width:`${size}px`, height:`${size}px`, borderRadius:'50%', backgroundColor:bg, overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:`${Math.round(size*.38)}px`, fontWeight:'800', color:'#FFF' }}>
      {u.avatar_url ? <img src={u.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : ini}
    </div>
  )
}

export default function UtentiPage() {
  const [users,       setUsers]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [modal,       setModal]       = useState(null)
  const [cur,         setCur]         = useState(EMPTY)
  const [saving,      setSaving]      = useState(false)
  const [errors,      setErrors]      = useState({})
  const [showPwd,     setShowPwd]     = useState(false)
  const [logUser,     setLogUser]     = useState(null)
  const [log,         setLog]         = useState([])
  const [logLoading,  setLogLoading]  = useState(false)
  const [toast,       setToast]       = useState(null)
  const { isAdmin }  = useRole()
  const { user: me } = useAuth()

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    const { data } = await supabase.from('admin_profiles').select('*').order('created_at',{ascending:false})
    setUsers(data||[])
    setLoading(false)
  }

  async function openLog(u) {
    setLogUser(u); setModal('log'); setLogLoading(true); setLog([])
    const { data } = await supabase.from('activity_log').select('*').eq('user_id',u.id).order('created_at',{ascending:false}).limit(100)
    setLog(data||[]); setLogLoading(false)
  }

  function openCreate() { setCur({...EMPTY}); setErrors({}); setShowPwd(false); setModal('create') }
  function openEdit(u)  { setCur({...u,password:''}); setErrors({}); setShowPwd(false); setModal('edit') }

  const ok  = msg => setToast({ msg, type:'ok'  })
  const err = msg => setToast({ msg, type:'err' })

  async function saveUser() {
    const e = {}
    if (!cur.username.trim()) e.username = 'Obbligatorio'
    if (!cur.email.trim())    e.email    = 'Obbligatorio'
    if (modal==='create' && !cur.password) e.password = 'Obbligatorio'
    if (cur.password && cur.password.length < 8) e.password = 'Min 8 caratteri'
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    try {
      if (modal === 'create') {
        await adminApi.createUser(cur.email.trim(), cur.password, cur.username.trim(), cur.ruolo)
        await supabase.rpc('log_activity',{p_azione:'utente_creato',p_dettagli:{email:cur.email}}).catch(()=>{})
        ok('Utente creato!')
      } else {
        await adminApi.updateUser(cur.id, {
          username: cur.username.trim(),
          nome:     cur.nome?.trim()||null,
          cognome:  cur.cognome?.trim()||null,
          ruolo:    cur.ruolo,
          attivo:   cur.attivo!==false,
          ...(cur.password?.trim() ? { password: cur.password } : {})
        })
        ok('Utente aggiornato!')
      }
      setModal(null); loadUsers()
    } catch(e) {
      setErrors({ general: e.message })
    }
    setSaving(false)
  }

  async function toggleAttivo(u) {
    await supabase.from('admin_profiles').update({ attivo:!u.attivo }).eq('id',u.id)
    loadUsers()
  }

  async function deleteUser() {
    setSaving(true)
    try {
      await adminApi.deleteUser(cur.id)
      await supabase.rpc('log_activity',{p_azione:'utente_eliminato',p_dettagli:{username:cur.username}}).catch(()=>{})
      ok('Utente eliminato')
      setModal(null); loadUsers()
    } catch(e) { err(e.message) }
    setSaving(false)
  }

  if (!isAdmin) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', flexDirection:'column', gap:'12px', textAlign:'center' }}>
      <ShieldCheck size={48} style={{ color:'#D1D5DB' }}/>
      <p style={{ fontSize:'18px', fontWeight:'700', color:'#0A0A0A' }}>Accesso non autorizzato</p>
      <p style={{ fontSize:'14px', color:'#6B7280' }}>Solo gli admin possono gestire gli utenti.</p>
    </div>
  )

  return (
    <div style={{ maxWidth:'1000px' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h1 style={{ fontSize:'32px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-.03em', margin:0 }}>Gestione Utenti</h1>
          <p style={{ fontSize:'14px', color:'#6B7280', margin:'4px 0 0' }}>{users.length} utenti</p>
        </div>
        <Btn onClick={openCreate}><Plus size={18}/> Nuovo utente</Btn>
      </div>

      <div style={{ backgroundColor:'#FFFFFF', borderRadius:'8px', border:'1px solid #E5E7EB', overflow:'hidden' }}>
        {loading ? (
          <p style={{ padding:'40px', textAlign:'center', color:'#9CA3AF', fontSize:'14px' }}>Caricamento…</p>
        ) : users.length === 0 ? (
          <EmptyState icon={Users} title="Nessun utente" desc="Crea il primo utente admin" action={<Btn onClick={openCreate}><Plus size={16}/>Crea utente</Btn>}/>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'14px' }}>
            <thead>
              <tr>{['Utente','Ruolo','Stato','Azioni'].map(h=>(
                <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:'11px', fontWeight:'600', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', borderBottom:'1px solid #E5E7EB', backgroundColor:'#FAFAFA' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {users.map(u=>(
                <tr key={u.id}
                  onMouseEnter={e=>e.currentTarget.style.backgroundColor='#F9FAFB'}
                  onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}
                  style={{ transition:'background .1s' }}>
                  <td style={{ padding:'12px 16px', borderBottom:'1px solid #F3F4F6', verticalAlign:'middle' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <Av u={u}/>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                          <p style={{ fontWeight:'700', color:'#0A0A0A', margin:0, fontSize:'14px' }}>
                            {u.nome&&u.cognome ? `${u.nome} ${u.cognome}` : u.username}
                          </p>
                          {u.id===me?.id && <span style={{ fontSize:'10px', fontWeight:'700', backgroundColor:'#EEF3FF', color:'#003DA5', padding:'1px 7px', borderRadius:'10px' }}>Tu</span>}
                        </div>
                        <p style={{ fontSize:'12px', color:'#6B7280', margin:'1px 0 0' }}>{u.email}</p>
                        {(u.nome||u.cognome) && <p style={{ fontSize:'11px', color:'#9CA3AF', margin:'1px 0 0' }}>@{u.username}</p>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px', borderBottom:'1px solid #F3F4F6', verticalAlign:'middle' }}>
                    <RuoloBadge ruolo={u.ruolo}/>
                  </td>
                  <td style={{ padding:'12px 16px', borderBottom:'1px solid #F3F4F6', verticalAlign:'middle' }}>
                    <button onClick={()=>u.id!==me?.id&&toggleAttivo(u)} disabled={u.id===me?.id}
                      style={{ display:'flex', alignItems:'center', gap:'5px', background:'none', border:'none', cursor:u.id===me?.id?'default':'pointer', fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:'600', color:u.attivo?'#16A34A':'#9CA3AF', opacity:u.id===me?.id?.5:1 }}>
                      {u.attivo ? <ToggleRight size={20} style={{ color:'#16A34A' }}/> : <ToggleLeft size={20}/>}
                      {u.attivo ? 'Attivo' : 'Inattivo'}
                    </button>
                  </td>
                  <td style={{ padding:'12px 16px', borderBottom:'1px solid #F3F4F6', verticalAlign:'middle' }}>
                    <div style={{ display:'flex', gap:'5px' }}>
                      <button style={{ background:'none', border:'1px solid #E5E7EB', borderRadius:'4px', padding:'5px 6px', cursor:'pointer', color:'#6B7280', display:'flex', alignItems:'center' }} title="Log" onClick={()=>openLog(u)}><Activity size={14}/></button>
                      <button style={{ background:'none', border:'1px solid #E5E7EB', borderRadius:'4px', padding:'5px 6px', cursor:'pointer', color:'#6B7280', display:'flex', alignItems:'center' }} title="Modifica" onClick={()=>openEdit(u)}><Pencil size={14}/></button>
                      {u.id!==me?.id && <button style={{ background:'none', border:'1px solid #FECACA', borderRadius:'4px', padding:'5px 6px', cursor:'pointer', color:'#DC2626', display:'flex', alignItems:'center' }} title="Elimina" onClick={()=>{setCur(u);setModal('delete')}}><Trash2 size={14}/></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crea/modifica */}
      {(modal==='create'||modal==='edit') && (
        <Modal title={modal==='create'?'Nuovo utente':'Modifica utente'} onClose={()=>setModal(null)} width="500px">
          <div style={{ display:'flex', flexDirection:'column', gap:'13px' }}>
            {errors.general && <div style={{ backgroundColor:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'6px', padding:'10px 14px', fontSize:'13px', color:'#DC2626' }}>{errors.general}</div>}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <Field label="Nome"><Input value={cur.nome||''} onChange={e=>setCur(p=>({...p,nome:e.target.value}))} placeholder="Mario"/></Field>
              <Field label="Cognome"><Input value={cur.cognome||''} onChange={e=>setCur(p=>({...p,cognome:e.target.value}))} placeholder="Rossi"/></Field>
            </div>
            <Field label="Username" required error={errors.username}>
              <Input value={cur.username} onChange={e=>{setCur(p=>({...p,username:e.target.value}));setErrors(p=>({...p,username:''}))}} placeholder="mario.rossi"/>
            </Field>
            <Field label="Email" required error={errors.email}>
              <Input type="email" value={cur.email} onChange={e=>{setCur(p=>({...p,email:e.target.value}));setErrors(p=>({...p,email:''}))}} placeholder="mario@cnaroma.it" disabled={modal==='edit'}/>
            </Field>
            <Field label={modal==='create'?'Password':'Nuova password (opzionale)'} error={errors.password}>
              <div style={{ position:'relative' }}>
                <Input type={showPwd?'text':'password'} value={cur.password||''}
                  onChange={e=>{setCur(p=>({...p,password:e.target.value}));setErrors(p=>({...p,password:''}))}}
                  placeholder={modal==='create'?'Minimo 8 caratteri':'Lascia vuoto per non cambiare'}
                  style={{ paddingRight:'44px' }}/>
                <button onClick={()=>setShowPwd(!showPwd)}
                  style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#6B7280', display:'flex' }}>
                  {showPwd?<EyeOff size={16}/>:<Eye size={16}/>}
                </button>
              </div>
            </Field>
            <Field label="Ruolo">
              <Select value={cur.ruolo} onChange={e=>setCur(p=>({...p,ruolo:e.target.value}))}>
                <option value="utente">👁 Utente — solo lettura</option>
                <option value="supervisore">✏️ Supervisore — crea e modifica</option>
                <option value="admin">⚡ Admin — accesso completo</option>
              </Select>
              <p style={{ fontSize:'12px', color:'#6B7280', margin:'4px 0 0' }}>{RUOLO_DESC[cur.ruolo]}</p>
            </Field>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px', paddingTop:'8px', borderTop:'1px solid #F3F4F6' }}>
              <Btn variant="ghost" onClick={()=>setModal(null)}>Annulla</Btn>
              <Btn onClick={saveUser} disabled={saving}>{saving?'Salvo…':modal==='create'?'Crea utente':'Salva'}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal delete */}
      {modal==='delete' && (
        <Modal title="Elimina utente" onClose={()=>setModal(null)} width="420px">
          <p style={{ fontSize:'14px', color:'#374151', margin:'0 0 8px' }}>Elimina <strong>{cur.username}</strong> ({cur.email})?</p>
          <p style={{ fontSize:'13px', color:'#DC2626', margin:'0 0 24px' }}>Operazione irreversibile.</p>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px' }}>
            <Btn variant="ghost" onClick={()=>setModal(null)}>Annulla</Btn>
            <Btn variant="danger" onClick={deleteUser} disabled={saving}>{saving?'Elimino…':'Elimina'}</Btn>
          </div>
        </Modal>
      )}

      {/* Modal log */}
      {modal==='log' && logUser && (
        <Modal title={`Log — ${logUser.username}`} onClose={()=>setModal(null)} width="520px">
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 14px', backgroundColor:'#F9FAFB', borderRadius:'8px', marginBottom:'14px' }}>
            <Av u={logUser} size={40}/>
            <div>
              <p style={{ fontSize:'14px', fontWeight:'700', color:'#0A0A0A', margin:0 }}>{logUser.nome&&logUser.cognome?`${logUser.nome} ${logUser.cognome}`:logUser.username}</p>
              <p style={{ fontSize:'12px', color:'#6B7280', margin:'1px 0 0' }}>{logUser.email}</p>
            </div>
            <div style={{ marginLeft:'auto' }}><RuoloBadge ruolo={logUser.ruolo}/></div>
          </div>
          {logLoading ? <p style={{ textAlign:'center', color:'#9CA3AF', padding:'24px 0' }}>Caricamento…</p>
          : log.length === 0 ? <p style={{ textAlign:'center', color:'#9CA3AF', padding:'24px 0' }}>Nessuna attività.</p>
          : <div style={{ maxHeight:'380px', overflowY:'auto' }}>
              {log.map((e,i)=>(
                <div key={e.id} style={{ display:'flex', gap:'10px', alignItems:'center', padding:'9px 0', borderBottom:i<log.length-1?'1px solid #F3F4F6':'none' }}>
                  <span style={{ fontSize:'16px', flexShrink:0 }}>{LOG_ICONS[e.azione]||'🔹'}</span>
                  <span style={{ flex:1, fontSize:'13px', fontWeight:'600', color:'#0A0A0A' }}>{LOG_LABELS[e.azione]||e.azione}</span>
                  <span style={{ fontSize:'11px', color:'#9CA3AF', display:'flex', alignItems:'center', gap:'3px', flexShrink:0 }}>
                    <Clock size={11}/>{new Date(e.created_at).toLocaleString('it-IT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
                  </span>
                </div>
              ))}
            </div>}
        </Modal>
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:'24px', left:'50%', transform:'translateX(-50%)', zIndex:300, display:'flex', alignItems:'center', gap:'10px', backgroundColor:toast.type==='ok'?'#F0FDF4':'#FEF2F2', border:`1px solid ${toast.type==='ok'?'#86EFAC':'#FECACA'}`, borderRadius:'12px', padding:'14px 20px', boxShadow:'0 8px 32px rgba(0,0,0,.15)', fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:'600', color:toast.type==='ok'?'#15803D':'#DC2626', whiteSpace:'nowrap' }}>
          {toast.type==='ok'?'✅':'❌'} {toast.msg}
          <button onClick={()=>setToast(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'inherit', marginLeft:'8px', fontSize:'16px' }}>×</button>
        </div>
      )}
    </div>
  )
}
