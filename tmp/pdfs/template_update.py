from reportlab.pdfgen import canvas
from pypdf import PdfReader, PdfWriter
from pathlib import Path

src_pdf = Path('/Users/jesusvilla/Downloads/608640160-Factura-964-suzuki-ertiga-2020.pdf')
out_pdf = Path('/Users/jesusvilla/Desktop/Sdmx-pagina-principal/output/pdf/608640160-Factura-964-suzuki-ertiga-2020-updated.pdf')

reader = PdfReader(str(src_pdf))
page = reader.pages[0]

overlay_path = out_pdf.with_suffix('.overlay.pdf')
c = canvas.Canvas(str(overlay_path), pagesize=(612, 792))

# Whiteout areas to replace.
c.setFillColorRGB(1, 1, 1)
# Top-left issuer area
c.rect(165, 640, 235, 120, fill=1, stroke=0)
# Top-right receptor/folio area
c.rect(410, 640, 170, 120, fill=1, stroke=0)
# Invoice header row below issuer/receptor
c.rect(40, 520, 540, 95, fill=1, stroke=0)
# Middle concept area
c.rect(150, 350, 430, 190, fill=1, stroke=0)
# Monetary / totals area
c.rect(90, 160, 470, 145, fill=1, stroke=0)
# Footer labels area
c.rect(35, 45, 540, 110, fill=1, stroke=0)

c.setFillColorRGB(0, 0, 0)

# Header
c.setFont('Helvetica', 14)
c.drawString(30, 735, 'FACTURA')
c.setFont('Helvetica', 12)
c.drawString(495, 735, 'FOLIO:')
c.drawString(565, 735, '7635')

# Logo not recreated.

# Issuer block
c.setFont('Helvetica', 11)
c.drawString(175, 723, 'Emisor:')
c.setFont('Helvetica', 12)
c.drawString(175, 705, 'AUTO SHOW LA SILLA DA DE CV.')
c.drawString(175, 688, 'ASS141202CY2')
c.setFont('Helvetica', 10.5)
c.drawString(175, 665, 'Lugar de Expedición: 66269 SAN PEDRO GARZA GARCIA, NUEVO LEON')
c.drawString(175, 648, 'RÉGIMEN GENERAL DE PERSONAS MORALES')
c.drawString(175, 631, 'Efecto del comprobante: I - Ingreso')

# Receptor block
c.setFont('Helvetica', 11)
c.drawString(410, 723, 'Receptor:')
c.setFont('Helvetica', 12)
c.drawString(410, 705, 'LUIS ANGEL ARAUJO JIMENEZ')
c.drawString(555, 705, 'AAJL931116006')
c.setFont('Helvetica', 10.5)
c.drawString(410, 665, 'ZUAZUA #3020 COLONIA CENTRO, CP: 87000, REYNOSA,')
c.drawString(410, 648, 'TAMAULIPAS, MEXICO.')
c.drawString(410, 631, 'Uso del CFDI: I03 - Equipo de transporte')

# Fiscal row
c.setFont('Helvetica', 11)
c.drawString(30, 617, 'Folio Fiscal:')
c.setFont('Helvetica', 10.5)
c.drawString(30, 600, 'C12A8811-BDDA-4848-B72D-BC0739FF6B65')
c.setFont('Helvetica', 11)
c.drawString(265, 617, 'Fecha / Hora de Emisión:')
c.setFont('Helvetica', 10.5)
c.drawString(265, 600, '27/07/2021 - 10:59:57')
c.setFont('Helvetica', 11)
c.drawString(420, 617, 'No. de Certificado Digital:')
c.setFont('Helvetica', 10.5)
c.drawString(420, 600, '00001000000505619881')

# Table header
c.setFont('Helvetica', 12)
c.drawString(32, 570, 'Clave')
c.drawString(32, 553, 'Producto')
c.drawString(86, 553, 'Cantidad')
c.drawString(150, 570, 'Clave')
c.drawString(150, 553, 'Unidad')
c.drawString(235, 553, 'Concepto( s)')
c.drawString(470, 570, 'Precio')
c.drawString(470, 553, 'Unitario')
c.drawString(560, 553, 'Importe')

# Item row
c.setFont('Helvetica', 10.5)
c.drawString(32, 515, '80141615')
c.drawString(92, 515, '1')
c.drawString(150, 515, 'H87 -')
c.drawString(150, 498, 'Pieza')
c.drawString(235, 515, 'NUEVO')

# Concept details - keep spread and readable
x = 235
y = 476
for line in [
    'MARCA: SUZUKI LINEA: ERTIGA MODELO: 2022 COLOR ROJO :',
    'ROJO',
    'TIPO SUV',
    'VERSION: 5 PUERTAS, 5 PASAJEROS, TRANSMISION AUTOMATICA.',
    'COMBUSTIBLE: GASOLINA',
    'CILINDROS: 4, 1.5 LTS.',
    'CLAVE VEHICULAR: 0571203',
    'NO. DE MOTOR: K15BT132886',
    'NO. DE SERIE: MHYNC2253NJ109203',
    'No Identificación: 1',
]:
    c.drawString(x, y, line)
    y -= 17

c.drawString(235, 316, 'Traslados:')
c.drawString(235, 300, 'IVA: 002, Base: $456,900.00, Tasa: 0.160000, Importe: $63,879.00')
c.drawString(32, 300, 'Moneda: MXN - Peso Mexicano')

# Amounts
c.setFont('Helvetica', 11)
c.drawString(470, 246, 'Subtotal:')
c.drawString(565, 246, '$393,879.31')
c.drawString(470, 215, 'IVA 16 %:')
c.drawString(565, 215, '$63,020.69')

c.setFont('Helvetica', 12)
c.drawString(175, 190, 'CUATROCIENTOS CINCUENTA Y SEIS MIL NOVECIENTOS PESOS M.N.')
c.drawString(360, 175, '00/100 MXN')

c.setFont('Helvetica', 12)
c.drawString(470, 182, 'Total:')
c.drawString(545, 182, '$456,900.00')

# Payment terms
c.setFont('Helvetica', 11)
c.drawString(35, 125, 'Forma de Pago: 99 - TRANSFERENCIA ELECTRONICA')
c.drawString(180, 125, 'Método de Pago: PPD - PAGO EN UNA SOLA EXHIBICION')
c.drawString(420, 125, 'Banco:')
c.drawString(470, 125, 'Cuenta:')
c.drawString(35, 110, 'Condiciones de Pago:')
c.drawString(35, 95, 'CONTADO')

# Footer certification text areas
c.setFont('Helvetica', 7.5)
c.drawString(150, 60, 'Cadena Original del complemento de Certificación Digital del SAT')
c.drawString(150, 48, '||1.1|5469e766-1502-4cac-a7de-0b0aeb87ac8f|2021-04-30T18:41:17|LSO1306189R5|AN48duVrylgXeknfa4ZU4AknRe4NIlVh16zpq7L4P/nRYgqZ6')
c.drawString(150, 37, 'VLS0k4azRvn2iqfZaDCm87Dhwjq3yja/vvkmEPSdwFTjGBi6s7Nml3/zkgpBoYgMy2TMtV73gl/P/8XgXZWVDm73KIPD9zvsPasplTsf8/WmilzC5wTr')
c.drawString(150, 26, 'ez6LyGUPfyxpNMJ/ZaW6vpqMW9Xz9GAx4n6+ORUkJJGzqYH9O7NXItTYpRePsia3JP2x8kvaZYEwBVAy1ie57dri1tcjHbiFqZwZ4NlcSV5xBU2w9SE')
c.drawString(150, 15, 'dHLdISrAkZ8Jgn4N8HR1QfuQMlW5mkY4euSqViwIDNItkFfvLLn7ER9ubkZfmQ==|00001000000408254801||')

c.drawString(150, 1, 'Sello Digital del CFDI AN48duVrylgXeknfa4ZU4AknRe4NIlVh16zpq7L4P/nRYgqZ6VLS0k4azRvn2iqfZaDCm87Dhwjq3yja/vvkmEPSdwFTjGBi6s7Nml3/zkgpBoYgMy2')

c.save()

overlay_reader = PdfReader(str(overlay_path))
page.merge_page(overlay_reader.pages[0])
writer = PdfWriter()
writer.add_page(page)
with open(out_pdf, 'wb') as f:
    writer.write(f)
print(out_pdf)
