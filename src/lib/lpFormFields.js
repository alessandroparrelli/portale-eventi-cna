// Campi standard del form landing page (condivisi tra editor e pagina pubblica)
export const STD_FIELDS = [
  { key:'nome',        label:'Nome',         tipo:'testo', default_on:true  },
  { key:'cognome',     label:'Cognome',      tipo:'testo', default_on:true  },
  { key:'email',       label:'Email',        tipo:'email', default_on:true, locked:true },
  { key:'telefono',    label:'Telefono',     tipo:'tel',   default_on:false },
  { key:'azienda',     label:'Azienda',      tipo:'testo', default_on:false },
  { key:'partita_iva', label:'Partita IVA',  tipo:'testo', default_on:true  },
  { key:'citta',       label:'Citta',        tipo:'testo', default_on:false },
]

// Normalizza i campi: standard sempre presenti (in ordine fisso), poi i personalizzati
export function normalizeFormFields(arr) {
  const base = Array.isArray(arr) ? arr : []
  const std = STD_FIELDS.map(s => {
    const c = base.find(x => x && x.key === s.key)
    return {
      key: s.key,
      label: (c && c.label) || s.label,
      tipo: (c && c.tipo) || s.tipo,
      std: true,
      enabled: s.locked ? true : (c ? c.enabled !== false : s.default_on),
      required: s.locked ? true : !!(c && c.required),
    }
  })
  const custom = base
    .filter(x => x && !STD_FIELDS.some(s => s.key === x.key))
    .map(x => ({ ...x, std: false, enabled: x.enabled !== false }))
  return [...std, ...custom]
}
