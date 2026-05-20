from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib.pagesizes import letter
from pypdf import PdfReader, PdfWriter
from pathlib import Path

src_pdf = Path('/Users/jesusvilla/Downloads/608640160-Factura-964-suzuki-ertiga-2020 (1) (5).pdf')
qr_img = Path('/Users/jesusvilla/Downloads/WhatsApp Image 2026-05-18 at 15.20.00.jpeg')
out_pdf = Path('/Users/jesusvilla/Desktop/Sdmx-pagina-principal/output/pdf/608640160-Factura-964-suzuki-ertiga-2020-qr-replaced.pdf')
out_pdf.parent.mkdir(parents=True, exist_ok=True)

def main():
    reader = PdfReader(str(src_pdf))
    page = reader.pages[0]

    overlay_path = out_pdf.with_suffix('.overlay.pdf')
    c = canvas.Canvas(str(overlay_path), pagesize=letter)
    qr = ImageReader(str(qr_img))
    # Position and size tuned to the visible QR block in the lower-left area.
    c.drawImage(qr, 42, 65, width=172, height=172, mask='auto', preserveAspectRatio=True, anchor='sw')
    c.save()

    overlay_reader = PdfReader(str(overlay_path))
    page.merge_page(overlay_reader.pages[0])
    writer = PdfWriter()
    writer.add_page(page)
    with open(out_pdf, 'wb') as f:
        writer.write(f)

    print(out_pdf)

if __name__ == '__main__':
    main()
