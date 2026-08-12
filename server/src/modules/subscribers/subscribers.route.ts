import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { getSubscribersSchema, subscriberSchema } from './subscribers.schema.js';
import SubscribeController from './subscribers.controller.js';
import { requireAuth } from '../../middlewares/requireAuth.js';

const router = Router();

router.post('/:publicationId/subscribe', validate(subscriberSchema), SubscribeController.create );
router.get('/:publicationId', requireAuth, validate(getSubscribersSchema), SubscribeController.getByPublicationId);

export default router;