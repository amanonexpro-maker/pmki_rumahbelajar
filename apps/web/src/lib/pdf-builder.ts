import { deflateSync } from "node:zlib";

/**
 * Minimal, zero-dependency PDF 1.4 builder for A4 summary documents.
 * Uses standard Type1 fonts (Helvetica & Helvetica-Bold) with WinAnsiEncoding
 * and FlateDecode stream compression for lightweight output.
 */

const PAGE_WIDTH = 595.28; // A4 pt
const PAGE_HEIGHT = 841.89; // A4 pt
const MARGIN_X = 48;
const MARGIN_TOP = 52;
const MARGIN_BOTTOM = 52;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

export interface PdfBlockOptions {
  fontSize?: number;
  lineHeight?: number;
  bold?: boolean;
  muted?: boolean;
  gapAfter?: number;
}

/**
 * Normalizes text to safe WinAnsi / ASCII characters and escapes PDF string literals.
 */
export function sanitizePdfText(input: string): string {
  const normalized = input
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014\u00B7]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapText(
  text: string,
  maxWidthPt: number,
  fontSize: number,
  bold: boolean
): string[] {
  const clean = text.replace(/\r\n/g, "\n");
  const paragraphs = clean.split("\n");
  const avgCharWidth = fontSize * (bold ? 0.56 : 0.51);
  const maxChars = Math.max(16, Math.floor(maxWidthPt / avgCharWidth));
  const lines: string[] = [];

  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let current = "";
    for (const word of words) {
      if (!current) {
        if (word.length > maxChars) {
          for (let i = 0; i < word.length; i += maxChars) {
            lines.push(word.slice(i, i + maxChars));
          }
        } else {
          current = word;
        }
        continue;
      }

      if (current.length + 1 + word.length <= maxChars) {
        current = `${current} ${word}`;
      } else {
        lines.push(current);
        if (word.length > maxChars) {
          for (let i = 0; i < word.length; i += maxChars) {
            const slice = word.slice(i, i + maxChars);
            if (i + maxChars >= word.length) {
              current = slice;
            } else {
              lines.push(slice);
            }
          }
        } else {
          current = word;
        }
      }
    }
    if (current) lines.push(current);
  }

  return lines;
}

export class SimplePdfBuilder {
  private pages: string[][] = [[]];
  private y = PAGE_HEIGHT - MARGIN_TOP;

  private get currentPage(): string[] {
    return this.pages[this.pages.length - 1];
  }

  private ensureSpace(neededHeight: number) {
    if (this.y - neededHeight < MARGIN_BOTTOM) {
      this.pages.push([]);
      this.y = PAGE_HEIGHT - MARGIN_TOP;
    }
  }

  addText(text: string, options: PdfBlockOptions = {}) {
    const fontSize = options.fontSize ?? 10;
    const lineHeight = options.lineHeight ?? Math.round(fontSize * 1.45);
    const bold = options.bold ?? false;
    const muted = options.muted ?? false;
    const gapAfter = options.gapAfter ?? 4;

    const lines = wrapText(text, CONTENT_WIDTH, fontSize, bold);
    const fontKey = bold ? "/F2" : "/F1";
    const color = muted ? ".42 .45 .43" : ".11 .14 .12";

    for (const line of lines) {
      this.ensureSpace(lineHeight);
      if (line.length > 0) {
        const escaped = sanitizePdfText(line);
        this.currentPage.push(
          `BT ${fontKey} ${fontSize} Tf ${color} rg 1 0 0 1 ${MARGIN_X} ${this.y.toFixed(1)} Tm (${escaped}) Tj ET`
        );
      }
      this.y -= lineHeight;
    }

    this.y -= gapAfter;
  }

  addDivider(gapAfter = 10) {
    this.ensureSpace(12);
    const lineY = this.y - 2;
    this.currentPage.push(
      `.84 .86 .85 RG .6 w ${MARGIN_X} ${lineY.toFixed(1)} m ${(PAGE_WIDTH - MARGIN_X).toFixed(1)} ${lineY.toFixed(1)} l S`
    );
    this.y -= gapAfter + 4;
  }

  addSpacer(height = 8) {
    this.y -= height;
  }

  build(): Uint8Array {
    const totalPages = this.pages.length;
    const encoder = new TextEncoder();
    const objChunks: Uint8Array[] = [];

    const pageObjIds: number[] = [];
    const contentObjIds: number[] = [];

    let nextId = 5;
    for (let i = 0; i < totalPages; i++) {
      pageObjIds.push(nextId++);
      contentObjIds.push(nextId++);
    }

    objChunks.push(
      encoder.encode("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
    );
    objChunks.push(
      encoder.encode(
        `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${totalPages} >>\nendobj\n`
      )
    );
    objChunks.push(
      encoder.encode(
        "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n"
      )
    );
    objChunks.push(
      encoder.encode(
        "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n"
      )
    );

    for (let i = 0; i < totalPages; i++) {
      const pageId = pageObjIds[i];
      const contentId = contentObjIds[i];

      const footerText = sanitizePdfText(
        `Rumah Belajar PMKI - Halaman ${i + 1} dari ${totalPages}`
      );
      const footerCmd = `BT /F1 8 Tf .48 .5 .49 rg 1 0 0 1 ${MARGIN_X} 28 Tm (${footerText}) Tj ET`;
      const streamBody = [...this.pages[i], footerCmd].join("\n");
      const compressed = deflateSync(encoder.encode(streamBody), { level: 9 });

      objChunks.push(
        encoder.encode(
          `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`
        )
      );

      const streamHead = encoder.encode(
        `${contentId} 0 obj\n<< /Length ${compressed.length} /Filter /FlateDecode >>\nstream\n`
      );
      const streamTail = encoder.encode("\nendstream\nendobj\n");
      const combined = new Uint8Array(
        streamHead.length + compressed.length + streamTail.length
      );
      combined.set(streamHead, 0);
      combined.set(compressed, streamHead.length);
      combined.set(streamTail, streamHead.length + compressed.length);
      objChunks.push(combined);
    }

    const header = encoder.encode("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
    let offset = header.length;
    const offsets: number[] = [0];

    for (const chunk of objChunks) {
      offsets.push(offset);
      offset += chunk.length;
    }

    const xrefOffset = offset;
    const xrefStr = [
      `xref\n0 ${objChunks.length + 1}\n`,
      "0000000000 65535 f \n",
      ...offsets
        .slice(1)
        .map((off) => `${String(off).padStart(10, "0")} 00000 n \n`),
      `trailer\n<< /Size ${objChunks.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
    ].join("");
    const xrefBytes = encoder.encode(xrefStr);

    const totalBytes = offset + xrefBytes.length;
    const output = new Uint8Array(totalBytes);
    let pos = 0;
    output.set(header, pos);
    pos += header.length;
    for (const chunk of objChunks) {
      output.set(chunk, pos);
      pos += chunk.length;
    }
    output.set(xrefBytes, pos);

    return output;
  }
}

export function createSimplePdf(): SimplePdfBuilder {
  return new SimplePdfBuilder();
}
