import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Award, Eye, Download, Loader2, Type, Square, Minus, Circle as CircleIcon,
  QrCode, Image as ImageIcon, Copy, Trash2, ChevronUp, ChevronDown,
  Bold, Italic, LayoutTemplate, Underline, Upload, X, ChevronRight,
  Save, BookOpen, Search, Plus, Pencil, CheckCircle, ExternalLink,
} from 'lucide-react'
import { Field, Input } from '../ui'
import LogoManager from './LogoManager'
import { supabase } from '../../lib/supabase'

const CERT_FN = 'https://hnkhckcclgabunkqfmrz.supabase.co/functions/v1/genera-certificato'
const PAGE_W = 842, PAGE_H = 595
const STAGE_W = 880
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
  { v: 'azienda', l: 'Azienda / Ragione sociale' },
  { v: 'mestiere', l: 'Mestiere / Settore' },
  { v: 'email', l: 'Email' },
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

/* ─── Font disponibili sul certificato ─────────────────────── */
const CERT_FONTS = [
  { label:'Inter (Sans)',            value:'inter',     stack:'"Inter", Helvetica, Arial, sans-serif' },
  { label:'Helvetica (Sans)',        value:'helvetica', stack:'Helvetica, Arial, sans-serif' },
  { label:'Times New Roman (Serif)', value:'times',     stack:'"Times New Roman", Times, serif' },
  { label:'Palatino (Serif)',        value:'palatino',  stack:'"EB Garamond", "Palatino Linotype", Palatino, serif' },
  { label:'Georgia (Serif)',         value:'georgia',   stack:'Georgia, serif' },
  { label:'Garamond (Serif)',        value:'garamond',  stack:'Garamond, "EB Garamond", serif' },
  { label:'Courier (Monospace)',     value:'courier',   stack:'"Courier New", Courier, monospace' },
  { label:'Arial (Sans)',            value:'arial',     stack:'Arial, Helvetica, sans-serif' },
  { label:'Trebuchet (Sans)',        value:'trebuchet', stack:'"Trebuchet MS", sans-serif' },
  { label:'Verdana (Sans)',          value:'verdana',   stack:'Verdana, Geneva, sans-serif' },
  { label:'Impact (Display)',        value:'impact',    stack:'Impact, "Arial Narrow", sans-serif' },
]
const CERT_FONT_STACK = Object.fromEntries(CERT_FONTS.map(f => [f.value, f.stack]))

function fontStack(family) {
  return CERT_FONT_STACK[family] || 'Helvetica, Arial, sans-serif'
}

/* ─── Palette colori certificato (40 colori) ────────────────── */
const CERT_COLORS = [
  '#000000','#0A0A0A','#1F2937','#374151','#6B7280','#9CA3AF','#D1D5DB','#FFFFFF',
  '#001B4D','#002E7A','#003DA5','#1d4ed8','#3B82F6','#93C5FD','#BFDBFE','#EFF6FF',
  '#064E3B','#16A34A','#22C55E','#86EFAC','#991B1B','#DC2626','#FCA5A5','#FEF2F2',
  '#451A03','#78350F','#B45309','#D97706','#F59E0B','#FCD34D','#FEF3C7','#FFFBEB',
  '#4C1D95','#7C3AED','#EC4899','#0E7490','#F5F5DC','#FFF8E7','#F0EDE0','#E8E0D0',
]

/* ─── Palette colori + picker custom ───────────────────────── */
function ColorSwatchPicker({ value, onChange }) {
  const [showCustom, setShowCustom] = useState(false)
  const [customVal, setCustomVal] = useState(value || '#003DA5')
  return (
    <div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'4px', marginBottom: showCustom ? '6px' : 0 }}>
        {CERT_COLORS.map(c => (
          <button key={c} type="button" onClick={() => onChange(c)} title={c}
            style={{ width:'22px', height:'22px', borderRadius:'4px', background:c, flexShrink:0,
              border: value===c ? '2.5px solid #003DA5' : c==='#FFFFFF' ? '1px solid #D1D5DB' : '1.5px solid rgba(0,0,0,.1)',
              cursor:'pointer', boxSizing:'border-box', transition:'transform .1s' }}
            onMouseEnter={e => e.currentTarget.style.transform='scale(1.3)'}
            onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
          />
        ))}
        <button type="button" title="Colore personalizzato" onClick={() => setShowCustom(v => !v)}
          style={{ width:'22px', height:'22px', borderRadius:'4px',
            background:'conic-gradient(red,yellow,lime,aqua,blue,magenta,red)',
            border:'1px solid #E5E7EB', cursor:'pointer', flexShrink:0 }} />
      </div>
      {showCustom && (
        <div style={{ display:'flex', gap:'6px', alignItems:'center', padding:'8px', background:'#F9FAFB', borderRadius:'8px', border:'1px solid #E5E7EB' }}>
          <input type="color" value={customVal} onChange={e => setCustomVal(e.target.value)}
            style={{ width:'40px', height:'32px', border:'1px solid #D1D5DB', borderRadius:'5px', cursor:'pointer', padding:'2px' }} />
          <input type="text" value={customVal} onChange={e => setCustomVal(e.target.value)} placeholder="#000000"
            style={{ flex:1, padding:'5px 8px', border:'1px solid #D1D5DB', borderRadius:'5px', fontSize:'12px', fontFamily:'monospace' }} />
          <button type="button" onClick={() => { onChange(customVal); setShowCustom(false) }}
            style={{ padding:'5px 12px', background:'#003DA5', color:'#fff', border:'none', borderRadius:'5px', fontSize:'12px', fontWeight:'700', cursor:'pointer' }}>Applica</button>
        </div>
      )}
    </div>
  )
}

/* ─── SVG icone allineamento (evita conflitto con lucide) ────── */
const AlignLeft   = ({ size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
const AlignCenter = ({ size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
const AlignRight  = ({ size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>

const SAMPLE = { nome: 'Mario Rossi', evento: 'Nome Evento di Esempio', data: '20 giugno 2026', luogo: 'Roma, Sede CNA', codice: 'AB12-CD34-EF56', anno: String(new Date().getFullYear()), azienda: 'Rossi Artigiani Srl', mestiere: 'Falegname', email: 'mario.rossi@esempio.it' }

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
        userSelect: 'none', textTransform: el.uppercase ? 'uppercase' : 'none',
        textDecoration: [el.underline && 'underline', el.strikethrough && 'line-through'].filter(Boolean).join(' ') || 'none',
        letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : 'normal', backgroundColor: el.bgColor || 'transparent',
      }}>{text}</div>
    )
  } else if (el.type === 'image') {
    const src = el.field === 'logo' ? logoUrl : el.src
    content = src
      ? <img src={src} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', opacity: el.opacity ?? 1 }} />
      : <div style={{ width: '100%', height: '100%', border: '1px dashed #D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#9CA3AF' }}>Immagine</div>
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
  const [logoDrawerOpen, setLogoDrawerOpen] = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [uploadImgErr, setUploadImgErr] = useState('')
  const [replaceTargetId, setReplaceTargetId] = useState(null)
  const [imgGalleryOpen, setImgGalleryOpen] = useState(false)
  // Template management
  const [tplList, setTplList] = useState([])
  const [tplLoading, setTplLoading] = useState(false)
  const [tplDrawerOpen, setTplDrawerOpen] = useState(false)
  const [savingTpl, setSavingTpl] = useState(false)
  const [saveNameModalOpen, setSaveNameModalOpen] = useState(false)
  const [saveNameValue, setSaveNameValue] = useState('')
  const [saveNameMode, setSaveNameMode] = useState('new') // 'new' | 'overwrite'
  const [saveNameTargetId, setSaveNameTargetId] = useState(null)
  const [tplMsg, setTplMsg] = useState('')
  // Catalogo modelli grafici
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchErr, setSearchErr] = useState('')
  const [searchCategory, setSearchCategory] = useState('all')
  const dragRef = useRef(null)
  const stageRef = useRef(null)
  const imgFileRef = useRef(null)

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

  function addElement(type, extra) {
    const base = { id: uid(), x: 340, y: 260, zIndex: (Math.max(0, ...elements.map(e => e.zIndex || 0)) + 1) }
    let el
    if (type === 'text') el = { ...base, type: 'text', field: 'custom', text: 'Nuovo testo', w: 220, h: 24, fontSize: 14, color: '#0A0A0A', fontFamily: 'helvetica' }
    else if (type === 'rect') el = { ...base, type: 'shape', shape: 'rect', w: 160, h: 80, fill: colore, opacity: 1 }
    else if (type === 'line') el = { ...base, type: 'shape', shape: 'line', w: 160, h: 0, stroke: colore, strokeWidth: 1 }
    else if (type === 'circle') el = { ...base, type: 'shape', shape: 'circle', w: 70, h: 70, fill: colore }
    else if (type === 'qrcode') el = { ...base, type: 'qrcode', w: 60, h: 60 }
    else if (type === 'logo') el = { ...base, type: 'image', field: 'logo', w: 140, h: 44 }
    else if (type === 'image') el = { ...base, type: 'image', field: 'custom', src: extra?.src, w: extra?.w || 150, h: extra?.h || 150 }
    setElements([...elements, el])
    setSelectedId(el.id)
    return el
  }

  /* ── Template: carica lista ── */
  const fetchTemplates = useCallback(async () => {
    setTplLoading(true)
    try {
      const { data, error } = await supabase.from('certificato_templates').select('*').order('nome')
      if (!error) setTplList(data || [])
    } catch {}
    setTplLoading(false)
  }, [])

  useEffect(() => { if (tplDrawerOpen) fetchTemplates() }, [tplDrawerOpen, fetchTemplates])

  /* ── Template: carica un template nell'editor ── */
  function loadTemplate(tpl) {
    if (elements.length > 0 && !confirm(`Caricare "${tpl.nome}"? Il disegno attuale verrà sostituito.`)) return
    update({ elements: tpl.elements || [], colore_primario: tpl.colore_primario || colore, logo_url: tpl.logo_url || logoUrl })
    setSelectedId(null)
    setTplDrawerOpen(false)
    setTplMsg(`Modello "${tpl.nome}" caricato`)
    setTimeout(() => setTplMsg(''), 3000)
  }

  /* ── Template: salva/aggiorna ── */
  async function saveTemplate(name, id) {
    setSavingTpl(true)
    try {
      const payload = { nome: name, elements, colore_primario: colore, logo_url: logoUrl, updated_at: new Date().toISOString() }
      if (id) {
        await supabase.from('certificato_templates').update(payload).eq('id', id)
        setTplMsg(`Modello "${name}" aggiornato`)
      } else {
        await supabase.from('certificato_templates').insert(payload)
        setTplMsg(`Modello "${name}" salvato`)
      }
      await fetchTemplates()
    } catch (e) {
      setTplMsg('Errore durante il salvataggio')
    }
    setSavingTpl(false)
    setSaveNameModalOpen(false)
    setTimeout(() => setTplMsg(''), 3500)
  }

  function openSaveNew() {
    setSaveNameValue(`Modello ${new Date().toLocaleDateString('it-IT')}`)
    setSaveNameMode('new')
    setSaveNameTargetId(null)
    setSaveNameModalOpen(true)
  }
  function openSaveOverwrite(tpl) {
    setSaveNameValue(tpl.nome)
    setSaveNameMode('overwrite')
    setSaveNameTargetId(tpl.id)
    setSaveNameModalOpen(true)
  }

  async function deleteTemplate(tpl) {
    if (!confirm(`Eliminare il modello "${tpl.nome}"?`)) return
    await supabase.from('certificato_templates').delete().eq('id', tpl.id)
    await fetchTemplates()
  }

  /* ── Categorie di ricerca curate per certificati/diplomi ── */
  const SEARCH_CATEGORIES = [
    { id:'elegante',   label:'🏅 Elegante',   query:'elegant certificate border gold frame ornamental' },
    { id:'accademico', label:'🎓 Accademico', query:'academic diploma parchment certificate scroll' },
    { id:'botanico',   label:'🌿 Botanico',   query:'floral botanical certificate frame flowers' },
    { id:'moderno',    label:'⚡ Moderno',    query:'modern professional certificate geometric abstract' },
    { id:'vintage',    label:'📜 Vintage',    query:'vintage antique certificate frame ornate diploma' },
    { id:'minimal',    label:'◻ Minimal',     query:'minimal clean certificate white simple border' },
    { id:'corporate',  label:'💼 Corporate',  query:'corporate award certificate business professional' },
    { id:'classico',   label:'🏛 Classico',   query:'classical ornate certificate roman border frame' },
    { id:'dorato',     label:'✨ Dorato',     query:'gold luxury certificate diploma border achievement' },
    { id:'geometrico', label:'◆ Geometrico',  query:'geometric pattern certificate abstract modern design' },
    { id:'pergamena',  label:'📃 Pergamena',  query:'parchment aged paper diploma scroll certificate texture' },
    { id:'cornice',    label:'🖼 Cornice',    query:'ornate frame border decoration certificate diploma' },
  ]
  const [selectedImages, setSelectedImages] = useState([])

  function toggleSelectImage(img) {
    setSelectedImages(prev => {
      const exists = prev.find(i => i.url === img.url)
      return exists ? prev.filter(i => i.url !== img.url) : [...prev, img]
    })
  }

  async function importSelected() {
    for (const img of selectedImages) {
      await importImageFromUrl(img.url)
      await new Promise(r => setTimeout(r, 400))
    }
    setSelectedImages([])
    setSearchOpen(false)
  }

  async function searchOnline(query) {
    const q = (query || searchQuery || SEARCH_CATEGORIES[0].query).trim()
    setSearchLoading(true); setSearchErr(''); setSearchResults([])
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Nessun risultato trovato')
      setSearchResults(data.images || [])
    } catch (e) {
      setSearchErr(e.message || 'Errore durante la ricerca')
    }
    setSearchLoading(false)
  }

  function openSearch() {
    setSearchOpen(true); setTplDrawerOpen(false); setImgGalleryOpen(false)
    if (!searchResults.length) { setSearchCategory('elegante'); searchOnline(SEARCH_CATEGORIES[0].query) }
  }

  /* ── Import immagine da URL esterno come sfondo ── */
  async function importImageFromUrl(url) {
    try {
      const base64 = await new Promise((res, rej) => {
        const img = new window.Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const c = document.createElement('canvas')
          c.width = img.naturalWidth; c.height = img.naturalHeight
          c.getContext('2d').drawImage(img, 0, 0)
          res(c.toDataURL('image/jpeg', 0.92).split(',')[1])
        }
        img.onerror = () => rej(new Error('Impossibile caricare questa immagine (CORS)'))
        img.src = url
      })
      const { data: { session } } = await supabase.auth.getSession()
      const jwt = session?.access_token
      const ts = Date.now()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-upload-logo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: `imported-${ts}.jpg`, base64, folder: 'certificati-immagini' }),
      })
      const result = await res.json()
      if (!res.ok || result.error) throw new Error(result.error)
      // Aggiunge come sfondo piena pagina (zIndex 0)
      const bgEl = { id: uid(), type: 'image', field: 'custom', src: result.url, x: 0, y: 0, w: 842, h: 595, zIndex: 0 }
      setElements([bgEl, ...elements])
      setSearchOpen(false)
      setTplMsg('Immagine importata come sfondo — trascinala o ridimensionala a piacere')
      setTimeout(() => setTplMsg(''), 4000)
    } catch (e) {
      setSearchErr('Impossibile importare: ' + (e.message || 'Errore'))
    }
  }

  async function uploadFreeImage(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) { setUploadImgErr('Solo immagini (PNG, JPG, SVG, WebP)'); return }
    if (file.size > 2 * 1024 * 1024) { setUploadImgErr('File troppo grande (max 2MB)'); return }
    setUploadingImg(true); setUploadImgErr('')
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader()
        r.onload = () => res(r.result.split(',')[1])
        r.onerror = rej
        r.readAsDataURL(file)
      })
      const { data: { session } } = await supabase.auth.getSession()
      const jwt = session?.access_token
      if (!jwt) throw new Error('Non autenticato')
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-upload-logo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, base64, folder: 'certificati-immagini' }),
      })
      const result = await res.json()
      if (!res.ok || result.error) throw new Error(result.error || 'Errore upload')
      if (!result.propagated) {
        // Attende fino a 6 secondi aggiuntivi per la propagazione CDN
        await new Promise(r => setTimeout(r, 3000))
      }
      if (replaceTargetId) {
        updateElement(replaceTargetId, { src: result.url })
        setReplaceTargetId(null)
        setUploadingImg(false)
        return
      }
      const dims = await new Promise(resolve => {
        const img = new window.Image()
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
        img.onerror = () => resolve({ w: 150, h: 150 })
        img.src = result.url
      })
      const maxDim = 180
      const scale = Math.min(maxDim / dims.w, maxDim / dims.h, 1)
      addElement('image', { src: result.url, w: Math.round(dims.w * scale), h: Math.round(dims.h * scale) })
    } catch (e) {
      setUploadImgErr(e.message || 'Errore durante il caricamento')
    }
    setUploadingImg(false)
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
  const btnSm = { width:'28px', height:'28px', border:'1px solid #D1D5DB', borderRadius:'5px', background:'#fff', fontSize:'16px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#374151', padding:0 }

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
        {/* ── Barra template + ricerca ── */}
        <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:'10px', padding:'12px 16px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:'10px' }}>
          <span style={{ fontSize:'12px', fontWeight:'700', color:'#1E40AF', marginRight:'2px' }}>Modelli:</span>
          <button type="button" onClick={openSaveNew} disabled={elements.length === 0 || savingTpl}
            style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'8px', border:'1px solid #003DA5', background:'#003DA5', color:'#fff', fontSize:'12px', fontWeight:'700', cursor: elements.length === 0 ? 'not-allowed' : 'pointer', opacity: elements.length === 0 ? 0.5 : 1 }}>
            <Save size={13} /> Salva come nuovo modello
          </button>
          <button type="button" onClick={() => { setTplDrawerOpen(v => !v); setSearchOpen(false); setImgGalleryOpen(false) }}
            style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'8px', border:`1px solid ${tplDrawerOpen ? '#003DA5' : '#D1D5DB'}`, background: tplDrawerOpen ? '#EFF6FF' : '#fff', color: tplDrawerOpen ? '#003DA5' : '#374151', fontSize:'12px', fontWeight:'700', cursor:'pointer' }}>
            <BookOpen size={13} /> I miei modelli {tplList.length > 0 && <span style={{ background:'#003DA5', color:'#fff', borderRadius:'99px', padding:'1px 6px', fontSize:'10px' }}>{tplList.length}</span>}
          </button>
          <button type="button" onClick={() => { setImgGalleryOpen(v => !v); setSearchOpen(false); setTplDrawerOpen(false) }}
            style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'8px', border:`1px solid ${imgGalleryOpen ? '#003DA5' : '#D1D5DB'}`, background: imgGalleryOpen ? '#EFF6FF' : '#fff', color: imgGalleryOpen ? '#003DA5' : '#374151', fontSize:'12px', fontWeight:'700', cursor:'pointer' }}>
            <ImageIcon size={13} /> Galleria immagini
          </button>
          <button type="button" onClick={() => { searchOpen ? setSearchOpen(false) : openSearch() }}
            style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'8px', border:`1px solid ${searchOpen ? '#003DA5' : '#D1D5DB'}`, background: searchOpen ? '#EFF6FF' : '#fff', color: searchOpen ? '#003DA5' : '#374151', fontSize:'12px', fontWeight:'700', cursor:'pointer' }}>
            <Search size={13} /> Modelli grafici online
          </button>
          {tplMsg && <span style={{ fontSize:'12px', color:'#16A34A', fontWeight:'600', display:'flex', alignItems:'center', gap:'5px' }}><CheckCircle size={13} />{tplMsg}</span>}
        </div>

        {/* ── Drawer "I miei modelli" ── */}
        {tplDrawerOpen && (
          <div style={{ border:'1px solid #E5E7EB', borderRadius:'10px', padding:'16px', background:'#fff' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
              <p style={{ margin:0, fontSize:'14px', fontWeight:'800', color:'#0A0A0A' }}>I miei modelli salvati</p>
              <button type="button" onClick={() => setTplDrawerOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}><X size={16}/></button>
            </div>
            {tplLoading ? (
              <div style={{ display:'flex', gap:'8px', color:'#9CA3AF', fontSize:'13px', alignItems:'center' }}><Loader2 size={15} style={{ animation:'spin .8s linear infinite' }}/> Caricamento…</div>
            ) : tplList.length === 0 ? (
              <p style={{ fontSize:'13px', color:'#9CA3AF', margin:0 }}>Nessun modello ancora salvato. Crea un certificato e premi "Salva come nuovo modello".</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {tplList.map(tpl => (
                  <div key={tpl.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', border:'1px solid #E5E7EB', borderRadius:'8px', background:'#FAFAFA' }}>
                    <div style={{ width:'80px', height:'45px', flexShrink:0, background:'#fff', border:'1px solid #E5E7EB', borderRadius:'5px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                      <div style={{ transform:'scale(0.095)', transformOrigin:'top left', width:`${PAGE_W}px`, height:`${PAGE_H}px`, position:'relative', background:'#fff' }}>
                        {(tpl.elements || []).filter(el => el.type === 'shape' && el.fill).slice(0,8).map(el => (
                          <div key={el.id} style={{ position:'absolute', left:el.x, top:el.y, width:el.w, height:el.h, background:el.fill || 'transparent', borderRadius: el.shape==='circle' ? '50%' : 0 }} />
                        ))}
                      </div>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:'0 0 2px', fontSize:'13px', fontWeight:'700', color:'#0A0A0A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tpl.nome}</p>
                      <p style={{ margin:0, fontSize:'11px', color:'#9CA3AF' }}>{tpl.elements?.length || 0} elementi · {new Date(tpl.updated_at).toLocaleDateString('it-IT')}</p>
                    </div>
                    <button type="button" onClick={() => loadTemplate(tpl)}
                      style={{ padding:'7px 12px', borderRadius:'7px', border:'1px solid #003DA5', background:'#003DA5', color:'#fff', fontSize:'12px', fontWeight:'700', cursor:'pointer', flexShrink:0 }}>Carica</button>
                    <button type="button" onClick={() => openSaveOverwrite(tpl)} title="Aggiorna con il disegno corrente"
                      style={{ padding:'7px 10px', borderRadius:'7px', border:'1px solid #E5E7EB', background:'#fff', color:'#374151', cursor:'pointer', flexShrink:0 }}><Pencil size={13}/></button>
                    <button type="button" onClick={() => deleteTemplate(tpl)}
                      style={{ padding:'7px 10px', borderRadius:'7px', border:'1px solid #FECACA', background:'#FEF2F2', color:'#DC2626', cursor:'pointer', flexShrink:0 }}><Trash2 size={13}/></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Drawer "Modelli grafici online" ── */}
        {searchOpen && (
          <div style={{ border:'1px solid #E5E7EB', borderRadius:'10px', background:'#fff', overflow:'hidden' }}>
            {/* Header */}
            <div style={{ padding:'14px 16px', borderBottom:'1px solid #E5E7EB', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <p style={{ margin:'0 0 2px', fontSize:'15px', fontWeight:'800', color:'#0A0A0A', display:'flex', alignItems:'center', gap:'8px' }}>
                  <Search size={15}/> Cerca sfondi per attestati e diplomi
                </p>
                <p style={{ margin:0, fontSize:'12px', color:'#9CA3AF' }}>
                  Scegli una categoria, oppure cerca liberamente. Puoi selezionare più immagini e importarle tutte insieme.
                </p>
              </div>
              <button type="button" onClick={() => { setSearchOpen(false); setSelectedImages([]) }} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', flexShrink:0, marginLeft:'12px' }}><X size={16}/></button>
            </div>

            {/* Categorie — 2 righe scrollabili orizzontalmente */}
            <div style={{ padding:'10px 16px', borderBottom:'1px solid #F3F4F6', display:'flex', flexWrap:'wrap', gap:'6px' }}>
              {SEARCH_CATEGORIES.map(cat => (
                <button key={cat.id} type="button"
                  onClick={() => { setSearchCategory(cat.id); setSelectedImages([]); searchOnline(cat.query) }}
                  style={{ padding:'5px 12px', borderRadius:'20px', border:'1px solid', fontSize:'12px', fontWeight:'700', cursor:'pointer', whiteSpace:'nowrap', transition:'all .1s',
                    borderColor: searchCategory === cat.id ? '#003DA5' : '#E5E7EB',
                    background: searchCategory === cat.id ? '#003DA5' : '#F9FAFB',
                    color: searchCategory === cat.id ? '#fff' : '#374151' }}>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Ricerca libera */}
            <div style={{ padding:'10px 16px', borderBottom:'1px solid #F3F4F6', display:'flex', gap:'8px', alignItems:'center' }}>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { setSelectedImages([]); searchOnline() } }}
                placeholder="Es: gold border certificate, diploma parchment ornate, modern blue frame…"
                style={{ flex:1, padding:'8px 12px', border:'1px solid #D1D5DB', borderRadius:'8px', fontSize:'13px', fontFamily:"'Inter',sans-serif" }} />
              <button type="button" onClick={() => { setSelectedImages([]); searchOnline() }} disabled={searchLoading}
                style={{ padding:'8px 18px', borderRadius:'8px', background:'#003DA5', color:'#fff', border:'none', fontSize:'13px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>
                {searchLoading ? <Loader2 size={14} style={{ animation:'spin .8s linear infinite' }}/> : <Search size={14}/>}
                Cerca
              </button>
            </div>

            {/* Barra selezione multipla — appare quando ci sono immagini selezionate */}
            {selectedImages.length > 0 && (
              <div style={{ padding:'10px 16px', background:'#EFF6FF', borderBottom:'1px solid #BFDBFE', display:'flex', alignItems:'center', gap:'12px' }}>
                <span style={{ fontSize:'13px', fontWeight:'700', color:'#003DA5' }}>
                  {selectedImages.length} immagine{selectedImages.length > 1 ? 'i' : ''} selezionata{selectedImages.length > 1 ? 'e' : ''}
                </span>
                <button type="button" onClick={importSelected}
                  style={{ padding:'7px 16px', borderRadius:'8px', background:'#003DA5', color:'#fff', border:'none', fontSize:'13px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
                  <Download size={13}/> Importa {selectedImages.length > 1 ? 'tutte' : ''} come sfondo
                </button>
                <button type="button" onClick={() => setSelectedImages([])}
                  style={{ fontSize:'12px', color:'#6B7280', background:'none', border:'none', cursor:'pointer' }}>Deseleziona tutto</button>
              </div>
            )}

            {/* Risultati — griglia grande */}
            <div style={{ padding:'14px 16px' }}>
              {searchErr && (
                <div style={{ padding:'12px 16px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', marginBottom:'12px', fontSize:'13px', color:'#DC2626' }}>
                  {searchErr}
                </div>
              )}
              {searchLoading && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', padding:'48px', color:'#9CA3AF', fontSize:'13px' }}>
                  <Loader2 size={22} style={{ animation:'spin .8s linear infinite' }}/> Ricerca in corso…
                </div>
              )}
              {!searchLoading && searchResults.length > 0 && (
                <>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                    <p style={{ margin:0, fontSize:'12px', color:'#6B7280' }}>
                      <strong style={{ color:'#0A0A0A' }}>{searchResults.length} risultati</strong> — clicca per selezionare, poi premi "Importa" in alto
                    </p>
                    {searchResults.length > 1 && (
                      <button type="button"
                        onClick={() => setSelectedImages(selectedImages.length === searchResults.length ? [] : [...searchResults])}
                        style={{ fontSize:'12px', fontWeight:'700', color:'#003DA5', background:'none', border:'none', cursor:'pointer' }}>
                        {selectedImages.length === searchResults.length ? 'Deseleziona tutti' : 'Seleziona tutti'}
                      </button>
                    )}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'10px', maxHeight:'480px', overflowY:'auto', paddingRight:'4px' }}>
                    {searchResults.map((img, i) => {
                      const isSel = selectedImages.find(s => s.url === img.url)
                      return (
                        <div key={i}
                          onClick={() => toggleSelectImage(img)}
                          style={{ position:'relative', borderRadius:'10px', overflow:'hidden', cursor:'pointer', aspectRatio:'4/3', background:'#F3F4F6',
                            border: isSel ? '3px solid #003DA5' : '2px solid transparent',
                            boxShadow: isSel ? '0 0 0 2px rgba(0,61,165,0.25)' : 'none',
                            transition:'border .1s, box-shadow .1s' }}>
                          <img src={img.thumb} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                            onError={e => { e.target.style.display='none' }} />
                          {/* Checkbox overlay */}
                          <div style={{ position:'absolute', top:'7px', right:'7px', width:'22px', height:'22px', borderRadius:'50%',
                            background: isSel ? '#003DA5' : 'rgba(255,255,255,0.85)',
                            border: isSel ? 'none' : '2px solid rgba(0,0,0,0.2)',
                            display:'flex', alignItems:'center', justifyContent:'center', transition:'all .1s' }}>
                            {isSel && <svg width="12" height="12" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                          {/* Overlay hover */}
                          <div style={{ position:'absolute', inset:0, background:'rgba(0,30,100,0)', transition:'background .15s' }}
                            onMouseEnter={e => { if (!isSel) e.currentTarget.style.background='rgba(0,30,100,0.25)' }}
                            onMouseLeave={e => { e.currentTarget.style.background='rgba(0,30,100,0)' }}>
                            <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'6px 8px',
                              background:'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                              opacity: 0, transition:'opacity .15s' }}
                              onMouseEnter={e => { e.currentTarget.style.opacity=1 }}
                              onMouseLeave={e => { e.currentTarget.style.opacity=0 }}>
                              <p style={{ margin:0, fontSize:'10px', color:'rgba(255,255,255,0.8)' }}>© {img.source}{img.author ? ` · ${img.author}` : ''}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
              {!searchLoading && !searchErr && searchResults.length === 0 && (
                <div style={{ textAlign:'center', padding:'40px 20px', color:'#9CA3AF' }}>
                  <p style={{ fontSize:'28px', margin:'0 0 8px' }}>🔍</p>
                  <p style={{ margin:'0 0 4px', fontSize:'14px', fontWeight:'600', color:'#374151' }}>Nessun risultato</p>
                  <p style={{ margin:0, fontSize:'12px' }}>Seleziona una categoria sopra o scrivi una ricerca in inglese per risultati migliori</p>
                </div>
              )}
            </div>
          </div>
        )}



        {/* ── Galleria immagini certificato ── */}
        {imgGalleryOpen && (
          <div style={{ border:'1px solid #E5E7EB', borderRadius:'10px', padding:'16px', background:'#fff' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
              <div>
                <p style={{ margin:'0 0 2px', fontSize:'14px', fontWeight:'800', color:'#0A0A0A' }}>Galleria immagini certificato</p>
                <p style={{ margin:0, fontSize:'12px', color:'#9CA3AF' }}>Queste immagini sono usate solo nei certificati, non appaiono nell&apos;hero degli eventi.</p>
              </div>
              <button type="button" onClick={() => setImgGalleryOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}><X size={16}/></button>
            </div>
            <LogoManager
              folder="certificati-immagini"
              showDefault={false}
              heading="Immagini caricate per i certificati"
              uploadHeading="Carica nuova immagine"
              value={null}
              compact
              onChange={url => {
                if (!url) return
                const img2 = new window.Image()
                img2.onload = () => {
                  const s = Math.min(200 / img2.naturalWidth, 200 / img2.naturalHeight, 1)
                  addElement('image', { src: url, w: Math.round(img2.naturalWidth * s), h: Math.round(img2.naturalHeight * s) })
                  setImgGalleryOpen(false)
                }
                img2.onerror = () => { addElement('image', { src: url, w: 150, h: 150 }); setImgGalleryOpen(false) }
                img2.src = url
              }}
            />
          </div>
        )}

        {/* ── Modale: salva con nome ── */}
        {saveNameModalOpen && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
            <div style={{ background:'#fff', borderRadius:'14px', padding:'28px 32px', width:'420px', maxWidth:'90vw', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
              <h3 style={{ margin:'0 0 6px', fontSize:'18px', fontWeight:'800', color:'#0A0A0A' }}>
                {saveNameMode === 'overwrite' ? 'Aggiorna modello esistente' : 'Salva come nuovo modello'}
              </h3>
              <p style={{ margin:'0 0 16px', fontSize:'13px', color:'#6B7280' }}>
                {saveNameMode === 'overwrite' ? `Sostituirà il disegno di "${saveNameValue}" con quello corrente.` : 'Dai un nome al modello per ritrovarlo rapidamente.'}
              </p>
              <input value={saveNameValue} onChange={e => setSaveNameValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveNameValue.trim() && saveTemplate(saveNameValue.trim(), saveNameTargetId)}
                autoFocus placeholder="Es. Diploma elegante, Certificato CNA 2026…"
                style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #D1D5DB', borderRadius:'8px', fontSize:'14px', fontFamily:"'Inter',sans-serif", boxSizing:'border-box', marginBottom:'16px' }} />
              <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
                <button type="button" onClick={() => setSaveNameModalOpen(false)}
                  style={{ padding:'9px 20px', borderRadius:'8px', border:'1px solid #E5E7EB', background:'#fff', color:'#374151', fontSize:'13px', fontWeight:'700', cursor:'pointer' }}>Annulla</button>
                <button type="button" onClick={() => saveTemplate(saveNameValue.trim(), saveNameTargetId)} disabled={!saveNameValue.trim() || savingTpl}
                  style={{ padding:'9px 20px', borderRadius:'8px', border:'none', background: saveNameValue.trim() ? '#003DA5' : '#D1D5DB', color:'#fff', fontSize:'13px', fontWeight:'700', cursor: saveNameValue.trim() ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', gap:'6px' }}>
                  {savingTpl ? <><Loader2 size={14} style={{ animation:'spin .8s linear infinite' }}/> Salvataggio…</> : <><Save size={14}/> Salva</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modelli + colore + logo */}
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
          <div style={{ width: '240px', flexShrink: 0 }}>
            <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em' }}>Logo evento</p>
            <button type="button" onClick={() => setLogoDrawerOpen(v => !v)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>
              <div style={{ width: '56px', height: '34px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', borderRadius: '5px', border: '1px solid #E5E7EB' }}>
                <img src={logoUrl} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151', flex: 1, textAlign: 'left' }}>Cambia logo</span>
              <ChevronRight size={15} style={{ transform: logoDrawerOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s', color: '#9CA3AF' }} />
            </button>
          </div>
        </div>

        {logoDrawerOpen && (
          <div style={{ maxWidth: '640px', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '16px', background: '#fff', position: 'relative' }}>
            <button type="button" onClick={() => setLogoDrawerOpen(false)}
              style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={16} /></button>
            <LogoManager value={logoUrl} onChange={url => update({ logo_url: url })} />
          </div>
        )}

        {/* Toolbar aggiungi elementi */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" onClick={() => addElement('text')} style={toolBtn}><Type size={16} />Testo</button>
          <button type="button" onClick={() => addElement('rect')} style={toolBtn}><Square size={16} />Rettangolo</button>
          <button type="button" onClick={() => addElement('line')} style={toolBtn}><Minus size={16} />Linea</button>
          <button type="button" onClick={() => addElement('circle')} style={toolBtn}><CircleIcon size={16} />Cerchio</button>
          <button type="button" onClick={() => addElement('qrcode')} style={toolBtn}><QrCode size={16} />QR</button>
          <button type="button" onClick={() => addElement('logo')} style={toolBtn}><ImageIcon size={16} />Logo</button>
          <button type="button" onClick={() => imgFileRef.current?.click()} disabled={uploadingImg} style={{ ...toolBtn, opacity: uploadingImg ? 0.5 : 1 }}>
            {uploadingImg ? <Loader2 size={16} style={{ animation: 'spin .8s linear infinite' }} /> : <Upload size={16} />}Immagine
          </button>
          <input ref={imgFileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style={{ display: 'none' }}
            onChange={e => { uploadFreeImage(e.target.files[0]); e.target.value = '' }} />
          <div style={{ width: '1px', height: '32px', background: '#E5E7EB', margin: '0 4px' }} />
          <button type="button" disabled={!selected} onClick={duplicateSelected} style={{ ...toolBtn, opacity: selected ? 1 : 0.4 }}><Copy size={16} />Duplica</button>
          <button type="button" disabled={!selected} onClick={() => reorder('up')} style={{ ...toolBtn, opacity: selected ? 1 : 0.4 }}><ChevronUp size={16} />Avanti</button>
          <button type="button" disabled={!selected} onClick={() => reorder('down')} style={{ ...toolBtn, opacity: selected ? 1 : 0.4 }}><ChevronDown size={16} />Indietro</button>
          <button type="button" disabled={!selected} onClick={deleteSelected} style={{ ...toolBtn, opacity: selected ? 1 : 0.4, color: '#DC2626' }}><Trash2 size={16} />Elimina</button>
        </div>
        {uploadImgErr && <p style={{ fontSize: '12px', color: '#DC2626', margin: 0 }}>{uploadImgErr}</p>}

        {/* Canvas + pannello proprietà */}
        <div style={{ display: 'grid', gridTemplateColumns: `${STAGE_W}px 360px`, gap: '20px', alignItems: 'flex-start' }} className="cert-canvas-grid">
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
                {selected.type === 'text' ? 'Testo' : selected.type === 'image' ? (selected.field === 'logo' ? 'Logo' : 'Immagine') : selected.type === 'qrcode' ? 'QR Code' : `Forma — ${selected.shape}`}
              </p>

              {selected.type === 'text' && (<>

                {/* Contenuto / campo dinamico */}
                <div>
                  <p style={{ margin:'0 0 5px', fontSize:'10px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.06em' }}>Contenuto</p>
                  <select value={selected.field || 'custom'} onChange={e => updateElement(selected.id, { field: e.target.value })}
                    style={{ width:'100%', padding:'7px 10px', border:'1px solid #D1D5DB', borderRadius:'6px', fontSize:'12px', fontFamily:"'Inter',sans-serif", marginBottom:'6px' }}>
                    {FIELD_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                  {(selected.field || 'custom') === 'custom' && (
                    <textarea value={selected.text || ''} onChange={e => updateElement(selected.id, { text: e.target.value })} rows={2}
                      style={{ width:'100%', padding:'8px 10px', border:'1px solid #D1D5DB', borderRadius:'6px', fontSize:'13px', fontFamily:"'Inter',sans-serif", resize:'vertical', boxSizing:'border-box' }} />
                  )}
                </div>

                {/* Font */}
                <div>
                  <p style={{ margin:'0 0 5px', fontSize:'10px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.06em' }}>Font</p>
                  <select value={selected.fontFamily || 'helvetica'} onChange={e => updateElement(selected.id, { fontFamily: e.target.value })}
                    style={{ width:'100%', padding:'7px 10px', border:'1px solid #D1D5DB', borderRadius:'6px', fontSize:'13px',
                      fontFamily: CERT_FONT_STACK[selected.fontFamily || 'helvetica'] }}>
                    {CERT_FONTS.map(f => (
                      <option key={f.value} value={f.value} style={{ fontFamily: f.stack }}>{f.label}</option>
                    ))}
                  </select>
                </div>

                {/* Dimensione con slider */}
                <div>
                  <p style={{ margin:'0 0 5px', fontSize:'10px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.06em' }}>
                    Dimensione — <span style={{ color:'#003DA5', fontWeight:'800' }}>{selected.fontSize || 14}px</span>
                  </p>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <button type="button" onClick={() => updateElement(selected.id, { fontSize: Math.max(6, (selected.fontSize||14) - 1) })}
                      style={btnSm}>−</button>
                    <input type="range" min="6" max="96" step="1" value={selected.fontSize || 14}
                      onChange={e => updateElement(selected.id, { fontSize: Number(e.target.value) })}
                      style={{ flex:1, accentColor:'#003DA5' }} />
                    <button type="button" onClick={() => updateElement(selected.id, { fontSize: Math.min(120, (selected.fontSize||14) + 1) })}
                      style={btnSm}>+</button>
                    <input type="number" min="6" max="120" value={selected.fontSize || 14}
                      onChange={e => updateElement(selected.id, { fontSize: Number(e.target.value) || 14 })}
                      style={{ width:'48px', padding:'4px 6px', border:'1px solid #D1D5DB', borderRadius:'5px', fontSize:'12px', textAlign:'center' }} />
                  </div>
                </div>

                {/* Stile */}
                <div>
                  <p style={{ margin:'0 0 5px', fontSize:'10px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.06em' }}>Stile</p>
                  <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                    {[
                      { key:'bold',          node: <strong style={{fontSize:'13px',fontFamily:'inherit'}}>B</strong>,             title:'Grassetto' },
                      { key:'italic',        node: <em style={{fontStyle:'italic',fontSize:'13px',fontFamily:'inherit'}}>I</em>,   title:'Corsivo' },
                      { key:'underline',     node: <span style={{textDecoration:'underline',fontSize:'13px'}}>U</span>,           title:'Sottolineato' },
                      { key:'strikethrough', node: <span style={{textDecoration:'line-through',fontSize:'13px'}}>S</span>,        title:'Barrato' },
                      { key:'uppercase',     node: <span style={{fontSize:'11px',fontWeight:'800',letterSpacing:'1px'}}>AA</span>, title:'Maiuscolo' },
                    ].map(({ key, node, title }) => (
                      <button key={key} type="button" title={title} onClick={() => updateElement(selected.id, { [key]: !selected[key] })}
                        style={{ minWidth:'34px', height:'34px', padding:'0 8px', borderRadius:'6px', border:'1px solid',
                          borderColor: selected[key] ? '#003DA5' : '#D1D5DB',
                          background: selected[key] ? '#EFF6FF' : '#fff',
                          color: selected[key] ? '#003DA5' : '#374151',
                          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {node}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Allineamento */}
                <div>
                  <p style={{ margin:'0 0 5px', fontSize:'10px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.06em' }}>Allineamento</p>
                  <div style={{ display:'flex', gap:'4px' }}>
                    {[{ v:'left', I:AlignLeft, t:'Sinistra' }, { v:'center', I:AlignCenter, t:'Centro' }, { v:'right', I:AlignRight, t:'Destra' }].map(({ v, I, t }) => (
                      <button key={v} type="button" title={t} onClick={() => updateElement(selected.id, { align: v })}
                        style={{ flex:1, height:'34px', borderRadius:'6px', border:'1px solid',
                          borderColor: (selected.align||'left') === v ? '#003DA5' : '#D1D5DB',
                          background: (selected.align||'left') === v ? '#EFF6FF' : '#fff',
                          color: (selected.align||'left') === v ? '#003DA5' : '#374151',
                          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <I size={14} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colore testo */}
                <div>
                  <p style={{ margin:'0 0 5px', fontSize:'10px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.06em' }}>
                    Colore testo
                    <span style={{ display:'inline-block', width:'12px', height:'12px', background: selected.color||'#0A0A0A', borderRadius:'2px', border:'1px solid #E5E7EB', marginLeft:'6px', verticalAlign:'middle' }} />
                  </p>
                  <ColorSwatchPicker value={selected.color || '#0A0A0A'} onChange={v => updateElement(selected.id, { color: v })} />
                </div>

                {/* Interlinea + Spaziatura */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                  <div>
                    <p style={{ margin:'0 0 5px', fontSize:'10px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.06em' }}>Interlinea</p>
                    <select value={selected.lineHeight || ''} onChange={e => updateElement(selected.id, { lineHeight: e.target.value ? Number(e.target.value) : undefined })}
                      style={{ width:'100%', padding:'7px 8px', border:'1px solid #D1D5DB', borderRadius:'6px', fontSize:'12px' }}>
                      <option value="">Auto</option>
                      {[1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 2, 2.5].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <p style={{ margin:'0 0 5px', fontSize:'10px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.06em' }}>Spaziatura</p>
                    <input type="number" step="0.5" min="-5" max="20" value={selected.letterSpacing || 0}
                      onChange={e => updateElement(selected.id, { letterSpacing: Number(e.target.value) || 0 })}
                      style={{ width:'100%', padding:'7px 8px', border:'1px solid #D1D5DB', borderRadius:'6px', fontSize:'12px', boxSizing:'border-box' }} />
                  </div>
                </div>

                {/* Sfondo testo */}
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'5px' }}>
                    <p style={{ margin:0, fontSize:'10px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.06em' }}>Sfondo testo</p>
                    {selected.bgColor && (
                      <button type="button" onClick={() => updateElement(selected.id, { bgColor: null })}
                        style={{ fontSize:'11px', color:'#DC2626', background:'none', border:'none', cursor:'pointer', padding:0 }}>× rimuovi</button>
                    )}
                  </div>
                  <ColorSwatchPicker value={selected.bgColor || null} onChange={v => updateElement(selected.id, { bgColor: v })} />
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
              {selected.type === 'image' && selected.field === 'logo' && (
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Usa il logo impostato qui sopra. Trascina per riposizionare — le proporzioni sono sempre mantenute.</p>
              )}
              {selected.type === 'image' && selected.field !== 'logo' && (<>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Immagine caricata liberamente. Trascina per spostarla, ridimensiona dall&apos;angolo.</p>
                <Field label="Opacità">
                  <input type="range" min="0.1" max="1" step="0.05" value={selected.opacity ?? 1} onChange={e => updateElement(selected.id, { opacity: Number(e.target.value) })} style={{ width: '100%' }} />
                </Field>
                <button type="button" onClick={() => { setReplaceTargetId(selected.id); imgFileRef.current?.click() }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#003DA5', background: 'none', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '7px 10px', cursor: 'pointer', alignSelf: 'flex-start' }}>
                  <Upload size={13} /> Sostituisci immagine
                </button>
              </>)}

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
