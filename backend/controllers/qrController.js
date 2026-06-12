import QRCode from 'qrcode';
import Exhibition from '../models/Exhibition.js';
import { asyncHandler, NotFoundError } from '../utils/errors.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// @desc    Generate QR code for an exhibition
// @route   GET /api/qr/exhibition/:exhibitionId
export const generateExhibitionQR = asyncHandler(async (req, res) => {
  const exhibition = await Exhibition.findById(req.params.exhibitionId);
  if (!exhibition) throw new NotFoundError('Exhibition');

  const targetUrl = `${FRONTEND_URL}/exhibitions/${exhibition._id}`;
  const qrCodeDataUrl = await QRCode.toDataURL(targetUrl, { width: 300, margin: 2 });

  res.json({
    exhibitionId: exhibition._id,
    exhibitionTitle: exhibition.title?.en || 'Untitled',
    qrCodeDataUrl,
    targetUrl,
  });
});
