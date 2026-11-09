import { Router } from 'express';
import { createOrder, getMyOrders } from '../controllers/orderController.js';
import { writeLimiter } from '../middleware/security.js';
import { requireCustomerOrAdmin } from '../middleware/session.js';

const router = Router();

router.post('/', writeLimiter, createOrder);
router.get('/my-orders', requireCustomerOrAdmin, getMyOrders);

export default router;
