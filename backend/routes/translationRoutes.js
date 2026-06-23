import { Router } from 'express';
import visitorProtect from '../middleware/visitorMiddleware.js';
import { translate, translateBatchHandler, detectLang } from '../controllers/translationController.js';

const router = Router();

// All translation routes require visitor or admin auth
router.use(visitorProtect);

router.post('/', translate);
router.post('/batch', translateBatchHandler);
router.post('/detect', detectLang);

export default router;
