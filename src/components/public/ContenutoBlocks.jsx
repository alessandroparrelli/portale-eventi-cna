/**
 * ContenutoBlocks — gestisce il raggruppamento sezioni_inizio/fine
 * Condiviso tra LandingPagePublic e LandingPage (eventi)
 */
import BlockRenderer from './BlockRenderer'

export default function ContenutoBlocks({ blocks, cp, formTarget }) {
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
    if (FULL_W_TYPES.has(block.tipo)) {
      return (
        <div key={block.id||i} style={{ marginLeft:'calc(-1 * clamp(16px,4vw,40px))', marginRight:'calc(-1 * clamp(16px,4vw,40px))', marginBottom:'0' }}>
          <BlockRenderer block={block} cp={cp} formTarget={formTarget} />
        </div>
      )
    }
    const isFullWidth = block.sezione?.sfondo && block.sezione.larghezza === 'piena'
    const isAmpia     = block.sezione?.sfondo && block.sezione.larghezza === 'ampia'
    if (isFullWidth || isAmpia) {
      const extra = isFullWidth
        ? { marginLeft:'calc(-1 * clamp(16px,4vw,40px))', marginRight:'calc(-1 * clamp(16px,4vw,40px))', marginBottom:'0' }
        : { marginLeft:'calc(-1 * clamp(0px,2vw,80px))', marginRight:'calc(-1 * clamp(0px,2vw,80px))', marginBottom:'0' }
      return (
        <div key={block.id||i} style={extra}>
          <BlockRenderer block={block} cp={cp} formTarget={formTarget} />
        </div>
      )
    }
    return <BlockRenderer key={block.id||i} block={block} cp={cp} formTarget={formTarget} />
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
        const isFullSec  = m.larghezza === 'piena'
        const isAmpiaSec = m.larghezza === 'ampia'
        const negMargin  = isFullSec
          ? { marginLeft:'calc(-1 * clamp(16px,4vw,40px))', marginRight:'calc(-1 * clamp(16px,4vw,40px))' }
          : isAmpiaSec
            ? { marginLeft:'calc(-1 * clamp(0px,2vw,80px))', marginRight:'calc(-1 * clamp(0px,2vw,80px))' }
            : {}

        return (
          <div key={m.id||gi} style={{ ...negMargin, background:sfondo, borderRadius:`${rtop} ${rtop} ${rbot} ${rbot}`, color:colTesto, marginBottom:'0' }}>
            <div style={{ maxWidth:mxw, margin:'0 auto', padding:`${pv} clamp(16px,4vw,40px)` }}>
              {item.children.map((block, bi) => {
                if (FULL_W_TYPES.has(block.tipo)) {
                  return (
                    <div key={block.id||bi} style={{ marginLeft:'calc(-1 * clamp(16px,4vw,40px))', marginRight:'calc(-1 * clamp(16px,4vw,40px))', marginBottom:'0' }}>
                      <BlockRenderer block={block} cp={cp} formTarget={formTarget} />
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
