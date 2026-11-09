import React, { useState } from 'react';
import { Heart, Send, Check, Database, UserCheck } from 'lucide-react';

export default function Footer({
  customer,
  onSelectCategory,
  onOpenCustomerModal,
  onOpenDatabaseModal,
}) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const isAdmin =
    customer?.role === 'admin' ||
    customer?.email?.toLowerCase() === 'admin@patasartesanatos.com';

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail('');
      }, 3000);
    }
  };

  const handleCategoryClick = (category) => {
    onSelectCategory(category);
    const catalogElem = document.getElementById('catalogo');
    if (catalogElem) {
      catalogElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#F5EFE6] border-t border-[#E8DEC0] pt-14 pb-10 text-charcoal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-[#E3D7C5]">
          {/* Brand Info */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-pastel-peach flex items-center justify-center text-xl shadow-soft">
                🐾
              </div>
              <span className="font-display font-bold text-xl text-charcoal">
                Patas & Ponto
              </span>
            </div>
            <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed max-w-sm">
              Ateliê artesanal dedicado à criação de peças únicas em crochê, quadros com ilustrações exclusivas, cerâmicas e chaveiros de gatinhos, cachorros, capivaras, coelhos e bichinhos para quem ama os animais.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={() => onOpenCustomerModal('register')}
                className="px-3.5 py-2 rounded-xl bg-pastel-terracotta hover:bg-[#c6604c] text-xs font-bold text-white flex items-center gap-1.5 shadow-sm transition-all"
              >
                <UserCheck className="w-4 h-4" />
                <span>Criar Conta</span>
              </button>
              <button
                onClick={() => onOpenCustomerModal('login')}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-pastel-peach border border-cream-300 text-xs font-bold text-charcoal flex items-center gap-1.5 shadow-sm transition-all"
              >
                <UserCheck className="w-4 h-4 text-pastel-terracotta" />
                <span>Entrar na Conta</span>
              </button>
              {isAdmin && (
                <button
                  onClick={onOpenDatabaseModal}
                  className="px-3.5 py-2 rounded-xl bg-charcoal hover:bg-charcoal/90 text-xs font-bold text-white flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Database className="w-4 h-4 text-pastel-peach" />
                  <span>Visualizar Banco de Dados</span>
                </button>
              )}
            </div>
          </div>

          {/* Catalog Quick Links */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-charcoal">
              Coleções de Bichinhos
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-charcoal-muted font-medium">
              <li>
                <button
                  onClick={() => handleCategoryClick('amigurumis')}
                  className="hover:text-pastel-terracotta transition-colors flex items-center gap-1.5"
                >
                  <span>🧶 Amigurumis em Crochê</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('quadros')}
                  className="hover:text-pastel-terracotta transition-colors flex items-center gap-1.5"
                >
                  <span>🖼️ Quadros Decorativos</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('chaveiros')}
                  className="hover:text-pastel-terracotta transition-colors flex items-center gap-1.5"
                >
                  <span>🔑 Chaveiros Fofos</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('casa')}
                  className="hover:text-pastel-terracotta transition-colors flex items-center gap-1.5"
                >
                  <span>☕ Cerâmica & Casa</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-charcoal">
              Clube das Patinhas 💌
            </h4>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Receba cupons de desconto, fotos dos novos bichinhos em crochê e novidades quentinhas no seu e-mail.
            </p>
            {subscribed ? (
              <div className="p-3 rounded-2xl bg-pastel-mint border border-pastel-mintDark/40 flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                <Check className="w-4 h-4 text-emerald-700" />
                <span>Obrigada! Você receberá nosso carinho em breve. 🐾</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu melhor e-mail..."
                  className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-pastel-terracotta hover:bg-[#c6604c] text-white font-bold text-xs shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5"
                >
                  <span>Assinar</span>
                  <Send className="w-3 h-3" />
                </button>
              </form>
            )}
            <p className="text-[11px] text-charcoal-light">
              Prometemos nunca enviar spam, apenas amor e bichinhos fofos!
            </p>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Payment Badges */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-charcoal-muted">
          <p className="flex items-center gap-1">
            © {new Date().getFullYear()} Patas & Ponto. Feito com{' '}
            <Heart className="w-3.5 h-3.5 fill-pastel-coral text-pastel-coral inline" />{' '}
            para todos os apaixonados por animais.
          </p>

          <div className="flex items-center gap-2 text-[11px] font-semibold text-charcoal-light">
            <span className="px-2.5 py-1 bg-white rounded-md border border-cream-200 text-emerald-700 font-bold">
              PIX Instantâneo
            </span>
            <span className="px-2.5 py-1 bg-white rounded-md border border-cream-200 text-charcoal">
              Cartão de Crédito (6x)
            </span>
            <span className="px-2.5 py-1 bg-white rounded-md border border-cream-200 text-pastel-terracotta font-mono">
              PostgreSQL
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
