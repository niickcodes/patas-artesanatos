import React, { useState, useMemo } from 'react';
import ProductCard from './ProductCard';
import CategoryFilter from './CategoryFilter';
import { CATEGORIES } from '../data/products';
import { Search, Sparkles, Filter } from 'lucide-react';

export default function ProductGrid({
  products,
  onAddToCart,
  onBuyNow,
  onDeleteProduct,
  onQuickView,
  activeCategory,
  onSelectCategory,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts = { todos: products.length };
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory = activeCategory === 'todos' || p.category === activeCategory;
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        return 0; // default featured
      });
  }, [products, activeCategory, searchQuery, sortBy]);

  return (
    <section id="catalogo" className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="text-center space-y-3 mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pastel-peach/60 text-xs font-bold text-charcoal border border-pastel-peachDark/30">
          <Sparkles className="w-3.5 h-3.5 text-pastel-coral" />
          <span>Catálogo Afetivo</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-display font-bold text-charcoal tracking-tight">
          Feito à mão para encantar seu espaço
        </h2>
        <p className="text-sm sm:text-base text-charcoal-muted max-w-xl mx-auto font-medium">
          Escolha entre peças exclusivas de amigurumis fofos, quadros botânicos com moldura e chaveirinhos cheios de personalidade.
        </p>
      </div>

      {/* Category Pills Bar */}
      <div className="mb-8">
        <CategoryFilter
          categories={CATEGORIES}
          activeCategory={activeCategory}
          onSelectCategory={onSelectCategory}
          counts={categoryCounts}
        />
      </div>

      {/* Search and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-white/60 p-3 sm:p-4 rounded-2xl border border-cream-200">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-charcoal-light absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por amigurumi, quadro, chaveiro..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-white border border-[#EFE7DC] text-charcoal placeholder:text-charcoal-light focus:outline-none focus:ring-2 focus:ring-pastel-peachDark/40 transition-all"
          />
        </div>

        {/* Sort Select */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          <span className="text-xs font-semibold text-charcoal-muted flex items-center gap-1.5 whitespace-nowrap">
            <Filter className="w-3.5 h-3.5 text-pastel-coral" />
            Ordenar por:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl bg-white border border-[#EFE7DC] text-charcoal focus:outline-none focus:ring-2 focus:ring-pastel-peachDark/40 transition-all cursor-pointer font-medium"
          >
            <option value="featured">Destaques</option>
            <option value="price-low">Menor Preço</option>
            <option value="price-high">Maior Preço</option>
            <option value="rating">Mais Bem Avaliados</option>
          </select>
        </div>

      </div>

      {/* Product Grid Container */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onBuyNow={onBuyNow}
              onDeleteProduct={onDeleteProduct}
              onQuickView={onQuickView}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white/70 rounded-3xl border border-cream-200 max-w-md mx-auto">
          <span className="text-5xl block mb-3 animate-wiggle">😿</span>
          <h3 className="font-display font-bold text-lg text-charcoal mb-1">
            Nenhum mimo encontrado
          </h3>
          <p className="text-xs text-charcoal-muted mb-4">
            Não encontramos nenhum produto com os termos buscados. Tente outra palavra ou limpe o filtro!
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              onSelectCategory('todos');
            }}
            className="px-4 py-2 rounded-xl bg-pastel-peach text-charcoal font-bold text-xs hover:bg-pastel-peachDark transition-colors"
          >
            Ver todos os produtos
          </button>
        </div>
      )}
    </section>
  );
}
