import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Truck,
  CheckCircle2,
  CreditCard,
  QrCode,
  Copy,
  Check,
  Lock,
  Mail,
  User,
  MapPin,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { createOrder } from '../services/api';
import {
  BRAZIL_UFS,
  CITIES_BY_UF,
  formatCep,
  formatCpf,
  formatPhone,
  formatAddressNumber,
  formatTextOnly,
  formatComplement,
  getFallbackAddressByCep,
  lookupAddressByCep,
  validateAddressParts,
  safeImageUrl,
  safeText,
} from '../utils/formatters';

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  customer,
  onCustomerSaved,
  onOrderCreated,
  initialStep = 'cart',
  onOpenAuthModal,
}) {
  const [step, setStep] = useState(initialStep); // 'cart' | 'checkout' | 'complete'
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(initialStep || 'cart');
      setCheckoutError(null);
    }
  }, [isOpen, initialStep]);

  // Customer info in checkout
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    street: '',
    addressNumber: '',
    complement: '',
    neighborhood: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  // Payment method: 'pix' | 'credit_card'
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [pixCopied, setPixCopied] = useState(false);

  // Credit Card state
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    cardExpiry: '',
    cardCvv: '',
    installments: 1,
  });

  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [completedOrderData, setCompletedOrderData] = useState(null);

  useEffect(() => {
    if (customer) {
      setCustomerForm({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        cpf: customer.cpf || '',
        street: customer.street || '',
        addressNumber: customer.addressNumber || '',
        complement: customer.complement || '',
        neighborhood: customer.neighborhood || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        zipCode: customer.zipCode || '',
      });
    }
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discount = couponApplied ? subtotal * 0.1 : 0;
  const freeShippingThreshold = 199.0;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const shipping = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 18.9;
  const total = Math.max(0, subtotal - discount + shipping);

  const pixCopyPasteCode = `00020126580014BR.GOV.BCB.PIX0125miauartesanatos@gmail.com5204000053039865406${total.toFixed(
    2
  )}5802BR5913MIAU E PONTO6009SAO PAULO62140510MIAUPONTO6304A1B2`;

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (
      coupon.trim().toUpperCase() === 'MIAU10' ||
      coupon.trim().toUpperCase() === 'GATINHO'
    ) {
      setCouponApplied(true);
    } else {
      alert('Cupom inválido. Tente usar "MIAU10" para 10% de desconto!');
    }
  };

  const handleCopyPix = () => {
    navigator.clipboard?.writeText(pixCopyPasteCode);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2500);
  };

  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const handleFinalizePurchase = async (e) => {
    e.preventDefault();
    setCheckoutError(null);

    if (!customerForm.email || !customerForm.email.includes('@')) {
      setCheckoutError('Por favor, informe um e-mail válido no cadastro para continuar.');
      return;
    }
    if (!customerForm.name || customerForm.name.trim().length < 3) {
      setCheckoutError('Por favor, informe seu nome completo.');
      return;
    }
    if (!customerForm.state) {
      setCheckoutError('Selecione o UF do seu estado.');
      return;
    }
    if (!customerForm.city || customerForm.city.trim().length < 2) {
      setCheckoutError('Informe a sua Cidade após selecionar o UF.');
      return;
    }
    const addrError = validateAddressParts({
      street: customerForm.street,
      addressNumber: customerForm.addressNumber,
      neighborhood: customerForm.neighborhood,
    });
    if (addrError) {
      setCheckoutError(addrError);
      return;
    }

    if (paymentMethod === 'credit_card') {
      const cleanDigits = cardData.cardNumber.replace(/\D/g, '');
      if (cleanDigits.length < 13) {
        setCheckoutError('Informe os 16 dígitos do cartão de crédito.');
        return;
      }
      if (!cardData.cardHolder.trim()) {
        setCheckoutError('Informe o nome impresso no cartão.');
        return;
      }
      if (cardData.cardExpiry.length < 4 || cardData.cardCvv.length < 3) {
        setCheckoutError('Preencha a validade (MM/AA) e o CVV do cartão.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await createOrder({
        customer: customerForm,
        items,
        couponCode: couponApplied ? coupon.trim().toUpperCase() || 'MIAU10' : null,
        discount,
        shipping,
        paymentMethod,
        paymentDetails: {
          ...cardData,
          cardNumber: (cardData.cardNumber || '').replace(/\s+/g, '').replace(/\D/g, ''),
        },
      });

      if (response.customer && onCustomerSaved) {
        onCustomerSaved(response.customer);
      }
      if (onOrderCreated) {
        onOrderCreated();
      }

      setCompletedOrderData(response);
      setStep('complete');

      if (response.message) {
        alert(response.message);
      }

      confetti({
        particleCount: 110,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#FFE5D9', '#D8EEDC', '#FBE4EC', '#D9735E'],
      });
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseAndReset = () => {
    if (step === 'complete') {
      onClearCart();
      setStep('cart');
      setCompletedOrderData(null);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={handleCloseAndReset}
        className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-[#FAF6F0] shadow-2xl flex flex-col justify-between border-l border-[#EDE4D8]">
          {/* Header */}
          <div className="p-5 border-b border-[#EFE7DC] bg-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {step === 'checkout' && (
                <button
                  onClick={() => setStep('cart')}
                  className="p-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-charcoal transition-colors mr-1"
                  aria-label="Voltar ao carrinho"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className="w-9 h-9 rounded-xl bg-pastel-peach flex items-center justify-center text-charcoal">
                <ShoppingBag className="w-5 h-5 text-pastel-terracotta" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-charcoal">
                  {step === 'cart' && 'Seu Carrinho de Mimos'}
                  {step === 'checkout' && 'Página de Pagamento'}
                  {step === 'complete' && 'Pedido Confirmado!'}
                </h3>
                <p className="text-xs text-charcoal-muted">
                  {step === 'cart' &&
                    (items.length === 0
                      ? 'Vazio por enquanto'
                      : `${items.length} tipo(s) de item`)}
                  {step === 'checkout' && 'Pague com Cartão de Crédito ou PIX'}
                  {step === 'complete' && 'Registrado no banco PostgreSQL'}
                </p>
              </div>
            </div>

            <button
              onClick={handleCloseAndReset}
              className="p-2 rounded-xl text-charcoal-light hover:text-charcoal hover:bg-cream-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* STEP 3: Checkout Completed Confirmation */}
          {step === 'complete' && completedOrderData ? (
            <div className="p-6 sm:p-8 text-center flex-1 overflow-y-auto flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-1 animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h4 className="font-display font-bold text-2xl text-charcoal">
                Pedido Recebido com Carinho! 🐾
              </h4>
              {completedOrderData.message && (
                <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold shadow-sm flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{completedOrderData.message}</span>
                </div>
              )}
              <p className="text-xs sm:text-sm text-charcoal-muted max-w-xs">
                Obrigado, <strong>{completedOrderData.customer?.name}</strong>! Seu pedido e
                pagamento já foram gravados no banco de dados PostgreSQL.
              </p>

              <div className="bg-white p-4 rounded-2xl border border-cream-200 w-full text-xs text-left space-y-2 shadow-sm">
                <div className="flex justify-between items-center border-b border-cream-100 pb-2">
                  <span className="font-bold text-charcoal">Código do Pedido:</span>
                  <span className="font-mono font-bold text-pastel-terracotta bg-pastel-peach/40 px-2.5 py-0.5 rounded-lg">
                    {completedOrderData.order?.order_code}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-muted">Cliente (E-mail):</span>
                  <span className="font-semibold text-charcoal">
                    {completedOrderData.customer?.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-muted">Forma de Pagamento:</span>
                  <span className="font-bold text-emerald-700 uppercase">
                    {completedOrderData.payment?.method === 'pix'
                      ? 'PIX Instantâneo'
                      : `Cartão (${completedOrderData.payment?.card_brand} final ${completedOrderData.payment?.card_last4} • ${completedOrderData.payment?.installments}x)`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-muted">Transação PostgreSQL:</span>
                  <span className="font-mono text-[11px] text-charcoal">
                    {completedOrderData.payment?.transaction_code}
                  </span>
                </div>
                {(completedOrderData.trackingCode || completedOrderData.order?.tracking_code) && (
                  <div className="flex justify-between items-center">
                    <span className="text-charcoal-muted">Código de Rastreio:</span>
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      {completedOrderData.trackingCode || completedOrderData.order?.tracking_code}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-cream-100 text-sm font-bold text-charcoal">
                  <span>Total Pago:</span>
                  <span className="text-pastel-terracotta">
                    R$ {Number(completedOrderData.order?.total || total).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCloseAndReset}
                className="w-full py-3.5 rounded-2xl bg-pastel-terracotta text-white font-bold text-sm shadow-soft hover:bg-[#c6604c] transition-colors"
              >
                Voltar à Loja
              </button>
            </div>
          ) : !customer ? (
            /* Require Logged-in Account to Access Cart or Payment */
            <div className="p-6 sm:p-8 text-center flex-1 overflow-y-auto flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-pastel-peach flex items-center justify-center text-pastel-terracotta mb-1">
                <Lock className="w-8 h-8" />
              </div>
              <h4 className="font-display font-bold text-xl text-charcoal">
                É necessário estar logado na conta
              </h4>
              <p className="text-xs sm:text-sm text-charcoal-muted max-w-xs leading-relaxed">
                Para adicionar produtos ao carrinho ou realizar o pagamento (Cartão de Crédito ou PIX), entre na sua conta ou crie um cadastro gratuito.
              </p>
              <div className="w-full space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenAuthModal) onOpenAuthModal('login');
                  }}
                  className="w-full py-3.5 rounded-2xl bg-pastel-terracotta hover:bg-[#c6604c] text-white font-bold text-sm shadow-soft transition-colors"
                >
                  Entrar na Conta
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenAuthModal) onOpenAuthModal('register');
                  }}
                  className="w-full py-3.5 rounded-2xl bg-white hover:bg-cream-100 text-charcoal border border-[#E3D7C5] font-bold text-sm transition-colors"
                >
                  Criar Conta Gratuita
                </button>
              </div>
            </div>
          ) : step === 'checkout' ? (
            /* STEP 2: Direct Payment Page (Credit Card / PIX) + Logged-in Customer Delivery Info */
            <form
              onSubmit={handleFinalizePurchase}
              className="flex-1 flex flex-col justify-between overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {checkoutError && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                    {checkoutError}
                  </div>
                )}

                {/* Order Items Quick Summary on Payment Page */}
                <div className="bg-white p-3.5 rounded-2xl border border-cream-200 flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex -space-x-2 overflow-hidden flex-shrink-0">
                      {items.slice(0, 3).map((it) => (
                        <img
                          key={it.id}
                          src={safeImageUrl(it.image)}
                          alt={safeText(it.name)}
                          className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm"
                        />
                      ))}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-charcoal truncate">
                        {items.length === 1
                          ? items[0].name
                          : `${items.length} produtos selecionados`}
                      </p>
                      <p className="text-[11px] text-charcoal-muted">
                        Conta: <strong className="text-charcoal">{customer.email}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="block text-[10px] text-charcoal-muted uppercase font-bold">
                      Total
                    </span>
                    <span className="font-display font-extrabold text-sm text-pastel-terracotta">
                      R$ {total.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* 1. Payment Method Selector (PIX vs Cartão de Crédito) FIRST */}
                <div className="bg-white p-4 rounded-2xl border border-cream-200 space-y-3.5 shadow-sm">
                  <h4 className="font-display font-bold text-sm text-charcoal flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <span>1. Pagamento: Cartão de Crédito ou PIX</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('credit_card')}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                        paymentMethod === 'credit_card'
                          ? 'bg-pastel-peach/60 border-pastel-terracotta text-charcoal shadow-sm ring-1 ring-pastel-terracotta'
                          : 'bg-cream-50 border-cream-200 text-charcoal-muted hover:bg-cream-100'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-pastel-terracotta text-white flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-charcoal">
                          Cartão de Crédito
                        </span>
                        <span className="block text-[10px] text-pastel-terracotta font-semibold">
                          Até 6x sem juros
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('pix')}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                        paymentMethod === 'pix'
                          ? 'bg-pastel-mint/60 border-emerald-500 text-charcoal shadow-sm ring-1 ring-emerald-500'
                          : 'bg-cream-50 border-cream-200 text-charcoal-muted hover:bg-cream-100'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-charcoal">PIX</span>
                        <span className="block text-[10px] text-emerald-700 font-semibold">
                          Aprovação na hora
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* PIX Payment View */}
                  {paymentMethod === 'pix' ? (
                    <div className="p-3.5 rounded-2xl bg-cream-50 border border-emerald-200 space-y-3 text-center">
                      <div className="mx-auto w-36 h-36 bg-white p-2.5 rounded-2xl border border-emerald-200 shadow-sm flex flex-col items-center justify-center">
                        {/* Stylized QR Code SVG */}
                        <svg viewBox="0 0 100 100" className="w-full h-full text-charcoal">
                          <rect x="5" y="5" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="6" />
                          <rect x="13" y="13" width="10" height="10" fill="currentColor" />
                          <rect x="69" y="5" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="6" />
                          <rect x="77" y="13" width="10" height="10" fill="currentColor" />
                          <rect x="5" y="69" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="6" />
                          <rect x="13" y="77" width="10" height="10" fill="currentColor" />
                          <rect x="40" y="10" width="8" height="8" fill="currentColor" />
                          <rect x="52" y="18" width="8" height="14" fill="currentColor" />
                          <rect x="38" y="38" width="24" height="24" rx="4" fill="#D9735E" />
                          <text x="50" y="55" textAnchor="middle" fontSize="14" fill="#FFF">🐾</text>
                          <rect x="10" y="42" width="18" height="8" fill="currentColor" />
                          <rect x="70" y="42" width="10" height="18" fill="currentColor" />
                          <rect x="40" y="70" width="14" height="8" fill="currentColor" />
                          <rect x="65" y="68" width="25" height="10" fill="currentColor" />
                          <rect x="65" y="84" width="12" height="12" fill="currentColor" />
                          <rect x="83" y="84" width="12" height="12" fill="currentColor" />
                        </svg>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-bold text-charcoal">
                          Chave PIX: <span className="text-emerald-700">miauartesanatos@gmail.com</span>
                        </p>
                        <p className="text-[11px] text-charcoal-muted">
                          Escaneie o QR Code ou copie o código PIX Copia e Cola abaixo:
                        </p>
                      </div>

                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          readOnly
                          value={pixCopyPasteCode}
                          className="flex-1 px-2.5 py-1.5 text-[10px] font-mono rounded-xl bg-white border border-cream-300 text-charcoal-muted truncate"
                        />
                        <button
                          type="button"
                          onClick={handleCopyPix}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          {pixCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Credit Card Payment View */
                    <div className="space-y-3 pt-1">
                      {/* Visual Credit Card Preview */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#373030] via-[#4a3e3d] to-[#D9735E] text-white shadow-md space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase tracking-widest text-white/80 font-bold">
                            Patas & Ponto Card
                          </span>
                          <CreditCard className="w-5 h-5 text-pastel-peach" />
                        </div>
                        <p className="font-mono text-sm sm:text-base tracking-widest font-bold">
                          {cardData.cardNumber || '•••• •••• •••• ••••'}
                        </p>
                        <div className="flex justify-between items-end text-[11px]">
                          <div>
                            <span className="block text-[9px] text-white/60 uppercase">
                              Titular do Cartão
                            </span>
                            <span className="font-semibold uppercase">
                              {cardData.cardHolder || 'NOME NO CARTÃO'}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[9px] text-white/60 uppercase">
                              Validade
                            </span>
                            <span className="font-mono font-semibold">
                              {cardData.cardExpiry || 'MM/AA'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-charcoal-muted mb-1">
                          Número do Cartão *
                        </label>
                        <input
                          type="text"
                          required
                          value={cardData.cardNumber}
                          onChange={(e) =>
                            setCardData({
                              ...cardData,
                              cardNumber: formatCardNumber(e.target.value),
                            })
                          }
                          placeholder="0000 0000 0000 0000"
                          className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-cream-50 border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-charcoal-muted mb-1">
                          Nome Impresso no Cartão *
                        </label>
                        <input
                          type="text"
                          required
                          value={cardData.cardHolder}
                          onChange={(e) =>
                            setCardData({
                              ...cardData,
                              cardHolder: e.target.value.toUpperCase(),
                            })
                          }
                          placeholder="COMO ESTÁ NO CARTÃO"
                          className="w-full px-3 py-2 text-xs uppercase rounded-xl bg-cream-50 border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-charcoal-muted mb-1">
                            Validade *
                          </label>
                          <input
                            type="text"
                            required
                            value={cardData.cardExpiry}
                            onChange={(e) =>
                              setCardData({
                                ...cardData,
                                cardExpiry: formatExpiry(e.target.value),
                              })
                            }
                            placeholder="MM/AA"
                            className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-cream-50 border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-charcoal-muted mb-1">
                            CVV *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={4}
                            value={cardData.cardCvv}
                            onChange={(e) =>
                              setCardData({
                                ...cardData,
                                cardCvv: e.target.value.replace(/\D/g, '').slice(0, 4),
                              })
                            }
                            placeholder="123"
                            className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-cream-50 border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-charcoal-muted mb-1">
                            Parcelas
                          </label>
                          <select
                            value={cardData.installments}
                            onChange={(e) =>
                              setCardData({
                                ...cardData,
                                installments: Number(e.target.value),
                              })
                            }
                            className="w-full px-2 py-2 text-xs rounded-xl bg-cream-50 border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal font-semibold"
                          >
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                              <option key={n} value={n}>
                                {n}x R$ {(total / n).toFixed(2).replace('.', ',')}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Customer Delivery Confirmation Section */}
                <div className="bg-white p-4 rounded-2xl border border-cream-200 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-bold text-sm text-charcoal flex items-center gap-2">
                      <User className="w-4 h-4 text-pastel-terracotta" />
                      <span>2. Endereço e Dados da Conta</span>
                    </h4>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Conta Logada
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-charcoal-muted mb-1">
                        Seu E-mail *
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-charcoal-light absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={customerForm.email}
                          onChange={(e) =>
                            setCustomerForm({ ...customerForm, email: e.target.value })
                          }
                          placeholder="seu.email@exemplo.com"
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-cream-50 border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-charcoal-muted mb-1">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={80}
                          value={customerForm.name}
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              name: formatTextOnly(e.target.value, 80),
                            })
                          }
                          placeholder="Seu nome completo"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-cream-50 border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-charcoal-muted mb-1">
                          CPF (11 números)
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={14}
                          value={customerForm.cpf}
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              cpf: formatCpf(e.target.value),
                            })
                          }
                          placeholder="000.000.000-00"
                          className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-cream-50 border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-charcoal-muted mb-1">
                          Celular
                        </label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={15}
                          value={customerForm.phone}
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              phone: formatPhone(e.target.value),
                            })
                          }
                          placeholder="(11) 99999-9999"
                          className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-cream-50 border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-charcoal-muted mb-1">
                          CEP (8 números)
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={9}
                          value={customerForm.zipCode}
                          onChange={(e) => {
                            const formatted = formatCep(e.target.value);
                            const digits = formatted.replace(/\D/g, '');
                            if (digits.length === 8) {
                              const instant = getFallbackAddressByCep(digits);
                              setCustomerForm((prev) => ({
                                ...prev,
                                zipCode: formatted,
                                state: instant?.state || prev.state,
                                city: instant?.city || prev.city,
                                street: instant?.street || prev.street,
                                neighborhood: instant?.neighborhood || prev.neighborhood,
                              }));
                              lookupAddressByCep(digits).then((resolved) => {
                                if (resolved) {
                                  setCustomerForm((prev) => {
                                    if (prev.zipCode.replace(/\D/g, '') !== digits) return prev;
                                    return {
                                      ...prev,
                                      state: resolved.state || prev.state,
                                      city: resolved.city || prev.city,
                                      street: resolved.street || prev.street,
                                      neighborhood: resolved.neighborhood || prev.neighborhood,
                                    };
                                  });
                                }
                              });
                            } else {
                              setCustomerForm((prev) => {
                                const prevDigits = (prev.zipCode || '').replace(/\D/g, '');
                                const isErasingCep =
                                  digits.length === 0 || digits.length < prevDigits.length;
                                if (isErasingCep) {
                                  return {
                                    ...prev,
                                    zipCode: formatted,
                                    street: '',
                                    neighborhood: '',
                                    city: '',
                                    state: '',
                                  };
                                }
                                return {
                                  ...prev,
                                  zipCode: formatted,
                                };
                              });
                            }
                          }}
                          placeholder="00000-000"
                          className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-cream-50 border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-charcoal-muted mb-1">
                          UF *
                        </label>
                        <select
                          required
                          value={customerForm.state}
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              state: e.target.value,
                              city:
                                customerForm.state === e.target.value
                                  ? customerForm.city
                                  : '',
                            })
                          }
                          className="w-full px-2 py-2 text-xs font-bold rounded-xl bg-cream-50 border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal cursor-pointer"
                        >
                          <option value="">UF...</option>
                          {BRAZIL_UFS.map((uf) => (
                            <option key={uf.sigla} value={uf.sigla}>
                              {uf.sigla} - {uf.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Cidade aparece após selecionar o UF */}
                    {customerForm.state ? (
                      <div className="animate-in fade-in duration-200">
                        <label className="block text-[11px] font-bold text-charcoal-muted mb-1">
                          Cidade ({customerForm.state}) *
                        </label>
                        <input
                          type="text"
                          required
                          list="checkout-uf-cities"
                          maxLength={60}
                          value={customerForm.city}
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              city: formatTextOnly(e.target.value, 60),
                            })
                          }
                          placeholder={`Cidade em ${customerForm.state}...`}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-cream-50 border border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-charcoal"
                        />
                        <datalist id="checkout-uf-cities">
                          {(CITIES_BY_UF[customerForm.state] || []).map((c) => (
                            <option key={c} value={c} />
                          ))}
                        </datalist>
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-cream-100 border border-dashed border-cream-300 text-[11px] text-charcoal-muted text-center">
                        Selecione o UF acima para liberar o campo Cidade
                      </div>
                    )}

                    {/* Rua, Número, Complemento e Bairro validados */}
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-8">
                        <label className="block text-[11px] font-bold text-charcoal-muted mb-1">
                          Rua *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={80}
                          value={customerForm.street}
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              street: formatTextOnly(e.target.value, 80),
                            })
                          }
                          placeholder="Nome da Rua"
                          className="w-full px-2.5 py-2 text-xs rounded-xl bg-cream-50 border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="block text-[11px] font-bold text-charcoal-muted mb-1">
                          Nº *
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          maxLength={6}
                          value={customerForm.addressNumber}
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              addressNumber: formatAddressNumber(e.target.value),
                            })
                          }
                          placeholder="142"
                          className="w-full px-2 py-2 text-xs font-mono rounded-xl bg-cream-50 border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
                        />
                      </div>
                      <div className="col-span-6">
                        <label className="block text-[11px] font-bold text-charcoal-muted mb-1">
                          Complemento
                        </label>
                        <input
                          type="text"
                          maxLength={60}
                          value={customerForm.complement}
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              complement: formatComplement(e.target.value, 60),
                            })
                          }
                          placeholder="Apto, Bloco, Casa..."
                          className="w-full px-2.5 py-2 text-xs rounded-xl bg-cream-50 border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
                        />
                      </div>
                      <div className="col-span-6">
                        <label className="block text-[11px] font-bold text-charcoal-muted mb-1">
                          Bairro *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={60}
                          value={customerForm.neighborhood}
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              neighborhood: formatTextOnly(e.target.value, 60),
                            })
                          }
                          placeholder="Seu Bairro"
                          className="w-full px-2.5 py-2 text-xs rounded-xl bg-cream-50 border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkout Submit Footer */}
              <div className="p-5 bg-white border-t border-[#EFE7DC] space-y-3">
                <div className="flex justify-between text-sm font-display font-bold text-charcoal">
                  <span>Total a Pagar:</span>
                  <span className="text-pastel-terracotta text-base">
                    R$ {total.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {submitting
                      ? 'Processando no PostgreSQL...'
                      : paymentMethod === 'pix'
                      ? 'Confirmar Pagamento PIX'
                      : 'Pagar com Cartão de Crédito'}
                  </span>
                </button>
              </div>
            </form>
          ) : (
            /* STEP 1: Cart Items & Summary */
            <>
              {/* Free Shipping Meter */}
              <div className="px-5 py-3 bg-pastel-peach/40 border-b border-pastel-peachDark/20">
                <div className="flex items-center justify-between text-xs font-semibold text-charcoal mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-pastel-coral" />
                    {remainingForFreeShipping > 0
                      ? `Faltam R$ ${remainingForFreeShipping.toFixed(2).replace('.', ',')} para Frete Grátis`
                      : 'Parabéns! Você ganhou Frete Grátis! 🎉'}
                  </span>
                  <span>
                    {Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100))}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-cream-200 overflow-hidden">
                  <div
                    className="h-full bg-pastel-coral transition-all duration-500 rounded-full"
                    style={{
                      width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {items.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <span className="text-4xl block">🧺</span>
                    <h4 className="font-display font-bold text-base text-charcoal">
                      Sua cestinha está vazia
                    </h4>
                    <p className="text-xs text-charcoal-muted max-w-xs mx-auto">
                      Explore nossos amigurumis, quadros, chaveiros e cerâmicas para encher sua casa de amor!
                    </p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3.5 bg-white p-3.5 rounded-2xl border border-cream-200 shadow-sm"
                    >
                      <img
                        src={safeImageUrl(item.image)}
                        alt={safeText(item.name)}
                        className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl object-cover border border-cream-100 flex-shrink-0"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start gap-1">
                          <h5 className="font-display font-bold text-xs sm:text-sm text-charcoal line-clamp-1">
                            {item.name}
                          </h5>
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="text-charcoal-light hover:text-red-500 transition-colors p-1"
                            aria-label="Remover item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs font-semibold text-pastel-terracotta">
                          R$ {item.price.toFixed(2).replace('.', ',')}
                        </p>

                        {/* Quantity Counter */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-lg bg-cream-100 hover:bg-cream-200 text-charcoal flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-lg bg-cream-100 hover:bg-cream-200 text-charcoal flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer / Summary */}
              {items.length > 0 && (
                <div className="p-5 bg-white border-t border-[#EFE7DC] space-y-3">
                  {/* Coupon input */}
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      placeholder="Cupom de desconto (ex: MIAU10)"
                      className="flex-1 px-3 py-2 text-xs rounded-xl bg-cream-50 border border-[#EFE7DC] focus:outline-none focus:ring-1 focus:ring-pastel-peachDark text-charcoal uppercase"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 text-xs font-bold rounded-xl bg-pastel-peach text-charcoal hover:bg-pastel-peachDark transition-colors"
                    >
                      Aplicar
                    </button>
                  </form>

                  {/* Summary Rows */}
                  <div className="space-y-1.5 text-xs text-charcoal-muted pt-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium text-charcoal">
                        R$ {subtotal.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    {couponApplied && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Desconto (10% MIAU10):</span>
                        <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Frete:</span>
                      <span className="font-medium text-charcoal">
                        {shipping === 0 ? (
                          <span className="text-emerald-700 font-bold">Grátis</span>
                        ) : (
                          `R$ ${shipping.toFixed(2).replace('.', ',')}`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-display font-bold text-charcoal pt-2 border-t border-cream-200">
                      <span>Total:</span>
                      <span className="text-pastel-terracotta">
                        R$ {total.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  {/* Proceed to Checkout Button */}
                  <button
                    onClick={() => setStep('checkout')}
                    className="w-full py-4 rounded-2xl bg-pastel-terracotta hover:bg-[#c6604c] text-white font-bold text-sm shadow-soft hover:shadow-soft-hover transition-all duration-200 flex items-center justify-center gap-2 group active:scale-98"
                  >
                    <span>Escolher Pagamento (PIX ou Cartão)</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <p className="text-[10px] text-center text-charcoal-light">
                    🔒 Pagamento 100% Criptografado • PIX e Cartões de Crédito
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
