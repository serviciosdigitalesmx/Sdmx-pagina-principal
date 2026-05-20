from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from pypdf import PdfReader, PdfWriter
from pathlib import Path

src_pdf = Path('/Users/jesusvilla/Downloads/608640160-Factura-964-suzuki-ertiga-2020.pdf')
qr_img = Path('/Users/jesusvilla/Downloads/WhatsApp Image 2026-05-18 at 15.20.00.jpeg')
out_pdf = Path('/Users/jesusvilla/Desktop/Sdmx-pagina-principal/output/pdf/608640160-Factura-964-suzuki-ertiga-2020-clean.pdf')

reader = PdfReader(str(src_pdf))
page = reader.pages[0]

overlay_path = out_pdf.with_suffix('.overlay.pdf')
c = canvas.Canvas(str(overlay_path), pagesize=(612, 792))

# Clear the original text areas but keep the page structure.
c.setFillColorRGB(1, 1, 1)
for rect in [
    (160, 637, 245, 125),  # issuer block
    (410, 637, 170, 125),  # receptor block
    (28, 548, 560, 82),    # header row + fiscal row
    (28, 405, 560, 168),   # item/concept area
    (28, 155, 560, 130),   # totals / payment area
    (28, 38, 560, 112),    # footer / cert text area
]:
    c.rect(*rect, fill=1, stroke=0)

# Reinsert QR only in the footer area and keep it on the left.
qr = ImageReader(str(qr_img))
c.drawImage(qr, 30, 84, width=128, height=128, mask='auto', preserveAspectRatio=True, anchor='sw')

c.setFillColorRGB(0, 0, 0)

# Header
c.setFont('Helvetica', 14)
c.drawString(30, 735, 'FACTURA')
c.setFont('Helvetica', 11)
c.drawString(500, 735, 'FOLIO:')
c.drawString(565, 735, '7635')

# Left logo placeholder intentionally left blank to preserve the look.

# Issuer block
c.setFont('Helvetica', 11)
c.drawString(175, 722, 'Emisor:')
c.setFont('Helvetica', 12)
c.drawString(175, 704, 'AUTO SHOW LA SILLA DA DE CV.')
c.drawString(175, 687, 'ASS141202CY2')
c.setFont('Helvetica', 10.3)
c.drawString(175, 665, 'Lugar de Expedición: 66269 SAN PEDRO GARZA GARCIA, NUEVO LEON')
c.drawString(175, 648, 'RÉGIMEN GENERAL DE PERSONAS MORALES')
c.drawString(175, 631, 'Efecto del comprobante: I - Ingreso')

# Receptor block
c.setFont('Helvetica', 11)
c.drawString(410, 722, 'Receptor:')
c.setFont('Helvetica', 12)
c.drawString(410, 704, 'LUIS ANGEL ARAUJO JIMENEZ')
c.drawString(555, 704, 'AAJL931116006')
c.setFont('Helvetica', 10.3)
c.drawString(410, 665, 'ZUAZUA #3020 COLONIA CENTRO, CP: 87000, REYNOSA,')
c.drawString(410, 648, 'TAMAULIPAS, MEXICO.')
c.drawString(410, 631, 'Uso del CFDI: I03 - Equipo de transporte')

# Fiscal row
c.setFont('Helvetica', 11)
c.drawString(30, 616, 'Folio Fiscal:')
c.setFont('Helvetica', 10.3)
c.drawString(30, 599, 'C12A8811-BDDA-4848-B72D-BC0739FF6B65')
c.setFont('Helvetica', 11)
c.drawString(265, 616, 'Fecha / Hora de Emisión:')
c.setFont('Helvetica', 10.3)
c.drawString(265, 599, '27/07/2021 - 10:59:57')
c.setFont('Helvetica', 11)
c.drawString(420, 616, 'No. de Certificado Digital:')
c.setFont('Helvetica', 10.3)
c.drawString(420, 599, '00001000000505619881')

# Table headers aligned into two visual columns
c.setFont('Helvetica', 11.5)
c.drawString(30, 570, 'Clave')
c.drawString(30, 553, 'Producto')
c.drawString(90, 553, 'Cantidad')
c.drawString(145, 570, 'Clave')
c.drawString(145, 553, 'Unidad')
c.drawString(225, 553, 'Concepto(s)')
c.drawString(468, 570, 'Precio')
c.drawString(468, 553, 'Unitario')
c.drawString(552, 553, 'Importe')

# Item line
c.setFont('Helvetica', 10.3)
c.drawString(30, 515, '80141615')
c.drawString(96, 515, '1')
c.drawString(145, 515, 'H87 -')
c.drawString(145, 498, 'Pieza')
c.drawString(225, 515, 'NUEVO')

# Concept block with controlled vertical spacing and shorter lines.
y = 478
for line in [
    'MARCA: SUZUKI LINEA: ERTIGA MODELO: 2022 COLO',
    'ROJO :',
    'R O J O',
    'TIPO SUV',
    'VERSION: 5 PUERTAS, 5 PASAJEROS,',
    'TRANSMISION AUTOMATICA.',
    'COMBUSTIBLE: GASOLINA',
    'CILINDROS: 4, 1.5 LTS.',
    'CLAVE VEHICULAR: 0571203',
    'NO. DE MOTOR: K15BT132886',
    'NO. DE SERIE: MHYNC2253NJ109203',
    'No Identificación: 1',
    'Traslados:',
    'IVA: 002, Base: $456,900.00, Tasa: 0.160000, Importe: $63,879.00',
]:
    c.drawString(225, y, line)
    y -= 16

# Amounts and totals
c.setFont('Helvetica', 10.5)
c.drawString(30, 295, 'Moneda: MXN - Peso Mexicano')
c.drawString(175, 295, 'CUATROCIENTOS CINCUENTA Y SEIS MIL NOVECIENTOS PESOS M.N.')
c.drawString(390, 279, '00/100 MXN')

c.setFont('Helvetica', 11)
c.drawString(470, 248, 'Subtotal:')
c.drawString(556, 248, '$393,879.31')
c.drawString(470, 217, 'IVA 16 %:')
c.drawString(556, 217, '$63,020.69')

c.setFont('Helvetica', 12)
c.drawString(175, 182, 'CUATROCIENTOS CINCUENTA Y SEIS MIL NOVECIENTOS PESOS M.N.')
c.drawString(390, 167, '00/100 MXN')
c.drawString(470, 182, 'Total:')
c.drawString(545, 182, '$456,900.00')

# Payment fields
c.setFont('Helvetica', 10.5)
c.drawString(35, 125, 'Forma de Pago: 99 - TRANSFERENCIA ELECTRONICA')
c.drawString(200, 125, 'Método de Pago: PPD - PAGO EN UNA SOLA EXHIBICION')
c.drawString(420, 125, 'Banco:')
c.drawString(470, 125, 'Cuenta:')
c.drawString(35, 110, 'Condiciones de Pago:')
c.drawString(35, 95, 'CONTADO')

# Footer texts
c.setFont('Helvetica', 7.5)
c.drawString(170, 84, 'Cadena Original del complemento de Certificación Digital del SAT')
chain = '||1.1|5469e766-1502-4cac-a7de-0b0aeb87ac8f|2021-04-30T18:41:17|LSO1306189R5|AN48duVrylgXeknfa4ZU4AknRe4NIlVh16zpq7L4P/nRYgqZ6VLS0k4azRvn2iqfZaDCm87Dhwjq3yja/vvkmEPSdwFTjGBi6s7Nml3/zkgpBoYgMy2TMtV73gl/P/8XgXZWVDm73KIPD9zvsPasplTsf8/WmilzC5wTrez6LyGUPfyxpNMJ/ZaW6vpqMW9Xz9GAx4n6+ORUkJJGzqYH9O7NXItTYpRePsia3JP2x8kvaZYEwBVAy1ie57dri1tcjHbiFqZwZ4NlcSV5xBU2w9SEdHLdISrAkZ8Jgn4N8HR1QfuQMlW5mkY4euSqViwIDNItkFfvLLn7ER9ubkZfmQ==|00001000000408254801||'
for i, start in enumerate(range(72, len(chain), 130)):
    c.drawString(170, 72 - i * 11, chain[start:start+130])

# Footer meta labels
c.setFont('Helvetica', 8.5)
c.drawString(30, 30, 'Fecha / Hora de Certificación: 27/07/2021 - 10:59:57')
c.drawString(175, 30, 'Número de Serie Certificado del SAT: 00001000000408254801')
c.drawString(345, 30, 'RFC del PAC: LSO1306189R5')
c.drawString(500, 30, 'Número autorización PAC:')

c.save()

overlay_reader = PdfReader(str(overlay_path))
page.merge_page(overlay_reader.pages[0])
writer = PdfWriter()
writer.add_page(page)
with open(out_pdf, 'wb') as f:
    writer.write(f)
print(out_pdf)
