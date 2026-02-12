import express from 'express';
import { trackVisitor } from '../controllers/visitorController.js';

const router = express.Router();

router.post('/visitors/track', trackVisitor);

export const visitorRouter = router;
