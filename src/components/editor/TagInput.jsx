import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function TagInput({ value = [], onChange }) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSug, setShowSug] = useState(false)

  useEffect(() => {
    // Carica suggerimenti: mestieri + tag già usati in altri eventi
    Promise.all([
      supabase.from('mestieri').select('nome').eq('attivo', true).order('nome'),
    ]).then(([{ data: mestieri }]) => {
      const sug = (mestieri || []).map(m => m.nome)
      setSuggestions(sug)
    })
  }, [])

  function addTag(tag) {
    const t = tag.trim()
    if (!t || value.includes(t)) return
    onChange([...value, t])
    setInput('')
    setShowSug(false)
  }

  function removeTag(tag) {
    onChange(value.filter(t => t !== tag))
  }

  function handleKey(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const filtered = suggestions.filter(s =>
    input.length >= 1 &&
    s.toLowerCase().includes(input.toLowerCase()) &&
    !value.includes(s)
  ).slice(0, 6)

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px 10px',
        border: '1px solid #D1D5DB', borderRadius: '6px', backgroundColor: '#ffffff',
        minHeight: '42px', cursor: 'text', alignItems: 'center' }}
        onClick={() => document.getElementById('tag-input-field')?.focus()}>
        {value.map(tag => (
          <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px',
            backgroundColor: '#003DA514', color: '#003DA5', fontSize: '12px', fontWeight: '700',
            borderRadius: '999px', padding: '3px 10px', letterSpacing: '0.01em' }}>
            {tag}
            <button type="button" onClick={() => removeTag(tag)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#003DA5',
                padding: 0, display: 'flex', alignItems: 'center', lineHeight: 1, fontSize: '13px' }}>
              ×
            </button>
          </span>
        ))}
        <input
          id="tag-input-field"
          value={input}
          onChange={e => { setInput(e.target.value); setShowSug(true) }}
          onKeyDown={handleKey}
          onFocus={() => setShowSug(true)}
          onBlur={() => setTimeout(() => setShowSug(false), 150)}
          placeholder={value.length === 0 ? 'Aggiungi tag… (Invio o virgola per confermare)' : ''}
          style={{ border: 'none', outline: 'none', fontSize: '13px', fontFamily: "'Inter',sans-serif",
            flex: 1, minWidth: '140px', color: '#0A0A0A', backgroundColor: 'transparent' }}
        />
      </div>
      {/* Suggerimenti */}
      {showSug && filtered.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)', marginTop: '4px', overflow: 'hidden' }}>
          <p style={{ fontSize: '10px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase',
            letterSpacing: '0.06em', padding: '8px 12px 4px', margin: 0 }}>
            Mestieri / Suggerimenti
          </p>
          {filtered.map(s => (
            <button key={s} type="button" onMouseDown={() => addTag(s)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px',
                border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
                fontSize: '13px', fontFamily: "'Inter',sans-serif", color: '#374151', fontWeight: '500' }}
              onMouseEnter={e => e.target.style.backgroundColor = '#F3F4F6'}
              onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
