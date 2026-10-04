/**
 * ContenutoBlocks — gestisce il raggruppamento sezioni_inizio/fine
 * Condiviso tra LandingPagePublic e LandingPage (eventi)
 */
import BlockRenderer from './BlockRenderer'

export default function ContenutoBlocks({ blocks, cp, formTarget, eventData }) {
  const PADDING_MAP  = { nessuno:'0', S:'24px', M:'48px', L:'72px', XL:'96px' }
  const RADIUS_MAP   = { nessuno:'0', S:'8px', M:'16px', L:'24px' }
  const MAX_W_MAP    = { contenuto:'800px', ampia:'1100px', piena:'100%' }
  const FULL_W_TYPES = new Set(['nav_ancorata','hero_interno'])

  // Raggruppa: ogni sezione_inizio apre un gruppo, sezione_fine lo chiude
  const grouped = []
  let currentSection = null
  for (const block of (blocks || [])) {
    if (block.tipo === 'sezione_inizio') {
      currentSection = { marker: block, children: [] }
    } else if (block.tipo === 'sezione_fine') {
      if (currentSection) {
        grouped.push({ type: 'section', marker: currentSection.marker, children: currentSection.children })
        currentSection = null
      }
    } else {
      if (currentSection) {
        currentSection.children.push(block)
      } else {
        grouped.push({ type: 'flat', block })
      }
    }
  }
  // Sezione non chiusa: i blocchi interni tornano flat
  if (currentSection) {
    for (const b of currentSection.children) grouped.push({ type: 'flat', block: b })
  }

  function renderBlock(block, i) {
    // Blocchi intrinsecamente full-width: escono dal contenitore
    if (FULL_W_TYPES.has(block.tipo)) {
      return (
        <div key={block.id||i} style={{ width:'100%' }}>
          <BlockRenderer block={block} cp={cp} formTarget={formTarget} eventData={eventData} />
        </div>
      )
    }
    // Blocchi con sfondo piena/ampia: escono dal wrapper centrato
    const isFullWidth = block.sezione?.sfondo && block.sezione.larghezza === 'piena'
    const isAmpia     = block.sezione?.sfondo && block.sezione.larghezza === 'ampia'
    if (isFullWidth || isAmpia) {
      return (
        <div key={block.id||i} style={{ width:'100%' }}>
          <BlockRenderer block={block} cp={cp} formTarget={formTarget} eventData={eventData} />
        </div>
      )
    }
    // Blocchi normali: wrapper centrato con padding orizzontale
    return (
      <div key={block.id||i} style={{ maxWidth:'800px', margin:'0 auto', padding:'0 clamp(16px,4vw,40px)', boxSizing:'border-box' }}>
        <BlockRenderer block={block} cp={cp} formTarget={formTarget} eventData={eventData} />
      </div>
    )
  }

  return (
    <>
      {grouped.map((item, gi) => {
        if (item.type === 'flat') return renderBlock(item.block, gi)

        // Sezione con sfondo
        const m       = item.marker
        const pv      = PADDING_MAP[m.padding_v    || 'M']
        const rtop    = RADIUS_MAP [m.radius_top   || 'nessuno']
        const rbot    = RADIUS_MAP [m.radius_bottom|| 'nessuno']
        const mxw     = MAX_W_MAP  [m.larghezza    || 'contenuto']
        const sfondo  = m.sfondo || '#F7F8FC'
        const colTesto = m.colore_testo || undefined
        // Le sezioni colorate ora sono sempre width:100% (il padre è già full-width)
        return (
          <div key={m.id||gi} style={{ width:'100%', background:sfondo, borderRadius:`${rtop} ${rtop} ${rbot} ${rbot}`, color:colTesto, marginBottom:'0' }}>
            <div style={{ maxWidth:mxw, margin:'0 auto', padding:`${pv} clamp(16px,4vw,40px)` }}>
              {item.children.map((block, bi) => {
                if (FULL_W_TYPES.has(block.tipo)) {
                  return (
                    <div key={block.id||bi} style={{ marginLeft:'calc(-1 * clamp(16px,4vw,40px))', marginRight:'calc(-1 * clamp(16px,4vw,40px))', marginBottom:'0' }}>
                      <BlockRenderer block={block} cp={cp} formTarget={formTarget} eventData={eventData} />
                    </div>
                  )
                }
                return <BlockRenderer key={block.id||bi} block={block} cp={cp} formTarget={formTarget} />
              })}
            </div>
          </div>
        )
      })}
    </>
  )
}
