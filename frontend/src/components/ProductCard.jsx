import React, { useState } from 'react';
import { ShoppingBag, ShoppingCart, Heart, Star, Check, Sparkles, Eye, Trash2 } from 'lucide-react';
import { safeImageUrl, safeText } from '../utils/formatters';

export default function ProductCard({
  product,
  onAddToCart,
  onBuyNow,
  onDeleteProduct,
  onQuickView,
}) {
  const [isLiked, setIsLiked] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const isPostedProduct = Boolean(product.createdByEmail);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDeleteProduct) {
      onDeleteProduct(product);
    }
  };

  const handleAddToCartClick = (e) => {
    e.stopPropagation();
    const added = onAddToCart(product);
    if (added !== false) {
      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false);
      }, 1800);
    }
  };

  const handleBuyNowClick = (e) => {
    e.stopPropagation();
    if (onBuyNow) {
      onBuyNow(product);
    } else {
      onAddToCart(product);
    }
  };

  const getCategoryTheme = (cat) => {
    switch (cat) {
      case 'amigurumis':
        return 'bg-pastel-peach/80 text-charcoal border-pastel-peachDark/40';
      case 'quadros':
        return 'bg-pastel-mint/80 text-charcoal border-pastel-mintDark/40';
      case 'chaveiros':
        return 'bg-pastel-lavender/80 text-charcoal border-pastel-lavenderDark/40';
      case 'casa':
        return 'bg-pastel-rose/80 text-charcoal border-pastel-roseDark/40';
      default:
        return 'bg-cream-200 text-charcoal border-cream-300';
    }
  };

  return (
    <article
      onClick={() => onQuickView(product)}
      className="group relative bg-white rounded-3xl p-4 sm:p-5 border border-[#EDE4D8] shadow-card hover:shadow-card-hover transition-all duration-300 ease-out hover:-translate-y-2 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Image Container */}
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-cream-100 mb-4 border border-[#F3ECE2]">
          <img
            src={safeImageUrl(product.image)}
            alt={safeText(product.name)}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
          />

          {/* Gradient Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {product.badge && (
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-pastel-coral text-white shadow-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {product.badge}
              </span>
            )}
            <span
              className={`px-3 py-0.5 rounded-full text-[11px] font-semibold border backdrop-blur-sm ${getCategoryTheme(
                product.category
              )}`}
            >
              {product.categoryLabel}
            </span>
          </div>

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            aria-label={isLiked ? "Remover dos favoritos" : "Salvar nos favoritos"}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-cream-200 hover:scale-110 active:scale-95 transition-all duration-200"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isLiked ? 'fill-pastel-coral text-pastel-coral' : 'text-charcoal-light hover:text-pastel-coral'
              }`}
            />
          </button>

          {/* Quick View Pill Hint on hover */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-10 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-charcoal text-xs font-semibold shadow-md">
            <Eye className="w-3.5 h-3.5 text-pastel-terracotta" />
            <span>Ver detalhes</span>
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-2 text-left">
          {/* Reviews & Stock */}
          <div className="flex items-center justify-between text-xs text-charcoal-muted">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-charcoal">{product.rating}</span>
              <span className="text-[11px]">({product.reviewsCount})</span>
            </div>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {product.inStock} em estoque
            </span>
          </div>

          {/* Title */}
          <h3 className="font-display font-bold text-base sm:text-lg text-charcoal leading-snug line-clamp-1 group-hover:text-pastel-terracotta transition-colors">
            {product.name}
          </h3>

          {/* Description snippet */}
          <p className="text-xs text-charcoal-muted line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-charcoal-light font-medium">
              Tamanho: {product.dimensions}
            </p>
            {isPostedProduct && onDeleteProduct && (
              <button
                type="button"
                onClick={handleDeleteClick}
                id={`delete-btn-${product.id}`}
                title="Excluir produto postado"
                className="px-2.5 py-1 rounded-xl bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pricing & Cart + Buy Buttons Section */}
      <div className="pt-4 mt-3 border-t border-cream-200 flex items-center justify-between gap-2">
        {/* Price display */}
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-extrabold text-lg sm:text-xl text-charcoal">
              R$ {product.price.toFixed(2).replace('.', ',')}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-charcoal-light line-through">
                R$ {product.originalPrice.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>
          <span className="block text-[10px] text-charcoal-muted font-medium">
            PIX ou até 6x no cartão
          </span>
        </div>

        {/* Cart Symbol Button + Direct Buy Button */}
        <div className="flex items-center gap-2">
          {/* Add to Cart Symbol Button */}
          <button
            type="button"
            onClick={handleAddToCartClick}
            id={`add-cart-btn-${product.id}`}
            title="Adicionar ao carrinho"
            aria-label="Adicionar ao carrinho"
            className={`p-2.5 rounded-2xl border transition-all duration-300 flex items-center justify-center shadow-sm ${
              isAdded
                ? 'bg-emerald-600 border-emerald-600 text-white scale-105'
                : 'bg-cream-100 hover:bg-pastel-peach border-[#E3D7C5] text-charcoal hover:text-pastel-terracotta hover:scale-105 active:scale-95'
            }`}
          >
            {isAdded ? (
              <Check className="w-4 h-4 animate-bounce" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
          </button>

          {/* Buy Now Button (goes straight to Payment) */}
          <button
            type="button"
            onClick={handleBuyNowClick}
            id={`buy-btn-${product.id}`}
            className="px-4 sm:px-4.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm bg-pastel-terracotta hover:bg-[#c6604c] text-white hover:shadow-soft-hover hover:scale-105 active:scale-95"
          >
            <ShoppingBag className="w-4 h-4 transition-transform group-hover:-rotate-6" />
            <span>Comprar</span>
          </button>
        </div>
      </div>
    </article>
  );
}
