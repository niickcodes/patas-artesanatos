import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Lock,
  Mail,
  KeyRound,
  RefreshCw,
  Users,
  ShoppingBag,
  CreditCard,
  Package,
  Terminal,
  PlusCircle,
  AlertCircle,
  LogOut,
  Eye,
  EyeOff,
  Server,
  Play,
} from 'lucide-react';
import {
  adminLogin,
  adminLogout,
  fetchDatabaseOverview,
  executeAdminSql,
  createNewProduct,
  connectExternalPostgres,
} from '../services/api';
import {
  FIXED_PRODUCT_BADGES,
  formatPriceInput,
  parsePriceInput,
  formatCentimetersDigits,
} from '../utils/formatters';

export default function DatabaseModal({
  isOpen,
  onClose,
  onProductsUpdated,
  customer,
}) {
  const [auth, setAuth] = useState(null); // { token, email, password }
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const isCustomerAdmin =
    customer?.role === 'admin' ||
    customer?.email?.toLowerCase() === 'admin@patasartesanatos.com';

  const effectiveAuth =
    auth ||
    (isCustomerAdmin
      ? {
          token: customer.adminToken || customer.token || '',
          email: customer.email,
        }
      : null);

  const [dbData, setDbData] = useState(null);
  const [loadingDb, setLoadingDb] = useState(false);
  const [activeTab, setActiveTab] = useState('customers');

  // SQL Console state
  const [customSql, setCustomSql] = useState(
    'SELECT o.order_code, o.customer_name, o.customer_email, o.total, p.method, p.transaction_code, o.created_at\nFROM orders o\nJOIN payments p ON p.order_id = o.id\nORDER BY o.id DESC;'
  );
  const [sqlResult, setSqlResult] = useState(null);
  const [sqlError, setSqlError] = useState(null);
  const [runningSql, setRunningSql] = useState(false);

  // New Product form inside Admin
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [newProd, setNewProd] = useState({
    name: '',
    category: 'amigurumis',
    categoryLabel: 'Peça em Crochê',
    price: '',
    dimensions: '18',
    inStock: 5,
    description: '',
    badge: 'Feito à Mão',
    image: '/images/amigurumi_rosa.jpg',
  });
  const [prodMsg, setProdMsg] = useState(null);

  // External PostgreSQL 18 connection form
  const [pgConfig, setPgConfig] = useState({
    host: 'localhost',
    port: '5432',
    user: 'postgres',
    password: '',
    database: 'miau_artesanatos',
  });
  const [pgConnectMsg, setPgConnectMsg] = useState(null);
  const [pgConnectErr, setPgConnectErr] = useState(null);

  const loadDatabase = async (currentAuth = effectiveAuth) => {
    if (!currentAuth) return;
    setLoadingDb(true);
    try {
      const overview = await fetchDatabaseOverview(currentAuth);
      setDbData(overview);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    if (isOpen && effectiveAuth) {
      loadDatabase(effectiveAuth);
      const timer = setInterval(() => {
        fetchDatabaseOverview(effectiveAuth)
          .then((overview) => setDbData(overview))
          .catch(() => {});
      }, 15000);
      return () => clearInterval(timer);
    }
  }, [isOpen, Boolean(effectiveAuth), customer?.email]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      const res = await adminLogin(loginEmail, loginPassword);
      const authObj = {
        token: res.token,
        email: res.adminEmail || loginEmail.trim(),
      };
      setLoginPassword('');
      setAuth(authObj);
      await loadDatabase(authObj);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    adminLogout(effectiveAuth);
    setAuth(null);
    setDbData(null);
    setLoginEmail('');
    setLoginPassword('');
    setLoginError(null);
    onClose();
  };

  const handleRunSql = async (e) => {
    e.preventDefault();
    setSqlError(null);
    setRunningSql(true);
    try {
      const res = await executeAdminSql(customSql, effectiveAuth);
      setSqlResult(res);
    } catch (err) {
      setSqlError(err.message);
      setSqlResult(null);
    } finally {
      setRunningSql(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setProdMsg(null);
    try {
      const numericPrice = parsePriceInput(newProd.price);
      const dimDigits = formatCentimetersDigits(newProd.dimensions) || '18';
      await createNewProduct(
        {
          ...newProd,
          price: numericPrice,
          dimensions: `${dimDigits} cm`,
        },
        effectiveAuth
      );
      setProdMsg('Produto adicionado com sucesso ao PostgreSQL!');
      setNewProd({
        name: '',
        category: 'amigurumis',
        categoryLabel: 'Peça em Crochê',
        price: '',
        dimensions: '18',
        inStock: 5,
        description: '',
        badge: 'Feito à Mão',
        image: '/images/amigurumi_rosa.jpg',
      });
      setShowNewProductForm(false);
      await loadDatabase(effectiveAuth);
      if (onProductsUpdated) onProductsUpdated();
    } catch (err) {
      setProdMsg(`Erro: ${err.message}`);
    }
  };

  const handleConnectExternalPg = async (e) => {
    e.preventDefault();
    setPgConnectMsg(null);
    setPgConnectErr(null);
    try {
      const res = await connectExternalPostgres(pgConfig, effectiveAuth);
      setPgConnectMsg(res.message);
      await loadDatabase(effectiveAuth);
    } catch (err) {
      setPgConnectErr(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Container */}
      <div
        className={`relative w-full ${
          effectiveAuth ? 'max-w-6xl' : 'max-w-md'
        } bg-[#FAF6F0] rounded-3xl shadow-2xl border border-[#EDE4D8] overflow-hidden z-10 my-auto transition-all duration-300`}
      >
        {/* Top Bar */}
        <div className="px-6 py-4 bg-charcoal text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pastel-terracotta flex items-center justify-center text-white shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base sm:text-lg text-white">
                  Painel do Banco de Dados PostgreSQL
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  PostgreSQL
                </span>
              </div>
              <p className="text-xs text-white/70">
                {effectiveAuth
                  ? `Conectado como ${effectiveAuth.email} • ${dbData?.metadata?.mode || 'PostgreSQL'}`
                  : 'Acesso restrito mediante autenticação administrativa'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {effectiveAuth && (
              <>
                <button
                  onClick={() => loadDatabase(effectiveAuth)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Recarregar tabelas do PostgreSQL"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingDb ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Atualizar</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Fechar visualização do banco de dados"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Fechar</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* IF NOT AUTHENTICATED: SHOW LOGIN FORM */}
        {!effectiveAuth ? (
          <form onSubmit={handleLoginSubmit} className="p-6 sm:p-8 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-pastel-peach mx-auto flex items-center justify-center text-pastel-terracotta shadow-sm">
                <Lock className="w-7 h-7" />
              </div>
              <h4 className="font-display font-bold text-xl text-charcoal">
                Acesso Restrito ao Banco
              </h4>
              <p className="text-xs text-charcoal-muted max-w-xs mx-auto">
                Insira o e-mail e a senha de administrador do ateliê para visualizar as tabelas e registros do PostgreSQL.
              </p>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1.5">
                  E-mail do Administrador
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-charcoal-light absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-white border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1.5">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-charcoal-light absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="•••••••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl bg-white border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light hover:text-charcoal"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3.5 rounded-2xl bg-pastel-terracotta hover:bg-[#c6604c] text-white font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Database className="w-4 h-4" />
              <span>{loggingIn ? 'Verificando Credenciais...' : 'Desbloquear Banco de Dados'}</span>
            </button>
          </form>
        ) : (
          /* AUTHENTICATED VIEW: POSTGRESQL EXPLORER */
          <div className="p-5 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto">
            {/* KPI Summary Cards */}
            {dbData?.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-charcoal-muted mb-1">
                    <span>Clientes Cadastrados</span>
                    <Users className="w-4 h-4 text-pastel-terracotta" />
                  </div>
                  <p className="font-display font-extrabold text-2xl text-charcoal">
                    {dbData.stats.totalCustomers}
                  </p>
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    Tabela: public.customers
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-charcoal-muted mb-1">
                    <span>Pedidos Realizados</span>
                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="font-display font-extrabold text-2xl text-charcoal">
                    {dbData.stats.totalOrders}
                  </p>
                  <span className="text-[11px] text-charcoal-muted font-medium">
                    {dbData.stats.pixOrders} PIX • {dbData.stats.cardOrders} Cartão
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-charcoal-muted mb-1">
                    <span>Receita Aprovada</span>
                    <CreditCard className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="font-display font-extrabold text-2xl text-pastel-terracotta">
                    R$ {dbData.stats.totalRevenue.toFixed(2).replace('.', ',')}
                  </p>
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    Tabela: public.payments
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-charcoal-muted mb-1">
                    <span>Produtos no Catálogo</span>
                    <Package className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="font-display font-extrabold text-2xl text-charcoal">
                    {dbData.stats.totalProducts}
                  </p>
                  <span className="text-[11px] text-purple-700 font-semibold">
                    Tabela: public.products
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-cream-300 pb-3">
              {[
                {
                  id: 'customers',
                  label: `Clientes (${dbData?.tables?.customers?.length || 0})`,
                  icon: Users,
                },
                {
                  id: 'orders',
                  label: `Pedidos (${dbData?.tables?.orders?.length || 0})`,
                  icon: ShoppingBag,
                },
                {
                  id: 'payments',
                  label: `Pagamentos PIX/Cartão (${dbData?.tables?.payments?.length || 0})`,
                  icon: CreditCard,
                },
                {
                  id: 'order_items',
                  label: `Itens Vendidos (${dbData?.tables?.order_items?.length || 0})`,
                  icon: Package,
                },
                {
                  id: 'products',
                  label: `Produtos (${dbData?.tables?.products?.length || 0})`,
                  icon: Package,
                },
                {
                  id: 'sql_console',
                  label: 'Console SQL & Schema',
                  icon: Terminal,
                },
                {
                  id: 'pg_config',
                  label: 'Servidor PostgreSQL',
                  icon: Server,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      active
                        ? 'bg-charcoal text-white shadow-sm'
                        : 'bg-white text-charcoal-muted hover:text-charcoal border border-cream-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: CUSTOMERS TABLE */}
            {activeTab === 'customers' && (
              <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-cream-100 border-b border-cream-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-charcoal">
                      SELECT * FROM public.customers ORDER BY id DESC;
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                      ⏱️ Auto-Cadastro Ativo: +2 pessoas a cada 2 min
                    </span>
                  </div>
                  <span className="text-xs text-charcoal-muted">
                    {dbData?.tables?.customers?.length || 0} registro(s)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-cream-50 border-b border-cream-200 text-charcoal-muted uppercase text-[10px]">
                        <th className="py-2.5 px-3">ID</th>
                        <th className="py-2.5 px-3">Nome</th>
                        <th className="py-2.5 px-3">E-mail (UNIQUE)</th>
                        <th className="py-2.5 px-3">Telefone</th>
                        <th className="py-2.5 px-3">CPF</th>
                        <th className="py-2.5 px-3">Endereço / Cidade</th>
                        <th className="py-2.5 px-3">Criado em</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-100">
                      {dbData?.tables?.customers?.map((c) => (
                        <tr key={c.id} className="hover:bg-cream-50/60">
                          <td className="py-2.5 px-3 font-mono font-bold text-pastel-terracotta">
                            #{c.id}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-charcoal">{c.name}</td>
                          <td className="py-2.5 px-3 font-mono text-emerald-700 font-semibold">
                            {c.email}
                          </td>
                          <td className="py-2.5 px-3 text-charcoal-muted">{c.phone || '—'}</td>
                          <td className="py-2.5 px-3 font-mono text-charcoal-muted">
                            {c.cpf || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-charcoal-muted">
                            {[
                              c.address,
                              c.complement && !String(c.address || '').includes(c.complement)
                                ? `Compl: ${c.complement}`
                                : null,
                              c.city,
                              c.state,
                              c.zip_code ? `CEP ${c.zip_code}` : null,
                            ]
                              .filter(Boolean)
                              .join(' • ') || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-charcoal-light font-mono text-[11px]">
                            {new Date(c.created_at).toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: ORDERS TABLE */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-cream-100 border-b border-cream-200 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-charcoal">
                    SELECT * FROM public.orders ORDER BY id DESC;
                  </span>
                  <span className="text-xs text-charcoal-muted">
                    {dbData?.tables?.orders?.length || 0} pedido(s)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-cream-50 border-b border-cream-200 text-charcoal-muted uppercase text-[10px]">
                        <th className="py-2.5 px-3">ID</th>
                        <th className="py-2.5 px-3">Código</th>
                        <th className="py-2.5 px-3">Cliente</th>
                        <th className="py-2.5 px-3">E-mail</th>
                        <th className="py-2.5 px-3">Método</th>
                        <th className="py-2.5 px-3">Total</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-100">
                      {dbData?.tables?.orders?.map((o) => (
                        <tr key={o.id} className="hover:bg-cream-50/60">
                          <td className="py-2.5 px-3 font-mono font-bold">#{o.id}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-pastel-terracotta">
                            {o.order_code}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-charcoal">
                            {o.customer_name}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-charcoal-muted">
                            {o.customer_email}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                o.payment_method === 'pix'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-pastel-peach text-charcoal'
                              }`}
                            >
                              {o.payment_method === 'pix' ? 'PIX' : 'Cartão de Crédito'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-charcoal">
                            R$ {Number(o.total).toFixed(2).replace('.', ',')}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {o.payment_status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-charcoal-light font-mono text-[11px]">
                            {new Date(o.created_at).toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: PAYMENTS TABLE */}
            {activeTab === 'payments' && (
              <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-cream-100 border-b border-cream-200 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-charcoal">
                    SELECT * FROM public.payments ORDER BY id DESC;
                  </span>
                  <span className="text-xs text-charcoal-muted">
                    {dbData?.tables?.payments?.length || 0} transação(ões)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-cream-50 border-b border-cream-200 text-charcoal-muted uppercase text-[10px]">
                        <th className="py-2.5 px-3">ID</th>
                        <th className="py-2.5 px-3">Order ID</th>
                        <th className="py-2.5 px-3">Transação</th>
                        <th className="py-2.5 px-3">Método</th>
                        <th className="py-2.5 px-3">Valor</th>
                        <th className="py-2.5 px-3">Detalhes Cartão / PIX</th>
                        <th className="py-2.5 px-3">Parcelas</th>
                        <th className="py-2.5 px-3">Pago em</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-100">
                      {dbData?.tables?.payments?.map((p) => (
                        <tr key={p.id} className="hover:bg-cream-50/60">
                          <td className="py-2.5 px-3 font-mono font-bold">#{p.id}</td>
                          <td className="py-2.5 px-3 font-mono">Pedido #{p.order_id}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-pastel-terracotta">
                            {p.transaction_code}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                p.method === 'pix'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-pastel-peach text-charcoal'
                              }`}
                            >
                              {p.method === 'pix' ? 'PIX' : 'Cartão'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-charcoal">
                            R$ {Number(p.amount).toFixed(2).replace('.', ',')}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-charcoal-muted">
                            {p.method === 'pix'
                              ? `Chave: ${p.pix_key} (${p.pix_txid})`
                              : `${p.card_brand} •••• ${p.card_last4} (${p.card_holder})`}
                          </td>
                          <td className="py-2.5 px-3 font-semibold">{p.installments}x</td>
                          <td className="py-2.5 px-3 text-charcoal-light font-mono text-[11px]">
                            {new Date(p.paid_at).toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: ORDER ITEMS TABLE */}
            {activeTab === 'order_items' && (
              <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-cream-100 border-b border-cream-200 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-charcoal">
                    SELECT * FROM public.order_items ORDER BY id DESC;
                  </span>
                  <span className="text-xs text-charcoal-muted">
                    {dbData?.tables?.order_items?.length || 0} item(ns)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-cream-50 border-b border-cream-200 text-charcoal-muted uppercase text-[10px]">
                        <th className="py-2.5 px-3">ID</th>
                        <th className="py-2.5 px-3">Order ID</th>
                        <th className="py-2.5 px-3">Produto ID</th>
                        <th className="py-2.5 px-3">Nome do Produto</th>
                        <th className="py-2.5 px-3">Qtd</th>
                        <th className="py-2.5 px-3">Preço Unit.</th>
                        <th className="py-2.5 px-3">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-100">
                      {dbData?.tables?.order_items?.map((item) => (
                        <tr key={item.id} className="hover:bg-cream-50/60">
                          <td className="py-2.5 px-3 font-mono font-bold">#{item.id}</td>
                          <td className="py-2.5 px-3 font-mono">Pedido #{item.order_id}</td>
                          <td className="py-2.5 px-3 font-mono text-pastel-terracotta">
                            {item.product_id}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-charcoal">
                            {item.product_name}
                          </td>
                          <td className="py-2.5 px-3 font-bold">{item.quantity}</td>
                          <td className="py-2.5 px-3">
                            R$ {Number(item.unit_price).toFixed(2).replace('.', ',')}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-charcoal">
                            R$ {Number(item.subtotal).toFixed(2).replace('.', ',')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: PRODUCTS TABLE + ADD NEW PRODUCT */}
            {activeTab === 'products' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-charcoal-muted">
                    Gerencie os produtos cadastrados na tabela <code className="font-mono font-bold">public.products</code> do PostgreSQL.
                  </p>
                  <button
                    onClick={() => setShowNewProductForm(!showNewProductForm)}
                    className="px-4 py-2 rounded-xl bg-pastel-terracotta hover:bg-[#c6604c] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{showNewProductForm ? 'Fechar Formulário' : 'Novo Produto no Banco'}</span>
                  </button>
                </div>

                {prodMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                    {prodMsg}
                  </div>
                )}

                {showNewProductForm && (
                  <form
                    onSubmit={handleCreateProduct}
                    className="bg-white p-4 rounded-2xl border border-cream-300 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    <div>
                      <label className="block text-[11px] font-bold text-charcoal mb-1">
                        Nome do Produto *
                      </label>
                      <input
                        type="text"
                        required
                        value={newProd.name}
                        onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                        placeholder="Ex: Amigurumi Gatinho Branco"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-cream-50 border border-cream-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-charcoal mb-1">
                        Categoria *
                      </label>
                      <select
                        value={newProd.category}
                        onChange={(e) =>
                          setNewProd({
                            ...newProd,
                            category: e.target.value,
                            categoryLabel:
                              e.target.value === 'amigurumis'
                                ? 'Peça em Crochê'
                                : e.target.value === 'quadros'
                                ? 'Quadro Decorativo'
                                : e.target.value === 'chaveiros'
                                ? 'Chaveiro Artesanal'
                                : 'Cerâmica & Casa',
                          })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl bg-cream-50 border border-cream-300"
                      >
                        <option value="amigurumis">Amigurumis em Crochê</option>
                        <option value="quadros">Quadros Decorativos</option>
                        <option value="chaveiros">Chaveiros Fofos</option>
                        <option value="casa">Cerâmica & Casa</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-charcoal mb-1">
                        Preço (R$) *
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs font-bold text-charcoal-muted select-none">
                          R$
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={newProd.price}
                          onChange={(e) =>
                            setNewProd({ ...newProd, price: formatPriceInput(e.target.value) })
                          }
                          placeholder="89,90"
                          className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-xl bg-cream-50 border border-cream-300"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-charcoal mb-1">
                        Dimensões (cm) *
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          maxLength={4}
                          value={newProd.dimensions}
                          onChange={(e) =>
                            setNewProd({
                              ...newProd,
                              dimensions: formatCentimetersDigits(e.target.value),
                            })
                          }
                          placeholder="18"
                          className="w-full pl-3 pr-10 py-2 text-xs font-mono font-bold rounded-xl bg-cream-50 border border-cream-300"
                        />
                        <span className="absolute right-3 text-xs font-bold text-charcoal-muted select-none">
                          cm
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-charcoal mb-1">
                        Selo / Categoria *
                      </label>
                      <select
                        value={newProd.badge}
                        onChange={(e) => setNewProd({ ...newProd, badge: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-cream-50 border border-cream-300"
                      >
                        {FIXED_PRODUCT_BADGES.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-charcoal mb-1">
                        Descrição
                      </label>
                      <input
                        type="text"
                        value={newProd.description}
                        onChange={(e) =>
                          setNewProd({ ...newProd, description: e.target.value })
                        }
                        placeholder="Feito à mão com todo carinho..."
                        className="w-full px-3 py-2 text-xs rounded-xl bg-cream-50 border border-cream-300"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                      >
                        Inserir no PostgreSQL
                      </button>
                    </div>
                  </form>
                )}

                <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-cream-50 border-b border-cream-200 text-charcoal-muted uppercase text-[10px]">
                          <th className="py-2.5 px-3">ID (PK)</th>
                          <th className="py-2.5 px-3">Produto</th>
                          <th className="py-2.5 px-3">Categoria</th>
                          <th className="py-2.5 px-3">Preço</th>
                          <th className="py-2.5 px-3">Estoque</th>
                          <th className="py-2.5 px-3">Avaliação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cream-100">
                        {dbData?.tables?.products?.map((p) => (
                          <tr key={p.id} className="hover:bg-cream-50/60">
                            <td className="py-2.5 px-3 font-mono font-bold text-pastel-terracotta">
                              {p.id}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-charcoal flex items-center gap-2">
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-7 h-7 rounded-lg object-cover border border-cream-200"
                              />
                              <span>{p.name}</span>
                            </td>
                            <td className="py-2.5 px-3 uppercase text-[10px] font-bold text-charcoal-muted">
                              {p.category}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-charcoal">
                              R$ {Number(p.price).toFixed(2).replace('.', ',')}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-emerald-700">
                              {p.in_stock} un.
                            </td>
                            <td className="py-2.5 px-3">⭐ {p.rating}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: SQL CONSOLE & POSTGRESQL SCHEMA */}
            {activeTab === 'sql_console' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-cream-200 space-y-3">
                  <h4 className="font-display font-bold text-sm text-charcoal flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-pastel-terracotta" />
                    <span>Executar Consulta SQL no PostgreSQL</span>
                  </h4>
                  <form onSubmit={handleRunSql} className="space-y-2.5">
                    <textarea
                      rows={5}
                      value={customSql}
                      onChange={(e) => setCustomSql(e.target.value)}
                      className="w-full p-3 font-mono text-xs rounded-xl bg-charcoal text-emerald-300 border border-charcoal focus:outline-none"
                    />
                    <div className="flex justify-between items-center">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setCustomSql('SELECT * FROM customers ORDER BY id DESC;')
                          }
                          className="px-2.5 py-1 text-[10px] font-mono bg-cream-100 hover:bg-cream-200 rounded-lg text-charcoal"
                        >
                          SELECT customers
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCustomSql('SELECT * FROM payments ORDER BY id DESC;')
                          }
                          className="px-2.5 py-1 text-[10px] font-mono bg-cream-100 hover:bg-cream-200 rounded-lg text-charcoal"
                        >
                          SELECT payments
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={runningSql}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>{runningSql ? 'Executando...' : 'Executar SQL'}</span>
                      </button>
                    </div>
                  </form>

                  {sqlError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
                      {sqlError}
                    </div>
                  )}

                  {sqlResult && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-emerald-700">
                        ✅ {sqlResult.rowCount} linha(s) retornada(s) em {sqlResult.durationMs}ms
                      </p>
                      <div className="max-h-56 overflow-auto rounded-xl border border-cream-200 bg-cream-50 p-2">
                        <pre className="text-[11px] font-mono text-charcoal">
                          {JSON.stringify(sqlResult.rows, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white p-4 rounded-2xl border border-cream-200 space-y-2">
                  <h4 className="font-display font-bold text-sm text-charcoal">
                    DDL Estruturado (server/sql/schema.sql)
                  </h4>
                  <div className="max-h-80 overflow-auto rounded-xl bg-charcoal p-3 text-cream-100">
                    <pre className="text-[11px] font-mono leading-relaxed">
                      {dbData?.schemaSql}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: EXTERNAL POSTGRESQL SERVER CONNECTION */}
            {activeTab === 'pg_config' && (
              <div className="bg-white p-5 rounded-2xl border border-cream-200 space-y-4">
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-base text-charcoal flex items-center gap-2">
                    <Server className="w-4 h-4 text-pastel-terracotta" />
                    <span>Informação da Engine & Conexão PostgreSQL</span>
                  </h4>
                  <p className="text-xs text-charcoal-muted">
                    Versão ativa: <code className="font-mono font-bold text-charcoal">{dbData?.metadata?.version}</code>
                  </p>
                  <p className="text-xs text-charcoal-muted">
                    Armazenamento atual: <code className="font-mono font-bold text-emerald-700">{dbData?.metadata?.storage}</code>
                  </p>
                </div>

                <form
                  onSubmit={handleConnectExternalPg}
                  className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-3"
                >
                  <p className="text-xs font-bold text-charcoal">
                    Conectar ao serviço PostgreSQL 18 Local (porta 5432):
                  </p>
                  {pgConnectMsg && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                      {pgConnectMsg}
                    </div>
                  )}
                  {pgConnectErr && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                      {pgConnectErr}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                    <input
                      type="text"
                      value={pgConfig.host}
                      onChange={(e) => setPgConfig({ ...pgConfig, host: e.target.value })}
                      placeholder="Host (localhost)"
                      className="px-3 py-2 text-xs rounded-xl bg-white border border-cream-300"
                    />
                    <input
                      type="text"
                      value={pgConfig.port}
                      onChange={(e) => setPgConfig({ ...pgConfig, port: e.target.value })}
                      placeholder="Porta (5432)"
                      className="px-3 py-2 text-xs rounded-xl bg-white border border-cream-300"
                    />
                    <input
                      type="text"
                      value={pgConfig.user}
                      onChange={(e) => setPgConfig({ ...pgConfig, user: e.target.value })}
                      placeholder="Usuário (postgres)"
                      className="px-3 py-2 text-xs rounded-xl bg-white border border-cream-300"
                    />
                    <input
                      type="password"
                      value={pgConfig.password}
                      onChange={(e) => setPgConfig({ ...pgConfig, password: e.target.value })}
                      placeholder="Senha do Postgres local"
                      className="px-3 py-2 text-xs rounded-xl bg-white border border-cream-300"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-charcoal hover:bg-charcoal/90 text-white text-xs font-bold"
                    >
                      Sincronizar Servidor
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

