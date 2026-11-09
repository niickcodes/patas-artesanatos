import React from 'react';
import { Heart } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: '🧶',
      title: 'Ponto a Ponto com Amor',
      description:
        'Cada amigurumi e chaveiro de bichinho é tecido manualmente por artesãs apaixonadas por animais, com fios 100% algodão nobre.',
      bgColor: 'bg-pastel-peach/40',
      borderColor: 'border-pastel-peachDark/30',
    },
    {
      icon: '🌿',
      title: 'Seguro para a Casa e Pets',
      description:
        'Materiais atóxicos, tintas botânicas à base de água nos quadros e olhos com trava de segurança reforçada em todos os bichinhos.',
      bgColor: 'bg-pastel-mint/40',
      borderColor: 'border-pastel-mintDark/30',
    },
    {
      icon: '🎁',
      title: 'Embalagem Especial Afetiva',
      description:
        'Tudo chega perfumado com aroma suave de lavanda, laço de cetim, cartão artesanal e mimos exclusivos na sua caixinha.',
      bgColor: 'bg-pastel-rose/40',
      borderColor: 'border-pastel-roseDark/30',
    },
    {
      icon: '🎨',
      title: 'Personalização do seu Pet',
      description:
        'Podemos reproduzir as manchinhas e características únicas do seu gatinho, cachorrinho, coelho ou outro bichinho sob encomenda!',
      bgColor: 'bg-pastel-lavender/40',
      borderColor: 'border-pastel-lavenderDark/30',
    },
  ];

  return (
    <section id="sobre" className="py-16 sm:py-20 bg-white/50 border-y border-[#EDE4D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pastel-mint/60 text-xs font-bold text-charcoal border border-pastel-mintDark/30">
            <Heart className="w-3.5 h-3.5 fill-pastel-terracotta text-pastel-terracotta" />
            <span>Nosso Cuidado</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-charcoal tracking-tight">
            O valor de um artesanato autoral
          </h2>
          <p className="text-sm sm:text-base text-charcoal-muted font-medium">
            Em um mundo industrializado, nós escolhemos o ritmo do afeto, do detalhe e da dedicação pura a todos que amam os animais.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-3xl ${feat.bgColor} border ${feat.borderColor} transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft`}
            >
              <div className="text-3xl mb-4 w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                {feat.icon}
              </div>
              <h3 className="font-display font-bold text-base text-charcoal mb-2">
                {feat.title}
              </h3>
              <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
