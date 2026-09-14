import type { SupabaseClient } from '@supabase/supabase-js'
import { downloadBlob, sanitizeFilename } from './utils'

/* ---------------- CSV (Excel-compatible, UTF-8 BOM) ---------------- */

export interface CsvColumn<T> {
  /** Column key on the row (used only when `value` is not provided). */
  key: string
  label: string
  value?: (row: T) => string | number | null | undefined
}

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => csvEscape(c.label)).join(',')
  const body = rows
    .map((row) => columns.map((c) => csvEscape(c.value ? c.value(row) : (row as Record<string, unknown>)[c.key])).join(','))
    .join('\r\n')
  return `${header}\r\n${body}`
}

export function downloadCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  const csv = toCsv(rows, columns)
  downloadBlob(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }), filename)
}

/* ---------------- ZIP helpers ---------------- */

export async function fetchStorageFile(client: SupabaseClient, bucket: string, path: string): Promise<Blob | null> {
  const { data, error } = await client.storage.from(bucket).download(path)
  if (error || !data) return null
  return data
}

export async function buildZip(
  entries: Array<{ name: string; blob: Blob | null }>,
): Promise<Blob> {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  for (const e of entries) {
    if (e.blob) zip.file(sanitizeFilename(e.name), e.blob)
  }
  return zip.generateAsync({ type: 'blob' })
}

export function downloadZip(filename: string, zip: Blob): void {
  downloadBlob(zip, filename)
}

/** Download every file that has a path, zipping them with safe filenames. */
export async function downloadZipOfFiles(
  client: SupabaseClient,
  zipName: string,
  items: Array<{ name: string; bucket: string; path: string | null }>,
): Promise<number> {
  const valid = items.filter((i): i is { name: string; bucket: string; path: string } => Boolean(i.path))
  const results = await Promise.all(
    valid.map(async (i) => ({ name: i.name, blob: await fetchStorageFile(client, i.bucket, i.path) })),
  )
  const zip = await buildZip(results)
  downloadZip(zipName, zip)
  return results.filter((r) => r.blob).length
}

/* ---------------- PDF reports (jsPDF + autotable, lazy-loaded) ---------------- */

export interface PdfReportSection {
  title?: string
  head: string[]
  body: Array<Array<string | number>>
}

const NAVY: [number, number, number] = [13, 43, 87]
const GOLD: [number, number, number] = [245, 179, 1]

export async function buildPdfReport(opts: {
  filename: string
  brandLine: string
  title: string
  subtitle?: string
  metaLines: string[]
  summaryLines?: string[]
  sections: PdfReportSection[]
  orientation?: 'landscape' | 'portrait'
}): Promise<void> {
  const { default: JsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new JsPDF({ orientation: opts.orientation ?? 'landscape', unit: 'pt', format: 'a4' })

  // Brand header
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 64, 'F')
  doc.setFillColor(...GOLD)
  doc.rect(0, 64, doc.internal.pageSize.getWidth(), 4, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('MEDSAM', 40, 30)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(opts.brandLine, 40, 46)

  doc.setTextColor(...NAVY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(opts.title, 40, 100)
  if (opts.subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(90, 90, 90)
    doc.text(opts.subtitle, 40, 118)
  }

  let y = 134
  doc.setTextColor(60, 60, 60)
  doc.setFontSize(9)
  for (const line of opts.metaLines) {
    doc.text(line, 40, y)
    y += 13
  }
  if (opts.summaryLines?.length) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...NAVY)
    y += 6
    doc.text('Summary', 40, y)
    y += 15
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(60, 60, 60)
    for (const line of opts.summaryLines) {
      doc.text(line, 40, y)
      y += 13
    }
  }

  let tableY = y + 14
  for (const section of opts.sections) {
    if (section.title) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...NAVY)
      doc.text(section.title, 40, tableY)
      tableY += 6
    }
    autoTable(doc, {
      startY: tableY,
      head: [section.head],
      body: section.body,
      styles: { fontSize: 8, cellPadding: 5, textColor: [40, 40, 40] },
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 248, 252] },
      margin: { left: 40, right: 40 },
    })
    // @ts-expect-error – lastAutoTable is attached by the plugin
    tableY = (doc.lastAutoTable?.finalY ?? tableY) + 28
  }

  // Footer with page numbers
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(130, 130, 130)
    doc.text(
      `MEDSAM Scientific Conference & Symposium — Confidential report — Page ${i} of ${pages}`,
      40,
      doc.internal.pageSize.getHeight() - 24,
    )
  }

  doc.save(opts.filename)
}
