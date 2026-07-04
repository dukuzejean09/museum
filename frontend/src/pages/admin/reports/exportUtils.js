// Export utilities for reports - PDF, CSV, Excel

export const exportToCSV = (data, columns, filename) => {
  if (!data || data.length === 0) return;

  const header = columns.map((col) => col.label).join(',');
  const rows = data.map((row) =>
    columns
      .map((col) => {
        let val = col.accessor ? col.accessor(row) : row[col.key] || '';
        // Escape commas and quotes in CSV
        val = String(val).replace(/"/g, '""');
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          val = `"${val}"`;
        }
        return val;
      })
      .join(',')
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
};

export const exportToExcel = (data, columns, filename) => {
  if (!data || data.length === 0) return;

  // Generate XML-based Excel file (compatible without dependencies)
  const header = columns.map((col) => `<th>${escapeXml(col.label)}</th>`).join('');
  const rows = data
    .map(
      (row) =>
        '<tr>' +
        columns
          .map((col) => {
            const val = col.accessor ? col.accessor(row) : row[col.key] || '';
            return `<td>${escapeXml(String(val))}</td>`;
          })
          .join('') +
        '</tr>'
    )
    .join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head><meta charset="UTF-8">
    <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
    <x:Name>Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
    </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
    <style>table{border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 10px;text-align:left}th{background:#f3f4f6;font-weight:bold}</style>
    </head><body><table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></body></html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  downloadBlob(blob, `${filename}.xls`);
};

export const exportToPDF = (title, data, columns, summary = null) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const header = columns.map((col) => `<th>${escapeHtml(col.label)}</th>`).join('');
  const rows = data
    .map(
      (row) =>
        '<tr>' +
        columns
          .map((col) => {
            const val = col.accessor ? col.accessor(row) : row[col.key] || '';
            return `<td>${escapeHtml(String(val))}</td>`;
          })
          .join('') +
        '</tr>'
    )
    .join('');

  const summaryHtml = summary
    ? `<div class="summary">${Object.entries(summary)
        .map(([k, v]) => `<div class="summary-card"><strong>${formatLabel(k)}</strong><span>${v}</span></div>`)
        .join('')}</div>`
    : '';

  printWindow.document.write(`
    <!DOCTYPE html><html><head><title>${title}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:40px;color:#1e293b}
      h1{font-size:24px;margin-bottom:8px;color:#0f172a}
      .meta{color:#64748b;font-size:12px;margin-bottom:24px}
      .summary{display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap}
      .summary-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;min-width:140px}
      .summary-card strong{display:block;font-size:11px;text-transform:uppercase;color:#64748b;margin-bottom:4px}
      .summary-card span{font-size:20px;font-weight:700;color:#0f172a}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th{background:#f1f5f9;border:1px solid #e2e8f0;padding:8px 10px;text-align:left;font-weight:600;white-space:nowrap}
      td{border:1px solid #e2e8f0;padding:6px 10px}
      tr:nth-child(even){background:#f8fafc}
      @media print{body{padding:20px}.summary-card{break-inside:avoid}}
    </style></head><body>
    <h1>${escapeHtml(title)}</h1>
    <p class="meta">Generated on ${new Date().toLocaleString()} | Kandt House Museum of Natural History</p>
    ${summaryHtml}
    <table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table>
    <script>window.onload=function(){window.print()}</script>
    </body></html>
  `);
  printWindow.document.close();
};

export const printReport = (title, contentElementId) => {
  const content = document.getElementById(contentElementId);
  if (!content) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html><html><head><title>${title}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:30px;color:#1e293b}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th{background:#f1f5f9;border:1px solid #e2e8f0;padding:8px;text-align:left;font-weight:600}
      td{border:1px solid #e2e8f0;padding:6px 8px}
      tr:nth-child(even){background:#f8fafc}
      .chart-placeholder{text-align:center;padding:20px;color:#94a3b8;font-style:italic}
    </style></head><body>
    ${content.innerHTML}
    <script>window.onload=function(){window.print()}</script>
    </body></html>
  `);
  printWindow.document.close();
};

// Helpers
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatLabel(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}
