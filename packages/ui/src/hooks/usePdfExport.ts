import { useCallback, useState } from 'react';

export type PdfExportInput = string | Blob | BlobPart[] | Record<string, unknown>;

export function usePdfExport(data: PdfExportInput, filename: string, mimeType = 'application/pdf') {
  const [loading, setLoading] = useState(false);

  const exportPdf = useCallback(async () => {
    setLoading(true);

    try {
      const blob =
        data instanceof Blob
          ? data
          : new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], { type: mimeType });

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${filename}.pdf`;
      anchor.rel = 'noopener noreferrer';
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }, [data, filename, mimeType]);

  return { exportPdf, loading };
}
