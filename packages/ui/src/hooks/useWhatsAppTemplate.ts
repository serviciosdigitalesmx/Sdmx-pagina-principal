export function useWhatsAppTemplate(order: {
  folio?: string;
  clientName?: string;
  summary?: string;
  locale?: string;
}) {
  const locale = order.locale ?? 'es';
  const labels = {
    es: {
      greeting: 'Hola',
      order: 'orden',
      details: 'Detalles',
      closing: 'Gracias',
    },
    en: {
      greeting: 'Hello',
      order: 'order',
      details: 'Details',
      closing: 'Thanks',
    },
  }[locale === 'en' ? 'en' : 'es'];

  return [
    `${labels.greeting} ${order.clientName ?? ''},`,
    '',
    `Le compartimos su ${labels.order} ${order.folio ?? ''}.`,
    `${labels.details}: ${order.summary ?? ''}`,
    '',
    labels.closing + '.',
  ].join('\n');
}
