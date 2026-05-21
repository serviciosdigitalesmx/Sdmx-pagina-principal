import { createElement } from 'react';
import { usePdfExport, type PdfExportInput } from '../hooks/usePdfExport';
import { useTenantTheme } from '../hooks/useTenantTheme';

export interface PdfExportButtonProps {
  data: PdfExportInput;
  filename?: string;
  className?: string;
}

export function PdfExportButton({
  data,
  filename = 'document',
  className = '',
}: PdfExportButtonProps) {
  const { exportPdf, loading } = usePdfExport(data, filename);
  const theme = useTenantTheme();

  return createElement(
    'button',
    {
      type: 'button',
      onClick: exportPdf,
      className,
      style: { backgroundColor: theme.accent },
      'aria-label': `Descargar PDF de ${filename}`,
      disabled: loading,
    },
    loading ? 'Generando...' : 'Descargar PDF'
  );
}
