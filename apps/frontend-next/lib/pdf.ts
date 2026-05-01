type PdfLine = {
  text: string;
  size?: number;
  bold?: boolean;
};

function escapePdfText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function buildContentStream(lines: PdfLine[]): string {
  let y = 760;
  const parts: string[] = ["BT"];
  for (const line of lines) {
    const size = line.size ?? 12;
    const font = line.bold ? "F2" : "F1";
    parts.push(`/${font} ${size} Tf`);
    parts.push(`1 0 0 1 48 ${y} Tm`);
    parts.push(`(${escapePdfText(line.text)}) Tj`);
    y -= Math.max(size + 8, 14);
  }
  parts.push("ET");
  return parts.join("\n");
}

export function buildSimplePdf(lines: PdfLine[]): Buffer {
  const body = buildContentStream(lines);
  const chunks: Buffer[] = [];
  const offsets: number[] = [];
  let position = 0;

  function push(text: string) {
    const buffer = Buffer.from(text, "latin1");
    chunks.push(buffer);
    position += buffer.length;
  }

  push("%PDF-1.4\n");
  offsets.push(0);
  offsets.push(position);
  push("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n");
  offsets.push(position);
  push("2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n");
  offsets.push(position);
  push("3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >> endobj\n");
  offsets.push(position);
  push("4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n");
  offsets.push(position);
  push("5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj\n");
  offsets.push(position);
  const stream = `6 0 obj << /Length ${Buffer.byteLength(body, "latin1")} >> stream\n${body}\nendstream endobj\n`;
  push(stream);

  const xrefStart = position;
  push(`xref\n0 7\n0000000000 65535 f \n`);
  for (let i = 1; i <= 6; i++) {
    const offset = offsets[i] ?? 0;
    push(`${offset.toString().padStart(10, "0")} 00000 n \n`);
  }
  push(`trailer << /Size 7 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  return Buffer.concat(chunks);
}
