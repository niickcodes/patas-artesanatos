import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, X, RefreshCw, PackageCheck, AlertCircle, Calendar, Hash, Tag, Truck } from 'lucide-react';
import { fetchMyOrders } from '../services/api';

export default function MyOrdersModal({ isOpen, onClose, customer }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadOrders = useCallback(async () => {
    if (!customer) return;
    setLoading(true);
    setError(null);
    try {
      const auth = {
        token: customer.token || customer.adminToken || '',
        email: customer.email,
      };
      const data = await fetchMyOrders(auth);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Erro ao carregar seu histórico de compras.');
    } finally {
      setLoading(false);
    }
  }, [customer]);

  useEffect(() => {
    if (isOpen) {
      loadOrders();
    }
  }, [isOpen, loadOrders]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-[#FAF6F0] rounded-3xl shadow-2xl border border-[#EDE4D8] overflow-hidden z-10 my-auto">
        {/* Top Header */}
        <div className="px-6 py-4 bg-charcoal text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pastel-terracotta flex items-center justify-center text-white shadow-sm">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-white">
                Minhas Compras 🐾
              </h3>
              <p className="text-xs text-white/70">
                Histórico exclusivo de compras vinculadas a <strong className="text-white">{customer?.email}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadOrders}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Recarregar compras"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-charcoal-muted space-y-2">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin text-pastel-terracotta" />
              <p className="text-xs font-medium">Buscando suas compras no PostgreSQL...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-charcoal-muted space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-cream-100 mx-auto flex items-center justify-center text-charcoal-light">
                <PackageCheck className="w-7 h-7" />
              </div>
              <p className="font-display font-bold text-base text-charcoal">
                Você ainda não realizou compras
              </p>
              <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
                Explore nosso catálogo artesanal e adicione mimos ao carrinho para realizar o seu primeiro pedido!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-sm">
                  <thead>
                    <tr className="border-b border-cream-200 bg-cream-50 text-charcoal-muted font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3.5">Código do Pedido</th>
                      <th className="py-3 px-3.5">Data</th>
                      <th className="py-3 px-3.5">Produto(s)</th>
                      <th className="py-3 px-3.5">Valor Total</th>
                      <th className="py-3 px-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-100">
                    {orders.map((o) => {
                      const formattedDate = o.created_at
                        ? new Date(o.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—';
                      const currentStatus = o.status || 'PAGAMENTO APROVADO';

                      return (
                        <tr key={o.id} className="hover:bg-cream-50/50 transition-colors">
                          <td className="py-3.5 px-3.5 font-mono font-bold text-pastel-terracotta">
                            {o.order_code}
                            {o.tracking_code && (
                              <div className="text-[10px] font-mono text-emerald-800 flex items-center gap-1 mt-0.5">
                                <Truck className="w-3 h-3 text-emerald-600" />
                                <span>{o.tracking_code}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-3.5 text-charcoal-muted whitespace-nowrap">
                            {formattedDate}
                          </td>
                          <td className="py-3.5 px-3.5 font-medium text-charcoal max-w-xs">
                            <span className="line-clamp-2">{o.product_names || 'Produtos do Ateliê'}</span>
                          </td>
                          <td className="py-3.5 px-3.5 font-bold text-charcoal whitespace-nowrap">
                            R$ {Number(o.total || 0).toFixed(2).replace('.', ',')}
                          </td>
                          <td className="py-3.5 px-3.5 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {currentStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

