import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import ProductGrid from './components/ProductGrid';
import Features from './components/Features';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import ProductModal from './components/ProductModal';
import CustomerModal from './components/CustomerModal';
import DatabaseModal from './components/DatabaseModal';
import AdminDashboard from './components/AdminDashboard';
import MyOrdersModal from './components/MyOrdersModal';
import { PRODUCTS } from './data/products';
import { fetchProducts, deleteProduct, logoutCustomerSession } from './services/api';

export default function App() {
  const [products, setProducts] = useState(PRODUCTS);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartInitialStep, setCartInitialStep] = useState('cart');
  const [activeCategory, setActiveCategory] = useState('todos');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [authRequiredNotice, setAuthRequiredNotice] = useState(null);
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || '/');

  // Customer Registration & Login State
  const [customer, setCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem('miau_customer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isAdmin =
    customer?.role === 'admin' ||
    customer?.email?.toLowerCase() === 'admin@patasartesanatos.com';

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (currentPath === '/admin' && !isAdmin) {
      navigate('/');
      setToastMessage('Acesso restrito ao Administrador Geral.');
    }
  }, [currentPath, isAdmin]);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerModalMode, setCustomerModalMode] = useState('register'); // 'register' | 'login'

  // Admin PostgreSQL Database Viewer Modal State
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);

  const isAnyOverlayOpen =
    isCustomerModalOpen ||
    isDatabaseModalOpen ||
    isMyOrdersOpen ||
    isCartOpen ||
    isModalOpen ||
    Boolean(authRequiredNotice);

  // Lock background page scroll whenever a modal/drawer is open
  useEffect(() => {
    if (isAnyOverlayOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isAnyOverlayOpen]);

  const loadCatalogFromPostgres = useCallback(async () => {
    try {
      const dbProducts = await fetchProducts();
      if (Array.isArray(dbProducts) && dbProducts.length > 0) {
        setProducts(dbProducts);
      }
    } catch {
      // Fallback to local static catalog if backend is starting
    }
  }, []);

  useEffect(() => {
    loadCatalogFromPostgres();
  }, [loadCatalogFromPostgres]);

  const handleOpenCustomerModal = (mode = 'register') => {
    setCustomerModalMode(mode);
    setIsCustomerModalOpen(true);
  };

  const handleCustomerSaved = (savedCustomer) => {
    setCustomer(savedCustomer);
    try {
      localStorage.setItem('miau_customer', JSON.stringify(savedCustomer));
    } catch {
      // ignore storage errors
    }
    showToast(
      `Bem-vindo(a), ${savedCustomer.name.split(' ')[0]}! Sua conta está ativa 🐾`
    );
  };

  const handleCustomerLogout = () => {
    logoutCustomerSession();
    setCustomer(null);
    setIsCartOpen(false);
    setCartItems([]);
    try {
      localStorage.removeItem('miau_customer');
    } catch {
      // ignore storage errors
    }
    if (currentPath === '/admin') {
      navigate('/');
    }
    showToast('Você saiu da sua conta. Até logo! 🐾');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleProductPosted = () => {
    showToast('🎉 Produto postado com sucesso !!');
    setTimeout(() => {
      const catalogElem = document.getElementById('catalogo');
      if (catalogElem) {
        catalogElem.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  const handleDeleteProduct = async (product) => {
    try {
      await deleteProduct(product.id, customer?.email || '');
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setCartItems((prev) => prev.filter((item) => item.id !== product.id));
      showToast(`🗑️ Produto "${product.name}" excluído com sucesso!`);
      await loadCatalogFromPostgres();
    } catch (err) {
      showToast(err.message || 'Erro ao excluir produto.');
    }
  };

  // Cart total count
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Add item to cart (Requires logged-in account)
  const handleAddToCart = (product, qty = 1) => {
    if (!customer) {
      const msg =
        'É necessário estar logado na sua conta para adicionar produtos ao carrinho!';
      setAuthRequiredNotice(msg);
      showToast('⚠️ É necessário estar logado na conta para adicionar ao carrinho!');
      return false;
    }

    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.id === product.id);
      if (existing) {
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prevItems, { ...product, quantity: qty }];
    });

    showToast(`"${product.name}" foi adicionado ao seu carrinho! 🐾`);
    return true;
  };

  // Buy Now -> Goes straight to Payment page (Requires logged-in account)
  const handleBuyNow = (product, qty = 1) => {
    if (!customer) {
      const msg =
        'É necessário estar logado na sua conta para comprar produtos e acessar a página de pagamento!';
      setAuthRequiredNotice(msg);
      showToast('⚠️ É necessário estar logado na conta para comprar!');
      return false;
    }

    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.id === product.id);
      if (existing) {
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.max(item.quantity, qty) }
            : item
        );
      }
      return [...prevItems, { ...product, quantity: qty }];
    });

    setCartInitialStep('checkout');
    setIsCartOpen(true);
    return true;
  };

  const handleOpenCart = () => {
    if (!customer) {
      const msg =
        'É necessário estar logado na sua conta para acessar o carrinho e pagamentos!';
      setAuthRequiredNotice(msg);
      showToast('⚠️ É necessário estar logado na conta!');
      return;
    }
    setCartInitialStep('cart');
    setIsCartOpen(true);
  };

  // Update item quantity
  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Remove item from cart
  const handleRemoveItem = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  // Clear cart
  const handleClearCart = () => {
    setCartItems([]);
  };

  // Quick view
  const handleQuickView = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleScrollToCatalog = () => {
    const catalogElem = document.getElementById('catalogo');
    if (catalogElem) {
      catalogElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0] text-charcoal font-sans selection:bg-pastel-peachDark selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-charcoal text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300 border border-white/20">
          <span className="text-xl">🐾</span>
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Login Required Warning Modal */}
      {authRequiredNotice && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            onClick={() => setAuthRequiredNotice(null)}
            className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm"
          />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#EDE4D8] z-10 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl">
              🔒
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-bold text-xl text-charcoal">
                É necessário estar logado na conta
              </h3>
              <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                {authRequiredNotice}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthRequiredNotice(null);
                  handleOpenCustomerModal('login');
                }}
                className="py-3 px-4 rounded-2xl bg-pastel-terracotta hover:bg-[#c6604c] text-white font-bold text-xs sm:text-sm shadow-soft transition-colors"
              >
                Entrar na Conta
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthRequiredNotice(null);
                  handleOpenCustomerModal('register');
                }}
                className="py-3 px-4 rounded-2xl bg-pastel-peach hover:bg-pastel-peachDark text-charcoal font-bold text-xs sm:text-sm border border-pastel-peachDark/40 transition-colors"
              >
                Criar Conta
              </button>
            </div>
            <button
              type="button"
              onClick={() => setAuthRequiredNotice(null)}
              className="text-xs font-semibold text-charcoal-light hover:text-charcoal transition-colors pt-1"
            >
              Continuar olhando a loja
            </button>
          </div>
        </div>
      )}

      {/* Site Content Wrapper (Locked and non-interactive when Criar/Entrar na Conta modal is open) */}
      <div
        className={
          isCustomerModalOpen
            ? 'pointer-events-none select-none overflow-hidden h-screen'
            : 'flex flex-col flex-1'
        }
        aria-hidden={isCustomerModalOpen}
      >
        {/* Header / Navbar */}
        <Navbar
          cartCount={cartCount}
          onOpenCart={handleOpenCart}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          customer={customer}
          onOpenCustomerModal={handleOpenCustomerModal}
          onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
          onOpenMyOrdersModal={() => setIsMyOrdersOpen(true)}
          onLogoutCustomer={handleCustomerLogout}
          currentPath={currentPath}
          onNavigate={navigate}
        />

        {/* Main Content: Admin Dashboard or Storefront */}
        {currentPath === '/admin' && isAdmin ? (
          <AdminDashboard
            customer={customer}
            products={products}
            onProductsUpdated={loadCatalogFromPostgres}
            onDeleteProduct={handleDeleteProduct}
            onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
            onNavigateHome={() => navigate('/')}
          />
        ) : (
          <main className="flex-1">
            {/* Hero Section */}
            <HeroBanner onExploreClick={handleScrollToCatalog} />

            {/* Product Catalog Grid */}
            <ProductGrid
              products={products}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              onDeleteProduct={handleDeleteProduct}
              onQuickView={handleQuickView}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
            />

            {/* Artisanal Values & Story Section */}
            <Features />
          </main>
        )}

        {/* Simple & Warm Footer */}
        <Footer
          customer={customer}
          onSelectCategory={setActiveCategory}
          onOpenCustomerModal={handleOpenCustomerModal}
          onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
        />
      </div>

      {/* Interactive Slide-out Cart & Checkout Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        customer={customer}
        onCustomerSaved={handleCustomerSaved}
        onOrderCreated={loadCatalogFromPostgres}
        initialStep={cartInitialStep}
        onOpenAuthModal={handleOpenCustomerModal}
      />

      {/* Quick View Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        product={selectedProduct}
        onClose={() => setIsModalOpen(false)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        onDeleteProduct={handleDeleteProduct}
      />

      {/* Customer Registration & Login Modal (Criar Conta / Entrar na Conta / Minha Conta) */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customer={customer}
        onCustomerSaved={handleCustomerSaved}
        onLogout={handleCustomerLogout}
        initialAuthMode={customerModalMode}
        onProductsUpdated={loadCatalogFromPostgres}
        onProductPosted={handleProductPosted}
        onDeleteProduct={handleDeleteProduct}
        products={products}
        onNavigateAdmin={() => navigate('/admin')}
      />

      {/* Protected PostgreSQL Database Viewer Modal */}
      <DatabaseModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        onProductsUpdated={loadCatalogFromPostgres}
        customer={customer}
      />

      {/* Customer Order History Modal (Minhas Compras / Meus Pedidos) */}
      <MyOrdersModal
        isOpen={isMyOrdersOpen}
        onClose={() => setIsMyOrdersOpen(false)}
        customer={customer}
      />
    </div>
  );
}
