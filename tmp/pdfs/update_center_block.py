from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from pypdf import PdfReader, PdfWriter
from pathlib import Path

src_pdf = Path('/Users/jesusvilla/Desktop/Sdmx-pagina-principal/output/pdf/608640160-Factura-964-suzuki-ertiga-2020-qr-replaced.pdf')
out_pdf = Path('/Users/jesusvilla/Desktop/Sdmx-pagina-principal/output/pdf/608640160-Factura-964-suzuki-ertiga-2020-final.pdf')

reader = PdfReader(str(src_pdf))
page = reader.pages[0]

overlay_path = out_pdf.with_suffix('.overlay.pdf')
c = canvas.Canvas(str(overlay_path), pagesize=letter)

# Wipe the center while keeping the lower footer/QR section intact.
c.setFillColorRGB(1, 1, 1)
c.rect(38, 388, 536, 282, fill=1, stroke=0)

c.setFillColorRGB(0, 0, 0)

# Left column: table labels + product line.
left = c.beginText(52, 645)
left.setFont('Helvetica', 8.5)
left.setLeading(10)
for line in [
    'Clave',
    'Producto  Cantidad',
    'Clave',
    'Unidad',
    'Precio',
    'Unitario',
    '',
    '80141615    1    H87 -',
    'Pieza',
    'NUEVO',
    '',
    'No Identificación: 1',
]:
    left.textLine(line)
c.drawText(left)

# Middle/right: concept and vehicle details in separated blocks.
mid = c.beginText(150, 645)
mid.setFont('Helvetica', 8.5)
mid.setLeading(10)
for line in [
    'Concepto( s)',
    '',
    'MARCA: SUZUKI LINEA: ERTIGA MODELO: 2022 COLO',
    'ROJO :',
    'R  O  J  O',
    'TIPO SUV',
    'VERSION: 5 PUERTAS, 5 PASAJEROS,',
    'TRANSMISION AUTOMATICA.',
    'COMBUSTIBLE: GASOLINA',
    'CILINDROS: 4, 1.5 LTS.',
    'CLAVE VEHICULAR: 0571203',
    'NO. DE MOTOR: K15BT132886',
    'NO. DE SERIE: MHYNC2253NJ109203',
    'Traslados:',
    'IVA: 002, Base: $456,900.00, Tasa: 0.160000, Importe: $63,879.00',
]:
    mid.textLine(line)
c.drawText(mid)

# Right side: monetary amounts.
right = c.beginText(390, 560)
right.setFont('Helvetica', 8.5)
right.setLeading(10)
for line in [
    'Importe',
    '',
    '$456,900.00    $209,474',
]:
    right.textLine(line)
c.drawText(right)

c.save()

overlay_reader = PdfReader(str(overlay_path))
page.merge_page(overlay_reader.pages[0])
writer = PdfWriter()
writer.add_page(page)
with open(out_pdf, 'wb') as f:
    writer.write(f)
print(out_pdf)
