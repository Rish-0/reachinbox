import { Router } from 'express';
import {
  createCampaignHandler,
  listCampaigns,
} from '../controllers/campaignController';
import { validate } from '../middleware/validate';
import { createCampaignSchema } from '@reachinbox/shared';

const router = Router();

router.post('/', validate(createCampaignSchema), createCampaignHandler);
router.get('/', listCampaigns);

export default router;
