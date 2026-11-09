import { Router } from 'express';
import {
  adminLogin,
  adminLogout,
  getDatabaseOverview,
  executeAdminQuery,
  connectExternalServer,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  deleteUser,
} from '../controllers/adminController.js';
import { requireAdminAuth } from '../middleware/adminAuth.js';
import { authLimiter, adminSqlLimiter, writeLimiter } from '../middleware/security.js';

const router = Router();

router.post('/login', authLimiter, adminLogin);
router.post('/logout', adminLogout);

// Rotas Administrativas com Autenticação e Autorização Estritas (Role "admin")
router.get('/database', requireAdminAuth, getDatabaseOverview);
router.post('/sql', requireAdminAuth, adminSqlLimiter, executeAdminQuery);
router.post('/connect-pg', requireAdminAuth, adminSqlLimiter, connectExternalServer);

// Gerenciamento de Pedidos, Status e Usuários
router.get('/orders', requireAdminAuth, getAllOrders);
router.put('/orders/:id/status', requireAdminAuth, writeLimiter, updateOrderStatus);
router.get('/users', requireAdminAuth, getAllUsers);
router.delete('/users/:id', requireAdminAuth, writeLimiter, deleteUser);

export default router;
