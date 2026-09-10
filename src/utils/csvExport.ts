export const downloadCSV = (data: Record<string, unknown>[], filename: string) => {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map((item) => Object.values(item).map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','));
  const csvContent = `data:text/csv;charset=utf-8,${[headers, ...rows].join('\n')}`;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
