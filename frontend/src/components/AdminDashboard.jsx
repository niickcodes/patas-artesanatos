import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  ShoppingBag,
  Users,
  Database,
  ArrowLeft,
  PlusCircle,
  Trash2,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  fetchAdminOrders,
  updateAdminOrderStatus,
  fetchAdminUsers,
  deleteAdminUser,
  createNewProduct,
} from '../services/api';
import {
  formatPriceInput,
  parsePriceInput,
  formatCentimetersDigits,
  safeImageUrl,
  safeText,
} from '../utils/formatters';

const STATUS_OPTIONS = [
  'PAGAMENTO APROVADO',
  'EM SEPARAÇÃO',
  'ENVIADO',
  'ENTREGUE',
  'CANCELADO',
];

export default function AdminDashboard({
  customer,
  products = [],
  onProductsUpdated,
  onDeleteProduct,
  onOpenDatabaseModal,
  onNavigateHome,
}) {
  const [activeTab, setActiveTab] = useState('pedidos'); // 'pedidos' | 'produtos' | 'usuarios'

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  // Users State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [userSearch, setUserSearch] = useState('');

  // Products State / Form
  const [showProductForm, setShowProductForm] = useState(false);
  const [productSearch, setProductSearch] = useState('');
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
  const [submittingProd, setSubmittingProd] = useState(false);

  const authObj = customer
    ? { token: customer.adminToken || customer.token || '', email: customer.email }
    : null;

  const loadOrders = useCallback(async () => {
    if (!authObj) return;
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const data = await fetchAdminOrders(authObj);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setOrdersError(err.message || 'Erro ao carregar pedidos.');
    } finally {
      setLoadingOrders(false);
    }
  }, [customer]);

  const loadUsers = useCallback(async () => {
    if (!authObj) return;
    setLoadingUsers(true);
    setUsersError(null);
    try {
      const data = await fetchAdminUsers(authObj);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setUsersError(err.message || 'Erro ao carregar usuários.');
    } finally {
      setLoadingUsers(false);
    }
  }, [customer]);

  useEffect(() => {
    loadOrders();
    loadUsers();
    // Auto-refresh periódico para buscar novos pedidos imediatamente do PostgreSQL
    const timer = setInterval(() => {
      loadOrders();
    }, 8000);
    return () => clearInterval(timer);
  }, [loadOrders, loadUsers]);

  const handleStatusChange = async (orderId, newStatus) => {
    setStatusUpdatingId(orderId);
    try {
      await updateAdminOrderStatus(orderId, newStatus, authObj);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: newStatus, payment_status: newStatus }
            : o
        )
      );
    } catch (err) {
      alert(`Erro ao atualizar status: ${err.message}`);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (userEmail?.toLowerCase() === 'admin@patasartesanatos.com') {
      alert('O administrador padrão não pode ser excluído.');
      return;
    }
    if (!window.confirm(`Tem certeza que deseja excluir o usuário ${userEmail}?`)) {
      return;
    }
    try {
      await deleteAdminUser(userId, authObj);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert(`Erro ao excluir: ${err.message}`);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setProdMsg(null);
    setSubmittingProd(true);
    try {
      const numericPrice = parsePriceInput(newProd.price);
      const dimDigits = formatCentimetersDigits(newProd.dimensions) || '18';
      await createNewProduct(
        {
          ...newProd,
          price: numericPrice,
          dimensions: `${dimDigits} cm`,
        },
        authObj
      );
      setProdMsg('Produto cadastrado com sucesso no PostgreSQL!');
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
      setShowProductForm(false);
      if (onProductsUpdated) onProductsUpdated();
    } catch (err) {
      setProdMsg(`Erro: ${err.message}`);
    } finally {
      setSubmittingProd(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!orderSearch) return true;
    const q = orderSearch.toLowerCase();
    return (
      o.order_code?.toLowerCase().includes(q) ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.customer_email?.toLowerCase().includes(q) ||
      o.tracking_code?.toLowerCase().includes(q)
    );
  });

  const filteredUsers = users.filter((u) => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.cpf?.includes(q) ||
      u.city?.toLowerCase().includes(q)
    );
  });

  const filteredProducts = products.filter((p) => {
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-soft border border-[#EDE4D8] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-pastel-terracotta text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-4 h-4" />
                Painel Administrativo (/admin)
              </span>
              <span className="text-xs text-charcoal-muted">
                Logado como: <strong className="text-charcoal">{customer?.email}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-charcoal">
              Gestão Geral do Ateliê 🐾
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted">
              Gerencie os pedidos, produtos, clientes e acesse o banco de dados PostgreSQL sem burocracia.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenDatabaseModal}
              id="admin-dashboard-view-db-button"
              className="px-4 py-2.5 rounded-2xl bg-charcoal hover:bg-charcoal/90 text-white text-xs font-bold flex items-center gap-2 shadow-soft transition-all active:scale-95"
              title="Acessar tabelas e console SQL diretamente (sem pedir senha)"
            >
              <Database className="w-4 h-4 text-pastel-peach" />
              <span>Visualizar Banco de Dados</span>
            </button>
            <button
              onClick={onNavigateHome}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-cream-100 border border-cream-300 text-charcoal text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar à Loja</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E3D7C5] gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('pedidos')}
            className={`px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeTab === 'pedidos'
                ? 'bg-pastel-terracotta text-white shadow-soft'
                : 'bg-white hover:bg-cream-100 text-charcoal border border-cream-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Pedidos ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('produtos')}
            className={`px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeTab === 'produtos'
                ? 'bg-pastel-terracotta text-white shadow-soft'
                : 'bg-white hover:bg-cream-100 text-charcoal border border-cream-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Produtos ({products.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeTab === 'usuarios'
                ? 'bg-pastel-terracotta text-white shadow-soft'
                : 'bg-white hover:bg-cream-100 text-charcoal border border-cream-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuários Cadastrados ({users.length})</span>
          </button>
        </div>

        {/* TAB 1: PEDIDOS */}
        {activeTab === 'pedidos' && (
          <div className="bg-white rounded-3xl p-6 shadow-soft border border-[#EDE4D8] space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-charcoal-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por código, cliente ou rastreio..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-cream-50 border border-cream-300 focus:outline-none focus:ring-2 focus:ring-pastel-peachDark"
                />
              </div>
              <button
                onClick={loadOrders}
                disabled={loadingOrders}
                className="px-3.5 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-charcoal text-xs font-semibold flex items-center gap-1.5 self-start"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
                <span>Atualizar Pedidos</span>
              </button>
            </div>

            {ordersError && (
              <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">
                {ordersError}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-cream-200 text-charcoal-muted font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Código</th>
                    <th className="py-3 px-3">Comprador</th>
                    <th className="py-3 px-3">Produto(s)</th>
                    <th className="py-3 px-3">Total</th>
                    <th className="py-3 px-3">Pagamento</th>
                    <th className="py-3 px-3">Rastreio</th>
                    <th className="py-3 px-3">Status Atual</th>
                    <th className="py-3 px-3">Alterar Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-6 text-center text-charcoal-muted">
                        Nenhum pedido encontrado no PostgreSQL.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => {
                      const currentStatus = o.status || o.payment_status || 'PAGAMENTO APROVADO';
                      return (
                        <tr key={o.id} className="hover:bg-cream-50/60 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-pastel-terracotta">
                            {o.order_code}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-charcoal">{o.customer_name}</div>
                            <div className="text-[11px] text-charcoal-muted">{o.customer_email}</div>
                          </td>
                          <td className="py-3 px-3 max-w-xs">
                            <div className="font-medium text-charcoal truncate" title={o.product_names || 'Produtos do Ateliê'}>
                              {o.product_names || 'Produtos do Ateliê'}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-bold text-charcoal whitespace-nowrap">
                            R$ {Number(o.total || 0).toFixed(2).replace('.', ',')}
                          </td>
                          <td className="py-3 px-3 uppercase text-[11px] font-semibold text-charcoal-muted">
                            {o.payment_method === 'pix' ? 'PIX' : 'Cartão de Crédito'}
                          </td>
                          <td className="py-3 px-3 font-mono font-semibold text-emerald-800">
                            {o.tracking_code || '—'}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                currentStatus === 'PAGAMENTO APROVADO'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : currentStatus === 'ENVIADO'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : currentStatus === 'ENTREGUE'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                  : currentStatus === 'CANCELADO'
                                  ? 'bg-red-100 text-red-800 border border-red-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {currentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <select
                              value={currentStatus}
                              disabled={statusUpdatingId === o.id}
                              onChange={(e) => handleStatusChange(o.id, e.target.value)}
                              className="px-2.5 py-1 rounded-xl bg-white border border-cream-300 text-charcoal text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pastel-peachDark"
                            >
                              {STATUS_OPTIONS.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUTOS */}
        {activeTab === 'produtos' && (
          <div className="bg-white rounded-3xl p-6 shadow-soft border border-[#EDE4D8] space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-charcoal-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar produto por nome ou categoria..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-cream-50 border border-cream-300 focus:outline-none focus:ring-2 focus:ring-pastel-peachDark"
                />
              </div>
              <button
                onClick={() => setShowProductForm(!showProductForm)}
                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 self-start shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{showProductForm ? 'Fechar Formulário' : '+ Novo Produto'}</span>
              </button>
            </div>

            {prodMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                {prodMsg}
              </div>
            )}

            {/* Form for new product */}
            {showProductForm && (
              <form onSubmit={handleCreateProduct} className="p-5 rounded-2xl bg-cream-50 border border-cream-200 space-y-3">
                <h4 className="font-display font-bold text-sm text-charcoal">Cadastrar Novo Produto</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-charcoal-muted mb-1">Nome *</label>
                    <input
                      type="text"
                      required
                      value={newProd.name}
                      onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                      placeholder="Ex: Amigurumi Gato Peludo"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-cream-300 text-charcoal"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-charcoal-muted mb-1">Preço (R$) *</label>
                    <input
                      type="text"
                      required
                      value={newProd.price}
                      onChange={(e) => setNewProd({ ...newProd, price: formatPriceInput(e.target.value) })}
                      placeholder="99,90"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-cream-300 text-charcoal"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-charcoal-muted mb-1">Categoria *</label>
                    <select
                      value={newProd.category}
                      onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-cream-300 text-charcoal"
                    >
                      <option value="amigurumis">Amigurumis</option>
                      <option value="quadros">Quadros</option>
                      <option value="chaveiros">Chaveiros</option>
                      <option value="casa">Cerâmica & Casa</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowProductForm(false)}
                    className="px-3 py-2 rounded-xl bg-white border border-cream-300 text-xs font-semibold text-charcoal"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingProd}
                    className="px-4 py-2 rounded-xl bg-pastel-terracotta hover:bg-[#c6604c] text-white text-xs font-bold"
                  >
                    {submittingProd ? 'Salvando...' : 'Salvar Produto'}
                  </button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-cream-200 text-charcoal-muted font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Item</th>
                    <th className="py-3 px-3">Categoria</th>
                    <th className="py-3 px-3">Preço</th>
                    <th className="py-3 px-3">Estoque</th>
                    <th className="py-3 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-cream-50/60 transition-colors">
                      <td className="py-3 px-3 flex items-center gap-3">
                        <img
                          src={safeImageUrl(p.image)}
                          alt={safeText(p.name)}
                          className="w-10 h-10 rounded-xl object-cover border border-cream-200 flex-shrink-0"
                        />
                        <div>
                          <div className="font-bold text-charcoal">{p.name}</div>
                          <div className="text-[11px] text-charcoal-muted truncate max-w-xs">{p.description}</div>
                        </div>
                      </td>
                      <td className="py-3 px-3 capitalize font-semibold text-charcoal-muted">{p.category}</td>
                      <td className="py-3 px-3 font-bold text-charcoal">
                        R$ {Number(p.price || 0).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="py-3 px-3 font-semibold text-charcoal">{p.in_stock ?? p.inStock ?? '—'} un</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onDeleteProduct && onDeleteProduct(p)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                          title="Excluir produto do catálogo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: USUÁRIOS CADASTRADOS */}
        {activeTab === 'usuarios' && (
          <div className="bg-white rounded-3xl p-6 shadow-soft border border-[#EDE4D8] space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-charcoal-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar usuário por nome, e-mail ou CPF..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-cream-50 border border-cream-300 focus:outline-none focus:ring-2 focus:ring-pastel-peachDark"
                />
              </div>
              <button
                onClick={loadUsers}
                disabled={loadingUsers}
                className="px-3.5 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-charcoal text-xs font-semibold flex items-center gap-1.5 self-start"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                <span>Atualizar Usuários</span>
              </button>
            </div>

            {usersError && (
              <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">
                {usersError}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-cream-200 text-charcoal-muted font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Nome</th>
                    <th className="py-3 px-3">E-mail</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">CPF</th>
                    <th className="py-3 px-3">Cidade / UF</th>
                    <th className="py-3 px-3">Telefone</th>
                    <th className="py-3 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-6 text-center text-charcoal-muted">
                        Nenhum usuário cadastrado no PostgreSQL.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isDefaultAdmin = u.email?.toLowerCase() === 'admin@patasartesanatos.com';
                      return (
                        <tr key={u.id} className="hover:bg-cream-50/60 transition-colors">
                          <td className="py-3 px-3 font-semibold text-charcoal">{u.name}</td>
                          <td className="py-3 px-3 font-mono text-[11px] text-charcoal-muted">{u.email}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                u.role === 'admin' || isDefaultAdmin
                                  ? 'bg-pastel-terracotta text-white'
                                  : 'bg-cream-200 text-charcoal'
                              }`}
                            >
                              {u.role || (isDefaultAdmin ? 'admin' : 'customer')}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-charcoal-muted">{u.cpf || '—'}</td>
                          <td className="py-3 px-3 text-charcoal">
                            {u.city ? `${u.city} - ${u.state}` : '—'}
                          </td>
                          <td className="py-3 px-3 text-charcoal-muted">{u.phone || '—'}</td>
                          <td className="py-3 px-3 text-right">
                            {!isDefaultAdmin && (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                                title="Excluir este usuário"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

