import { useTenantTheme } from '../hooks/useTenantTheme';
import { useWhatsAppTemplate } from '../hooks/useWhatsAppTemplate';

export interface WhatsAppButtonProps {
  phone: string;
  order: Record<string, unknown>;
  className?: string;
}

export function WhatsAppButton({ phone, order, className = '' }: WhatsAppButtonProps) {
  const theme = useTenantTheme();
  const message = useWhatsAppTemplate(order as any);
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return {
    href,
    className,
    style: { backgroundColor: theme.primary },
    ariaLabel: `Enviar WhatsApp a ${(order.clientName as string) ?? ''}`,
  };
}
