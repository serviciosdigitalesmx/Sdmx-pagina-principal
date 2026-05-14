import { usePdfExport } from '../hooks/usePdfExport';
import { useTenantTheme } from '../hooks/useTenantTheme';

export interface PdfExportButtonProps {
  data: unknown;
  filename?: string;
  className?: string;
}

export function PdfExportButton({
  data,
  filename = 'document',
  className = '',
}: PdfExportButtonProps) {
  const { exportPdf } = usePdfExport(data, filename);
  const theme = useTenantTheme();

  return {
    onClick: exportPdf,
    className,
    style: { backgroundColor: theme.accent },
    ariaLabel: `Descargar PDF de ${filename}`,
  };
}
