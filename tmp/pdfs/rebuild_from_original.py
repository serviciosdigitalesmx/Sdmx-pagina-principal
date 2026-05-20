from reportlab.pdfgen import canvas
from pypdf import PdfReader, PdfWriter
from pathlib import Path

src_pdf = Path('/Users/jesusvilla/Downloads/608640160-Factura-964-suzuki-ertiga-2020 (1) (5).pdf')
out_pdf = Path('/Users/jesusvilla/Desktop/Sdmx-pagina-principal/output/pdf/608640160-Factura-964-suzuki-ertiga-2020-from-original.pdf')
reader = PdfReader(str(src_pdf))
page = reader.pages[0]

overlay_path = out_pdf.with_suffix('.overlay.pdf')
c = canvas.Canvas(str(overlay_path), pagesize=(612, 792))

# White out only the text/data blocks that need replacement.
c.setFillColorRGB(1, 1, 1)
for rect in [
    (160, 632, 250, 110),  # issuer section
    (408, 632, 190, 110),  # receptor section
    (26, 588, 560, 34),    # folio fiscal / dates row
    (26, 402, 560, 170),   # table / concept area
    (26, 155, 560, 135),   # amounts + payment area
    (150, 28, 430, 95),    # footer certification text area
]:
    c.rect(*rect, fill=1, stroke=0)

c.setFillColorRGB(0, 0, 0)

# Header
c.setFont('Helvetica', 12)
c.drawString(498, 740, 'FOLIO:')
c.drawString(570, 740, '7635')

# Issuer
c.setFont('Helvetica', 11)
c.drawString(172, 726, 'Emisor:')
c.setFont('Helvetica', 12)
c.drawString(172, 707, 'AUTO SHOW LA SILLA DA DE CV.')
c.drawString(172, 690, 'ASS141202CY2')
c.setFont('Helvetica', 10.2)
c.drawString(172, 668, 'Lugar de Expedición: 66269 SAN PEDRO GARZA GARCIA, NUEVO LEON')
c.drawString(172, 651, 'RÉGIMEN GENERAL DE PERSONAS MORALES')
c.drawString(172, 634, 'Efecto del comprobante: I - Ingreso')

# Receptor
c.setFont('Helvetica', 11)
c.drawString(409, 726, 'Receptor:')
c.setFont('Helvetica', 12)
c.drawString(409, 707, 'LUIS ANGEL ARAUJO JIMENEZ')
c.drawString(555, 707, 'AAJL931116006')
c.setFont('Helvetica', 10.2)
c.drawString(409, 668, 'ZUAZUA #3020 COLONIA CENTRO, CP: 87000, REYNOSA,')
c.drawString(409, 651, 'TAMAULIPAS, MEXICO.')
c.drawString(409, 634, 'Uso del CFDI: I03 - Equipo de transporte')

# Fiscal row
c.setFont('Helvetica', 10.8)
c.drawString(28, 606, 'Folio Fiscal:')
c.drawString(28, 590, 'C12A8811-BDDA-4848-B72D-BC0739FF6B65')
c.drawString(268, 606, 'Fecha / Hora de Emisión:')
c.drawString(268, 590, '27/07/2021 - 10:59:57')
c.drawString(417, 606, 'No. de Certificado Digital:')
c.drawString(417, 590, '00001000000505619881')

# Table headers
c.setFont('Helvetica', 11.5)
c.drawString(30, 560, 'Clave')
c.drawString(30, 542, 'Producto')
c.drawString(88, 542, 'Cantidad')
c.drawString(145, 560, 'Clave')
c.drawString(145, 542, 'Unidad')
c.drawString(225, 542, 'Concepto( s)')
c.drawString(470, 560, 'Precio')
c.drawString(470, 542, 'Unitario')
c.drawString(548, 542, 'Importe')

# Product row
c.setFont('Helvetica', 10.4)
c.drawString(30, 505, '80141615')
c.drawString(90, 505, '1')
c.drawString(145, 505, 'H87 -')
c.drawString(145, 488, 'Pieza')
c.drawString(225, 505, 'NUEVO')

# Concept details, spaced and left-aligned to avoid overlap.
y = 468
concept_lines = [
    'MARCA: SUZUKI LINEA: ERTIGA MODELO: 2022 COLO',
    'ROJO :',
    'R O J O',
    'TIPO SUV',
    'VERSION: 5 PUERTAS, 5 PASAJEROS, TRANSMISION AUTOMATICA.',
    'COMBUSTIBLE: GASOLINA',
    'CILINDROS: 4, 1.5 LTS.',
    'CLAVE VEHICULAR: 0571203',
    'NO. DE MOTOR: K15BT132886',
    'NO. DE SERIE: MHYNC2253NJ109203',
    'No Identificación: 1',
    'Traslados:',
    'IVA: 002, Base: $456,900.00, Tasa: 0.160000, Importe: $63,879.00',
]
for line in concept_lines:
    c.drawString(225, y, line)
    y -= 17

# Amounts / totals
c.setFont('Helvetica', 10.8)
c.drawString(28, 295, 'Moneda:')
c.drawString(28, 280, 'MXN - Peso')
c.drawString(28, 265, 'Mexicano')

c.drawString(160, 283, 'CUATROCIENTOS CINCUENTA Y SEIS MIL NOVECIENTOS PESOS M.N.')
c.drawString(390, 268, '00/100 MXN')

c.setFont('Helvetica', 11.2)
c.drawString(470, 248, 'Subtotal:')
c.drawString(556, 248, '$393,879.31')
c.drawString(470, 214, 'IVA 16 %:')
c.drawString(556, 214, '$63,020.69')
c.drawString(470, 180, 'Total:')
c.drawString(545, 180, '$456,900.00')

# Payment section
c.setFont('Helvetica', 10.5)
c.drawString(35, 122, 'Forma de Pago: 99 - TRANSFERENCIA ELECTRONICA')
c.drawString(205, 122, 'Método de Pago: PPD - PAGO EN UNA SOLA EXHIBICION')
c.drawString(425, 122, 'Banco:')
c.drawString(475, 122, 'Cuenta:')
c.drawString(35, 107, 'Condiciones de Pago:')
c.drawString(35, 92, 'CONTADO')

# Footer certification area
c.setFont('Helvetica', 7.8)
c.drawString(165, 78, 'Cadena Original del complemento de Certificación Digital del SAT')
chain = '||1.1|5469e766-1502-4cac-a7de-0b0aeb87ac8f|2021-04-30T18:41:17|LSO1306189R5|AN48duVrylgXeknfa4ZU4AknRe4NIlVh16zpq7L4P/nRYgqZ6VLS0k4azRvn2iqfZaDCm87Dhwjq3yja/vvkmEPSdwFTjGBi6s7Nml3/zkgpBoYgMy2TMtV73gl/P/8XgXZWVDm73KIPD9zvsPasplTsf8/WmilzC5wTrez6LyGUPfyxpNMJ/ZaW6vpqMW9Xz9GAx4n6+ORUkJJGzqYH9O7NXItTYpRePsia3JP2x8kvaZYEwBVAy1ie57dri1tcjHbiFqZwZ4NlcSV5xBU2w9SEdHLdISrAkZ8Jgn4N8HR1QfuQMlW5mkY4euSqViwIDNItkFfvLLn7ER9ubkZfmQ==|00001000000408254801||'
for i, start in enumerate(range(0, len(chain), 126)):
    c.drawString(165, 65 - i * 10, chain[start:start+126])

c.setFont('Helvetica', 8.6)
c.drawString(30, 30, 'Fecha / Hora de Certificación: 27/07/2021 - 10:59:57')
c.drawString(205, 30, 'Número de Serie Certificado del SAT: 00001000000408254801')
c.drawString(365, 30, 'RFC del PAC: LSO1306189R5')
c.drawString(500, 30, 'Número autorización PAC:')

c.save()

overlay = PdfReader(str(overlay_path))
page.merge_page(overlay.pages[0])
writer = PdfWriter()
writer.add_page(page)
with open(out_pdf, 'wb') as f:
    writer.write(f)
print(out_pdf)
