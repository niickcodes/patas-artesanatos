import express from 'express';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import { initDatabase, getPublicDatabaseStatus } from './config/database.js';
import { startAutoCustomerScheduler } from './services/autoCustomerScheduler.js';
import {
  securityHeaders,
  corsMiddleware,
  csrfOriginCheck,
  hppAndPrototypeGuard,
  apiLimiter,
  notFoundHandler,
  errorHandler,
} from './middleware/security.js';
import { attachSessions } from './middleware/session.js';
import productRoutes from './routes/productRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

// Oculta assinatura do Express (impede fingerprinting via Nmap / Nikto / WhatWeb)
app.disable('x-powered-by');
app.set('trust proxy', config.trustProxy);

// 0. Redirecionamento forçado de HTTP para HTTPS em produção / proxies TLS (OWASP A02 / A05)
app.use((req, res, next) => {
  if (config.cookieSecure && req.get('x-forwarded-proto') === 'http') {
    return res.redirect(301, `https://${req.get('host')}${req.originalUrl}`);
  }
  next();
});

// 1. Cabeçalhos de Segurança HTTP (Helmet CSP, HSTS, X-Frame-Options, nosniff, Cache-Control)
app.use(securityHeaders);

// 2. Política de CORS estrita (apenas origens autorizadas em config.allowedOrigins)
app.use(corsMiddleware);

// 3. Parser de Cookies (para sessões HttpOnly + SameSite=Strict) e JSON com limite seguro
app.use(cookieParser());
app.use(express.json({ limit: '2mb', strict: true }));

// 4. Proteção contra HTTP Parameter Pollution (HPP), Prototype Pollution (__proto__) e Null Bytes
app.use(hppAndPrototypeGuard);

// 5. Proteção Anti-CSRF (validação de Origin/Referer e Content-Type application/json)
app.use('/api', csrfOriginCheck);

// 6. Rate Limiting global da API (mitigação contra scanners e força bruta / DoS)
app.use('/api', apiLimiter);

// 7. Anexa sessões válidas de cliente/admin (req.customer / req.admin)
app.use('/api', attachSessions);

// Healthcheck da API (sem expor versão do SO, credenciais ou diretórios internos)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Miau & Ponto API',
    database: getPublicDatabaseStatus(),
    timestamp: new Date().toISOString(),
  });
});

// Rotas estruturadas da API
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Tratamento seguro de 404 e Erros (sem vazamento de stack traces)
app.use(notFoundHandler);
app.use(errorHandler);

// Inicializa o PostgreSQL e sobe o servidor
initDatabase()
  .then(() => {
    startAutoCustomerScheduler();
    app.listen(config.port, () => {
      console.log(`🐾 Servidor Backend Miau & Ponto rodando em http://localhost:${config.port}`);
    });
  })
  .catch((err) => {
    console.error('Erro crítico ao inicializar banco PostgreSQL:', err.message);
    process.exit(1);
  });
