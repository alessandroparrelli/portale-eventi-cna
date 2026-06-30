# Bug critico: header sparisce su iOS in verticale (PWA standalone)

## Sintomo
L'header fisso (logo CNA + hamburger menu) non appare quando l'app è in
modalità verticale su iPhone, sia in Safari che da PWA installata.
Ruotando il telefono in orizzontale l'header riappare correttamente.

## Causa radice (CONFERMATA — non reintrodurre)

Due problemi distinti, entrambi causati da pattern CSS comuni ma pericolosi
su iOS WebKit quando combinati con `position: fixed`:

### 1. `overflow` su un antenato di un elemento `position: fixed`
```css
/* MAI fare questo se un discendente usa position:fixed */
#root {
  overflow-x: hidden; /* <-- rompe il fixed positioning su iOS */
}
```
Su iOS Safari (sia tab browser che standalone PWA), se un elemento ha
`overflow` impostato su un asse (anche solo `overflow-x`), WebKit a volte
tratta gli elementi `position: fixed` discendenti come se fossero
`position: absolute` relativi a quel container, invece che al viewport.
Il bug è intermittente e si "ripara" dopo un resize del viewport — la
rotazione dello schermo è il trigger più comune perché forza un reflow
completo.

**Regola**: il blocco dello scroll orizzontale va impostato SOLO su
`<body>`, mai su `#root` o altri wrapper che contengono elementi fixed.

### 2. `transform` su un elemento `position: fixed`
```css
/* MAI fare questo su un header/elemento fixed permanente */
header {
  position: fixed;
  transform: translateZ(0); /* <-- crea un nuovo containing block */
}
```
Applicare `transform` (anche solo per "forzare l'accelerazione hardware")
a un elemento `position: fixed` crea un nuovo *containing block* CSS.
Su iOS questo interagisce male con la safe-area dinamica e la barra
degli indirizzi di Safari che cambia altezza — causando lo stesso
sintomo di sparizione/mancato posizionamento corretto in verticale.

**Regola**: non usare `transform: translateZ(0)` o simili "hack" di
performance su elementi che devono restare `position: fixed` e visibili
in ogni condizione di viewport.

## Fix applicato (commit di riferimento)

- `src/index.css`: rimosso `overflow-x: hidden` da `#root`. Il blocco
  scroll orizzontale resta solo su `body { overflow-x: clip }`.
- `src/components/AdminLayout.jsx`: rimosso `transform: translateZ(0)` /
  `WebkitTransform: translateZ(0)` dallo stile dell'header.
- `src/components/AdminLayout.jsx`: rimossa una dichiarazione duplicata
  di `paddingTop` nello stesso oggetto di stile (la seconda sovrascriveva
  silenziosamente la prima — bug minore ma da evitare).
- Aggiunto `minHeight: '100dvh'` come fallback moderno accanto a `100vh`
  per gestire correttamente il viewport dinamico di Safari iOS (la
  toolbar che appare/scompare durante lo scroll cambia l'altezza
  disponibile in modo che `100vh` da solo non gestisce bene).

## Come verificare che il fix regge

1. Apri il sito da Safari su iPhone in **verticale** — header deve
   essere visibile subito, senza bisogno di interazione.
2. Naviga tra più pagine admin (Dashboard, Eventi, Iscritti) — header
   deve restare visibile e fisso durante lo scroll.
3. Installa la PWA da zero (Condividi → Aggiungi a Home) e riapri da
   icona — stesso comportamento del browser.
4. Ruota il telefono in orizzontale e poi di nuovo in verticale — non
   deve esserci alcuna differenza di comportamento tra le due
   orientazioni.

## Checklist per future modifiche al layout

Prima di aggiungere `overflow`, `transform`, `filter`, `will-change`,
`backdrop-filter` o `contain` a un elemento che è **antenato** di
qualcosa con `position: fixed`, chiediti: "questo crea un nuovo
containing block?" Tutte queste proprietà CSS possono farlo. Se sì,
testa esplicitamente su iOS in entrambi gli orientamenti prima di
mergeare.
