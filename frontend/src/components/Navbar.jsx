import React, { useState } from 'react';
import {
  ShoppingBag,
  Menu,
  X,
  Sparkles,
  UserCheck,
  UserPlus,
  LogIn,
  Database,
  LogOut,
  PlusCircle,
  ShieldCheck,
} from 'lucide-react';

export default function Navbar({
  cartCount,
  onOpenCart,
  activeCategory,
  onSelectCategory,
  customer,
  onOpenCustomerModal,
  onOpenDatabaseModal,
  onOpenMyOrdersModal,
  onLogoutCustomer,
  currentPath = '/',
  onNavigate,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin =
    customer?.role === 'admin' ||
    customer?.email?.toLowerCase() === 'admin@patasartesanatos.com';

  const navLinks = [
    { id: 'todos', label: 'Catálogo' },
    { id: 'amigurumis', label: 'Amigurumis' },
    { id: 'quadros', label: 'Quadros' },
    { id: 'chaveiros', label: 'Chaveiros' },
    { id: 'casa', label: 'Cerâmica & Casa' },
  ];

  const handleNavClick = (id) => {
    if (onNavigate && currentPath !== '/') {
      onNavigate('/');
    }
    onSelectCategory(id);
    setMobileMenuOpen(false);
    setTimeout(() => {
      const catalogElem = document.getElementById('catalogo');
      if (catalogElem) {
        catalogElem.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  return (
    <>
      {/* Top micro-announcement banner */}
      <div className="bg-gradient-to-r from-pastel-peach via-pastel-rose to-pastel-lavender text-charcoal py-1.5 px-4 text-xs sm:text-sm font-medium text-center border-b border-pastel-peachDark/20 flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-pastel-coral animate-wiggle" />
        <span>
          Frete Grátis acima de R$ 199 • Pagamento via PIX e Cartão • Mimos em cada caixinha! 🐾
        </span>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#FAF6F0]/90 backdrop-blur-md border-b border-[#EFE7DC] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2">
          {/* Logo */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('/');
            }}
            className="flex items-center gap-3 group flex-shrink-0"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-pastel-peach to-pastel-rose flex items-center justify-center shadow-soft group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
              <span className="text-2xl select-none" role="img" aria-label="pata de gato">
                🐾
              </span>
            </div>
            <div>
              <span className="font-display font-bold text-lg sm:text-2xl tracking-tight text-charcoal group-hover:text-pastel-terracotta transition-colors">
                Patas & Ponto
              </span>
              <p className="text-[11px] font-medium text-charcoal-muted tracking-wide flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-pastel-mintDark"></span>
                Ateliê Afetivo Animal
              </p>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1 bg-white/70 px-3 py-1.5 rounded-full border border-cream-200 shadow-sm">
            {navLinks.map((link) => {
              const isActive = activeCategory === link.id && currentPath === '/';
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-pastel-peach text-charcoal shadow-sm'
                      : 'text-charcoal-muted hover:text-charcoal hover:bg-cream-100'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Database Viewer Button, Painel Admin / Sair or Criar Conta / Entrar na Conta */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* View PostgreSQL Database Button (Visible ONLY to Admin) */}
            {isAdmin && (
              <button
                onClick={onOpenDatabaseModal}
                id="view-database-button"
                title="Visualizar Banco de Dados PostgreSQL (Acesso Exclusivo do Administrador)"
                className="p-2.5 sm:px-3 sm:py-2.5 rounded-full bg-charcoal hover:bg-charcoal/90 text-white shadow-soft transition-all duration-200 flex items-center gap-1.5 active:scale-95"
              >
                <Database className="w-4 h-4 text-pastel-peach" />
                <span className="hidden xl:inline-block text-xs font-bold">
                  Banco de Dados
                </span>
              </button>
            )}

            {/* When Admin is Logged in: Replace buttons with "Painel Admin" and "Sair" */}
            {isAdmin ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onNavigate && onNavigate(currentPath === '/admin' ? '/' : '/admin')}
                  id="admin-panel-button"
                  title="Acessar o Painel Administrativo"
                  className={`p-2.5 sm:px-3.5 sm:py-2.5 rounded-full font-bold text-xs shadow-soft transition-all duration-200 flex items-center gap-1.5 active:scale-95 ${
                    currentPath === '/admin'
                      ? 'bg-pastel-terracotta text-white'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-pastel-peach" />
                  <span className="hidden sm:inline-block text-xs font-bold">
                    {currentPath === '/admin' ? 'Ver Loja' : 'Painel Admin'}
                  </span>
                </button>

                <button
                  onClick={onLogoutCustomer}
                  id="admin-logout-button"
                  title="Sair da conta de administrador"
                  className="p-2.5 sm:px-3 sm:py-2.5 rounded-full bg-white hover:bg-red-50 border border-red-200 text-red-600 shadow-soft transition-all duration-200 flex items-center gap-1 active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline-block text-xs font-bold">Sair</span>
                </button>
              </div>
            ) : customer?.email ? (
              /* Regular Customer Account Actions */
              <>
                <button
                  onClick={onOpenMyOrdersModal}
                  id="customer-my-orders-button"
                  title="Visualizar minhas compras"
                  className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-full bg-pastel-terracotta hover:bg-[#c6604c] text-white shadow-soft transition-all duration-200 flex items-center gap-1.5 active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span className="hidden sm:inline-block text-xs font-bold">
                    Meus Pedidos
                  </span>
                </button>

                <button
                  onClick={() => onOpenCustomerModal('new_product')}
                  id="customer-add-product-button"
                  title="Cadastrar novo produto na plataforma"
                  className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft transition-all duration-200 flex items-center gap-1.5 active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden md:inline-block text-xs font-bold">
                    Cadastrar Produto
                  </span>
                </button>

                <button
                  onClick={() => onOpenCustomerModal('register')}
                  id="customer-account-button"
                  title="Acessar Minha Conta"
                  className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-full border bg-pastel-mint/70 border-pastel-mintDark text-charcoal hover:bg-pastel-mint shadow-soft transition-all duration-200 flex items-center gap-1.5 active:scale-95"
                >
                  <UserCheck className="w-4 h-4 text-pastel-terracotta" />
                  <span className="hidden sm:inline-block text-xs font-bold max-w-[110px] truncate">
                    Conta: {customer.name.split(' ')[0]}
                  </span>
                </button>

                <button
                  onClick={onLogoutCustomer}
                  title="Sair da conta"
                  className="p-2.5 sm:px-3 sm:py-2.5 rounded-full bg-white hover:bg-red-50 border border-red-200 text-red-600 shadow-soft transition-all duration-200 flex items-center gap-1 active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline-block text-xs font-bold">Sair</span>
                </button>
              </>
            ) : (
              /* Side-by-side "Criar Conta" and "Entrar na Conta" buttons */
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenCustomerModal('register')}
                  id="customer-register-button"
                  title="Criar uma nova conta"
                  className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-full bg-pastel-terracotta hover:bg-[#c6604c] text-white shadow-soft transition-all duration-200 flex items-center gap-1.5 active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline-block text-xs font-bold">
                    Criar Conta
                  </span>
                </button>

                <button
                  onClick={() => onOpenCustomerModal('login')}
                  id="customer-login-button"
                  title="Entrar em uma conta já existente"
                  className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-full bg-white hover:bg-pastel-peach/50 border border-[#EFE7DC] text-charcoal shadow-soft transition-all duration-200 flex items-center gap-1.5 active:scale-95"
                >
                  <LogIn className="w-4 h-4 text-pastel-terracotta" />
                  <span className="hidden sm:inline-block text-xs font-bold">
                    Entrar na Conta
                  </span>
                </button>
              </div>
            )}

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              id="cart-button"
              aria-label="Abrir carrinho de compras"
              className="relative p-2.5 sm:px-3.5 sm:py-2.5 rounded-full bg-white hover:bg-cream-100 border border-[#EFE7DC] shadow-soft hover:shadow-soft-hover transition-all duration-300 flex items-center gap-2 group active:scale-95"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-charcoal group-hover:text-pastel-terracotta group-hover:-rotate-12 transition-transform duration-300" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 bg-pastel-coral text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce-gentle shadow-sm">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden md:inline-block text-xs font-semibold text-charcoal">
                Carrinho
              </span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Abrir menu de navegação"
              className="xl:hidden p-2.5 rounded-xl bg-white border border-[#EFE7DC] text-charcoal hover:bg-cream-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-[#FAF6F0] border-b border-[#EFE7DC] px-4 pt-2 pb-6 space-y-2 animate-in fade-in slide-in-from-top-3 duration-200">
            <p className="text-xs uppercase font-bold text-charcoal-light tracking-wider px-2 py-1">
              Categorias de Artesanato
            </p>
            {navLinks.map((link) => {
              const isActive = activeCategory === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-2xl text-sm font-semibold transition-colors flex items-center justify-between ${
                    isActive
                      ? 'bg-pastel-peach text-charcoal font-bold'
                      : 'text-charcoal-muted hover:bg-white'
                  }`}
                >
                  <span>{link.label}</span>
                  <span className="text-xs text-charcoal-light">🐾</span>
                </button>
              );
            })}

            <div className="pt-2 border-t border-cream-200 grid grid-cols-2 gap-2">
              {isAdmin ? (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onNavigate) onNavigate(currentPath === '/admin' ? '/' : '/admin');
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-pastel-peach" />
                    <span>{currentPath === '/admin' ? 'Ver Loja' : 'Painel Admin'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogoutCustomer();
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-600 flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair</span>
                  </button>
                </>
              ) : customer?.email ? (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onOpenMyOrdersModal) onOpenMyOrdersModal();
                    }}
                    className="col-span-2 px-4 py-2.5 rounded-2xl bg-pastel-terracotta text-white text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Meus Pedidos</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenCustomerModal('register');
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-pastel-mint/70 border border-pastel-mintDark text-xs font-bold text-charcoal flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4 text-pastel-terracotta" />
                    <span>Minha Conta</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogoutCustomer();
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-600 flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenCustomerModal('register');
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-pastel-terracotta text-white text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Criar Conta</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenCustomerModal('login');
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-white border border-cream-300 text-xs font-bold text-charcoal flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4 text-pastel-terracotta" />
                    <span>Entrar na Conta</span>
                  </button>
                </>
              )}
              {isAdmin && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenDatabaseModal();
                  }}
                  className="col-span-2 px-4 py-2.5 rounded-2xl bg-charcoal text-white text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Database className="w-4 h-4 text-pastel-peach" />
                  <span>Visualizar Banco de Dados PostgreSQL</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
