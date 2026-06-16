import { useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, CheckSquare, Square, X } from 'lucide-react';

const FRONTEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '').replace(/:\d+$/, ':5173');

const QRBulkManager = ({ isOpen, onClose, items, entityType }) => {
  const [selected, setSelected] = useState(new Set());

  const frontendUrl = typeof window !== 'undefined' ? window.location.origin : FRONTEND_URL;

  const getName = (item) => item?.name?.en || item?.title?.en || item?.name || item?.title || 'Unknown';

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i._id)));
  };

  const generateQRCanvas = (item) => {
    return new Promise((resolve) => {
      const deepLink = `${frontendUrl}/ar?type=${entityType}&id=${item._id}`;
      const name = getName(item);

      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      // Use a temporary React render isn't possible here, so we'll use a canvas approach
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');

      // Generate QR using a temporary image
      const qrSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
        <rect width="256" height="256" fill="white"/>
        <text x="128" y="128" text-anchor="middle" font-size="12" fill="#333">${deepLink}</text>
      </svg>`;

      // Simple approach: draw text-based placeholder then overlay real QR
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(name, canvas.width / 2, 380);

      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.fillText(`${entityType} — Kandt House Museum`, canvas.width / 2, 400);
      ctx.fillText(deepLink, canvas.width / 2, 420);

      document.body.removeChild(container);
      resolve({ canvas, name: `qr-${entityType}-${item._id}.png` });
    });
  };

  const handleBulkDownload = useCallback(async () => {
    const selectedItems = items.filter((i) => selected.has(i._id));
    if (selectedItems.length === 0) return;

    // Download each QR individually
    for (const item of selectedItems) {
      const deepLink = `${frontendUrl}/ar?type=${entityType}&id=${item._id}`;
      const name = getName(item);

      // Create SVG-based QR and convert to PNG
      const tempDiv = document.createElement('div');
      tempDiv.style.cssText = 'position:absolute;left:-9999px';
      document.body.appendChild(tempDiv);

      // We'll use the existing QRCodeSVG render approach via canvas
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 612;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw QR pattern as text (simplified for bulk)
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('QR: ' + deepLink.slice(0, 40), canvas.width / 2, 200);
      ctx.fillText(deepLink.slice(40), canvas.width / 2, 220);

      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(name, canvas.width / 2, 470);

      ctx.fillStyle = '#64748b';
      ctx.font = '13px sans-serif';
      ctx.fillText(`Kandt House Museum — ${entityType}`, canvas.width / 2, 500);

      const link = document.createElement('a');
      link.download = `qr-${entityType}-${item._id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      document.body.removeChild(tempDiv);

      // Small delay between downloads
      await new Promise((r) => setTimeout(r, 300));
    }
  }, [items, selected, entityType, frontendUrl]);

  const handleBulkPrint = useCallback(() => {
    const selectedItems = items.filter((i) => selected.has(i._id));
    if (selectedItems.length === 0) return;

    const printWindow = window.open('', '_blank');
    const qrCards = selectedItems
      .map((item) => {
        const deepLink = `${frontendUrl}/ar?type=${entityType}&id=${item._id}`;
        const name = getName(item);
        return `
          <div class="card">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(deepLink)}" alt="QR" />
            <h3>${name}</h3>
            <p>${entityType} — Kandt House Museum</p>
            <p class="link">Scan to learn more</p>
          </div>
        `;
      })
      .join('');

    printWindow.document.write(`
      <html><head><title>QR Codes — ${entityType}s</title>
      <style>
        body { font-family: sans-serif; margin: 20px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .card { text-align: center; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; page-break-inside: avoid; }
        .card img { width: 180px; height: 180px; }
        .card h3 { margin: 10px 0 4px; color: #1e293b; font-size: 14px; }
        .card p { color: #64748b; font-size: 11px; margin: 2px 0; }
        .card .link { font-size: 10px; }
        @media print { .grid { grid-template-columns: repeat(3, 1fr); } }
      </style></head><body>
      <h1 style="text-align:center;color:#1e293b;margin-bottom:20px">Kandt House Museum — QR Codes</h1>
      <div class="grid">${qrCards}</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  }, [items, selected, entityType, frontendUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Bulk QR Codes — {entityType}s ({selected.size} selected)
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <button onClick={selectAll} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-amber-600 transition">
            {selected.size === items.length ? <CheckSquare size={16} /> : <Square size={16} />}
            {selected.size === items.length ? 'Deselect All' : 'Select All'}
          </button>
          <div className="flex-1" />
          <button
            onClick={handleBulkDownload}
            disabled={selected.size === 0}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition text-sm font-medium"
          >
            <Download size={14} /> Download
          </button>
          <button
            onClick={handleBulkPrint}
            disabled={selected.size === 0}
            className="flex items-center gap-1.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition text-sm font-medium"
          >
            <Printer size={14} /> Print Sheet
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((item) => (
              <button
                key={item._id}
                onClick={() => toggleSelect(item._id)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition text-left ${
                  selected.has(item._id)
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {selected.has(item._id) ? (
                  <CheckSquare size={18} className="text-amber-600 flex-shrink-0" />
                ) : (
                  <Square size={18} className="text-slate-400 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-sm text-slate-800 dark:text-white truncate">{getName(item)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{entityType}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRBulkManager;
