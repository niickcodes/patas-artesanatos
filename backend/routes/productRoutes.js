import { Router } from 'express';
import { getAllProducts, createProduct, deleteProduct } from '../controllers/productController.js';
import { writeLimiter } from '../middleware/security.js';

const router = Router();

router.get('/', getAllProducts);
// Permite que usuários logados (ou admin) cadastrem produtos na plataforma
router.post('/', writeLimiter, createProduct);
// Permite excluir um produto postado
router.delete('/:id', writeLimiter, deleteProduct);

export default router;
