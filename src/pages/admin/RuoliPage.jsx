import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '../../hooks/usePageTitle'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../hooks/useRole'
import { logAttivita } from '../../lib/activityLog'
import { Modal, Field, Input, Btn, EmptyState } from '../../components/ui'
import { ShieldCheck, Plus, Pencil, Trash2, Lock, ArrowLeft } from 'lucide-react'

const SEZIONI = [
  { key:'dashboard',  label:'Dashboard' },
  { key:'eventi',     label:'Eventi' },
  { key:'iscritti',   label:'Iscritti' },
  { key:'checkin',    label:'Check-in' },
  { key:'statistiche',label:'Statistiche' },
  { key:'log',        label:'Log attività' },
  { key:'email',      label:'Email' },
  { key:'landing',    label:'Landing Page' },
  { key:'calendario', label:'Calendario' },
  { key:'analytics',  label:'Analytics' },
  { key:'utenti',     label:'Utenti' },
  { key:'ruoli',      label:'Ruoli' },
]

const LIVELLI = [
  { value:'nessuno',    label:'Nessuno',    color:'#9CA3AF' },
  { value:'visualizza', label:'Visualizza', color:'#D97706' },
  { value:'gestisci',   label:'Gestisci',   color:'#16A34A' },
]

const EMPTY = { nome:'', descrizione:'', permessi: Object.fromEntries(SEZIONI.map(s => [s.key, 'nessuno'])) }

function LivelloPill({ value, current, onClick, disabled }) {
  const l = LIVELLI.find(x => x.value === value)
  const active = current === value
  return (
    <button
      type="button" disabled={disabled} onClick={onClick}
      style={{
        padding:'4px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:'700',
        border:`1px solid ${active ? l.color : '#E5E7EB'}`,
        backgroundColor: active ? l.color+'18' : '#FFFFFF',
        color: active ? l.color : '#9CA3AF',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily:"'Inter',sans-serif",
      }}>
      {l.label}
    </button>
  )
}

export default function RuoliPage() {
  usePageTitle('Ruoli')
  const { canManage } = useRole()
  const canManageRuoli = canManage('ruoli')

  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'create' | 'edit' | 'delete'
  const [cur, setCur] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState(null)

  useEffect(() => { loadRoles() }, [])

  async function loadRoles() {
    setLoading(true)
    const { data } = await supabase.from('roles').select('*').order('is_sistema', { ascending:false }).order('nome')
    setRoles(data || [])
    setLoading(false)
  }

  const ok = msg => setToast({ msg, type:'ok' })

  function openCreate() { setCur({ ...EMPTY, permessi:{...EMPTY.permessi} }); setErrors({}); setModal('create') }
  function openEdit(r)  { setCur({ ...r, permessi:{...EMPTY.permessi, ...(r.permessi||{})} }); setErrors({}); setModal('edit') }

  function setLivello(sezione, livello) {
    setCur(p => ({ ...p, permessi: { ...p.permessi, [sezione]: livello } }))
  }

  async function saveRole() {
    const e = {}
    if (!cur.nome?.trim()) e.nome = 'Obbligatorio'
    if (cur.nome && !/^[a-z0-9_-]+$/i.test(cur.nome.trim())) e.nome = 'Solo lettere, numeri, trattini (no spazi)'
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    try {
      if (modal === 'create') {
        const { error } = await supabase.from('roles').insert({
          nome: cur.nome.trim().toLowerCase(),
          descrizione: cur.descrizione?.trim() || null,
          permessi: cur.permessi,
        })
        if (error) throw error
        logAttivita('ruolo_creato', { dettagli: { nome: cur.nome } })
        ok('Ruolo creato!')
      } else {
        const { error } = await supabase.from('roles').update({
          descrizione: cur.descrizione?.trim() || null,
          permessi: cur.permessi,
          updated_at: new Date().toISOString(),
        }).eq('id', cur.id)
        if (error) throw error
        logAttivita('ruolo_modificato', { dettagli: { nome: cur.nome } })
        ok('Ruolo aggiornato!')
      }
      setModal(null); loadRoles()
    } catch (e) {
      setErrors({ general: e.message })
    }
    setSaving(false)
  }

  async function deleteRole() {
    setSaving(true)
    try {
      const { count } = await supabase.from('admin_profiles').select('id', { count:'exact', head:true }).eq('ruolo', cur.nome)
      if (count > 0) {
        setErrors({ general: `Impossibile eliminare: ${count} utente${count===1?'':'i'} ${count===1?'ha':'hanno'} ancora questo ruolo. Riassegnali prima di eliminarlo.` })
        setSaving(false)
        return
      }
      const { error } = await supabase.from('roles').delete().eq('id', cur.id)
      if (error) throw error
      logAttivita('ruolo_eliminato', { dettagli: { nome: cur.nome } })
      ok('Ruolo eliminato')
      setModal(null); loadRoles()
    } catch (e) { setErrors({ general: e.message }) }
    setSaving(false)
  }

  if (!canManageRuoli) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', flexDirection:'column', gap:'12px', textAlign:'center' }}>
      <ShieldCheck size={48} style={{ color:'#D1D5DB' }}/>
      <p style={{ fontSize:'18px', fontWeight:'700', color:'#0A0A0A' }}>Accesso non autorizzato</p>
      <p style={{ fontSize:'14px', color:'#6B7280' }}>Non hai i permessi per gestire i ruoli.</p>
    </div>
  )

  return (
    <div style={{ width:'100%' }} className="admin-page">
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <Link to="/admin/utenti" style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'13px', color:'#6B7280', textDecoration:'none', marginBottom:'6px' }}>
            <ArrowLeft size={14}/> Utenti
          </Link>
          <h1 style={{ fontSize:'32px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-.03em', margin:0 }}>Gestione Ruoli</h1>
          <p style={{ fontSize:'14px', color:'#6B7280', margin:'4px 0 0' }}>{roles.length} ruoli — definisci cosa può vedere e fare ogni ruolo per sezione</p>
        </div>
        <Btn onClick={openCreate}><Plus size={18}/> Nuovo ruolo</Btn>
      </div>

      {toast && (
        <div style={{ marginBottom:'16px', padding:'10px 14px', borderRadius:'6px', fontSize:'13px', fontWeight:'600',
          backgroundColor: toast.type==='ok' ? '#F0FDF4' : '#FEF2F2', color: toast.type==='ok' ? '#16A34A' : '#DC2626' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ backgroundColor:'#FFFFFF', borderRadius:'8px', border:'1px solid #E5E7EB', overflow:'hidden' }}>
        {loading ? (
          <p style={{ padding:'40px', textAlign:'center', color:'#9CA3AF', fontSize:'14px' }}>Caricamento…</p>
        ) : roles.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="Nessun ruolo" desc="Crea il primo ruolo personalizzato" action={<Btn onClick={openCreate}><Plus size={16}/>Crea ruolo</Btn>}/>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'14px' }}>
            <thead>
              <tr>{['Ruolo','Descrizione','Tipo','Azioni'].map(h=>(
                <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:'11px', fontWeight:'600', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', borderBottom:'1px solid #E5E7EB', backgroundColor:'#FAFAFA' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.id}>
                  <td style={{ padding:'12px 16px', borderBottom:'1px solid #F3F4F6', verticalAlign:'middle' }}>
                    <span style={{ fontWeight:'700', color:'#0A0A0A', textTransform:'capitalize' }}>{r.nome}</span>
                  </td>
                  <td style={{ padding:'12px 16px', borderBottom:'1px solid #F3F4F6', verticalAlign:'middle', color:'#6B7280' }}>
                    {r.descrizione || '—'}
                  </td>
                  <td style={{ padding:'12px 16px', borderBottom:'1px solid #F3F4F6', verticalAlign:'middle' }}>
                    {r.is_sistema
                      ? <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'11px', fontWeight:'700', color:'#6B7280', backgroundColor:'#F3F4F6', padding:'3px 9px', borderRadius:'20px' }}><Lock size={11}/> Sistema</span>
                      : <span style={{ fontSize:'11px', fontWeight:'700', color:'#7C3AED', backgroundColor:'#F5F3FF', padding:'3px 9px', borderRadius:'20px' }}>Personalizzato</span>}
                  </td>
                  <td style={{ padding:'12px 16px', borderBottom:'1px solid #F3F4F6', verticalAlign:'middle' }}>
                    <div style={{ display:'flex', gap:'5px' }}>
                      <button style={{ background:'none', border:'1px solid #E5E7EB', borderRadius:'4px', padding:'5px 6px', cursor:'pointer', color:'#6B7280', display:'flex', alignItems:'center' }} title="Modifica permessi" onClick={()=>openEdit(r)}><Pencil size={14}/></button>
                      {!r.is_sistema && <button style={{ background:'none', border:'1px solid #FECACA', borderRadius:'4px', padding:'5px 6px', cursor:'pointer', color:'#DC2626', display:'flex', alignItems:'center' }} title="Elimina" onClick={()=>{setCur(r);setErrors({});setModal('delete')}}><Trash2 size={14}/></button>}
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
        <Modal title={modal==='create'?'Nuovo ruolo':`Permessi — ${cur.nome}`} onClose={()=>setModal(null)} width="640px">
          <div style={{ display:'flex', flexDirection:'column', gap:'13px' }}>
            {errors.general && <div style={{ backgroundColor:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'6px', padding:'10px 14px', fontSize:'13px', color:'#DC2626' }}>{errors.general}</div>}
            {modal==='create' && (
              <Field label="Nome ruolo" required error={errors.nome}>
                <Input value={cur.nome} onChange={e=>{setCur(p=>({...p,nome:e.target.value}));setErrors(p=>({...p,nome:''}))}} placeholder="es. marketing"/>
              </Field>
            )}
            <Field label="Descrizione">
              <Input value={cur.descrizione||''} onChange={e=>setCur(p=>({...p,descrizione:e.target.value}))} placeholder="Breve descrizione del ruolo"/>
            </Field>

            <div>
              <label style={{ fontSize:'13px', fontWeight:'500', color:'#0A0A0A', display:'block', marginBottom:'8px' }}>
                Permessi per sezione
              </label>
              <div style={{ display:'flex', flexDirection:'column', gap:'2px', border:'1px solid #E5E7EB', borderRadius:'8px', overflow:'hidden' }}>
                {SEZIONI.map((s, i) => (
                  <div key={s.key} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'9px 14px', backgroundColor: i%2===0 ? '#FFFFFF' : '#FAFAFA',
                  }}>
                    <span style={{ fontSize:'13px', fontWeight:'600', color:'#374151' }}>{s.label}</span>
                    <div style={{ display:'flex', gap:'6px' }}>
                      {LIVELLI.map(l => (
                        <LivelloPill
                          key={l.value} value={l.value}
                          current={cur.permessi?.[s.key] || 'nessuno'}
                          disabled={cur.is_sistema && cur.nome==='admin'}
                          onClick={()=>setLivello(s.key, l.value)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {cur.is_sistema && cur.nome==='admin' && (
                <p style={{ fontSize:'12px', color:'#9CA3AF', margin:'8px 0 0' }}>Il ruolo Admin ha sempre accesso completo a tutte le sezioni.</p>
              )}
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px', paddingTop:'8px', borderTop:'1px solid #F3F4F6' }}>
              <Btn variant="ghost" onClick={()=>setModal(null)}>Annulla</Btn>
              <Btn onClick={saveRole} disabled={saving}>{saving?'Salvo…':modal==='create'?'Crea ruolo':'Salva permessi'}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal elimina */}
      {modal==='delete' && (
        <Modal title="Elimina ruolo" onClose={()=>setModal(null)} width="420px">
          {errors.general && <div style={{ backgroundColor:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'6px', padding:'10px 14px', fontSize:'13px', color:'#DC2626', marginBottom:'16px' }}>{errors.general}</div>}
          <p style={{ fontSize:'14px', color:'#374151', lineHeight:1.6, margin:'0 0 20px' }}>
            Eliminare il ruolo <strong>{cur.nome}</strong>?
          </p>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px' }}>
            <Btn variant="ghost" onClick={()=>setModal(null)}>Annulla</Btn>
            <Btn onClick={deleteRole} disabled={saving} style={{ backgroundColor:'#DC2626' }}>{saving?'Elimino…':'Elimina'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
