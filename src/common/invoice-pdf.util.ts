export type InvoicePdfInput = {
  invoiceId: string
  issuedDate: string
  amountLabel: string
  status: string
  /** Line item description shown in the summary table. */
  lineDescription?: string
}

const PAGE_W = 612
const PAGE_H = 792
const MARGIN = 50

const COLOR = {
  text: [0.12, 0.14, 0.16] as const,
  muted: [0.45, 0.48, 0.52] as const,
  accent: [0.08, 0.42, 0.4] as const,
  line: [0.82, 0.84, 0.86] as const,
  badgeBg: [0.93, 0.97, 0.96] as const,
  badgeBorder: [0.72, 0.86, 0.84] as const,
  headerBg: [0.97, 0.98, 0.99] as const,
}

function escapePdfText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
}

/** Approximate Helvetica glyph width for right-alignment without font metrics. */
function textWidthApprox(text: string, fontSize: number, bold = false): number {
  const factor = bold ? 0.56 : 0.52
  return text.length * fontSize * factor
}

function rgbFill([r, g, b]: readonly [number, number, number]): string {
  return `${r} ${g} ${b} rg`
}

function rgbStroke([r, g, b]: readonly [number, number, number]): string {
  return `${r} ${g} ${b} RG`
}

function drawText(
  x: number,
  y: number,
  text: string,
  opts: { font?: "regular" | "bold" | "mono"; size?: number; color?: readonly [number, number, number] } = {},
): string {
  const fontKey = opts.font === "bold" ? "F2" : opts.font === "mono" ? "F3" : "F1"
  const size = opts.size ?? 10
  const color = opts.color ?? COLOR.text
  return `${rgbFill(color)}\nBT\n/${fontKey} ${size} Tf\n${x.toFixed(2)} ${y.toFixed(2)} Td\n(${escapePdfText(text)}) Tj\nET\n`
}

function drawTextRightAt(
  rightX: number,
  y: number,
  text: string,
  opts: { font?: "regular" | "bold" | "mono"; size?: number; color?: readonly [number, number, number] } = {},
): string {
  const size = opts.size ?? 10
  const bold = opts.font === "bold"
  const x = rightX - textWidthApprox(text, size, bold)
  return drawText(x, y, text, opts)
}

function drawTextRight(
  y: number,
  text: string,
  opts: { font?: "regular" | "bold" | "mono"; size?: number; color?: readonly [number, number, number] } = {},
): string {
  return drawTextRightAt(PAGE_W - MARGIN, y, text, opts)
}

function drawFilledRect(
  x: number,
  y: number,
  width: number,
  height: number,
  fill: readonly [number, number, number],
): string {
  return `q\n${rgbFill(fill)}\n${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re\nf\nQ\n`
}

function drawStrokedRect(
  x: number,
  y: number,
  width: number,
  height: number,
  stroke: readonly [number, number, number],
  lineWidth = 0.75,
): string {
  return `q\n${rgbStroke(stroke)}\n${lineWidth} w\n${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re\nS\nQ\n`
}

function drawHorizontalLine(x1: number, x2: number, y: number): string {
  return `q\n${rgbStroke(COLOR.line)}\n0.75 w\n${x1.toFixed(2)} ${y.toFixed(2)} m\n${x2.toFixed(2)} ${y.toFixed(2)} l\nS\nQ\n`
}

function formatStatusLabel(status: string): string {
  return status.trim().toUpperCase()
}

function parseAmountParts(amountLabel: string): { amount: string; tax: string; total: string } {
  const normalized = amountLabel.trim()
  return {
    amount: normalized,
    tax: "$0.00",
    total: normalized,
  }
}

/** Build a structured tax invoice / receipt PDF (PDF 1.4, standard fonts only). */
export function buildInvoicePdf(input: InvoicePdfInput): Buffer {
  const lineDescription = input.lineDescription ?? "Psychology Session / Consultation"
  const statusLabel = formatStatusLabel(input.status)
  const amounts = parseAmountParts(input.amountLabel)

  const contentWidth = PAGE_W - MARGIN * 2
  const tableRight = PAGE_W - MARGIN

  const col = {
    description: MARGIN + 8,
    amountRight: 395,
    taxRight: 485,
    totalRight: tableRight,
  }

  const parts: string[] = []

  // Header band
  parts.push(drawFilledRect(MARGIN, PAGE_H - 130, contentWidth, 80, COLOR.headerBg))
  parts.push(drawStrokedRect(MARGIN, PAGE_H - 130, contentWidth, 80, COLOR.line))

  // Left: company block
  parts.push(drawText(MARGIN + 16, PAGE_H - 68, "Tailored Psychology", { font: "bold", size: 20, color: COLOR.text }))
  parts.push(
    drawText(MARGIN + 16, PAGE_H - 88, "ABN 00 000 000 000  ·  ACN 000 000 000", {
      size: 9,
      color: COLOR.muted,
    }),
  )
  parts.push(
    drawText(MARGIN + 16, PAGE_H - 102, "hello@tailoredpsychology.com.au  ·  (07) 0000 0000", {
      size: 9,
      color: COLOR.muted,
    }),
  )
  parts.push(drawText(MARGIN + 16, PAGE_H - 116, "Brisbane, Queensland, Australia", { size: 9, color: COLOR.muted }))

  // Right: document title
  parts.push(
    drawTextRight(PAGE_H - 72, "TAX INVOICE / RECEIPT", { font: "bold", size: 13, color: COLOR.accent }),
  )

  // Metadata block
  const metaTop = PAGE_H - 165
  parts.push(drawFilledRect(MARGIN, metaTop - 78, contentWidth, 78, [1, 1, 1]))
  parts.push(drawStrokedRect(MARGIN, metaTop - 78, contentWidth, 78, COLOR.line))

  const metaLabelX = MARGIN + 16
  const metaValueX = MARGIN + 130
  let metaY = metaTop - 24

  parts.push(drawText(metaLabelX, metaY, "Invoice ID", { size: 9, color: COLOR.muted }))
  parts.push(drawText(metaValueX, metaY, input.invoiceId, { font: "mono", size: 10, color: COLOR.text }))
  metaY -= 22

  parts.push(drawText(metaLabelX, metaY, "Date Issued", { size: 9, color: COLOR.muted }))
  parts.push(drawText(metaValueX, metaY, input.issuedDate, { size: 10, color: COLOR.text }))
  metaY -= 22

  parts.push(drawText(metaLabelX, metaY, "Payment Status", { size: 9, color: COLOR.muted }))
  const badgeText = statusLabel
  const badgeWidth = textWidthApprox(badgeText, 9, true) + 18
  const badgeX = metaValueX
  const badgeY = metaY - 4
  parts.push(drawFilledRect(badgeX, badgeY, badgeWidth, 18, COLOR.badgeBg))
  parts.push(drawStrokedRect(badgeX, badgeY, badgeWidth, 18, COLOR.badgeBorder))
  parts.push(drawText(badgeX + 9, metaY, badgeText, { font: "bold", size: 9, color: COLOR.accent }))

  // Transaction table
  const tableTop = metaTop - 110
  parts.push(drawText(MARGIN, tableTop, "Transaction Summary", { font: "bold", size: 11, color: COLOR.text }))

  const headerY = tableTop - 28
  parts.push(drawText(col.description, headerY, "Description", { font: "bold", size: 9, color: COLOR.muted }))
  parts.push(drawTextRightAt(col.amountRight, headerY, "Amount", { font: "bold", size: 9, color: COLOR.muted }))
  parts.push(drawTextRightAt(col.taxRight, headerY, "Tax (GST)", { font: "bold", size: 9, color: COLOR.muted }))
  parts.push(drawTextRightAt(col.totalRight, headerY, "Total", { font: "bold", size: 9, color: COLOR.muted }))

  parts.push(drawHorizontalLine(MARGIN, tableRight, headerY - 8))

  const rowY = headerY - 24
  parts.push(drawText(col.description, rowY, lineDescription, { size: 10, color: COLOR.text }))
  parts.push(drawTextRightAt(col.amountRight, rowY, amounts.amount, { size: 10, color: COLOR.text }))
  parts.push(drawTextRightAt(col.taxRight, rowY, amounts.tax, { size: 10, color: COLOR.text }))
  parts.push(drawTextRightAt(col.totalRight, rowY, amounts.total, { font: "bold", size: 10, color: COLOR.text }))

  parts.push(drawHorizontalLine(MARGIN, tableRight, rowY - 10))

  // Totals emphasis row
  const totalY = rowY - 28
  parts.push(drawText(PAGE_W - MARGIN - 180, totalY, "Amount Due", { font: "bold", size: 10, color: COLOR.text }))
  parts.push(drawTextRightAt(col.totalRight, totalY, amounts.total, { font: "bold", size: 12, color: COLOR.accent }))

  // Footer
  const footerY = 72
  parts.push(drawHorizontalLine(MARGIN, tableRight, footerY + 18))
  parts.push(
    drawText(MARGIN, footerY, "Generated by the patient portal. Retain for your records.", {
      size: 8,
      color: COLOR.muted,
    }),
  )
  parts.push(
    drawText(MARGIN, footerY - 12, "Rebate eligibility is determined by Medicare and your referrer.", {
      size: 8,
      color: COLOR.muted,
    }),
  )

  const streamBody = parts.join("\n")
  const streamLen = Buffer.byteLength(streamBody, "utf8")

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >> >>\nendobj\n",
    `4 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamBody}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
    "7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n",
  ]

  let pdf = "%PDF-1.4\n"
  const offsets: number[] = [0]
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"))
    pdf += obj
  }
  const xrefStart = Buffer.byteLength(pdf, "utf8")
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += "0000000000 65535 f \n"
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  return Buffer.from(pdf, "utf8")
}
