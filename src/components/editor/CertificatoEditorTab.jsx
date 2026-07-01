import { useEffect, useRef, useState } from 'react'
import {
  Award, Eye, Download, Loader2, Type, Square, Minus, Circle as CircleIcon,
  QrCode, Image as ImageIcon, Copy, Trash2, ChevronUp, ChevronDown, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, LayoutTemplate,
} from 'lucide-react'
import { Field, Input } from '../ui'
import LogoManager from './LogoManager'

const CERT_FN = 'https://hnkhckcclgabunkqfmrz.supabase.co/functions/v1/genera-certificato'
const PAGE_W = 842, PAGE_H = 595
const STAGE_W = 720
const SCALE = STAGE_W / PAGE_W
const STAGE_H = PAGE_H * SCALE

const LOGO_RAW = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'

function uid() { return 'el_' + Math.random().toString(36).slice(2, 10) }

function encodeConfig(obj) {
  const json = JSON.stringify(obj)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  bytes.forEach(b => { binary += String.fromCharCode(b) })
  return btoa(binary)
}

const FIELD_OPTIONS = [
  { v: 'custom', l: 'Testo libero' },
  { v: 'nome', l: 'Nome partecipante' },
  { v: 'evento', l: 'Nome evento' },
  { v: 'data', l: 'Data evento' },
  { v: 'luogo', l: 'Luogo' },
  { v: 'codice', l: 'Codice verifica' },
  { v: 'anno', l: 'Anno corrente' },
]

/* ─────────────────────────── PRESET (modelli di partenza) ─────────────────────────── */
function presetLaterale(colore) {
  return [
    { id: uid(), type: 'shape', shape: 'rect', x: 0, y: 0, w: 270, h: 595, fill: colore, zIndex: 1 },
    { id: uid(), type: 'image', field: 'logo', x: 40, y: 40, w: 170, h: 50, zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: 'ANNO', x: 40, y: 268, w: 150, h: 14, fontSize: 9, bold: true, color: '#FFFFFF', fontFamily: 'helvetica', zIndex: 2 },
    { id: uid(), type: 'text', field: 'anno', x: 40, y: 284, w: 150, h: 36, fontSize: 30, bold: true, color: '#FFFFFF', fontFamily: 'helvetica', zIndex: 2 },
    { id: uid(), type: 'shape', shape: 'rect', x: 40, y: 494, w: 190, h: 54, fill: '#FFFFFF', opacity: 0.14, zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: 'CODICE VERIFICA', x: 54, y: 502, w: 170, h: 12, fontSize: 8, bold: true, color: '#FFFFFF', zIndex: 3 },
    { id: uid(), type: 'text', field: 'codice', x: 54, y: 516, w: 170, h: 16, fontSize: 11, bold: true, color: '#FFFFFF', fontFamily: 'courier', zIndex: 3 },
    { id: uid(), type: 'qrcode', x: 176, y: 40, w: 60, h: 60, zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: 'CERTIFICATO DI PARTECIPAZIONE', x: 310, y: 56, w: 470, h: 16, fontSize: 11, bold: true, color: '#8593A6', zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: 'Si certifica che', x: 310, y: 82, w: 470, h: 26, fontSize: 20, bold: true, color: '#0A0A0A', zIndex: 2 },
    { id: uid(), type: 'text', field: 'nome', x: 310, y: 118, w: 470, h: 46, fontSize: 34, bold: true, color: colore, zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: "ha partecipato all'evento", x: 310, y: 168, w: 470, h: 18, fontSize: 13, color: '#374151', zIndex: 2 },
    { id: uid(), type: 'shape', shape: 'rect', x: 310, y: 198, w: 472, h: 70, fill: '#F7F9FF', zIndex: 1 },
    { id: uid(), type: 'shape', shape: 'rect', x: 310, y: 198, w: 4, h: 70, fill: colore, zIndex: 2 },
    { id: uid(), type: 'text', field: 'evento', x: 332, y: 208, w: 430, h: 20, fontSize: 15, bold: true, color: '#0A0A0A', zIndex: 2 },
    { id: uid(), type: 'text', field: 'data', x: 332, y: 238, w: 200, h: 16, fontSize: 11, color: '#6B7280', zIndex: 2 },
    { id: uid(), type: 'text', field: 'luogo', x: 500, y: 238, w: 200, h: 16, fontSize: 11, color: '#6B7280', zIndex: 2 },
    { id: uid(), type: 'shape', shape: 'line', x: 310, y: 508, w: 150, h: 0, stroke: '#D1D5DB', strokeWidth: 1, zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: 'CNA Roma', x: 310, y: 516, w: 250, h: 16, fontSize: 11, bold: true, color: '#0A0A0A', zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: "Confederazione Nazionale dell'Artigianato", x: 310, y: 534, w: 350, h: 14, fontSize: 9, color: '#9CA3AF', zIndex: 2 },
  ]
}

function presetMedaglia(colore) {
  return [
    { id: uid(), type: 'shape', shape: 'line', x: 60, y: 54, w: 722, h: 0, stroke: colore, strokeWidth: 1.5, zIndex: 2 },
    { id: uid(), type: 'shape', shape: 'line', x: 60, y: 508, w: 722, h: 0, stroke: colore, strokeWidth: 1.5, zIndex: 2 },
    { id: uid(), type: 'image', field: 'logo', x: 371, y: 70, w: 100, h: 40, zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: 'CERTIFICATO DI PARTECIPAZIONE', x: 171, y: 126, w: 500, h: 16, fontSize: 11, bold: true, color: '#8593A6', align: 'center', zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: 'Si certifica che', x: 171, y: 152, w: 500, h: 24, fontSize: 16, italic: true, color: '#374151', fontFamily: 'times', align: 'center', zIndex: 2 },
    { id: uid(), type: 'text', field: 'nome', x: 121, y: 184, w: 600, h: 52, fontSize: 40, bold: true, color: colore, fontFamily: 'times', align: 'center', zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: "ha partecipato all'evento", x: 171, y: 244, w: 500, h: 18, fontSize: 13, italic: true, color: '#374151', fontFamily: 'times', align: 'center', zIndex: 2 },
    { id: uid(), type: 'text', field: 'evento', x: 121, y: 268, w: 600, h: 26, fontSize: 18, bold: true, color: '#0A0A0A', align: 'center', zIndex: 2 },
    { id: uid(), type: 'text', field: 'data', x: 171, y: 302, w: 500, h: 16, fontSize: 11, color: '#6B7280', align: 'center', zIndex: 2 },
    { id: uid(), type: 'text', field: 'luogo', x: 171, y: 320, w: 500, h: 16, fontSize: 11, color: '#6B7280', align: 'center', zIndex: 2 },
    { id: uid(), type: 'shape', shape: 'rect', x: 396, y: 458, w: 14, h: 34, fill: colore, zIndex: 1 },
    { id: uid(), type: 'shape', shape: 'rect', x: 432, y: 458, w: 14, h: 34, fill: colore, zIndex: 1 },
    { id: uid(), type: 'shape', shape: 'circle', x: 386, y: 398, w: 70, h: 70, fill: colore, zIndex: 2 },
    { id: uid(), type: 'shape', shape: 'circle', x: 396, y: 408, w: 50, h: 50, stroke: '#FFFFFF', strokeWidth: 1.5, zIndex: 3 },
    { id: uid(), type: 'text', field: 'custom', text: 'CNA', x: 386, y: 425, w: 70, h: 16, fontSize: 13, bold: true, color: '#FFFFFF', align: 'center', zIndex: 3 },
    { id: uid(), type: 'text', field: 'custom', text: 'CNA Roma', x: 60, y: 528, w: 260, h: 16, fontSize: 10, bold: true, color: '#0A0A0A', zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: "Confederazione Nazionale dell'Artigianato", x: 60, y: 544, w: 340, h: 12, fontSize: 8, color: '#9CA3AF', zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: 'CODICE VERIFICA', x: 592, y: 512, w: 190, h: 10, fontSize: 7, bold: true, color: '#9CA3AF', align: 'right', zIndex: 2 },
    { id: uid(), type: 'text', field: 'codice', x: 592, y: 524, w: 190, h: 14, fontSize: 9, color: '#374151', fontFamily: 'courier', align: 'right', zIndex: 2 },
    { id: uid(), type: 'qrcode', x: 752, y: 540, w: 40, h: 40, zIndex: 2 },
  ]
}

function presetMinimal(colore) {
  return [
    { id: uid(), type: 'image', field: 'logo', x: 64, y: 48, w: 110, h: 26, zIndex: 2 },
    { id: uid(), type: 'shape', shape: 'line', x: 64, y: 100, w: 714, h: 0, stroke: '#E5E7EB', strokeWidth: 0.75, zIndex: 1 },
    { id: uid(), type: 'text', field: 'custom', text: 'CERTIFICATO DI PARTECIPAZIONE', x: 64, y: 128, w: 500, h: 14, fontSize: 10.5, bold: true, color: colore, zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: 'Si certifica che', x: 64, y: 154, w: 500, h: 20, fontSize: 14, color: '#374151', zIndex: 2 },
    { id: uid(), type: 'text', field: 'nome', x: 64, y: 180, w: 700, h: 50, fontSize: 40, bold: true, color: '#0A0A0A', zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: "ha partecipato all'evento", x: 64, y: 236, w: 500, h: 18, fontSize: 12.5, color: '#6B7280', zIndex: 2 },
    { id: uid(), type: 'text', field: 'evento', x: 64, y: 262, w: 600, h: 20, fontSize: 15, bold: true, color: colore, zIndex: 2 },
    { id: uid(), type: 'text', field: 'data', x: 64, y: 288, w: 220, h: 16, fontSize: 10.5, color: '#9CA3AF', zIndex: 2 },
    { id: uid(), type: 'text', field: 'luogo', x: 260, y: 288, w: 220, h: 16, fontSize: 10.5, color: '#9CA3AF', zIndex: 2 },
    { id: uid(), type: 'shape', shape: 'line', x: 64, y: 480, w: 714, h: 0, stroke: '#E5E7EB', strokeWidth: 0.75, zIndex: 1 },
    { id: uid(), type: 'text', field: 'custom', text: 'CNA Roma', x: 64, y: 498, w: 250, h: 14, fontSize: 10.5, bold: true, color: '#0A0A0A', zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: "Confederazione Nazionale dell'Artigianato", x: 64, y: 514, w: 340, h: 12, fontSize: 8.5, color: '#9CA3AF', zIndex: 2 },
    { id: uid(), type: 'text', field: 'codice', x: 478, y: 498, w: 300, h: 14, fontSize: 8.5, color: '#9CA3AF', align: 'right', zIndex: 2 },
    { id: uid(), type: 'qrcode', x: 738, y: 480, w: 40, h: 40, zIndex: 2 },
  ]
}

function presetCornice(colore) {
  return [
    { id: uid(), type: 'shape', shape: 'rect', x: 18, y: 18, w: 806, h: 559, stroke: colore, strokeWidth: 5, zIndex: 1 },
    { id: uid(), type: 'shape', shape: 'rect', x: 30, y: 30, w: 782, h: 535, stroke: colore, strokeWidth: 1, zIndex: 1 },
    { id: uid(), type: 'image', field: 'logo', x: 371, y: 58, w: 100, h: 38, zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: 'ATTESTATO DI PARTECIPAZIONE', x: 121, y: 116, w: 600, h: 30, fontSize: 23, bold: true, color: colore, fontFamily: 'times', align: 'center', zIndex: 2 },
    { id: uid(), type: 'shape', shape: 'line', x: 396, y: 154, w: 50, h: 0, stroke: colore, strokeWidth: 1, zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: 'Si certifica che', x: 171, y: 172, w: 500, h: 20, fontSize: 13, color: '#4B5563', fontFamily: 'times', align: 'center', zIndex: 2 },
    { id: uid(), type: 'text', field: 'nome', x: 121, y: 198, w: 600, h: 44, fontSize: 32, bold: true, color: '#0A0A0A', fontFamily: 'times', align: 'center', zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: "ha partecipato all'evento", x: 171, y: 248, w: 500, h: 18, fontSize: 12.5, color: '#4B5563', fontFamily: 'times', align: 'center', zIndex: 2 },
    { id: uid(), type: 'text', field: 'evento', x: 121, y: 272, w: 600, h: 22, fontSize: 15, bold: true, color: colore, align: 'center', zIndex: 2 },
    { id: uid(), type: 'text', field: 'data', x: 171, y: 300, w: 500, h: 16, fontSize: 10.5, color: '#6B7280', align: 'center', zIndex: 2 },
    { id: uid(), type: 'text', field: 'luogo', x: 171, y: 318, w: 500, h: 16, fontSize: 10.5, color: '#6B7280', align: 'center', zIndex: 2 },
    { id: uid(), type: 'shape', shape: 'rect', x: 34, y: 34, w: 14, h: 14, fill: colore, zIndex: 2 },
    { id: uid(), type: 'shape', shape: 'rect', x: 794, y: 34, w: 14, h: 14, fill: colore, zIndex: 2 },
    { id: uid(), type: 'shape', shape: 'rect', x: 34, y: 547, w: 14, h: 14, fill: colore, zIndex: 2 },
    { id: uid(), type: 'shape', shape: 'rect', x: 794, y: 547, w: 14, h: 14, fill: colore, zIndex: 2 },
    { id: uid(), type: 'shape', shape: 'line', x: 331, y: 522, w: 180, h: 0, stroke: '#9CA3AF', strokeWidth: 1, zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: 'CNA Roma', x: 331, y: 530, w: 180, h: 14, fontSize: 10.5, bold: true, color: '#0A0A0A', align: 'center', zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: "Confederazione Nazionale dell'Artigianato", x: 271, y: 546, w: 300, h: 12, fontSize: 8, color: '#9CA3AF', align: 'center', zIndex: 2 },
    { id: uid(), type: 'text', field: 'codice', x: 60, y: 540, w: 200, h: 12, fontSize: 7.5, color: '#9CA3AF', zIndex: 2 },
    { id: uid(), type: 'qrcode', x: 748, y: 522, w: 40, h: 40, zIndex: 2 },
  ]
}

/* ─── Greca (motivo a chiave, rettilineo) per bordi in stile diploma/accademico ─── */
function greekBandH(x0, y0, totalW, bandH, color, unit = 22) {
  const out = []
  let x = x0, i = 0
  while (x + unit * 0.65 <= x0 + totalW) {
    const tall = i % 2 === 0
    out.push({ id: uid(), type: 'shape', shape: 'rect', x, y: tall ? y0 : y0 + bandH * 0.4, w: unit * 0.65, h: tall ? bandH : bandH * 0.6, fill: color, zIndex: 2 })
    x += unit; i++
  }
  return out
}
function greekBandV(x0, y0, totalH, bandW, color, unit = 26) {
  const out = []
  let y = y0, i = 0
  while (y + unit * 0.65 <= y0 + totalH) {
    const tall = i % 2 === 0
    out.push({ id: uid(), type: 'shape', shape: 'rect', x: tall ? x0 : x0 + bandW * 0.4, y, w: tall ? bandW : bandW * 0.6, h: unit * 0.65, fill: color, zIndex: 2 })
    y += unit; i++
  }
  return out
}

function presetAccademico(colore) {
  return [
    { id: uid(), type: 'shape', shape: 'rect', x: 20, y: 20, w: 802, h: 555, stroke: colore, strokeWidth: 3, zIndex: 1 },
    { id: uid(), type: 'shape', shape: 'rect', x: 30, y: 30, w: 782, h: 535, stroke: colore, strokeWidth: 1, zIndex: 1 },
    ...greekBandH(50, 46, 742, 14, colore, 22),
    ...greekBandH(50, 522, 742, 14, colore, 22),
    { id: uid(), type: 'image', field: 'logo', x: 371, y: 74, w: 100, h: 34, zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: 'DIPLOMA DI PARTECIPAZIONE', x: 121, y: 116, w: 600, h: 28, fontSize: 22, bold: true, color: colore, fontFamily: 'times', align: 'center', zIndex: 2 },
    { id: uid(), type: 'shape', shape: 'line', x: 396, y: 150, w: 50, h: 0, stroke: colore, strokeWidth: 1, zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: 'Si certifica che', x: 171, y: 164, w: 500, h: 18, fontSize: 13, italic: true, color: '#4B5563', fontFamily: 'times', align: 'center', zIndex: 2 },
    { id: uid(), type: 'text', field: 'nome', x: 121, y: 188, w: 600, h: 42, fontSize: 32, bold: true, color: '#0A0A0A', fontFamily: 'times', align: 'center', zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: "ha partecipato all'evento", x: 171, y: 234, w: 500, h: 18, fontSize: 12.5, italic: true, color: '#4B5563', fontFamily: 'times', align: 'center', zIndex: 2 },
    { id: uid(), type: 'text', field: 'evento', x: 121, y: 256, w: 600, h: 22, fontSize: 15, bold: true, color: colore, align: 'center', zIndex: 2 },
    { id: uid(), type: 'text', field: 'data', x: 171, y: 282, w: 500, h: 16, fontSize: 10.5, color: '#6B7280', align: 'center', zIndex: 2 },
    { id: uid(), type: 'text', field: 'luogo', x: 171, y: 299, w: 500, h: 16, fontSize: 10.5, color: '#6B7280', align: 'center', zIndex: 2 },
    { id: uid(), type: 'shape', shape: 'rect', x: 398, y: 410, w: 13, h: 30, fill: colore, zIndex: 1 },
    { id: uid(), type: 'shape', shape: 'rect', x: 431, y: 410, w: 13, h: 30, fill: colore, zIndex: 1 },
    { id: uid(), type: 'shape', shape: 'circle', x: 386, y: 350, w: 64, h: 64, fill: colore, zIndex: 2 },
    { id: uid(), type: 'shape', shape: 'circle', x: 396, y: 360, w: 44, h: 44, stroke: '#FFFFFF', strokeWidth: 1.5, zIndex: 3 },
    { id: uid(), type: 'text', field: 'custom', text: 'CNA', x: 386, y: 376, w: 64, h: 14, fontSize: 11, bold: true, color: '#FFFFFF', align: 'center', zIndex: 3 },
    { id: uid(), type: 'text', field: 'custom', text: 'CNA Roma', x: 60, y: 470, w: 260, h: 14, fontSize: 10, bold: true, color: '#0A0A0A', zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: "Confederazione Nazionale dell'Artigianato", x: 60, y: 484, w: 340, h: 11, fontSize: 8, color: '#9CA3AF', zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: 'CODICE VERIFICA', x: 592, y: 470, w: 190, h: 10, fontSize: 7, bold: true, color: '#9CA3AF', align: 'right', zIndex: 2 },
    { id: uid(), type: 'text', field: 'codice', x: 592, y: 482, w: 190, h: 13, fontSize: 8.5, color: '#374151', fontFamily: 'courier', align: 'right', zIndex: 2 },
    { id: uid(), type: 'qrcode', x: 752, y: 468, w: 40, h: 40, zIndex: 2 },
  ]
}

function presetGrecoColonne(colore) {
  return [
    ...greekBandV(40, 40, 516, 26, colore, 26),
    ...greekBandV(776, 40, 516, 26, colore, 26),
    { id: uid(), type: 'shape', shape: 'line', x: 66, y: 40, w: 710, h: 0, stroke: colore, strokeWidth: 2, zIndex: 2 },
    { id: uid(), type: 'shape', shape: 'line', x: 66, y: 556, w: 710, h: 0, stroke: colore, strokeWidth: 2, zIndex: 2 },
    { id: uid(), type: 'image', field: 'logo', x: 371, y: 60, w: 100, h: 36, zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: 'ATTESTATO ACCADEMICO', x: 121, y: 112, w: 600, h: 28, fontSize: 22, bold: true, color: colore, fontFamily: 'times', align: 'center', zIndex: 2 },
    { id: uid(), type: 'shape', shape: 'line', x: 396, y: 146, w: 50, h: 0, stroke: colore, strokeWidth: 1, zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: 'Si certifica che', x: 171, y: 160, w: 500, h: 18, fontSize: 13, italic: true, color: '#4B5563', fontFamily: 'times', align: 'center', zIndex: 2 },
    { id: uid(), type: 'text', field: 'nome', x: 121, y: 184, w: 600, h: 44, fontSize: 34, bold: true, color: '#0A0A0A', fontFamily: 'times', align: 'center', zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: "ha partecipato all'evento", x: 171, y: 232, w: 500, h: 18, fontSize: 12.5, italic: true, color: '#4B5563', fontFamily: 'times', align: 'center', zIndex: 2 },
    { id: uid(), type: 'text', field: 'evento', x: 121, y: 256, w: 600, h: 22, fontSize: 16, bold: true, color: colore, align: 'center', zIndex: 2 },
    { id: uid(), type: 'text', field: 'data', x: 171, y: 284, w: 500, h: 16, fontSize: 10.5, color: '#6B7280', align: 'center', zIndex: 2 },
    { id: uid(), type: 'text', field: 'luogo', x: 171, y: 302, w: 500, h: 16, fontSize: 10.5, color: '#6B7280', align: 'center', zIndex: 2 },
    { id: uid(), type: 'shape', shape: 'line', x: 331, y: 456, w: 180, h: 0, stroke: '#9CA3AF', strokeWidth: 1, zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: 'CNA Roma', x: 331, y: 464, w: 180, h: 14, fontSize: 10.5, bold: true, color: '#0A0A0A', align: 'center', zIndex: 2 },
    { id: uid(), type: 'text', field: 'custom', text: "Confederazione Nazionale dell'Artigianato", x: 271, y: 480, w: 300, h: 11, fontSize: 8, color: '#9CA3AF', align: 'center', zIndex: 2 },
    { id: uid(), type: 'text', field: 'codice', x: 331, y: 497, w: 180, h: 11, fontSize: 7.5, color: '#9CA3AF', align: 'center', fontFamily: 'courier', zIndex: 2 },
    { id: uid(), type: 'qrcode', x: 401, y: 512, w: 40, h: 40, zIndex: 2 },
  ]
}

const PRESETS = [
  { id: 'laterale', label: 'Laterale', desc: 'Fascia colorata a sinistra', build: presetLaterale },
  { id: 'medaglia', label: 'Medaglia', desc: 'Sigillo e nastro, elegante', build: presetMedaglia },
  { id: 'minimal', label: 'Minimal', desc: 'Essenziale, molto spazio bianco', build: presetMinimal },
  { id: 'cornice', label: 'Cornice', desc: 'Doppio bordo, stile istituzionale', build: presetCornice },
  { id: 'accademico', label: 'Accademico', desc: 'Diploma con greche e sigillo', build: presetAccademico },
  { id: 'colonne', label: 'Greco a colonne', desc: 'Colonne laterali a greca, stile classico', build: presetGrecoColonne },
]

function fontStack(family) {
  if (family === 'times') return "'Times New Roman', Times, serif"
  if (family === 'courier') return "'Courier New', Courier, monospace"
  return "Helvetica, Arial, sans-serif"
}

const SAMPLE = { nome: 'Mario Rossi', evento: 'Nome Evento di Esempio', data: '20 giugno 2026', luogo: 'Roma, Sede CNA', codice: 'AB12-CD34-EF56', anno: String(new Date().getFullYear()) }

/* ─────────────────────────── Elemento sul canvas ─────────────────────────── */
function CanvasElement({ el, selected, onSelect, onDragStart, onResizeStart, logoUrl }) {
  const base = {
    position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h,
    cursor: 'move', outline: selected ? '1.5px solid #003DA5' : 'none', outlineOffset: '2px',
    boxSizing: 'border-box',
  }
  let content = null
  if (el.type === 'text') {
    const text = el.field === 'custom' ? (el.text || '') : el.field === 'anno' ? SAMPLE.anno : (SAMPLE[el.field] ?? '')
    content = (
      <div style={{
        width: '100%', height: '100%', fontFamily: fontStack(el.fontFamily), fontSize: el.fontSize || 14,
        fontWeight: el.bold ? 700 : 400, fontStyle: el.italic ? 'italic' : 'normal', color: el.color || '#0A0A0A',
        textAlign: el.align || 'left', lineHeight: el.lineHeight || 1.25, whiteSpace: 'pre-wrap', overflow: 'hidden',
        userSelect: 'none',
      }}>{text}</div>
    )
  } else if (el.type === 'image') {
    const src = el.field === 'logo' ? logoUrl : el.src
    content = src
      ? <img src={src} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
      : <div style={{ width: '100%', height: '100%', border: '1px dashed #D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#9CA3AF' }}>Logo</div>
  } else if (el.type === 'qrcode') {
    content = (
      <div style={{ width: '100%', height: '100%', border: '1px solid #D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <QrCode size={Math.min(el.w, el.h) * 0.7} color="#374151" />
      </div>
    )
  } else if (el.type === 'shape') {
    if (el.shape === 'line') {
      content = <div style={{ width: '100%', height: el.strokeWidth || 1, background: el.stroke || el.fill || '#000', marginTop: (el.h - (el.strokeWidth || 1)) / 2 }} />
    } else if (el.shape === 'circle') {
      content = <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        background: el.fill || 'transparent', border: el.stroke ? `${el.strokeWidth || 1}px solid ${el.stroke}` : 'none',
        opacity: el.opacity ?? 1, boxSizing: 'border-box',
      }} />
    } else {
      content = <div style={{
        width: '100%', height: '100%',
        background: el.fill || 'transparent', border: el.stroke ? `${el.strokeWidth || 1}px solid ${el.stroke}` : 'none',
        opacity: el.opacity ?? 1, boxSizing: 'border-box',
      }} />
    }
  }

  return (
    <div style={base} onPointerDown={e => onDragStart(e, el.id)} onClick={e => { e.stopPropagation(); onSelect(el.id) }}>
      {content}
      {selected && (
        <div
          onPointerDown={e => { e.stopPropagation(); onResizeStart(e, el.id) }}
          style={{
            position: 'absolute', right: '-5px', bottom: '-5px', width: '10px', height: '10px',
            background: '#003DA5', border: '1.5px solid #fff', borderRadius: '50%', cursor: 'nwse-resize', boxShadow: '0 1px 3px rgba(0,0,0,.3)',
          }}
        />
      )}
    </div>
  )
}

/* ─────────────────────────── Editor principale ─────────────────────────── */
export default function CertificatoEditorTab({ event, setEvent }) {
  const cfg = event.certificato_config || {}
  const elements = cfg.elements || []
  const colore = cfg.colore_primario || '#003DA5'
  const logoUrl = cfg.logo_url || LOGO_RAW

  const [selectedId, setSelectedId] = useState(null)
  const dragRef = useRef(null)
  const stageRef = useRef(null)

  function update(patch) {
    setEvent(p => ({ ...p, certificato_config: { ...(p.certificato_config || {}), ...patch } }))
  }
  function setElements(next) { update({ elements: next }) }
  function updateElement(id, patch) { setElements(elements.map(el => el.id === id ? { ...el, ...patch } : el)) }
  const selected = elements.find(e => e.id === selectedId) || null

  function applyPreset(presetId) {
    const preset = PRESETS.find(p => p.id === presetId)
    if (!preset) return
    if (elements.length > 0 && !confirm('Applicare questo modello sostituirà tutti gli elementi attuali. Continuare?')) return
    setElements(preset.build(colore))
    setSelectedId(null)
  }

  function addElement(type) {
    const base = { id: uid(), x: 340, y: 260, zIndex: (Math.max(0, ...elements.map(e => e.zIndex || 0)) + 1) }
    let el
    if (type === 'text') el = { ...base, type: 'text', field: 'custom', text: 'Nuovo testo', w: 220, h: 24, fontSize: 14, color: '#0A0A0A', fontFamily: 'helvetica' }
    else if (type === 'rect') el = { ...base, type: 'shape', shape: 'rect', w: 160, h: 80, fill: colore, opacity: 1 }
    else if (type === 'line') el = { ...base, type: 'shape', shape: 'line', w: 160, h: 0, stroke: colore, strokeWidth: 1 }
    else if (type === 'circle') el = { ...base, type: 'shape', shape: 'circle', w: 70, h: 70, fill: colore }
    else if (type === 'qrcode') el = { ...base, type: 'qrcode', w: 60, h: 60 }
    else if (type === 'logo') el = { ...base, type: 'image', field: 'logo', w: 140, h: 44 }
    setElements([...elements, el])
    setSelectedId(el.id)
  }

  function deleteSelected() {
    if (!selectedId) return
    setElements(elements.filter(e => e.id !== selectedId))
    setSelectedId(null)
  }
  function duplicateSelected() {
    if (!selected) return
    const copy = { ...selected, id: uid(), x: selected.x + 14, y: selected.y + 14 }
    setElements([...elements, copy])
    setSelectedId(copy.id)
  }
  function reorder(dir) {
    if (!selected) return
    const zs = elements.map(e => e.zIndex || 0)
    const target = dir === 'up' ? Math.max(...zs) + 1 : Math.min(...zs) - 1
    updateElement(selected.id, { zIndex: target })
  }

  // drag & resize
  function onDragStart(e, id) {
    e.preventDefault()
    setSelectedId(id)
    const el = elements.find(x => x.id === id)
    dragRef.current = { mode: 'move', id, startClientX: e.clientX, startClientY: e.clientY, origX: el.x, origY: el.y }
  }
  function onResizeStart(e, id) {
    e.preventDefault()
    setSelectedId(id)
    const el = elements.find(x => x.id === id)
    dragRef.current = { mode: 'resize', id, startClientX: e.clientX, startClientY: e.clientY, origW: el.w, origH: el.h }
  }
  useEffect(() => {
    function onMove(e) {
      const d = dragRef.current
      if (!d) return
      const dx = (e.clientX - d.startClientX) / SCALE
      const dy = (e.clientY - d.startClientY) / SCALE
      if (d.mode === 'move') {
        const el = elements.find(x => x.id === d.id)
        if (!el) return
        const nx = Math.max(0, Math.min(PAGE_W - el.w, d.origX + dx))
        const ny = Math.max(0, Math.min(PAGE_H - el.h, d.origY + dy))
        updateElement(d.id, { x: Math.round(nx), y: Math.round(ny) })
      } else if (d.mode === 'resize') {
        const el = elements.find(x => x.id === d.id)
        const isLine = el && el.type === 'shape' && el.shape === 'line'
        const nw = Math.max(10, Math.round(d.origW + dx))
        const nh = Math.max(isLine ? 0 : 10, Math.round(d.origH + dy))
        updateElement(d.id, { w: nw, h: nh })
      }
    }
    function onUp() { dragRef.current = null }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements])

  // PDF reale (export/prova)
  const [pdfLoading, setPdfLoading] = useState(false)
  function realPdfUrl(download) {
    const params = new URLSearchParams({
      preview: '1', config: encodeConfig({ colore_primario: colore, logo_url: logoUrl, elements }),
      evento: event.titolo || 'Nome Evento di Esempio', luogo: event.luogo || 'Roma, Sede CNA',
    })
    if (event.data_inizio) params.set('data', event.data_inizio)
    if (download) params.set('download', '1')
    return `${CERT_FN}?${params.toString()}`
  }

  const toolBtn = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '8px 6px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: '10px', color: '#374151', fontWeight: '600', minWidth: '56px' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0A0A0A', letterSpacing: '-.03em', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={22} /> Certificato di partecipazione
        </h2>
        <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Editor libero: trascina, ridimensiona e personalizza ogni elemento. Questo è esattamente ciò che verrà stampato nel PDF.</p>
      </div>

      {/* Abilitazione */}
      <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <input type="checkbox" checked={!!event.certificato_abilitato} onChange={e => setEvent(p => ({ ...p, certificato_abilitato: e.target.checked }))} style={{ width: '16px', height: '16px' }} />
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#0A0A0A' }}>Abilita certificati di partecipazione</span>
        </label>
        {event.certificato_abilitato && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input type="checkbox" checked={event.certificato_invio_auto !== false} onChange={e => setEvent(p => ({ ...p, certificato_invio_auto: e.target.checked }))} style={{ width: '16px', height: '16px' }} />
            <span style={{ fontSize: '13px', color: '#374151' }}>Invio automatico dopo l&apos;evento</span>
          </label>
        )}
      </div>

      {event.certificato_abilitato && (<>
        {/* Modelli + colore */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 320px' }}>
            <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <LayoutTemplate size={13} /> Modelli di partenza
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {PRESETS.map(p => (
                <button key={p.id} type="button" onClick={() => applyPreset(p.id)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#374151' }}>
                  {p.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '6px 0 0' }}>Applica un modello e poi modifica liberamente ogni elemento.</p>
          </div>
          <div>
            <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em' }}>Colore principale</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="color" value={colore} onChange={e => update({ colore_primario: e.target.value })}
                style={{ width: '40px', height: '34px', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
              <Input value={colore} onChange={e => update({ colore_primario: e.target.value })} style={{ maxWidth: '110px' }} />
            </div>
          </div>
          <div style={{ minWidth: '220px' }}>
            <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em' }}>Logo</p>
            <LogoManager value={logoUrl} onChange={url => update({ logo_url: url })} />
          </div>
        </div>

        {/* Toolbar aggiungi elementi */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" onClick={() => addElement('text')} style={toolBtn}><Type size={16} />Testo</button>
          <button type="button" onClick={() => addElement('rect')} style={toolBtn}><Square size={16} />Rettangolo</button>
          <button type="button" onClick={() => addElement('line')} style={toolBtn}><Minus size={16} />Linea</button>
          <button type="button" onClick={() => addElement('circle')} style={toolBtn}><CircleIcon size={16} />Cerchio</button>
          <button type="button" onClick={() => addElement('qrcode')} style={toolBtn}><QrCode size={16} />QR</button>
          <button type="button" onClick={() => addElement('logo')} style={toolBtn}><ImageIcon size={16} />Logo</button>
          <div style={{ width: '1px', height: '32px', background: '#E5E7EB', margin: '0 4px' }} />
          <button type="button" disabled={!selected} onClick={duplicateSelected} style={{ ...toolBtn, opacity: selected ? 1 : 0.4 }}><Copy size={16} />Duplica</button>
          <button type="button" disabled={!selected} onClick={() => reorder('up')} style={{ ...toolBtn, opacity: selected ? 1 : 0.4 }}><ChevronUp size={16} />Avanti</button>
          <button type="button" disabled={!selected} onClick={() => reorder('down')} style={{ ...toolBtn, opacity: selected ? 1 : 0.4 }}><ChevronDown size={16} />Indietro</button>
          <button type="button" disabled={!selected} onClick={deleteSelected} style={{ ...toolBtn, opacity: selected ? 1 : 0.4, color: '#DC2626' }}><Trash2 size={16} />Elimina</button>
        </div>

        {/* Canvas + pannello proprietà */}
        <div style={{ display: 'grid', gridTemplateColumns: `${STAGE_W}px 300px`, gap: '20px', alignItems: 'flex-start' }} className="cert-canvas-grid">
          <div>
            <div
              ref={stageRef}
              onClick={() => setSelectedId(null)}
              style={{ position: 'relative', width: STAGE_W, height: STAGE_H, background: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            >
              {elements.length === 0 && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                  Scegli un modello di partenza qui sopra per iniziare
                </div>
              )}
              {[...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)).map(el => (
                <CanvasElement key={el.id} el={el} selected={el.id === selectedId} onSelect={setSelectedId} onDragStart={onDragStart} onResizeStart={onResizeStart} logoUrl={logoUrl} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>Formato A4 orizzontale — dati di esempio: Mario Rossi</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href={realPdfUrl(false)} target="_blank" rel="noopener noreferrer" onClick={() => setPdfLoading(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '700', color: '#003DA5', textDecoration: 'none' }}>
                  <Eye size={13} /> Anteprima PDF reale
                </a>
                <a href={realPdfUrl(true)} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '700', color: '#003DA5', textDecoration: 'none' }}>
                  <Download size={13} /> Scarica prova
                </a>
              </div>
            </div>
          </div>

          {/* Pannello proprietà */}
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '200px' }}>
            {!selected ? (
              <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>Seleziona un elemento sul certificato per modificarne le proprietà, oppure trascinalo per spostarlo.</p>
            ) : (<>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                {selected.type === 'text' ? 'Testo' : selected.type === 'image' ? 'Logo' : selected.type === 'qrcode' ? 'QR Code' : `Forma — ${selected.shape}`}
              </p>

              {selected.type === 'text' && (<>
                <Field label="Contenuto">
                  <select value={selected.field || 'custom'} onChange={e => updateElement(selected.id, { field: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', fontFamily: "'Inter',sans-serif" }}>
                    {FIELD_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </Field>
                {(selected.field || 'custom') === 'custom' && (
                  <Field label="Testo">
                    <textarea value={selected.text || ''} onChange={e => updateElement(selected.id, { text: e.target.value })} rows={2}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', fontFamily: "'Inter',sans-serif", resize: 'vertical' }} />
                  </Field>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <Field label="Famiglia">
                    <select value={selected.fontFamily || 'helvetica'} onChange={e => updateElement(selected.id, { fontFamily: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px' }}>
                      <option value="helvetica">Sans (Helvetica)</option>
                      <option value="times">Serif (Times)</option>
                      <option value="courier">Monospace (Courier)</option>
                    </select>
                  </Field>
                  <Field label="Dimensione">
                    <Input type="number" value={selected.fontSize || 14} onChange={e => updateElement(selected.id, { fontSize: Number(e.target.value) || 14 })} />
                  </Field>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button type="button" onClick={() => updateElement(selected.id, { bold: !selected.bold })}
                    style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', background: selected.bold ? '#EFF6FF' : '#fff', color: selected.bold ? '#003DA5' : '#374151', cursor: 'pointer' }}><Bold size={14} /></button>
                  <button type="button" onClick={() => updateElement(selected.id, { italic: !selected.italic })}
                    style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', background: selected.italic ? '#EFF6FF' : '#fff', color: selected.italic ? '#003DA5' : '#374151', cursor: 'pointer' }}><Italic size={14} /></button>
                  <div style={{ width: '1px', height: '24px', background: '#E5E7EB' }} />
                  {[{ v: 'left', I: AlignLeft }, { v: 'center', I: AlignCenter }, { v: 'right', I: AlignRight }].map(({ v, I }) => (
                    <button key={v} type="button" onClick={() => updateElement(selected.id, { align: v })}
                      style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', background: (selected.align || 'left') === v ? '#EFF6FF' : '#fff', color: (selected.align || 'left') === v ? '#003DA5' : '#374151', cursor: 'pointer' }}><I size={14} /></button>
                  ))}
                  <input type="color" value={selected.color || '#0A0A0A'} onChange={e => updateElement(selected.id, { color: e.target.value })}
                    style={{ width: '32px', height: '30px', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer', padding: '2px', marginLeft: 'auto' }} />
                </div>
              </>)}

              {selected.type === 'shape' && (<>
                {selected.shape !== 'line' && (
                  <Field label="Riempimento">
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input type="color" value={selected.fill || '#003DA5'} onChange={e => updateElement(selected.id, { fill: e.target.value })}
                        style={{ width: '32px', height: '30px', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
                      <button type="button" onClick={() => updateElement(selected.id, { fill: null })}
                        style={{ fontSize: '11px', color: '#6B7280', background: 'none', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }}>Nessuno</button>
                    </div>
                  </Field>
                )}
                <Field label={selected.shape === 'line' ? 'Colore linea' : 'Bordo'}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input type="color" value={selected.stroke || '#003DA5'} onChange={e => updateElement(selected.id, { stroke: e.target.value })}
                      style={{ width: '32px', height: '30px', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
                    <Input type="number" value={selected.strokeWidth || 1} onChange={e => updateElement(selected.id, { strokeWidth: Number(e.target.value) || 1 })} style={{ maxWidth: '70px' }} />
                    {selected.shape !== 'line' && (
                      <button type="button" onClick={() => updateElement(selected.id, { stroke: null })}
                        style={{ fontSize: '11px', color: '#6B7280', background: 'none', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }}>Nessuno</button>
                    )}
                  </div>
                </Field>
                {selected.shape !== 'line' && (
                  <Field label="Opacità">
                    <input type="range" min="0.1" max="1" step="0.05" value={selected.opacity ?? 1} onChange={e => updateElement(selected.id, { opacity: Number(e.target.value) })} style={{ width: '100%' }} />
                  </Field>
                )}
              </>)}

              {selected.type === 'qrcode' && (
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Genera automaticamente il QR di verifica del certificato. Puoi solo spostarlo e ridimensionarlo.</p>
              )}
              {selected.type === 'image' && (
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Usa il logo impostato qui sopra. Trascina per riposizionare — le proporzioni sono sempre mantenute.</p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '4px', borderTop: '1px solid #E5E7EB' }}>
                <Field label="X"><Input type="number" value={Math.round(selected.x)} onChange={e => updateElement(selected.id, { x: Number(e.target.value) || 0 })} /></Field>
                <Field label="Y"><Input type="number" value={Math.round(selected.y)} onChange={e => updateElement(selected.id, { y: Number(e.target.value) || 0 })} /></Field>
                <Field label="Larghezza"><Input type="number" value={Math.round(selected.w)} onChange={e => updateElement(selected.id, { w: Number(e.target.value) || 10 })} /></Field>
                <Field label="Altezza"><Input type="number" value={Math.round(selected.h)} onChange={e => updateElement(selected.id, { h: Number(e.target.value) || 0 })} /></Field>
              </div>
            </>)}
          </div>
        </div>
      </>)}

      <style>{`
        @media (max-width: 1060px) {
          .cert-canvas-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
