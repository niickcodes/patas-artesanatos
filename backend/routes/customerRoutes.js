import { Router } from 'express';
import {
  registerOrUpdateCustomer,
  loginCustomer,
  logoutCustomer,
  getCurrentCustomer,
  getCustomerByEmail,
} from '../controllers/customerController.js';
import { authLimiter } from '../middleware/security.js';
import { requireCustomer, requireCustomerOrAdmin } from '../middleware/session.js';

const router = Router();

router.post('/register', authLimiter, registerOrUpdateCustomer);
router.post('/login', authLimiter, loginCustomer);
router.post('/logout', logoutCustomer);
router.get('/me', requireCustomer, getCurrentCustomer);
router.get('/lookup', requireCustomerOrAdmin, getCustomerByEmail);

export default router;
