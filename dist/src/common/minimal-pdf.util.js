"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMinimalPdf = buildMinimalPdf;
/** Minimal valid PDF 1.4 with plain text lines (no external PDF library). */
function buildMinimalPdf(lines) {
    const safe = lines.map((line) => line.replace(/[()\\]/g, " "));
    const streamBody = [
        "BT",
        "/F1 11 Tf",
        "50 750 Td",
        "14 TL",
        ...safe.flatMap((line) => [`(${line}) Tj`, "T*"]),
        "ET",
    ].join("\n");
    const streamLen = Buffer.byteLength(streamBody, "utf8");
    const objects = [
        "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
        `4 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamBody}\nendstream\nendobj\n`,
        "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    ];
    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    for (const obj of objects) {
        offsets.push(Buffer.byteLength(pdf, "utf8"));
        pdf += obj;
    }
    const xrefStart = Buffer.byteLength(pdf, "utf8");
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    for (let i = 1; i < offsets.length; i++) {
        pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
    return Buffer.from(pdf, "utf8");
}
//# sourceMappingURL=minimal-pdf.util.js.map