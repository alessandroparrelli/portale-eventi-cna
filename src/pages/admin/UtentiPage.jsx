import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../hooks/useRole'
import { useAuth } from '../../hooks/useAuth'
import { Modal, RuoloBadge, Field, Input, Select, Btn, EmptyState } from '../../components/ui'
import { Users, Plus, Pencil, Trash2, ShieldCheck, Eye, EyeOff } from 'lucide-react'

const EMPTY_USER = { username:'', email:'', password:'', ruolo:'utente' }

const RUOLO_DESC = {
  admin:       'Accesso completo: crea, modifica, elimina, esporta, gestisce utenti.',
  supervisore: 'Può creare e modificare eventi e iscritti, esportare dati. Non può eliminare né gestire utenti.',
  utente:      'Sola lettura: vede eventi, iscritti e presenti. Non può modificare, eliminare o esportare.',
}

export default function UtentiPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [current, setCurrent] = useState(EMPTY_USER)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [showPwd, setShowPwd] = useState(false)
  const [delConfirm, setDelConfirm] = useState(null)
  const { isAdmin } = useRole()
  const { user: me } = useAuth()

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    const { data } = await supabase.from('admin_profiles').select('*').order('created_at',{ascending:false})
    setUsers(data || [])
    setLoading(false)
  }

  function openCreate() { setCurrent({...EMPTY_USER}); setErrors({}); setShowPwd(false); setModal('create') }
  function openEdit(u) { setCurrent({...u, password:''}); setErrors({}); setShowPwd(false); setModal('edit') }
  function openDelete(u) { setDelConfirm(u) }

  function validate() {
    const e = {}
    if (!current.username.trim()) e.username = 'Campo obbligatorio'
    if (!current.email.trim()) e.email = 'Campo obbligatorio'
    if (modal==='create' && !current.password.trim()) e.password = 'Campo obbligatorio'
    if (current.password && current.password.length < 8) e.password = 'Minimo 8 caratteri'
    return e
  }

  async function saveUser() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)

    if (modal === 'create') {
      // Crea utente in auth.users via SQL (come fatto per Alessandro)
      const { data, error } = await supabase.rpc('create_admin_user', {
        p_email: current.email.trim(),
        p_password: current.password,
        p_username: current.username.trim(),
        p_ruolo: current.ruolo,
      })
      if (error) { setErrors({ general: error.message }); setSaving(false); return }
    } else {
      // Aggiorna profilo
      const updates = { username: current.username.trim(), email: current.email.trim(), ruolo: current.ruolo, updated_at: new Date().toISOString() }
      const { error } = await supabase.from('admin_profiles').update(updates).eq('id', current.id)
      if (error) { setErrors({ general: error.message }); setSaving(false); return }
      // Aggiorna anche auth.users metadata
      await supabase.rpc('update_admin_user_meta', { p_user_id: current.id, p_ruolo: current.ruolo, p_username: current.username.trim() })
    }
    setSaving(false)
    setModal(null)
    loadUsers()
  }

  async function deleteUser() {
    await supabase.rpc('delete_admin_user', { p_user_id: delConfirm.id })
    setDelConfirm(null)
    loadUsers()
  }

  if (!isAdmin) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
        <div style={{ textAlign:'center' }}>
          <ShieldCheck size={48} style={{ color:'#D1D5DB', marginBottom:'12px' }}/>
          <p style={{ fontSize:'18px', fontWeight:'700', color:'#0A0A0A' }}>Accesso non autorizzato</p>
          <p style={{ fontSize:'14px', color:'#6B7280' }}>Solo gli amministratori possono gestire gli utenti.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Gestione Utenti</h1>
          <p style={s.subtitle}>{users.length} utenti admin registrati</p>
        </div>
        <Btn onClick={openCreate}><Plus size={18}/>Nuovo utente</Btn>
      </div>

      {/* Legenda ruoli */}
      <div style={s.legendCard}>
        <p style={s.legendTitle}><ShieldCheck size={14} style={{marginRight:'6px'}}/>Livelli di accesso</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'12px' }}>
          {Object.entries(RUOLO_DESC).map(([ruolo, desc])=>(
            <div key={ruolo} style={s.legendItem}>
              <RuoloBadge ruolo={ruolo}/>
              <p style={s.legendDesc}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabella utenti */}
      <div style={s.card}>
        {loading ? (
          <div style={{ padding:'48px', textAlign:'center', color:'#9CA3AF', fontSize:'14px' }}>Caricamento…</div>
        ) : users.length === 0 ? (
          <EmptyState icon={Users} title="Nessun utente" desc="Aggiungi il primo utente admin"/>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['Utente','Email','Ruolo','Stato','Creato il','Azioni'].map(h=>(
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u=>(
                <tr key={u.id} style={s.tr}
                  onMouseEnter={e=>e.currentTarget.style.backgroundColor='#F9FAFB'}
                  onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}>
                  <td style={s.td}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={s.avatar(u.ruolo)}>{u.username.charAt(0).toUpperCase()}</div>
                      <div>
                        <p style={s.name}>{u.username}</p>
                        {u.id === me?.id && <span style={s.meBadge}>Tu</span>}
                      </div>
                    </div>
                  </td>
                  <td style={s.td}><span style={s.cell}>{u.email}</span></td>
                  <td style={s.td}><RuoloBadge ruolo={u.ruolo}/></td>
                  <td style={s.td}>
                    <span style={{ fontSize:'12px', fontWeight:'600', color: u.attivo ? '#16A34A' : '#6B7280' }}>
                      {u.attivo ? '● Attivo' : '○ Inattivo'}
                    </span>
                  </td>
                  <td style={s.td}><span style={s.cell}>{new Date(u.created_at).toLocaleDateString('it-IT')}</span></td>
                  <td style={s.td}>
                    <div style={{ display:'flex', gap:'6px' }}>
                      <button style={s.iconBtn} title="Modifica" onClick={()=>openEdit(u)}>
                        <Pencil size={15}/>
                      </button>
                      {u.id !== me?.id && (
                        <button style={{...s.iconBtn, color:'#DC2626'}} title="Elimina" onClick={()=>openDelete(u)}>
                          <Trash2 size={15}/>
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

      {/* MODAL CREATE/EDIT */}
      {(modal==='create'||modal==='edit') && (
        <Modal title={modal==='create'?'Nuovo utente admin':'Modifica utente'} onClose={()=>setModal(null)} width="480px">
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {errors.general && <div style={s.errBox}>{errors.general}</div>}
            <Field label="Username" required error={errors.username}>
              <Input value={current.username} onChange={e=>{setCurrent(p=>({...p,username:e.target.value}));setErrors(p=>({...p,username:''}))}} placeholder="es. mario"/>
            </Field>
            <Field label="Email" required error={errors.email}>
              <Input type="email" value={current.email} onChange={e=>{setCurrent(p=>({...p,email:e.target.value}));setErrors(p=>({...p,email:''}))}} placeholder="mario@cnaroma.it" disabled={modal==='edit'}/>
            </Field>
            {modal==='create' && (
              <Field label="Password" required error={errors.password}>
                <div style={{ position:'relative' }}>
                  <Input type={showPwd?'text':'password'} value={current.password}
                    onChange={e=>{setCurrent(p=>({...p,password:e.target.value}));setErrors(p=>({...p,password:''}))}}
                    placeholder="Minimo 8 caratteri" style={{ paddingRight:'40px' }}/>
                  <button onClick={()=>setShowPwd(!showPwd)}
                    style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)',
                      background:'none', border:'none', cursor:'pointer', color:'#6B7280', display:'flex' }}>
                    {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </Field>
            )}
            <Field label="Ruolo">
              <Select value={current.ruolo} onChange={e=>setCurrent(p=>({...p,ruolo:e.target.value}))}>
                <option value="utente">Utente — solo lettura</option>
                <option value="supervisore">Supervisore — crea e modifica</option>
                <option value="admin">Admin — accesso completo</option>
              </Select>
              <p style={{ fontSize:'12px', color:'#6B7280', margin:'4px 0 0' }}>{RUOLO_DESC[current.ruolo]}</p>
            </Field>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'8px' }}>
              <Btn variant="ghost" onClick={()=>setModal(null)}>Annulla</Btn>
              <Btn onClick={saveUser} disabled={saving}>{saving?'Salvataggio…':modal==='create'?'Crea utente':'Salva'}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL DELETE */}
      {delConfirm && (
        <Modal title="Elimina utente" onClose={()=>setDelConfirm(null)} width="420px">
          <p style={{ fontSize:'14px', color:'#374151', marginBottom:'20px' }}>
            Sei sicuro di voler eliminare l'utente <strong>{delConfirm.username}</strong> ({delConfirm.email})? L'operazione non è reversibile.
          </p>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px' }}>
            <Btn variant="ghost" onClick={()=>setDelConfirm(null)}>Annulla</Btn>
            <Btn variant="danger" onClick={deleteUser}>Elimina</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

const RUOLO_AVATAR = { admin:'#003DA5', supervisore:'#D97706', utente:'#6B7280' }

const s = {
  page: { maxWidth:'900px' },
  header: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'24px', flexWrap:'wrap', gap:'12px' },
  title: { fontSize:'32px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-0.03em', margin:0 },
  subtitle: { fontSize:'14px', color:'#6B7280', margin:'4px 0 0', fontWeight:'500' },
  legendCard: { backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'16px 20px', marginBottom:'20px' },
  legendTitle: { display:'flex', alignItems:'center', fontSize:'12px', fontWeight:'600', color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 12px' },
  legendItem: { display:'flex', flexDirection:'column', gap:'6px' },
  legendDesc: { fontSize:'12px', color:'#6B7280', margin:0, lineHeight:'1.5' },
  card: { backgroundColor:'#FFFFFF', borderRadius:'6px', border:'1px solid #E5E7EB', overflow:'hidden' },
  table: { width:'100%', borderCollapse:'collapse', fontSize:'14px' },
  th: { padding:'10px 20px', textAlign:'left', fontSize:'11px', fontWeight:'600', color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid #E5E7EB', whiteSpace:'nowrap', backgroundColor:'#FAFAFA' },
  tr: { transition:'background-color 0.1s' },
  td: { padding:'14px 20px', borderBottom:'1px solid #F3F4F6', verticalAlign:'middle' },
  avatar: (ruolo) => ({ width:'34px', height:'34px', borderRadius:'50%', backgroundColor: RUOLO_AVATAR[ruolo]||'#6B7280', color:'#FFF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'700', flexShrink:0 }),
  name: { fontWeight:'600', color:'#0A0A0A', margin:0, letterSpacing:'-0.01em' },
  meBadge: { fontSize:'10px', fontWeight:'700', backgroundColor:'#EEF3FF', color:'#003DA5', padding:'1px 7px', borderRadius:'10px' },
  cell: { color:'#374151', fontSize:'14px' },
  iconBtn: { background:'none', border:'1px solid #E5E7EB', borderRadius:'4px', padding:'5px 7px', cursor:'pointer', color:'#6B7280', display:'flex', alignItems:'center' },
  errBox: { backgroundColor:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'4px', padding:'10px 14px', fontSize:'14px', color:'#DC2626' },
}
