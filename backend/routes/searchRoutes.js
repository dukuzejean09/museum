import express from 'express';
import { globalSearch } from '../controllers/searchController.js';

const publicRouter = express.Router();

// Public search
publicRouter.get('/', globalSearch);

export { publicRouter };
