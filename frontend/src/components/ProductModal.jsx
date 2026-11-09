import React, { useState } from 'react';
import { X, Star, ShoppingBag, ShoppingCart, Check, ShieldCheck, Sparkles, Package, Trash2 } from 'lucide-react';
import { safeImageUrl, safeText } from '../utils/formatters';

export default function ProductModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onBuyNow,
  onDeleteProduct,
}) {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  if (!isOpen || !product) return null;

  const isPostedProduct = Boolean(product.createdByEmail);

  const handleAdd = () => {
    const added = onAddToCart(product, quantity);
    if (added === false) return;
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 1000);
  };

  const handleBuy = () => {
    if (onBuyNow) {
      const ok = onBuyNow(product, quantity);
      if (ok !== false) {
        onClose();
      }
    } else {
      handleAdd();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-cream-200 z-10 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-cream-100 hover:bg-cream-200 text-charcoal-muted hover:text-charcoal transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          {/* Image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-cream-100 border border-cream-200 shadow-inner">
            <img
              src={safeImageUrl(product.image)}
              alt={safeText(product.name)}
              className="w-full h-full object-cover object-center"
            />
            {product.badge && (
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-pastel-coral text-white shadow-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {product.badge}
              </span>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <span className="text-xs uppercase font-bold text-pastel-terracotta tracking-wider">
                {product.categoryLabel}
              </span>
              <h3 className="font-display font-bold text-xl sm:text-2xl text-charcoal mt-1">
                {product.name}
              </h3>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <span className="text-xs font-bold text-charcoal">{product.rating}</span>
                <span className="text-xs text-charcoal-muted">({product.reviewsCount} avaliações)</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="font-display font-extrabold text-2xl text-charcoal">
                R$ {product.price.toFixed(2).replace('.', ',')}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-charcoal-light line-through">
                  R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
              {product.description}
            </p>

            {/* Highlights */}
            <div className="bg-cream-100 p-3 rounded-2xl text-xs space-y-1 text-charcoal-muted border border-[#EDE4D8]">
              <div className="flex items-center gap-2 font-semibold text-charcoal">
                <Package className="w-3.5 h-3.5 text-pastel-coral" />
                <span>Dimensões: {product.dimensions}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-pastel-mintDark" />
                <span>Acabamento atóxico & higienizado</span>
              </div>
            </div>

            {/* Add to Cart Symbol + Buy Now Actions */}
            <div className="pt-2 flex items-center gap-2.5">
              <div className="flex items-center border border-cream-200 rounded-xl bg-cream-50 p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg text-charcoal font-bold hover:bg-white transition-colors"
                >
                  -
                </button>
                <span className="w-8 text-center text-sm font-bold text-charcoal">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-lg text-charcoal font-bold hover:bg-white transition-colors"
                >
                  +
                </button>
              </div>

              {/* Cart Symbol Button */}
              <button
                type="button"
                onClick={handleAdd}
                title="Adicionar ao carrinho"
                aria-label="Adicionar ao carrinho"
                className={`p-3.5 rounded-xl font-bold text-sm border transition-all duration-300 flex items-center justify-center shadow-sm ${
                  justAdded
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-cream-100 hover:bg-pastel-peach border-[#E3D7C5] text-charcoal hover:text-pastel-terracotta hover:scale-105 active:scale-95'
                }`}
              >
                {justAdded ? (
                  <Check className="w-5 h-5 animate-bounce" />
                ) : (
                  <ShoppingCart className="w-5 h-5" />
                )}
              </button>

              {/* Direct Buy Button -> Goes straight to Payment */}
              <button
                type="button"
                onClick={handleBuy}
                className="flex-1 py-3.5 px-4 rounded-xl font-bold text-sm shadow-soft transition-all duration-300 flex items-center justify-center gap-2 bg-pastel-terracotta hover:bg-[#c6604c] text-white hover:scale-102 active:scale-98"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Comprar</span>
              </button>
            </div>

            {isPostedProduct && onDeleteProduct && (
              <div className="pt-2 border-t border-cream-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onDeleteProduct(product);
                    onClose();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Produto Postado</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
