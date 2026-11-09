import React from 'react';
import { ArrowDown, Heart } from 'lucide-react';

export default function HeroBanner({ onExploreClick }) {
  return (
    <section className="relative overflow-hidden pt-6 pb-14 sm:pt-10 sm:pb-20 lg:pt-14 lg:pb-24">
      {/* Subtle background ambient pastel blurs */}
      <div className="absolute top-10 left-1/4 w-72 h-72 bg-pastel-peach/40 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-subtle" />
      <div className="absolute top-20 right-10 w-96 h-96 bg-pastel-rose/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-5 left-10 w-80 h-80 bg-pastel-mint/35 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headlines & CTA */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-pastel-peachDark/30 text-xs sm:text-sm font-semibold text-charcoal shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-pastel-coral animate-ping" />
              <span>Feito à mão para apaixonados por animais 🐾</span>
              <span role="img" aria-label="crochê">
                🧶
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-bold text-charcoal tracking-tight leading-[1.15]">
              Mimos artesanais que transformam{' '}
              <span className="relative inline-block text-pastel-terracotta">
                amor pelos bichos
                <svg
                  className="absolute -bottom-2 left-0 w-full text-pastel-peachDark"
                  viewBox="0 0 200 9"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.5 7C45 2.5 155 1.5 197.5 7"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{' '}
              em aconchego para o seu lar.
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-charcoal-muted max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              De gatinhos e cachorrinhos a capivaras, coelhos, raposas e ursinhos: peças únicas em crochê (amigurumis), quadros botânicos, cerâmicas e chaveiros bordados à mão com todo carinho.
            </p>

            {/* Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={onExploreClick}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-pastel-terracotta hover:bg-[#c9624e] text-white font-bold text-base shadow-soft-hover hover:scale-102 hover:-translate-y-0.5 active:scale-98 transition-all duration-300 flex items-center justify-center gap-3 group"
              >
                <span>Explorar Coleção de Bichinhos</span>
                <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
              </button>

              <a
                href="#sobre"
                className="w-full sm:w-auto px-7 py-4 rounded-full bg-white hover:bg-cream-100 text-charcoal font-semibold text-base border border-[#E8DEC0]/80 shadow-soft transition-all duration-300 flex items-center justify-center gap-2 hover:border-pastel-coral/50"
              >
                <Heart className="w-4 h-4 text-pastel-coral fill-pastel-coral" />
                <span>Nossa Filosofia Afetiva</span>
              </a>
            </div>

            {/* Micro Trust Indicators */}
            <div className="pt-4 grid grid-cols-3 gap-2 sm:gap-4 border-t border-[#EFE7DC] max-w-lg mx-auto lg:mx-0">
              <div className="flex flex-col items-center lg:items-start">
                <span className="font-display font-bold text-xl sm:text-2xl text-charcoal">
                  +3.800
                </span>
                <span className="text-xs text-charcoal-muted font-medium">
                  Bichinhos Entregues
                </span>
              </div>
              <div className="flex flex-col items-center lg:items-start">
                <span className="font-display font-bold text-xl sm:text-2xl text-charcoal">
                  5.0 ★
                </span>
                <span className="text-xs text-charcoal-muted font-medium">
                  Avaliação dos Pet Lovers
                </span>
              </div>
              <div className="flex flex-col items-center lg:items-start">
                <span className="font-display font-bold text-xl sm:text-2xl text-charcoal">
                  100%
                </span>
                <span className="text-xs text-charcoal-muted font-medium">
                  Artesanal & Autoral
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5 relative flex justify-center">
            {/* Outer Decorative Card Frame */}
            <div className="relative w-full max-w-md">
              {/* Floating Pill Top Left */}
              <div className="absolute -top-4 -left-4 sm:-left-6 z-20 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-card border border-pastel-peach/60 flex items-center gap-2.5 animate-float">
                <span className="w-8 h-8 rounded-full bg-pastel-mint flex items-center justify-center text-sm shadow-inner">
                  🐾
                </span>
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold text-charcoal-light tracking-wider">
                    Crochê & Arte Animal
                  </p>
                  <p className="text-xs font-bold text-charcoal">100% Algodão Nobre</p>
                </div>
              </div>

              {/* Main Image Frame */}
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white bg-white group">
                <img
                  src="/images/hero.jpg"
                  alt="Mesa de trabalho artesanal com amigurumis de bichinhos, novelos em tons pastéis e quadro decorativo"
                  className="w-full h-[380px] sm:h-[440px] object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 via-transparent to-transparent opacity-60"></div>

                {/* Floating pill in bottom of the image */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-white/60 shadow-lg flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🐶🐱</span>
                    <div>
                      <p className="text-xs font-bold text-charcoal">
                        Gatos, Cães & Amigos do Bosque
                      </p>
                      <p className="text-[10px] text-charcoal-muted">
                        Materiais atóxicos, macios e seguros
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-pastel-peach text-charcoal-dark text-[11px] font-bold rounded-lg">
                    Slow Made
                  </span>
                </div>
              </div>

              {/* Floating Pill Bottom Right */}
              <div className="absolute -bottom-4 -right-4 sm:-right-6 z-20 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-card border border-pastel-rose/60 flex items-center gap-3 animate-bounce-gentle">
                <div className="w-9 h-9 rounded-full bg-pastel-rose flex items-center justify-center text-pastel-terracotta">
                  <Heart className="w-5 h-5 fill-pastel-coral text-pastel-coral" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-charcoal">Feito Sob Encomenda</p>
                  <p className="text-[10px] text-charcoal-muted">Ou a pronta entrega</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
