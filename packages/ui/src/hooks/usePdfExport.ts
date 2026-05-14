export function usePdfExport(data: unknown, filename: string) {
  let loading = false;

  const exportPdf = async () => {
    loading = true;
    try {
      const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      const blob = new Blob([content], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${filename}.pdf`;
      anchor.rel = 'noopener noreferrer';
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      loading = false;
    }
  };

  return { exportPdf, get loading() { return loading; } };
}
