declare module "pdfkit" {
  import type { EventEmitter } from "node:events";

  export default class PDFDocument extends EventEmitter {
    constructor(options?: Record<string, unknown>);
    fontSize(size: number): this;
    text(text: string, options?: Record<string, unknown>): this;
    moveDown(lines?: number): this;
    fillColor(color: string): this;
    addPage(options?: Record<string, unknown>): this;
    image(src: Buffer | string, options?: Record<string, unknown>): this;
    end(): void;
  }
}
