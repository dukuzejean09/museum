import QRCode from 'qrcode';
import Exhibition from '../models/Exhibition.js';
import Artifact from '../models/Artifact.js';
import { asyncHandler, NotFoundError } from '../utils/errors.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// @desc    Generate QR code for an exhibition (AR-compatible)
// @route   GET /api/qr/exhibition/:exhibitionId
export const generateExhibitionQR = asyncHandler(async (req, res) => {
  const exhibition = await Exhibition.findById(req.params.exhibitionId);
  if (!exhibition) throw new NotFoundError('Exhibition');

  // AR-compatible URL — works as both a web link and AR scanner target
  const targetUrl = `${FRONTEND_URL}/ar?type=exhibition&id=${exhibition._id}`;
  const qrCodeDataUrl = await QRCode.toDataURL(targetUrl, { width: 300, margin: 2 });

  res.json({
    exhibitionId: exhibition._id,
    exhibitionTitle: exhibition.title?.en || 'Untitled',
    qrCodeDataUrl,
    targetUrl,
  });
});

// @desc    Generate QR code for an artifact (AR-compatible)
// @route   GET /api/qr/artifact/:artifactId
export const generateArtifactQR = asyncHandler(async (req, res) => {
  const artifact = await Artifact.findById(req.params.artifactId);
  if (!artifact) throw new NotFoundError('Artifact');

  const targetUrl = `${FRONTEND_URL}/ar?type=artifact&id=${artifact._id}`;
  const qrCodeDataUrl = await QRCode.toDataURL(targetUrl, { width: 300, margin: 2 });

  res.json({
    artifactId: artifact._id,
    artifactName: artifact.name?.en || 'Untitled',
    qrCodeDataUrl,
    targetUrl,
  });
});
