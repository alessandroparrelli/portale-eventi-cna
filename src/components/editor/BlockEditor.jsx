/**
 * BlockEditor — editor a blocchi per la landing page
 * Ogni blocco è { id, tipo, ...dati }
 * Tipi: 'testo' | 'stats' | 'griglia' | 'cta' | 'separatore' | 'immagine'
 */
import { useState, useCallback } from 'react'
import RichEditor from './RichEditor'
import ImageUploader from './ImageUploader'

// ── Generatore ID ──────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9)

// ── Blocco di default per tipo ─────────────────────────────
export function newBlock(tipo) {
  const base = { id: uid(), tipo }
  switch (tipo) {
    case 'testo':      return { ...base, html: '<p>Scrivi qui…</p>' }
    case 'stats':      return { ...base, items: [{ num: '100+', label: 'Partecipanti' }, { num: '10', label: 'Relatori' }], colore: '#003DA5' }
    case 'griglia':    return { ...base, cols: [{ titolo: 'Titolo 1', testo: 'Descrizione.' }, { titolo: 'Titolo 2', testo: 'Descrizione.' }] }
    case 'cta':        return { ...base, titolo: 'Partecipa all\'evento', testo_btn: 'Iscriviti ora →', colore: '#003DA5' }
    case 'separatore': return { ...base }
    case 'immagine':   return { ...base, src: '', didascalia: '' }
    default:           return base
  }
}

// ── CSS per preview blocchi ────────────────────────────────
const BLOCK_TYPES = [
  { tipo: 'testo',      emoji: '📝', label: 'Testo' },
  { tipo: 'stats',      emoji: '📊', label: 'Statistiche' },
  { tipo: 'griglia',    emoji: '⊞',  label: 'Griglia' },
  { tipo: 'cta',        emoji: '🎯', label: 'CTA' },
  { tipo: 'immagine',   emoji: '🖼',  label: 'Immagine' },
  { tipo: 'separatore', emoji: '—',  label: 'Separatore' },
]

// ── Blocco stats editor ────────────────────────────────────
function StatsEditor({ block, onChange }) {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
        <label style={lb}>Colore numeri</label>
        <input type="color" value={block.colore || '#003DA5'}
          onChange={e => onChange({ ...block, colore: e.target.value })}
          style={{ width: '36px', height: '28px', border: 'none', cursor: 'pointer' }} />
      </div>
      {(block.items || []).map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input value={item.num} onChange={e => {
            const items = [...block.items]; items[i] = { ...items[i], num: e.target.value }
            onChange({ ...block, items })
          }} placeholder="100+" style={{ ...inp, width: '80px', fontWeight: '700', fontSize: '16px' }} />
          <input value={item.label} onChange={e => {
            const items = [...block.items]; items[i] = { ...items[i], label: e.target.value }
            onChange({ ...block, items })
          }} placeholder="Partecipanti" style={{ ...inp, flex: 1 }} />
          <button onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}
            style={btnDel}>✕</button>
        </div>
      ))}
      <button onClick={() => onChange({ ...block, items: [...(block.items || []), { num: '0', label: 'Etichetta' }] })}
        style={btnAdd}>+ Aggiungi statistica</button>
    </div>
  )
}

// ── Blocco griglia editor ──────────────────────────────────
function GrigliaEditor({ block, onChange }) {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
        <label style={lb}>Colonne:</label>
        {[2, 3, 4].map(n => (
          <button key={n} onClick={() => {
            let cols = [...(block.cols || [])]
            while (cols.length < n) cols.push({ titolo: `Titolo ${cols.length + 1}`, testo: 'Descrizione.' })
            onChange({ ...block, cols: cols.slice(0, n) })
          }} style={{ ...btnAdd, padding: '4px 12px', backgroundColor: (block.cols || []).length === n ? '#003DA5' : '#F3F4F6', color: (block.cols || []).length === n ? '#FFF' : '#374151' }}>
            {n}
          </button>
        ))}
      </div>
      {(block.cols || []).map((col, i) => (
        <div key={i} style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input value={col.icona || ''} onChange={e => {
            const cols = [...block.cols]; cols[i] = { ...cols[i], icona: e.target.value }
            onChange({ ...block, cols })
          }} placeholder="🎯 Emoji opzionale" style={{ ...inp, width: '140px' }} />
          <input value={col.titolo} onChange={e => {
            const cols = [...block.cols]; cols[i] = { ...cols[i], titolo: e.target.value }
            onChange({ ...block, cols })
          }} placeholder="Titolo colonna" style={{ ...inp, fontWeight: '700' }} />
          <textarea value={col.testo} onChange={e => {
            const cols = [...block.cols]; cols[i] = { ...cols[i], testo: e.target.value }
            onChange({ ...block, cols })
          }} placeholder="Testo descrittivo" rows={2}
            style={{ ...inp, resize: 'vertical', fontFamily: "'Inter',sans-serif" }} />
        </div>
      ))}
    </div>
  )
}

// ── Blocco CTA editor ──────────────────────────────────────
function CtaEditor({ block, onChange }) {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div>
        <label style={lb}>Titolo</label>
        <input value={block.titolo || ''} onChange={e => onChange({ ...block, titolo: e.target.value })}
          placeholder="Partecipa all'evento" style={inp} />
      </div>
      <div>
        <label style={lb}>Testo pulsante</label>
        <input value={block.testo_btn || ''} onChange={e => onChange({ ...block, testo_btn: e.target.value })}
          placeholder="Iscriviti ora →" style={inp} />
      </div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <label style={lb}>Colore</label>
        <input type="color" value={block.colore || '#003DA5'}
          onChange={e => onChange({ ...block, colore: e.target.value })}
          style={{ width: '36px', height: '28px', border: 'none', cursor: 'pointer' }} />
      </div>
    </div>
  )
}

// ── Blocco immagine editor ─────────────────────────────────
function ImmagineEditor({ block, onChange }) {
  const align = block.align || 'center'
  const size  = block.size  || 'large'

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <ImageUploader value={block.src || null} onChange={url => onChange({ ...block, src: url || '' })} />

      {/* Allineamento */}
      <div>
        <label style={lb}>Allineamento</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[['left','◀ Sinistra'],['center','■ Centro'],['right','▶ Destra']].map(([val, label]) => (
            <button key={val} type="button"
              onClick={() => onChange({ ...block, align: val })}
              style={{ flex: 1, padding: '7px', border: `1px solid ${align===val?'#003DA5':'#E5E7EB'}`, borderRadius: '6px', backgroundColor: align===val?'#EEF3FF':'#FFF', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily:"'Inter',sans-serif", color: align===val?'#003DA5':'#6B7280', transition:'all .1s' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Dimensione */}
      <div>
        <label style={lb}>Dimensione</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[['small','Piccola 33%'],['medium','Media 60%'],['large','Piena 100%']].map(([val, label]) => (
            <button key={val} type="button"
              onClick={() => onChange({ ...block, size: val })}
              style={{ flex: 1, padding: '7px', border: `1px solid ${size===val?'#003DA5':'#E5E7EB'}`, borderRadius: '6px', backgroundColor: size===val?'#EEF3FF':'#FFF', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily:"'Inter',sans-serif", color: size===val?'#003DA5':'#6B7280', transition:'all .1s' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Didascalia */}
      <div>
        <label style={lb}>Didascalia (opzionale)</label>
        <input value={block.didascalia || ''} onChange={e => onChange({ ...block, didascalia: e.target.value })}
          placeholder="Testo sotto l'immagine" style={inp} />
      </div>

      {/* Anteprima */}
      {block.src && (
        <div style={{ marginTop: '4px', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px', textAlign: align }}>
          <img src={block.src} alt="" style={{
            maxWidth: size==='small'?'33%':size==='medium'?'60%':'100%',
            display: 'inline-block',
            borderRadius: '4px',
          }}/>
          {block.didascalia && <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '6px', fontStyle: 'italic' }}>{block.didascalia}</p>}
        </div>
      )}
    </div>
  )
}

// ── Wrapper singolo blocco ─────────────────────────────────
function Block({ block, index, total, onChange, onDelete, onMoveUp, onMoveDown }) {
  const [collapsed, setCollapsed] = useState(false)
  const typeInfo = BLOCK_TYPES.find(t => t.tipo === block.tipo) || { emoji: '📦', label: block.tipo }

  return (
    <div style={{ border: '1.5px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden', marginBottom: '8px', backgroundColor: '#FFF' }}>
      {/* Header blocco */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#FAFAFA', borderBottom: collapsed ? 'none' : '1px solid #E5E7EB', cursor: 'pointer' }}
        onClick={() => setCollapsed(c => !c)}>
        <span style={{ fontSize: '16px' }}>{typeInfo.emoji}</span>
        <span style={{ flex: 1, fontSize: '13px', fontWeight: '700', color: '#374151' }}>
          {typeInfo.label}
          {block.tipo === 'testo' && block.html && (
            <span style={{ fontSize: '11px', fontWeight: '400', color: '#9CA3AF', marginLeft: '8px' }}>
              {block.html.replace(/<[^>]+>/g, '').slice(0, 50)}…
            </span>
          )}
        </span>
        {/* Frecce riordina */}
        <button onClick={e => { e.stopPropagation(); onMoveUp() }} disabled={index === 0}
          style={{ ...btnIcon, opacity: index === 0 ? .3 : 1 }} title="Sposta su">↑</button>
        <button onClick={e => { e.stopPropagation(); onMoveDown() }} disabled={index === total - 1}
          style={{ ...btnIcon, opacity: index === total - 1 ? .3 : 1 }} title="Sposta giù">↓</button>
        <button onClick={e => { e.stopPropagation(); onDelete() }}
          style={{ ...btnIcon, color: '#DC2626', borderColor: '#FECACA' }} title="Elimina">✕</button>
        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{collapsed ? '▶' : '▼'}</span>
      </div>

      {/* Contenuto blocco */}
      {!collapsed && (
        <>
          {block.tipo === 'testo' && (
            <RichEditor value={block.html || ''} onChange={html => onChange({ ...block, html })} minHeight="180px" />
          )}
          {block.tipo === 'stats'      && <StatsEditor    block={block} onChange={onChange} />}
          {block.tipo === 'griglia'    && <GrigliaEditor  block={block} onChange={onChange} />}
          {block.tipo === 'cta'        && <CtaEditor       block={block} onChange={onChange} />}
          {block.tipo === 'immagine'   && <ImmagineEditor  block={block} onChange={onChange} />}
          {block.tipo === 'separatore' && (
            <div style={{ padding: '16px', color: '#9CA3AF', fontSize: '13px', textAlign: 'center' }}>
              — Linea separatrice —
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Componente principale BlockEditor ─────────────────────
export default function BlockEditor({ blocks = [], onChange }) {
  const [showAddMenu, setShowAddMenu] = useState(false)

  function addBlock(tipo) {
    onChange([...blocks, newBlock(tipo)])
    setShowAddMenu(false)
  }

  function updateBlock(i, block) {
    const next = [...blocks]; next[i] = block; onChange(next)
  }

  function deleteBlock(i) {
    onChange(blocks.filter((_, j) => j !== i))
  }

  function moveBlock(i, dir) {
    const next = [...blocks]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div>
      {blocks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px', border: '2px dashed #E5E7EB', borderRadius: '10px', color: '#9CA3AF', marginBottom: '12px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '600' }}>Nessun blocco</p>
          <p style={{ margin: 0, fontSize: '13px' }}>Aggiungi il primo blocco con il pulsante qui sotto</p>
        </div>
      )}

      {blocks.map((block, i) => (
        <Block key={block.id}
          block={block} index={i} total={blocks.length}
          onChange={b => updateBlock(i, b)}
          onDelete={() => deleteBlock(i)}
          onMoveUp={() => moveBlock(i, -1)}
          onMoveDown={() => moveBlock(i, 1)}
        />
      ))}

      {/* Aggiungi blocco */}
      <div style={{ position: 'relative', marginTop: '4px' }}>
        <button type="button" onClick={() => setShowAddMenu(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            width: '100%', padding: '13px',
            border: `2px dashed ${showAddMenu ? '#003DA5' : '#D1D5DB'}`,
            borderRadius: '8px',
            backgroundColor: showAddMenu ? '#EEF3FF' : '#FAFAFA',
            cursor: 'pointer', fontSize: '14px', fontWeight: '700',
            color: showAddMenu ? '#003DA5' : '#6B7280',
            fontFamily: "'Inter',sans-serif", transition: 'all .15s',
          }}>
          <span style={{ fontSize: '18px' }}>{showAddMenu ? '✕' : '+'}</span>
          {showAddMenu ? 'Chiudi' : 'Aggiungi blocco'}
        </button>

        {showAddMenu && (
          <div style={{ marginTop: '6px', border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,.08)' }}>
            {BLOCK_TYPES.map(({ tipo, emoji, label }) => (
              <button key={tipo} type="button" onClick={() => addBlock(tipo)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  width: '100%', padding: '14px 18px',
                  border: 'none', borderBottom: '1px solid #F3F4F6',
                  backgroundColor: '#FFF', cursor: 'pointer',
                  fontFamily: "'Inter',sans-serif", textAlign: 'left',
                  transition: 'background .1s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EEF3FF'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFF'}>
                <span style={{ fontSize: '22px', flexShrink: 0, width: '28px' }}>{emoji}</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#0A0A0A' }}>{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Stili locali ───────────────────────────────────────────
const lb  = { fontSize: '12px', fontWeight: '600', color: '#6B7280', display: 'block', marginBottom: '4px' }
const inp = { width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '14px', fontFamily: "'Inter',sans-serif", outline: 'none', boxSizing: 'border-box' }
const btnAdd = { padding: '8px 14px', border: '1px solid #E5E7EB', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontFamily: "'Inter',sans-serif", fontWeight: '600', backgroundColor: '#F9FAFB', color: '#374151' }
const btnDel = { width: '28px', height: '28px', border: '1px solid #FECACA', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
const btnIcon = { background: 'none', border: '1px solid #E5E7EB', borderRadius: '5px', cursor: 'pointer', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#6B7280', flexShrink: 0 }
