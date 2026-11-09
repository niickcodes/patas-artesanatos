import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  UserPlus,
  LogIn,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  Sparkles,
  CheckCircle2,
  LogOut,
  ShoppingBag,
  User,
  Send,
  Gift,
  Edit3,
  PlusCircle,
  PackagePlus,
  Image as ImageIcon,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import {
  registerCustomer,
  loginCustomer,
  lookupCustomer,
  createUserProduct,
} from '../services/api';
import {
  BRAZIL_UFS,
  CITIES_BY_UF,
  FIXED_PRODUCT_BADGES,
  formatCep,
  formatCpf,
  formatPhone,
  formatAddressNumber,
  formatTextOnly,
  formatComplement,
  getFallbackAddressByCep,
  lookupAddressByCep,
  validateAddressParts,
  formatPriceInput,
  parsePriceInput,
  formatCentimetersDigits,
  safeImageUrl,
  safeText,
} from '../utils/formatters';

const PRESET_PRODUCT_IMAGES = [
  { label: 'Cachorrinho Golden', url: '/images/amigurumi_cachorrinho.jpg' },
  { label: 'Capivara Zen', url: '/images/amigurumi_capivara.jpg' },
  { label: 'Coelhinha Baunilha', url: '/images/amigurumi_coelhinho.jpg' },
  { label: 'Raposinha do Bosque', url: '/images/amigurumi_raposinha.jpg' },
  { label: 'Gatinho Rosa', url: '/images/amigurumi_rosa.jpg' },
  { label: 'Gatinho Siamês', url: '/images/amigurumi_siames.jpg' },
  { label: 'Quadro Cachorrinho', url: '/images/quadro_cachorro_flores.jpg' },
  { label: 'Quadro Floresta', url: '/images/quadro_bosque_animais.jpg' },
  { label: 'Chaveiro Ursinho', url: '/images/chaveiro_ursinho.jpg' },
  { label: 'Caneca Cachorrinho', url: '/images/caneca_cachorrinho_estudio.jpg' },
];

export default function CustomerModal({
  isOpen,
  onClose,
  customer,
  onCustomerSaved,
  onLogout,
  initialAuthMode = 'register', // 'register' | 'login' | 'new_product'
  onProductsUpdated,
  onProductPosted,
  onDeleteProduct,
  products = [],
  onNavigateAdmin,
}) {
  const [authMode, setAuthMode] = useState('register'); // 'register' | 'login'
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'new_product' | 'orders' | 'edit'

  // Login credentials state
  const [loginEmailInput, setLoginEmailInput] = useState('');
  const [loginPasswordInput, setLoginPasswordInput] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Registration / Edit profile form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    cpf: '',
    street: '',
    addressNumber: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '', // Começa vazio para que a Cidade apareça após selecionar o UF!
    zipCode: '',
  });
  const [cepAutoFilled, setCepAutoFilled] = useState(false);

  // New Product form state (for logged-in users)
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'amigurumis',
    price: '',
    originalPrice: '',
    dimensions: '18',
    inStock: '5',
    badge: 'Feito à Mão',
    image: '/images/amigurumi_cachorrinho.jpg',
    description: '',
  });
  const [creatingProduct, setCreatingProduct] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [emailConfirmationBanner, setEmailConfirmationBanner] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);

  // Lock background page scroll completely while this modal is open
  useEffect(() => {
    if (isOpen) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevBodyOverflow || '';
        document.documentElement.style.overflow = prevHtmlOverflow || '';
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      if (initialAuthMode === 'new_product' && customer) {
        setActiveTab('new_product');
      } else if (initialAuthMode === 'login') {
        setAuthMode('login');
      } else {
        setAuthMode('register');
        if (customer && activeTab === 'new_product' && initialAuthMode !== 'new_product') {
          setActiveTab('overview');
        }
      }
    }
  }, [isOpen, initialAuthMode]);

  useEffect(() => {
    setCepAutoFilled(false);
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        password: '',
        phone: formatPhone(customer.phone || ''),
        cpf: formatCpf(customer.cpf || ''),
        street: customer.street || '',
        addressNumber: customer.addressNumber || '',
        complement: customer.complement || '',
        neighborhood: customer.neighborhood || '',
        city: customer.city || '',
        state: customer.state || '',
        zipCode: formatCep(customer.zipCode || ''),
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        cpf: '',
        street: '',
        addressNumber: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
      });
    }
  }, [customer, isOpen]);

  useEffect(() => {
    if (isOpen && customer?.email) {
      lookupCustomer(customer.email)
        .then((data) => {
          setCustomerOrders(data.orders || []);
        })
        .catch(() => {
          setCustomerOrders([]);
        });
    }
  }, [isOpen, customer?.email]);

  if (!isOpen) return null;

  const handleFieldChange = (field, rawValue) => {
    setError(null);
    if (field === 'zipCode') {
      const formattedCep = formatCep(rawValue);
      const digits = formattedCep.replace(/\D/g, '');
      if (digits.length === 8) {
        // Preenche imediatamente com os dados da faixa do CEP (exceto Número!) e refina via ViaCEP
        const instantAddress = getFallbackAddressByCep(digits);
        setFormData((prev) => ({
          ...prev,
          zipCode: formattedCep,
          state: instantAddress?.state || prev.state,
          city: instantAddress?.city || prev.city,
          street: instantAddress?.street || prev.street,
          neighborhood: instantAddress?.neighborhood || prev.neighborhood,
          // Não altera addressNumber (exceto número)
        }));
        setCepAutoFilled(true);
        lookupAddressByCep(digits).then((resolved) => {
          if (resolved) {
            setFormData((prev) => {
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
        setCepAutoFilled(false);
        setFormData((prev) => {
          const prevDigits = (prev.zipCode || '').replace(/\D/g, '');
          const isErasingCep = digits.length === 0 || digits.length < prevDigits.length;
          if (isErasingCep) {
            return {
              ...prev,
              zipCode: formattedCep,
              street: '',
              neighborhood: '',
              city: '',
              state: '',
            };
          }
          return { ...prev, zipCode: formattedCep };
        });
      }
    } else if (field === 'cpf') {
      setFormData((prev) => ({ ...prev, cpf: formatCpf(rawValue) }));
    } else if (field === 'phone') {
      setFormData((prev) => ({ ...prev, phone: formatPhone(rawValue) }));
    } else if (field === 'name') {
      setFormData((prev) => ({ ...prev, name: formatTextOnly(rawValue, 80) }));
    } else if (field === 'city') {
      setFormData((prev) => ({ ...prev, city: formatTextOnly(rawValue, 60) }));
    } else if (field === 'street') {
      setFormData((prev) => ({ ...prev, street: formatTextOnly(rawValue, 80) }));
    } else if (field === 'addressNumber') {
      setFormData((prev) => ({ ...prev, addressNumber: formatAddressNumber(rawValue) }));
    } else if (field === 'complement') {
      setFormData((prev) => ({ ...prev, complement: formatComplement(rawValue, 60) }));
    } else if (field === 'neighborhood') {
      setFormData((prev) => ({ ...prev, neighborhood: formatTextOnly(rawValue, 60) }));
    } else if (field === 'email') {
      setFormData((prev) => ({ ...prev, email: rawValue.slice(0, 100) }));
    } else if (field === 'password') {
      setFormData((prev) => ({ ...prev, password: rawValue.slice(0, 60) }));
    } else if (field === 'state') {
      // Quando muda o UF, limpa a cidade anterior para o usuário escolher/digitar a cidade do novo UF
      setFormData((prev) => ({
        ...prev,
        state: rawValue,
        city: prev.state === rawValue ? prev.city : '',
      }));
    }
  };

  const validateFields = (isUpdate = false) => {
    if (!formData.email || !formData.email.includes('@')) {
      return 'Informe um e-mail válido.';
    }
    if (!isUpdate || (formData.password && formData.password.trim().length > 0)) {
      const pwd = formData.password || '';
      if (!isUpdate && !pwd) {
        return 'Crie uma senha forte para sua conta.';
      }
      if (pwd) {
        if (pwd.length < 8) return 'A senha deve ter no mínimo 8 caracteres.';
        if (!/[A-Z]/.test(pwd)) return 'A senha deve conter pelo menos 1 letra maiúscula.';
        if (!/[a-z]/.test(pwd)) return 'A senha deve conter pelo menos 1 letra minúscula.';
        if (!/\d/.test(pwd)) return 'A senha deve conter pelo menos 1 número.';
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pwd)) {
          return 'A senha deve conter pelo menos 1 caractere especial (ex: @, #, $, %, etc.).';
        }
      }
    }
    if (!formData.name || formData.name.trim().length < 3) {
      return 'Informe seu nome completo (mínimo 3 letras).';
    }
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      return 'Informe o Celular com DDD + número (10 ou 11 dígitos).';
    }
    const cleanCpf = formData.cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      return 'O CPF é obrigatório, único e deve conter exatamente 11 números.';
    }
    const cleanCep = formData.zipCode.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      return 'O CEP deve conter exatamente 8 números.';
    }
    if (!formData.state) {
      return 'Selecione primeiro o UF do seu estado.';
    }
    if (!formData.city || formData.city.trim().length < 2) {
      return 'Informe a sua Cidade (disponível após selecionar o UF).';
    }

    const addressErr = validateAddressParts({
      street: formData.street,
      addressNumber: formData.addressNumber,
      neighborhood: formData.neighborhood,
    });
    if (addressErr) {
      return addressErr;
    }

    return null;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const emailToSearch = loginEmailInput.trim();
    if (!emailToSearch || !emailToSearch.includes('@')) {
      setError('Digite o e-mail cadastrado para entrar na sua conta.');
      return;
    }
    if (!loginPasswordInput) {
      setError('Digite sua senha cadastrada para entrar na conta.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const data = await loginCustomer(emailToSearch, loginPasswordInput);
      onCustomerSaved(data.customer);
      setCustomerOrders(data.orders || []);
      setLoginPasswordInput('');

      const isAdmin =
        data.customer?.role === 'admin' ||
        data.customer?.email?.toLowerCase() === 'admin@patasartesanatos.com';

      if (isAdmin) {
        onClose();
        if (typeof onNavigateAdmin === 'function') {
          onNavigateAdmin();
        } else {
          window.location.pathname = '/admin';
        }
        return;
      }

      setActiveTab('overview');
      setSuccessMsg('Login realizado com sucesso! Bem-vindo(a) à sua conta 🐾');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      setError(
        err.message ||
          'Usuário não encontrado. Verifique se o e-mail e a senha estão corretos.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const isUpdate = Boolean(customer);
    const validationError = validateFields(isUpdate);
    if (validationError) {
      setError(validationError);
      return;
    }

    const complementPart = formData.complement?.trim()
      ? ` (${formData.complement.trim()})`
      : '';
    const fullAddress = `${formData.street.trim()}, Nº ${formData.addressNumber.trim()}${complementPart} - Bairro ${formData.neighborhood.trim()}`;

    setLoading(true);
    try {
      const result = await registerCustomer({
        ...formData,
        address: fullAddress,
        isUpdate,
      });
      onCustomerSaved(result.customer);

      if (!isUpdate) {
        setEmailConfirmationBanner(true);
        setActiveTab('overview');
      } else {
        setSuccessMsg('Seus dados foram atualizados com sucesso!');
        setTimeout(() => setSuccessMsg(null), 3000);
        setActiveTab('overview');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setProductForm((prev) => ({ ...prev, image: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateUserProductSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setEmailConfirmationBanner(false);

    if (!productForm.name.trim() || productForm.name.trim().length < 3) {
      setError('Informe o nome do produto (mínimo 3 caracteres).');
      return;
    }

    const numericPrice = parsePriceInput(productForm.price);
    if (!numericPrice || numericPrice <= 0) {
      setError('Informe um preço válido para o produto (ex: 89,90).');
      return;
    }

    const cleanDimDigits = formatCentimetersDigits(productForm.dimensions);
    if (!cleanDimDigits || Number(cleanDimDigits) <= 0) {
      setError('Informe as dimensões apenas com números em centímetros (ex: 18).');
      return;
    }

    if (!FIXED_PRODUCT_BADGES.includes(productForm.badge)) {
      setError('Selecione uma categoria fixa de Selo para o produto.');
      return;
    }

    if (!productForm.description.trim()) {
      setError('Escreva uma breve descrição da peça artesanal.');
      return;
    }

    setCreatingProduct(true);
    try {
      const categoryLabels = {
        amigurumis: 'Peça em Crochê',
        quadros: 'Quadro Decorativo',
        chaveiros: 'Chaveiro Artesanal',
        casa: 'Cerâmica & Casa',
      };

      const created = await createUserProduct(
        {
          name: productForm.name.trim(),
          category: productForm.category,
          categoryLabel: categoryLabels[productForm.category] || 'Peça Artesanal',
          price: numericPrice,
          originalPrice: null,
          dimensions: `${cleanDimDigits} cm`,
          inStock: Math.max(1, Number(String(productForm.inStock).replace(/\D/g, '') || 5)),
          badge: productForm.badge,
          image: productForm.image || '/images/amigurumi_cachorrinho.jpg',
          description: productForm.description.trim(),
        },
        customer.email
      );

      if (onProductsUpdated) {
        await onProductsUpdated();
      }

      setProductForm({
        name: '',
        category: 'amigurumis',
        price: '',
        originalPrice: '',
        dimensions: '18',
        inStock: '5',
        badge: 'Feito à Mão',
        image: '/images/amigurumi_cachorrinho.jpg',
        description: '',
      });

      // Fecha a aba/modal imediatamente e mostra mensagem de "Produto postado com sucesso !!" no site (sem mensagem de e-mail!)
      onClose();
      if (onProductPosted) {
        onProductPosted(created);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingProduct(false);
    }
  };

  const handleLogoutClick = () => {
    setEmailConfirmationBanner(false);
    setCustomerOrders([]);
    setActiveTab('overview');
    setLoginEmailInput('');
    setLoginPasswordInput('');
    if (onLogout) {
      onLogout();
    }
  };

  const suggestedCities = formData.state ? CITIES_BY_UF[formData.state] || [] : [];

  const renderFormFields = (isEditMode = false) => (
    <div className="space-y-3.5">
      {/* E-mail (Único) e Senha */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold text-charcoal">
              E-mail Obrigatório *
            </label>
            <span className="text-[10px] font-bold text-pastel-terracotta">
              Único por conta
            </span>
          </div>
          <div className="relative">
            <Mail className="w-4 h-4 text-charcoal-light absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              name="email"
              required
              readOnly={isEditMode}
              maxLength={100}
              value={formData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              placeholder="seu.email@exemplo.com"
              className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal ${
                isEditMode ? 'bg-cream-100 cursor-not-allowed' : 'bg-white'
              }`}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-charcoal mb-1.5">
            {isEditMode ? 'Nova Senha (opcional)' : 'Crie sua Senha *'}
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-charcoal-light absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showRegisterPassword ? 'text' : 'password'}
              name="password"
              required={!isEditMode}
              maxLength={60}
              value={formData.password}
              onChange={(e) => handleFieldChange('password', e.target.value)}
              placeholder={isEditMode ? 'Deixe em branco para manter' : 'Mínimo 8 caracteres (A-Z, a-z, 0-9, @#$)'}
              className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl bg-white border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
            />
            <button
              type="button"
              onClick={() => setShowRegisterPassword(!showRegisterPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light hover:text-charcoal"
            >
              {showRegisterPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-charcoal-muted mt-1">
            Requisitos: min. 8 caracteres, com maiúscula, minúscula, número e símbolo (@, #, $, etc.).
          </p>
        </div>
      </div>

      {/* Nome Completo */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-xs font-bold text-charcoal">Nome Completo *</label>
          <span className="text-[10px] text-charcoal-light">
            {formData.name.length}/80 caracteres
          </span>
        </div>
        <input
          type="text"
          name="name"
          required
          maxLength={80}
          value={formData.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          placeholder="Ex: Maria Clara Oliveira"
          className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-white border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
        />
      </div>

      {/* Celular e CPF (Único) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold text-charcoal">Celular / WhatsApp *</label>
            <span className="text-[10px] text-charcoal-light">
              {formData.phone.replace(/\D/g, '').length}/11 dígitos
            </span>
          </div>
          <div className="relative">
            <Phone className="w-4 h-4 text-charcoal-light absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              inputMode="numeric"
              name="phone"
              required
              maxLength={15}
              value={formData.phone}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-mono rounded-xl bg-white border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold text-charcoal">CPF * (Único)</label>
            <span className="text-[10px] text-charcoal-light">
              {formData.cpf.replace(/\D/g, '').length}/11 dígitos
            </span>
          </div>
          <input
            type="text"
            inputMode="numeric"
            name="cpf"
            required
            maxLength={14}
            value={formData.cpf}
            onChange={(e) => handleFieldChange('cpf', e.target.value)}
            placeholder="000.000.000-00"
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono rounded-xl bg-white border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
          />
        </div>
      </div>

      {/* CEP (8 dígitos), UF (Select 27 UFs) e Cidade (APARECE APÓS SELECIONAR O UF!) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        <div className="sm:col-span-4">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold text-charcoal">CEP *</label>
            <span className="text-[10px] text-charcoal-light">
              {formData.zipCode.replace(/\D/g, '').length}/8 núm.
            </span>
          </div>
          <input
            type="text"
            inputMode="numeric"
            name="zipCode"
            required
            maxLength={9}
            value={formData.zipCode}
            onChange={(e) => handleFieldChange('zipCode', e.target.value)}
            placeholder="00000-000"
            className="w-full px-3 py-2.5 text-xs sm:text-sm font-mono rounded-xl bg-white border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
          />
        </div>

        <div className="sm:col-span-4">
          <label className="block text-xs font-bold text-charcoal mb-1.5">
            Estado (UF) *
          </label>
          <select
            name="state"
            required
            value={formData.state}
            onChange={(e) => handleFieldChange('state', e.target.value)}
            className="w-full px-2.5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-white border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal cursor-pointer"
          >
            <option value="">Selecione o UF...</option>
            {BRAZIL_UFS.map((uf) => (
              <option key={uf.sigla} value={uf.sigla}>
                {uf.sigla} - {uf.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Cidade só aparece após o usuário selecionar o UF */}
        <div className="sm:col-span-4">
          {formData.state ? (
            <div className="animate-in fade-in slide-in-from-left-2 duration-200">
              <label className="block text-xs font-bold text-charcoal mb-1.5">
                Cidade ({formData.state}) *
              </label>
              <input
                type="text"
                name="city"
                list="uf-cities-list"
                required
                maxLength={60}
                value={formData.city}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                placeholder={`Cidade em ${formData.state}...`}
                className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl bg-white border border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-charcoal"
              />
              <datalist id="uf-cities-list">
                {suggestedCities.map((cityName) => (
                  <option key={cityName} value={cityName} />
                ))}
              </datalist>
            </div>
          ) : (
            <div className="px-3 py-2.5 rounded-xl bg-cream-100 border border-dashed border-cream-300 text-[11px] text-charcoal-muted text-center font-medium">
              👈 Selecione o UF para exibir a Cidade
            </div>
          )}
        </div>
      </div>

      {/* Endereço Validado: Rua, Número, Complemento e Bairro */}
      <div className="p-3.5 rounded-2xl bg-white/80 border border-[#E3D7C5] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-charcoal flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-pastel-terracotta" />
            <span>Endereço de Entrega (Preenchido pelo CEP, exceto Número)</span>
          </span>
          {cepAutoFilled && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>CEP localizado! Informe o Número e Complemento</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8">
            <label className="block text-[11px] font-bold text-charcoal-muted mb-1">
              Rua / Logradouro *
            </label>
            <input
              type="text"
              name="street"
              required
              maxLength={80}
              value={formData.street}
              onChange={(e) => handleFieldChange('street', e.target.value)}
              placeholder="Ex: Rua das Acácias"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold text-charcoal-muted mb-1">
              Número * <span className="text-pastel-terracotta">(Digite aqui)</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              name="addressNumber"
              required
              maxLength={6}
              value={formData.addressNumber}
              onChange={(e) => handleFieldChange('addressNumber', e.target.value)}
              placeholder="Ex: 142"
              className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-xl bg-white border border-pastel-terracotta/50 focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
            />
          </div>

          <div className="sm:col-span-6">
            <label className="block text-[11px] font-bold text-charcoal-muted mb-1">
              Complemento (Opcional)
            </label>
            <input
              type="text"
              name="complement"
              maxLength={60}
              value={formData.complement}
              onChange={(e) => handleFieldChange('complement', e.target.value)}
              placeholder="Ex: Apto 42, Bloco B, Casa 2"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
            />
          </div>

          <div className="sm:col-span-6">
            <label className="block text-[11px] font-bold text-charcoal-muted mb-1">
              Bairro *
            </label>
            <input
              type="text"
              name="neighborhood"
              required
              maxLength={60}
              value={formData.neighborhood}
              onChange={(e) => handleFieldChange('neighborhood', e.target.value)}
              placeholder="Ex: Jardim Botânico"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-white border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden overscroll-none animate-in fade-in duration-200">
      {/* Fixed non-scrollable backdrop (blocks interaction with the underlying site) */}
      <div
        className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm transition-opacity touch-none select-none"
        aria-hidden="true"
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-2xl bg-[#FAF6F0] rounded-3xl shadow-2xl border border-[#EDE4D8] overflow-hidden z-10 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-pastel-peach via-pastel-rose to-pastel-lavender border-b border-[#EFE7DC] flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/90 shadow-sm flex items-center justify-center text-pastel-terracotta">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg sm:text-xl text-charcoal">
                {customer
                  ? `Olá, ${customer.name.split(' ')[0]}! 🐾`
                  : authMode === 'login'
                  ? 'Entrar na Conta'
                  : 'Criar Nova Conta'}
              </h3>
              <p className="text-xs text-charcoal-muted">
                {customer
                  ? customer.email
                  : authMode === 'login'
                  ? 'Informe seu e-mail e senha já cadastrados'
                  : 'E-mail e CPF únicos • Acesse quando quiser na aba Entrar na Conta'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {customer && (
              <button
                type="button"
                onClick={handleLogoutClick}
                className="px-3 py-2 rounded-xl bg-white/80 hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                title="Sair da sua conta"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            )}
            <button
              onClick={onClose}
              title="Fechar e voltar ao site"
              className="p-2 rounded-xl bg-white/80 text-charcoal-muted hover:text-charcoal hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* IF LOGGED IN: ACCOUNT DASHBOARD WITH NAVIGATION & PRODUCT CREATION */}
        {customer ? (
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto overscroll-contain flex-1">
            {/* Decorative Email Confirmation Banner (Only shown right after creating a new account) */}
            {emailConfirmationBanner && activeTab === 'overview' && (
              <div className="p-4 rounded-2xl bg-pastel-mint/70 border border-emerald-300 text-charcoal space-y-2 shadow-sm animate-in fade-in duration-300">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-xs sm:text-sm text-emerald-950">
                        💌 E-mail de confirmação enviado!
                      </h4>
                      <p className="text-[11px] text-emerald-900">
                        Enviamos um link de confirmação de cadastro para{' '}
                        <strong>{customer.email}</strong>. Verifique sua caixa de entrada!
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailConfirmationBanner(false);
                      setSuccessMsg('E-mail confirmado com sucesso! Conta 100% verificada 🐾');
                      setTimeout(() => setSuccessMsg(null), 3000);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Já confirmei meu e-mail</span>
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Account Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-cream-300 pb-3">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setActiveTab('overview');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'overview'
                    ? 'bg-pastel-terracotta text-white shadow-sm'
                    : 'bg-white text-charcoal-muted hover:text-charcoal border border-cream-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Minha Conta</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setActiveTab('new_product');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'new_product'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Cadastrar Produto</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setActiveTab('orders');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'orders'
                    ? 'bg-pastel-terracotta text-white shadow-sm'
                    : 'bg-white text-charcoal-muted hover:text-charcoal border border-cream-200'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Meus Pedidos ({customerOrders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setActiveTab('edit');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'edit'
                    ? 'bg-pastel-terracotta text-white shadow-sm'
                    : 'bg-white text-charcoal-muted hover:text-charcoal border border-cream-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Meus Dados</span>
              </button>
            </div>

            {/* TAB 1: ACCOUNT OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-cream-100 pb-2.5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-charcoal-light tracking-wider">
                        Cliente Cadastrado
                      </span>
                      <h4 className="font-display font-bold text-base text-charcoal">
                        {customer.name}
                      </h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Conta Ativa</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="block text-charcoal-light font-semibold">
                        E-mail (Único):
                      </span>
                      <span className="font-bold text-charcoal">{customer.email}</span>
                    </div>
                    <div>
                      <span className="block text-charcoal-light font-semibold">Celular:</span>
                      <span className="font-mono font-semibold text-charcoal">
                        {customer.phone || 'Não informado'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-charcoal-light font-semibold">
                        CPF (Único):
                      </span>
                      <span className="font-mono font-semibold text-charcoal">
                        {customer.cpf || 'Não informado'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-charcoal-light font-semibold">
                        CEP • Cidade/UF:
                      </span>
                      <span className="font-mono font-semibold text-charcoal">
                        {customer.zipCode || '—'} • {customer.city || '—'}/
                        {customer.state || '—'}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="block text-charcoal-light font-semibold">
                        Endereço Validado (Rua, Número, Complemento e Bairro):
                      </span>
                      <span className="font-semibold text-charcoal">
                        {customer.address || 'Nenhum endereço salvo ainda'}
                        {customer.complement &&
                          !String(customer.address || '').includes(customer.complement) &&
                          ` • Compl: ${customer.complement}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Call-to-Action to Register a Product on the Platform */}
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
                      <PackagePlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-display font-bold text-xs sm:text-sm text-charcoal">
                        Publique seu Artesanato na Loja! 🧶
                      </h5>
                      <p className="text-[11px] text-charcoal-muted">
                        Como usuário logado, você pode cadastrar novos produtos diretamente no catálogo.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('new_product')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Cadastrar Produto</span>
                  </button>
                </div>

                {/* Clube das Patinhas Benefit Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-pastel-peach/60 to-pastel-rose/60 border border-pastel-peachDark/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-pastel-terracotta shadow-sm">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-display font-bold text-xs sm:text-sm text-charcoal">
                        Mimo do Clube das Patinhas
                      </h5>
                      <p className="text-[11px] text-charcoal-muted">
                        Use o cupom <strong>MIAU10</strong> no carrinho para 10% OFF!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 rounded-xl bg-pastel-terracotta text-white text-xs font-bold whitespace-nowrap hover:bg-[#c6604c] transition-colors"
                  >
                    Ir às Compras
                  </button>
                </div>

                {/* Footer Actions */}
                <div className="pt-2 flex items-center justify-between border-t border-cream-200">
                  <button
                    type="button"
                    onClick={handleLogoutClick}
                    className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair da Conta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    className="px-4 py-2.5 rounded-xl bg-white border border-cream-300 hover:bg-cream-100 text-charcoal font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-pastel-terracotta" />
                    <span>Editar Dados</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: CADASTRAR PRODUTO (LOGGED-IN USER PRODUCT CREATION) */}
            {activeTab === 'new_product' && (
              <form onSubmit={handleCreateUserProductSubmit} className="space-y-4">
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-cream-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-cream-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <PackagePlus className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-sm sm:text-base text-charcoal">
                          Cadastrar Novo Produto na Plataforma
                        </h4>
                        <p className="text-[11px] text-charcoal-muted">
                          Publicado por: <strong>{customer.name}</strong> ({customer.email})
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-7">
                      <label className="block text-xs font-bold text-charcoal mb-1">
                        Nome do Produto *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={100}
                        value={productForm.name}
                        onChange={(e) =>
                          setProductForm({ ...productForm, name: e.target.value })
                        }
                        placeholder="Ex: Amigurumi Cachorrinho Baunilha"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-cream-50 border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
                      />
                    </div>

                    <div className="sm:col-span-5">
                      <label className="block text-xs font-bold text-charcoal mb-1">
                        Categoria *
                      </label>
                      <select
                        value={productForm.category}
                        onChange={(e) =>
                          setProductForm({ ...productForm, category: e.target.value })
                        }
                        className="w-full px-3 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-cream-50 border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal cursor-pointer"
                      >
                        <option value="amigurumis">🧶 Amigurumis em Crochê</option>
                        <option value="quadros">🖼️ Quadros Decorativos</option>
                        <option value="chaveiros">🔑 Chaveiros Fofos</option>
                        <option value="casa">☕ Cerâmica & Casa</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-charcoal mb-1">
                        Preço (R$) *
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs font-bold text-charcoal-muted select-none">
                          R$
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          maxLength={12}
                          value={productForm.price}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              price: formatPriceInput(e.target.value),
                            })
                          }
                          placeholder="89,90"
                          className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-mono font-bold rounded-xl bg-cream-50 border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-charcoal mb-1">
                        Estoque *
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        maxLength={3}
                        value={productForm.inStock}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            inStock: e.target.value.replace(/\D/g, '').slice(0, 3),
                          })
                        }
                        placeholder="5"
                        className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-xl bg-cream-50 border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-charcoal mb-1">
                        Dimensões (cm) *
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          maxLength={4}
                          value={productForm.dimensions}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              dimensions: formatCentimetersDigits(e.target.value),
                            })
                          }
                          placeholder="18"
                          className="w-full pl-3 pr-10 py-2 text-xs sm:text-sm font-mono font-bold rounded-xl bg-cream-50 border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
                        />
                        <span className="absolute right-3 text-xs font-bold text-charcoal-muted select-none">
                          cm
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-charcoal mb-1">
                        Selo / Categoria *
                      </label>
                      <select
                        value={productForm.badge}
                        onChange={(e) =>
                          setProductForm({ ...productForm, badge: e.target.value })
                        }
                        className="w-full px-2.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-cream-50 border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal cursor-pointer"
                      >
                        {FIXED_PRODUCT_BADGES.map((badgeOption) => (
                          <option key={badgeOption} value={badgeOption}>
                            {badgeOption}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Image Selection or Upload */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-charcoal">
                      Foto do Produto (Escolha da Galeria ou Envie do Computador)
                    </label>
                    <div className="flex items-center gap-3">
                      <img
                        src={productForm.image}
                        alt="Preview"
                        className="w-16 h-16 rounded-2xl object-cover border border-cream-300 flex-shrink-0 bg-cream-100"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_PRODUCT_IMAGES.map((img) => (
                            <button
                              key={img.url}
                              type="button"
                              onClick={() =>
                                setProductForm({ ...productForm, image: img.url })
                              }
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                productForm.image === img.url
                                  ? 'bg-pastel-terracotta text-white border-pastel-terracotta'
                                  : 'bg-cream-50 text-charcoal-muted border-cream-200 hover:bg-cream-100'
                              }`}
                            >
                              {img.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="px-3 py-1.5 rounded-xl bg-cream-100 hover:bg-cream-200 text-charcoal text-[11px] font-bold cursor-pointer flex items-center gap-1.5 border border-cream-300 transition-colors">
                            <ImageIcon className="w-3.5 h-3.5 text-pastel-terracotta" />
                            <span>Enviar Foto do Dispositivo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageFileUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-charcoal">
                        Descrição da Peça Artesanal *
                      </label>
                      <span className="text-[10px] text-charcoal-light">
                        {productForm.description.length}/300
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      required
                      maxLength={300}
                      value={productForm.description}
                      onChange={(e) =>
                        setProductForm({ ...productForm, description: e.target.value })
                      }
                      placeholder="Descreva os materiais usados, detalhes feitos à mão e cuidados com a peça..."
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-cream-50 border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-charcoal-muted hover:bg-cream-200 transition-colors"
                  >
                    Voltar à Conta
                  </button>

                  <button
                    type="submit"
                    disabled={creatingProduct}
                    className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-soft transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>
                      {creatingProduct
                        ? 'Publicando no PostgreSQL...'
                        : 'Publicar Produto na Loja'}
                    </span>
                  </button>
                </div>

                {/* Lista de Produtos Postados com Opção de Excluir */}
                {products.filter((p) => Boolean(p.createdByEmail)).length > 0 && (
                  <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-sm space-y-2.5 mt-4">
                    <h5 className="font-display font-bold text-xs sm:text-sm text-charcoal">
                      Produtos Postados na Plataforma ({products.filter((p) => Boolean(p.createdByEmail)).length})
                    </h5>
                    <div className="space-y-2">
                      {products
                        .filter((p) => Boolean(p.createdByEmail))
                        .map((postedProd) => (
                          <div
                            key={postedProd.id}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-cream-50 border border-cream-200"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={safeImageUrl(postedProd.image)}
                                alt={safeText(postedProd.name)}
                                className="w-10 h-10 rounded-lg object-cover border border-cream-200 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-charcoal truncate">
                                  {postedProd.name}
                                </p>
                                <p className="text-[11px] text-charcoal-muted">
                                  R$ {Number(postedProd.price).toFixed(2).replace('.', ',')} •{' '}
                                  {postedProd.dimensions} • {postedProd.badge}
                                </p>
                              </div>
                            </div>
                            {onDeleteProduct && (
                              <button
                                type="button"
                                onClick={() => onDeleteProduct(postedProd)}
                                className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[11px] font-bold flex items-center gap-1 transition-colors flex-shrink-0"
                                title="Excluir produto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Excluir</span>
                              </button>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </form>
            )}

            {/* TAB 3: MY ORDERS */}
            {activeTab === 'orders' && (
              <div className="space-y-3">
                {customerOrders.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-2xl border border-cream-200 space-y-2">
                    <span className="text-3xl block">📦</span>
                    <p className="font-display font-bold text-sm text-charcoal">
                      Você ainda não realizou pedidos
                    </p>
                    <p className="text-xs text-charcoal-muted max-w-xs mx-auto">
                      Escolha seus mimos favoritos no catálogo e finalize com PIX ou Cartão!
                    </p>
                  </div>
                ) : (
                  customerOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl bg-white border border-cream-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-pastel-terracotta bg-pastel-peach/40 px-2.5 py-0.5 rounded-lg">
                            {ord.order_code}
                          </span>
                          <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {ord.payment_method === 'pix' ? 'PIX' : 'Cartão de Crédito'} •{' '}
                            {ord.payment_status}
                          </span>
                        </div>
                        <p className="text-[11px] text-charcoal-muted">
                          Realizado em {new Date(ord.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-charcoal-light uppercase font-bold">
                          Total do Pedido
                        </span>
                        <span className="font-display font-extrabold text-sm text-charcoal">
                          R$ {Number(ord.total).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 4: EDIT PROFILE */}
            {activeTab === 'edit' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {renderFormFields(true)}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-charcoal-muted hover:bg-cream-200 transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 rounded-2xl bg-pastel-terracotta hover:bg-[#c6604c] text-white font-bold text-xs sm:text-sm shadow-soft transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{loading ? 'Salvando...' : 'Atualizar Cadastro'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* IF NOT LOGGED IN: SWITCHER BETWEEN "CRIAR CONTA" AND "ENTRAR NA CONTA" */
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto overscroll-contain flex-1">
            {/* Side-by-side Mode Switcher: Criar Conta | Entrar na Conta */}
            <div className="grid grid-cols-2 gap-2.5 bg-cream-200/70 p-1.5 rounded-2xl border border-cream-300">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setError(null);
                }}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  authMode === 'register'
                    ? 'bg-pastel-terracotta text-white shadow-sm'
                    : 'text-charcoal-muted hover:text-charcoal hover:bg-white/60'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Criar Conta</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setError(null);
                }}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  authMode === 'login'
                    ? 'bg-charcoal text-white shadow-sm'
                    : 'text-charcoal-muted hover:text-charcoal hover:bg-white/60'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar na Conta</span>
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {authMode === 'login' ? (
              /* ENTRAR NA CONTA (REQUIRES REGISTERED EMAIL AND PASSWORD) */
              <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">
                <div className="bg-white p-5 rounded-2xl border border-cream-200 space-y-4 shadow-sm">
                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-base text-charcoal">
                      Entrar na sua Conta 🐾
                    </h4>
                    <p className="text-xs text-charcoal-muted">
                      Digite o e-mail e a senha que você cadastrou para acessar sua conta e cadastrar produtos.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-charcoal mb-1.5">
                      E-mail Cadastrado *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-charcoal-light absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        maxLength={100}
                        value={loginEmailInput}
                        onChange={(e) => {
                          setError(null);
                          setLoginEmailInput(e.target.value);
                        }}
                        placeholder="seu.email@exemplo.com"
                        className="w-full pl-10 pr-3.5 py-3 text-xs sm:text-sm rounded-xl bg-cream-50 border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-charcoal mb-1.5">
                      Senha Cadastrada *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-charcoal-light absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        maxLength={60}
                        value={loginPasswordInput}
                        onChange={(e) => {
                          setError(null);
                          setLoginPasswordInput(e.target.value);
                        }}
                        placeholder="Digite sua senha"
                        className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm rounded-xl bg-cream-50 border border-[#E3D7C5] focus:outline-none focus:ring-2 focus:ring-pastel-peachDark text-charcoal"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light hover:text-charcoal"
                      >
                        {showLoginPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-charcoal-muted hover:bg-cream-200 transition-colors"
                  >
                    Sair / Voltar ao Site
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 rounded-2xl bg-charcoal hover:bg-charcoal/90 text-white font-bold text-xs sm:text-sm shadow-soft transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <LogIn className="w-4 h-4 text-pastel-peach" />
                    <span>{loading ? 'Verificando...' : 'Entrar na Conta'}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* CRIAR CONTA (REGISTRATION FORM) */
              <form onSubmit={handleSubmit} className="space-y-4">
                {renderFormFields(false)}

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-charcoal-muted hover:bg-cream-200 transition-colors"
                  >
                    Sair / Voltar ao Site
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 rounded-2xl bg-pastel-terracotta hover:bg-[#c6604c] text-white font-bold text-xs sm:text-sm shadow-soft transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{loading ? 'Validando e Cadastrando...' : 'Concluir Cadastro'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
