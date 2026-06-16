import { useState, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Printer, Copy, Check } from 'lucide-react';

const QRPreviewModal = ({ isOpen, onClose, entityType, entity, frontendUrl }) => {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef(null);

  const entityName = entity?.name?.en || entity?.title?.en || entity?.name || entity?.title || 'Unknown';
  const entityId = entity?._id;
  const deepLink = `${frontendUrl}/ar?type=${entityType}&id=${entityId}`;

  const handleDownload = useCallback(() => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    canvas.width = 512;
    canvas.height = 612;

    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 56, 30, 400, 400);

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(entityName, canvas.width / 2, 470);

      ctx.fillStyle = '#64748b';
      ctx.font = '13px sans-serif';
      ctx.fillText(`Kandt House Museum — ${entityType}`, canvas.width / 2, 495);
      ctx.fillText('Scan to learn more', canvas.width / 2, 515);

      const link = document.createElement('a');
      link.download = `qr-${entityType}-${entityId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, [entityName, entityType, entityId]);

  const handlePrint = useCallback(() => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>QR Code - ${entityName}</title>
      <style>
        body { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; font-family:sans-serif; margin:0; }
        h2 { margin:20px 0 5px; color:#1e293b; }
        p { color:#64748b; font-size:14px; margin:4px 0; }
      </style></head><body>
      ${svgData}
      <h2>${entityName}</h2>
      <p>Kandt House Museum &mdash; ${entityType}</p>
      <p>Scan to learn more</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, [entityName, entityType]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(deepLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [deepLink]);

  if (!isOpen || !entity) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">QR Code</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div ref={qrRef} className="flex flex-col items-center py-6 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl mb-4">
          <QRCodeSVG value={deepLink} size={220} level="H" includeMargin />
          <p className="mt-4 font-semibold text-slate-800 dark:text-white text-center">{entityName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{entityType}</p>
        </div>

        <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4">
          <input
            readOnly
            value={deepLink}
            className="flex-1 bg-transparent text-xs text-slate-600 dark:text-slate-300 outline-none truncate"
          />
          <button onClick={handleCopy} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition" title="Copy link">
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-slate-500" />}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl transition font-medium text-sm"
          >
            <Download size={16} /> Download PNG
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 py-2.5 rounded-xl transition font-medium text-sm"
          >
            <Printer size={16} /> Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRPreviewModal;
