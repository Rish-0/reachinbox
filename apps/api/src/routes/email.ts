import { Router } from 'express';
import {
  scheduledEmailsHandler,
  sentEmailsHandler,
  searchEmailsHandler,
} from '../controllers/emailController';

const router = Router();

router.get('/scheduled', scheduledEmailsHandler);
router.get('/sent', sentEmailsHandler);
router.get('/search', searchEmailsHandler);

export default router;
