import React, { useState, useEffect } from 'react';
import AuthButton from './AuthButton';
import ShopCartModal from './ShopCartModal';
import UserOrderHistory from './UserOrderHistory';
import Confetti from './Confetti';
import { api } from '../utils/api';
import { formatGuarani } from '../utils/formatters';
import logo from '../assets/logo.png';
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

import { FaChevronDown, FaTimes, FaArrowUp } from 'react-icons/fa';







// Componente de búsqueda flotante


const ShopHome = ({ username, onLogout, userId, onLoginRequired, isAuthenticated }) => {

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('shop');
  const [cartItemCount, setCartItemCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const categories = ['Todos', 'Cubiertas', 'Llantas'];


  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const fetchedProducts = await api.getProducts();
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error al cargar productos:", error);
        alert("Error al cargar productos.");
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);



  useEffect(() => {
    // Cargar el contador del carrito
    const loadCartCount = async () => {
      try {
        let totalCount = 0;

        if (isAuthenticated && userId) {
          // Usuario autenticado: obtener del servidor
          const cartItems = await api.getCart(userId);
          totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        } else {
          // Usuario no autenticado: obtener del localStorage
          const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
          totalCount = guestCart.reduce((sum, item) => sum + item.quantity, 0);
        }

        setCartItemCount(totalCount);
      } catch (error) {
        console.error("Error al cargar el contador del carrito:", error);
      }
    };

    loadCartCount();
  }, [isAuthenticated, userId]);

  const handleOpenCart = () => {
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }
    setIsCartModalOpen(true);
  };

  const handleAddToCart = async (product) => {
    setAddingToCart(true);
    try {
      // Crear copia del producto con el precio correcto
      const productWithCorrectPrice = {
        ...product,
        price: getDisplayPrice(product) // Usa precio promocional si está activo
      };

      if (isAuthenticated && userId) {
        // Usuario autenticado: guardar en servidor
        await api.addToCart(userId, productWithCorrectPrice);
      } else {
        // Usuario no autenticado: guardar en localStorage
        const existingCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        const existingItem = existingCart.find(item => item.product._id === product._id);

        if (existingItem) {
          existingItem.quantity += 1;
          // Actualizar precio si cambió (por promoción)
          existingItem.product.price = getDisplayPrice(product);
        } else {
          existingCart.push({ product: productWithCorrectPrice, quantity: 1 });
        }

        localStorage.setItem('guestCart', JSON.stringify(existingCart));
      }

      setCartItemCount(prev => prev + 1);

      // Mostrar animación de confeti
      setShowConfetti(true);

      // Mostrar mensaje de éxito con precio correcto
      const displayPrice = getDisplayPrice(product);
      setTimeout(() => {
        alert(`¡${product.name} agregado al carrito por ${formatGuarani(displayPrice)}!`);
      }, 500);

    } catch (error) {
      console.error("Error al agregar al carrito:", error);
      alert("Error al agregar al carrito.");
    } finally {
      setAddingToCart(false);
    }
  };



  const handleConfettiComplete = () => {
    setShowConfetti(false);
  };

  // Función helper para verificar si una promoción está activa
  const isPromotionActive = (product) => {
    // Si el backend ya nos dice si está activa, usamos eso (prioridad)
    if (product.isPromotionActive !== undefined) return product.isPromotionActive;

    // Fallback: validación local (por si acaso)
    if (!product.promotion?.isActive) return false;
    const now = new Date();
    const start = new Date(product.promotion.startDate);
    const end = new Date(product.promotion.endDate);
    // Ajustar fecha fin al final del día (igual que en el backend)
    end.setHours(23, 59, 59, 999);
    return now >= start && now <= end;
  };

  // Función helper para obtener el precio a mostrar
  const getDisplayPrice = (product) => {
    return isPromotionActive(product) ? product.promotion.discountedPrice : product.price;
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || selectedCategory === '' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    // Priorizar productos con promoción activa
    const aPromoted = isPromotionActive(a);
    const bPromoted = isPromotionActive(b);
    if (aPromoted && !bPromoted) return -1;
    if (!aPromoted && bPromoted) return 1;
    return 0;
  });

  // Obtener productos nuevos (creados en los últimos 30 días) - solo si no hay búsqueda activa
  const getNewProducts = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return products.filter(product => {
      // Si el producto tiene fecha de creación, usarla
      if (product.createdAt) {
        const productDate = new Date(product.createdAt);
        return productDate >= thirtyDaysAgo;
      }
      // Si no tiene fecha, considerar los últimos 8 productos como nuevos
      return true;
    }).slice(-8);
  };

  const newProducts = (searchTerm === '' && (selectedCategory === 'Todos' || selectedCategory === ''))
    ? getNewProducts()
    : [];

  const handleFloatingSearch = (term) => {
    setSearchTerm(term);
  };



  return (
    <div className="min-h-screen bg-gray-100 p-4 relative">
      {/* Contenedor para los botones flotantes */}

      {/* 1. TOP BAR */}
      <div className="bg-gray-900 text-gray-300 text-xs py-2 border-b border-gray-800">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="font-medium text-white">Hola, {username || 'Invitado'}</span>
            <span className="hidden sm:inline text-gray-600">|</span>
            <button onClick={() => window.open("https://maps.app.goo.gl/1LWoLgWijYNqWoK7A", "_blank")} className="hover:text-white transition-colors">
              Nuestras Sucursales
            </button>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <button onClick={onLogout} className="hover:text-red-400 transition-colors font-medium">Cerrar Sesión</button>
            ) : (
              <button onClick={onLoginRequired} className="hover:text-white transition-colors font-medium">Iniciar Sesión / Registrarse</button>
            )}
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">

          {/* Logo Area */}
          <div className="flex items-center cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <img src={logo} alt="Vecar Logo" className="h-12 mr-3" />
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-gray-900 leading-none">VECAR</span>
              <span className="text-xs font-bold tracking-widest text-red-600 uppercase">Cubiertas </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 w-full md:max-w-xl relative">
            <div className="flex">
              <input
                type="text"
                placeholder="Buscar cubiertas, llantas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 text-gray-900 focus:bg-white focus:border-gray-900 focus:outline-none transition-colors"
              />
              <button className="bg-gray-900 text-white px-6 font-bold hover:bg-black transition-colors">
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Actions Area */}
          <div className="flex items-center space-x-6">
            {/* Cart */}
            <button onClick={handleOpenCart} className="relative group">
              <div className="flex items-center text-gray-800 group-hover:text-red-600 transition-colors">
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V9a4 4 0 10-8 0v2H5a1 1 0 000 2h1v4a2 2 0 002 2h4a2 2 0 002-2v-4h1a1 1 0 100-2h-1zM8 9a2 2 0 114 0v2H8V9z" />
                  </svg>
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-sm font-bold">
                      {cartItemCount}
                    </span>
                  )}
                </div>
                <div className="ml-2 hidden lg:flex flex-col items-start leading-tight">
                  <span className="text-xs text-gray-500 font-medium">Tu Carrito</span>
                  <span className="text-sm font-bold">{cartItemCount} Items</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 3. NAVIGATION BAR */}
        <div className="border-t border-gray-100 hidden md:block">
          <div className="container mx-auto px-4">
            <nav className="flex items-center space-x-8 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === 'Todos' ? '' : cat)}
                  className={`py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${(selectedCategory === cat || (cat === 'Todos' && selectedCategory === ''))
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile Category Scroll */}
        <div className="md:hidden border-t border-gray-100 overflow-x-auto bg-gray-50">
          <div className="flex px-4 py-2 space-x-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === 'Todos' ? '' : cat)}
                className={`text-xs font-bold uppercase whitespace-nowrap px-3 py-1.5 border ${(selectedCategory === cat || (cat === 'Todos' && selectedCategory === ''))
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-300'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* NEW HERO SECTION DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 max-w-[1600px] mx-auto">
        {/* Main Banner - Spans 3 columns */}
        <div className="md:col-span-3 bg-gray-900 rounded-none overflow-hidden relative min-h-[400px] flex items-center shadow-md border border-gray-300">
          {/* Background Overlay */}
          <div className="absolute inset-0 bg-black/50 z-10"></div>
          {/* Background Image Placeholder or Texture */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1580273916550-e323be2ebdd9?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-60"></div>

          <div className="relative z-20 p-8 md:p-12 text-white max-w-2xl">
            <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-wider uppercase bg-red-600 rounded-none">
              VECAR CUBIERTAS
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-none mb-4">
              EL MEJOR PRECIO <br /><span className="text-gray-300">DE CORDILLERA</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 font-light max-w-lg">
              Venta de cubiertas de todas las marcas, llantas deportivas de alta gama y servicios de gomería con tecnología de punta.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })} className="px-8 py-3 bg-white text-gray-900 font-bold hover:bg-gray-200 transition-colors uppercase text-sm tracking-wide rounded-none">
                Ver Productos
              </button>
              <button onClick={() => window.open('https://wa.me/595985944899', '_blank')} className="px-8 py-3 bg-transparent border-2 border-white text-white font-bold hover:bg-white/10 transition-colors uppercase text-sm tracking-wide rounded-none">
                Agendar Turno
              </button>
            </div>
          </div>
        </div>

        {/* Info Sidebar - Spans 1 column */}
        <div className="md:col-span-1 flex flex-col gap-4">
          {/* Location Card */}
          <a href="https://maps.app.goo.gl/1LWoLgWijYNqWoK7A" target="_blank" rel="noopener noreferrer" className="flex-1 bg-white p-6 border border-gray-300 shadow-sm flex flex-col justify-center rounded-none group hover:border-gray-800 transition-colors cursor-pointer">
            <div className="w-10 h-10 bg-gray-100 flex items-center justify-center mb-4 rounded-none group-hover:bg-gray-900 group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Ubicación Central</h3>
            <p className="text-gray-600 text-sm">Boquerón 14, Caacupé, Paraguay</p>
            <p className="text-gray-500 text-xs mt-1">Caacupé, Paraguay</p>
            <span className="text-xs font-bold text-blue-600 mt-2 uppercase tracking-wide group-hover:underline">Ver en mapa &rarr;</span>
          </a>

          {/* Hours Card */}
          <div className="flex-1 bg-white p-6 border border-gray-300 shadow-sm flex flex-col justify-center rounded-none group hover:border-gray-800 transition-colors">
            <div className="w-10 h-10 bg-gray-100 flex items-center justify-center mb-4 rounded-none group-hover:bg-gray-900 group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Horarios de Atención</h3>
            <p className="text-gray-600 text-sm">Lunes a Sábado</p>
            <p className="text-red-600 font-bold mt-1">07:00 - 18:00 Hs</p>
          </div>

          {/* Contact Card */}
          <div className="flex-1 bg-gray-900 p-6 border border-gray-900 shadow-sm flex flex-col justify-center rounded-none relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gray-800 rounded-full -mr-10 -mt-10 opacity-50"></div>
            <h3 className="font-bold text-white text-lg mb-1 relative z-10">Contacto Directo</h3>
            <p className="text-gray-400 text-sm mb-4 relative z-10">Consultas y Presupuestos</p>
            <a href="https://wa.me/595985944899" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-white font-bold text-lg hover:text-green-400 transition-colors relative z-10">
              <span className="mr-2">WhatsApp</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Services Grid Row */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-12 max-w-[1600px] mx-auto">
        {[
          { icon: "🏎️", title: "Balanceo", desc: "Confort al andar" },
          { icon: "🔧", title: "Reparación", desc: "Llantas y Cubiertas" }
        ].map((service, idx) => (
          <div key={idx} className="bg-white p-4 border-l-4 border-l-red-600 shadow-sm border-t border-r border-b border-gray-200 rounded-none flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="font-bold text-gray-900">{service.title}</p>
              <p className="text-xs text-gray-500">{service.desc}</p>
            </div>
            <span className="text-2xl grayscale opacity-80">{service.icon}</span>
          </div>
        ))}
      </div>
      {/* Resto de tu componente ShopHome permanece igual */}
      <div className="container mx-auto bg-white rounded-none shadow-sm border border-gray-200 p-6">
        {/* Header */}




        {/* Tabs */}


        {/* Contenido */}
        <div className="bg-white border-b border-gray-200 mb-8 sm:rounded-none">
          <div className="container mx-auto px-4 flex space-x-8">
            <button
              onClick={() => setActiveTab('shop')}
              className={`py-4 font-bold text-sm uppercase tracking-wider border-b-4 transition-all ${activeTab === 'shop' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              Catálogo Completo
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 font-bold text-sm uppercase tracking-wider border-b-4 transition-all ${activeTab === 'history' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              Historial de Compras
            </button>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-12">
          {activeTab === 'shop' && (
            <>

              {loadingProducts ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-gray-900 rounded-full"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-none border-dashed border-2 border-gray-300">
                  <p className="text-gray-600">No encontramos productos que coincidan con tu búsqueda.</p>
                </div>
              ) : (
                <>
                  {/* Sección de Productos Nuevos */}
                  {newProducts.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <span className="mr-2">⚡</span>
                        Productos Nuevos
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {newProducts.map(product => (
                          <div key={product._id} className="bg-white rounded-none overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200 flex flex-col group">
                            <div
                              className="w-full h-40 md:h-48 lg:h-56 flex items-center justify-center bg-gray-50 p-2 cursor-pointer relative"
                              onClick={() => setSelectedProduct(product)}
                            >
                              <img
                                src={product.image}
                                alt={product.name}
                                className="max-h-full max-w-full object-contain transition-transform hover:scale-105"
                              />
                              {/* Badge de promoción */}
                              {isPromotionActive(product) && (
                                <div className="absolute top-2 left-2 bg-red-700 text-white text-xs px-2 py-1 font-bold shadow-md rounded-none">
                                  {product.promotion.name.toUpperCase()}
                                </div>
                              )}
                              <div className="absolute top-2 right-2 bg-gray-900 text-white text-xs px-2 py-1 font-bold rounded-none">
                                NUEVO
                              </div>
                              {/* Indicador de stock */}
                              {product.isSoldOut ? (
                                <div className="absolute bottom-2 left-2 bg-red-700 text-white text-xs px-2 py-1 flex items-center font-bold rounded-none">
                                  AGOTADO
                                </div>
                              ) : (
                                <div className="absolute bottom-2 left-2 bg-green-700 text-white text-xs px-2 py-1 flex items-center font-bold rounded-none">
                                  <div className="w-2 h-2 bg-white mr-1 animate-pulse rounded-full"></div>
                                  EN STOCK
                                </div>
                              )}
                            </div>

                            <div className="p-3 flex flex-col flex-grow">
                              <h3 className="text-sm md:text-base font-medium text-gray-800 mb-1 line-clamp-2">{product.name}</h3>
                              {/* Precios con promoción */}
                              {isPromotionActive(product) ? (
                                <div className="mb-2">
                                  <p className="text-gray-400 text-sm line-through">{formatGuarani(product.price)}</p>
                                  <p className="text-red-600 text-lg md:text-xl font-bold">{formatGuarani(product.promotion.discountedPrice)}</p>
                                  <span className="inline-block bg-red-600 text-white text-xs px-2 py-1 mt-1 font-bold rounded-none">
                                    {Math.round(((product.price - product.promotion.discountedPrice) / product.price) * 100)}% OFF
                                  </span>
                                </div>
                              ) : (
                                <p className="text-gray-900 text-lg md:text-xl font-bold mb-2">{formatGuarani(product.price)}</p>
                              )}
                              <p className="text-gray-600 text-xs md:text-sm mb-3 line-clamp-2 flex-grow">{product.description}</p>
                              <div className="mt-auto space-y-2">
                                <AuthButton
                                  text={product.isSoldOut ? "Agotado" : (addingToCart ? "Agregando..." : "AGREGAR AL CARRITO")}
                                  onClick={() => handleAddToCart(product)}
                                  disabled={addingToCart || product.isSoldOut}
                                  className={`w-full py-2 text-sm font-bold uppercase rounded-none ${product.isSoldOut ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
                                />
                                <a
                                  href={`https://wa.me/595985944899?text=Hola, estoy interesado en el producto ${encodeURIComponent(product.name)} (${formatGuarani(getDisplayPrice(product))}). ¿Tienen disponible?`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center w-full bg-green-600 hover:bg-green-700 text-white py-2 transition text-xs font-bold uppercase rounded-none mt-2"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                  </svg>
                                  {product.category === 'Kits' || product.category === 'Recargables' ? 'Consultar' : 'Consultar'}
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Productos Principales */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {filteredProducts.map(product => (
                      <div key={product._id} className="bg-white rounded-none overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200 flex flex-col group">
                        <div
                          className="w-full h-40 sm:h-48 md:h-56 lg:h-64 flex items-center justify-center bg-gray-50 p-2 cursor-pointer relative"
                          onClick={() => setSelectedProduct(product)}
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="max-h-full max-w-full object-contain transition-transform hover:scale-105"
                          />
                          {/* Badge de promoción */}
                          {isPromotionActive(product) && (
                            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 font-bold shadow-md rounded-none">
                              {product.promotion.name.toUpperCase()}
                            </div>
                          )}
                          {/* Overlay de Agotado */}
                          {product.isSoldOut && (
                            <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
                              <span className="bg-red-600 text-white px-4 py-2 font-bold text-lg transform -rotate-12 shadow-lg border-2 border-white rounded-none">
                                AGOTADO
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-3 sm:p-4 flex flex-col flex-grow">
                          <h3 className="text-sm sm:text-base font-medium text-gray-800 mb-1 sm:mb-2 line-clamp-2">{product.name}</h3>
                          {/* Precios con promoción */}
                          {isPromotionActive(product) ? (
                            <div className="mb-3 sm:mb-4">
                              <p className="text-gray-400 text-sm line-through">{formatGuarani(product.price)}</p>
                              <p className="text-red-500 text-lg sm:text-xl font-bold">{formatGuarani(product.promotion.discountedPrice)}</p>
                              <span className="inline-block bg-red-500 text-white text-xs px-2 py-1 mt-1 font-bold rounded-none">
                                {Math.round(((product.price - product.promotion.discountedPrice) / product.price) * 100)}% OFF
                              </span>
                            </div>
                          ) : (
                            <p className="text-gray-900 text-lg sm:text-xl font-bold mb-3 sm:mb-4">{formatGuarani(product.price)}</p>
                          )}
                          <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 flex-grow">{product.description}</p>
                          <div className="mt-auto space-y-2">
                            <AuthButton
                              text={product.isSoldOut ? "Agotado" : (addingToCart ? "Agregando..." : "AGREGAR AL CARRITO")}
                              onClick={() => handleAddToCart(product)}
                              disabled={addingToCart || product.isSoldOut}
                              className={`w-full py-2 text-sm font-bold uppercase rounded-none ${product.isSoldOut ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
                            />
                            <a
                              href={`https://wa.me/595985944899?text=Hola, estoy interesado en el producto ${encodeURIComponent(product.name)} (${formatGuarani(getDisplayPrice(product))}). ¿Tienen disponible?`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-full bg-green-600 hover:bg-green-700 text-white py-2 transition text-xs font-bold uppercase rounded-none"
                            >
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                              </svg>
                              {product.category === 'Kits' || product.category === 'Recargables' ? 'Consultar' : 'Consultar'}
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Modal de Productos Relacionados */}
                  {selectedProduct && (
                    <div
                      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
                      onClick={(e) => {
                        // Cerrar al hacer clic fuera del contenido
                        if (e.target === e.currentTarget) {
                          setSelectedProduct(null);
                        }
                      }}
                    >
                      <div className="bg-white rounded-none max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-gray-600 shadow-2xl">
                        <div className="p-6 md:p-8">
                          <div className="flex justify-between items-start mb-6 border-b border-gray-200 pb-4">
                            <h3 className="text-3xl font-bold text-gray-900 tracking-tight">Detalles del Producto</h3>
                            <button
                              onClick={() => setSelectedProduct(null)}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          {/* Producto principal seleccionado */}
                          <div
                            className="bg-white rounded-none p-0 mb-6"
                            id="selected-product"
                          >
                            <div className="flex flex-col lg:flex-row gap-8">
                              <div className="lg:w-1/2 flex-shrink-0">
                                <div className="h-80 flex items-center justify-center bg-gray-50 rounded-none p-6 border border-gray-200">
                                  <img
                                    src={selectedProduct.image}
                                    alt={selectedProduct.name}
                                    className="max-h-full max-w-full object-contain"
                                  />
                                </div>
                              </div>
                              <div className="lg:w-1/2">
                                <div className="mb-2">
                                  <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-none uppercase tracking-wider">
                                    {selectedProduct.category}
                                  </span>
                                </div>
                                <h4 className="font-extrabold text-gray-900 text-3xl mb-4 leading-tight">{selectedProduct.name}</h4>

                                {isPromotionActive(selectedProduct) ? (
                                  <div className="mb-6">
                                    <p className="text-gray-400 text-lg line-through mb-1">{formatGuarani(selectedProduct.price)}</p>
                                    <div className="flex items-center gap-3">
                                      <p className="text-red-600 font-bold text-4xl">{formatGuarani(selectedProduct.promotion.discountedPrice)}</p>
                                      <span className="bg-red-600 text-white text-sm px-3 py-1 font-bold rounded-none">
                                        {Math.round(((selectedProduct.price - selectedProduct.promotion.discountedPrice) / selectedProduct.price) * 100)}% OFF
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-gray-900 font-bold text-4xl mb-6">{formatGuarani(selectedProduct.price)}</p>
                                )}
                                <p className="text-gray-600 mb-8 text-lg leading-relaxed">{selectedProduct.description}</p>
                                <div className="flex flex-col gap-3">
                                  <button
                                    onClick={() => {
                                      handleAddToCart(selectedProduct);
                                      setSelectedProduct(null);
                                    }}
                                    disabled={selectedProduct.isSoldOut}
                                    className={`${selectedProduct.isSoldOut ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-900 hover:bg-black'} text-white py-4 px-6 rounded-none transition-colors flex items-center justify-center text-lg font-bold uppercase tracking-wider shadow-md border-b-4 border-gray-800 active:border-b-0 active:translate-y-1`}
                                  >
                                    {selectedProduct.isSoldOut ? 'Agotado' : (
                                      <>
                                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        AGREGAR AL CARRITO
                                      </>
                                    )}
                                  </button>
                                  <a
                                    href={`https://wa.me/595985944899?text=Hola, estoy interesado en el producto ${encodeURIComponent(selectedProduct.name)} (${formatGuarani(selectedProduct.price)}). ¿Tienen disponible?`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-none inline-flex items-center justify-center transition-colors text-lg font-bold uppercase tracking-wider shadow-md border-b-4 border-green-800 active:border-b-0 active:translate-y-1"
                                  >
                                    <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                    CONSULTAR
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Productos relacionados por nombre y categoría */}
                          <div className="mb-6">
                            <h4 className="text-lg font-semibold text-gray-700 mb-4">Productos similares por nombre</h4>
                            <div className="grid grid-cols-2 gap-4">
                              {filteredProducts
                                .filter(p =>
                                  p._id !== selectedProduct._id &&
                                  (p.name.toLowerCase().includes(selectedProduct.name.toLowerCase().split(' ')[0]) ||
                                    selectedProduct.name.toLowerCase().includes(p.name.toLowerCase().split(' ')[0]))
                                )
                                .slice(0, 4)
                                .map(relatedProduct => (
                                  <div
                                    key={relatedProduct._id}
                                    className="border border-gray-200 rounded-none p-4 hover:shadow-lg transition-all cursor-pointer group bg-white"
                                    onClick={() => {
                                      setSelectedProduct(relatedProduct);
                                      // Scroll al producto seleccionado solo en móvil
                                      if (window.innerWidth <= 768) {
                                        setTimeout(() => {
                                          const selectedElement = document.getElementById('selected-product');
                                          if (selectedElement) {
                                            selectedElement.scrollIntoView({
                                              behavior: 'smooth',
                                              block: 'nearest'
                                            });
                                          }
                                        }, 100);
                                      }
                                    }}
                                  >
                                    <div className="h-40 flex items-center justify-center mb-4 relative bg-gray-50 rounded-none border border-gray-100">
                                      <img
                                        src={relatedProduct.image}
                                        alt={relatedProduct.name}
                                        className="max-h-full max-w-full object-contain p-2"
                                      />
                                      {/* Indicador de stock */}
                                      {relatedProduct.isSoldOut ? (
                                        <div className="absolute bottom-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-none flex items-center font-bold shadow-sm">
                                          AGOTADO
                                        </div>
                                      ) : (
                                        <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-none flex items-center font-bold shadow-sm">
                                          <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                                          EN STOCK
                                        </div>
                                      )}
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200"></div>
                                    </div>

                                    <h4 className="font-semibold text-gray-800 mb-1 truncate">{relatedProduct.name}</h4>
                                    {/* Precios con promoción */}
                                    {isPromotionActive(relatedProduct) ? (
                                      <div className="mb-2">
                                        <p className="text-gray-400 text-xs line-through">{formatGuarani(relatedProduct.price)}</p>
                                        <p className="text-red-500 font-bold">{formatGuarani(relatedProduct.promotion.discountedPrice)}</p>
                                        <span className="inline-block bg-red-600 text-white text-xs px-2 py-0.5 rounded-none mt-1 font-bold">
                                          {Math.round(((relatedProduct.price - relatedProduct.promotion.discountedPrice) / relatedProduct.price) * 100)}% OFF
                                        </span>
                                      </div>
                                    ) : (
                                      <p className="text-blue-600 font-bold mb-2">{formatGuarani(relatedProduct.price)}</p>
                                    )}
                                    <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded-none mb-4 inline-block uppercase tracking-wider">
                                      {relatedProduct.category}
                                    </span>

                                    <div className="flex flex-col space-y-2 mt-3">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAddToCart(relatedProduct);
                                          setSelectedProduct(null);
                                        }}
                                        disabled={relatedProduct.isSoldOut}
                                        className={`w-full py-2 px-3 rounded-none text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center ${relatedProduct.isSoldOut ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-gray-900 hover:bg-black text-white'
                                          }`}
                                      >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        {relatedProduct.isSoldOut ? 'Agotado' : 'Agregar al carrito'}
                                      </button>
                                      <a
                                        href={`https://wa.me/595985944899?text=Hola, estoy interesado en el producto ${encodeURIComponent(relatedProduct.name)} (${formatGuarani(getDisplayPrice(relatedProduct))}). ¿Tienen disponible?`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={e => e.stopPropagation()}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-none text-xs font-bold uppercase tracking-wider text-center transition-colors flex items-center justify-center"
                                      >
                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        Consultar
                                      </a>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>

                          {/* Productos relacionados por categoría */}
                          <div className="mb-6">
                            <h4 className="text-lg font-semibold text-gray-700 mb-4">Otros productos en {selectedProduct.category}</h4>
                            <div className="grid grid-cols-2 gap-4">
                              {filteredProducts
                                .filter(p =>
                                  p.category === selectedProduct.category &&
                                  p._id !== selectedProduct._id &&
                                  !p.name.toLowerCase().includes(selectedProduct.name.toLowerCase().split(' ')[0]) &&
                                  !selectedProduct.name.toLowerCase().includes(p.name.toLowerCase().split(' ')[0])
                                )
                                .slice(0, 4)
                                .map(relatedProduct => (
                                  <div
                                    key={relatedProduct._id}
                                    className="border border-gray-200 rounded-none p-4 hover:shadow-lg transition-all cursor-pointer group bg-white"
                                    onClick={() => {
                                      setSelectedProduct(relatedProduct);
                                      // Scroll al producto seleccionado solo en móvil
                                      if (window.innerWidth <= 768) {
                                        setTimeout(() => {
                                          const selectedElement = document.getElementById('selected-product');
                                          if (selectedElement) {
                                            selectedElement.scrollIntoView({
                                              behavior: 'smooth',
                                              block: 'nearest'
                                            });
                                          }
                                        }, 100);
                                      }
                                    }}
                                  >
                                    <div className="h-40 flex items-center justify-center mb-4 relative bg-gray-50 rounded-none border border-gray-100">
                                      <img
                                        src={relatedProduct.image}
                                        alt={relatedProduct.name}
                                        className="max-h-full max-w-full object-contain p-2"
                                      />
                                      {/* Indicador de stock */}
                                      {relatedProduct.isSoldOut ? (
                                        <div className="absolute bottom-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-none flex items-center font-bold shadow-sm">
                                          AGOTADO
                                        </div>
                                      ) : (
                                        <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-none flex items-center font-bold shadow-sm">
                                          <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                                          EN STOCK
                                        </div>
                                      )}
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200"></div>
                                    </div>

                                    <h4 className="font-semibold text-gray-800 mb-1 truncate">{relatedProduct.name}</h4>
                                    {/* Precios con promoción */}
                                    {isPromotionActive(relatedProduct) ? (
                                      <div className="mb-2">
                                        <p className="text-gray-400 text-xs line-through">{formatGuarani(relatedProduct.price)}</p>
                                        <p className="text-red-500 font-bold">{formatGuarani(relatedProduct.promotion.discountedPrice)}</p>
                                        <span className="inline-block bg-red-600 text-white text-xs px-2 py-0.5 rounded-none mt-1 font-bold">
                                          {Math.round(((relatedProduct.price - relatedProduct.promotion.discountedPrice) / relatedProduct.price) * 100)}% OFF
                                        </span>
                                      </div>
                                    ) : (
                                      <p className="text-blue-600 font-bold mb-2">{formatGuarani(relatedProduct.price)}</p>
                                    )}

                                    <div className="flex flex-col space-y-2 mt-3">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAddToCart(relatedProduct);
                                          setSelectedProduct(null);
                                        }}
                                        disabled={relatedProduct.isSoldOut}
                                        className={`w-full py-2 px-3 rounded-none text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center ${relatedProduct.isSoldOut ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-gray-900 hover:bg-black text-white'
                                          }`}
                                      >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        {relatedProduct.isSoldOut ? 'Agotado' : 'Agregar al carrito'}
                                      </button>
                                      <a
                                        href={`https://wa.me/595985944899?text=Hola, estoy interesado en el producto ${encodeURIComponent(relatedProduct.name)} (${formatGuarani(getDisplayPrice(relatedProduct))}). ¿Tienen disponible?`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={e => e.stopPropagation()}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-none text-xs font-bold uppercase tracking-wider text-center transition-colors flex items-center justify-center"
                                      >
                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        Consultar
                                      </a>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>

                          {/* Ofertas Relacionadas */}
                          {filteredProducts.some(p => isPromotionActive(p) && p._id !== selectedProduct._id) && (
                            <div className="mb-6">
                              <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                                <span className="mr-2">🔥</span> Ofertas Relacionadas
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                {filteredProducts
                                  .filter(p =>
                                    isPromotionActive(p) &&
                                    p._id !== selectedProduct._id
                                  )
                                  .slice(0, 4)
                                  .map(relatedProduct => (
                                    <div
                                      key={relatedProduct._id}
                                      className="border border-red-100 rounded-none p-4 hover:shadow-lg transition-all cursor-pointer group bg-white"
                                      onClick={() => {
                                        setSelectedProduct(relatedProduct);
                                        // Scroll al producto seleccionado solo en móvil
                                        if (window.innerWidth <= 768) {
                                          setTimeout(() => {
                                            const selectedElement = document.getElementById('selected-product');
                                            if (selectedElement) {
                                              selectedElement.scrollIntoView({
                                                behavior: 'smooth',
                                                block: 'nearest'
                                              });
                                            }
                                          }, 100);
                                        }
                                      }}
                                    >
                                      <div className="h-40 flex items-center justify-center mb-4 relative bg-gray-50 rounded-none border border-gray-100">
                                        <img
                                          src={relatedProduct.image}
                                          alt={relatedProduct.name}
                                          className="max-h-full max-w-full object-contain p-2"
                                        />
                                        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-none font-bold shadow-sm">
                                          OFF
                                        </div>
                                        {/* Indicador de stock */}
                                        {relatedProduct.isSoldOut ? (
                                          <div className="absolute bottom-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-none flex items-center font-bold shadow-sm">
                                            AGOTADO
                                          </div>
                                        ) : (
                                          <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-none flex items-center font-bold shadow-sm">
                                            <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                                            EN STOCK
                                          </div>
                                        )}
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200"></div>
                                      </div>

                                      <h4 className="font-semibold text-gray-800 mb-1 truncate">{relatedProduct.name}</h4>
                                      <div className="mb-2">
                                        <p className="text-gray-400 text-xs line-through">{formatGuarani(relatedProduct.price)}</p>
                                        <p className="text-red-500 font-bold">{formatGuarani(relatedProduct.promotion.discountedPrice)}</p>
                                        <span className="inline-block bg-red-600 text-white text-xs px-2 py-0.5 rounded-none mt-1 font-bold">
                                          {Math.round(((relatedProduct.price - relatedProduct.promotion.discountedPrice) / relatedProduct.price) * 100)}% OFF
                                        </span>
                                      </div>

                                      <div className="flex flex-col space-y-2 mt-3">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddToCart(relatedProduct);
                                            setSelectedProduct(null);
                                          }}
                                          disabled={relatedProduct.isSoldOut}
                                          className={`w-full py-2 px-3 rounded-none text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center ${relatedProduct.isSoldOut ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-gray-900 hover:bg-black text-white'
                                            }`}
                                        >
                                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                          </svg>
                                          {relatedProduct.isSoldOut ? 'Agotado' : 'Agregar al carrito'}
                                        </button>
                                        <a
                                          href={`https://wa.me/595985944899?text=Hola, estoy interesado en el producto ${encodeURIComponent(relatedProduct.name)} (${formatGuarani(relatedProduct.promotion.discountedPrice)}). ¿Tienen disponible?`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={e => e.stopPropagation()}
                                          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-none text-xs font-bold uppercase tracking-wider text-center transition-colors flex items-center justify-center"
                                        >
                                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                          </svg>
                                          Consultar
                                        </a>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  )}
                </>
              )}
            </>
          )}
          {activeTab === 'history' && (
            isAuthenticated && userId ? (
              <UserOrderHistory userId={userId} />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Debes iniciar sesión para ver tu historial de compras.</p>
                <button
                  onClick={onLoginRequired}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  Iniciar Sesión
                </button>
              </div>
            )
          )}
        </div>

      </div>

      {/* Sección Sobre Nosotros */}

      <section className="bg-white py-16 lg:py-24 border-t border-gray-200" id="about">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col lg:flex-row items-stretch">

          {/* Columna de imágenes - Diseño Industrial */}
          <div className="lg:w-1/2 p-2">
            <div className="grid grid-cols-2 gap-2 h-full">
              <div className="relative h-64 lg:h-auto bg-gray-200 overflow-hidden border border-gray-900 group">
                <img
                  src="https://i.imgur.com/sU9A3SY.png"
                  alt="Cubiertas y Llantas"
                  className="w-full h-full object-cover transition-all duration-700"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="border-2 border-white px-4 py-2">
                    <span className="text-white font-bold text-sm uppercase tracking-widest">Productos Premium</span>
                  </div>
                </div>
              </div>
              <div className="relative h-64 lg:h-auto bg-gray-200 overflow-hidden border border-gray-900 group">
                <img
                  src="https://i.imgur.com/jztvdpF.jpeg"
                  alt="Atención al cliente"
                  className="w-full h-full object-cover transition-all duration-700"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="border-2 border-white px-4 py-2">
                    <span className="text-white font-bold text-sm uppercase tracking-widest">Atención total</span>
                  </div>
                </div>
              </div>
              <div className="relative col-span-2 h-64 lg:h-auto bg-gray-20 overflow-hidden border border-gray-900 group">
                <img
                  src="https://i.imgur.com/lriL7Rb.png"
                  alt="Equipo Vecar"
                  className="w-full h-full object-contain transition-all duration-500"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="border-2 border-white px-6 py-3">
                    <span className="text-white font-bold text-lg uppercase tracking-widest">Equipo Profesional</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna de texto - Diseño Industrial */}
          <div className="lg:w-1/2 p-8 lg:p-12 lg:pl-16 flex flex-col justify-center bg-gray-50 border-r border-y border-gray-200 lg:border-l-0 border-l lg:border-r">
            <h2 className="text-4xl font-black text-gray-900 mb-8 uppercase tracking-tighter flex items-center">
              <span className="w-3 h-12 bg-red-600 mr-4 block"></span>
              Sobre Vecar
            </h2>

            <div className="mb-10 group">
              <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center uppercase tracking-wide group-hover:text-red-600 transition-colors">
                <svg className="w-6 h-6 mr-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Nuestra Pasión
              </h3>
              <p className="text-gray-600 leading-relaxed font-medium pl-9 border-l-2 border-gray-200">
                En Vecar, Ofrecemos las mejores cubiertas y llantas, combinando calidad, durabilidad y precios competitivos. Seleccionamos cada producto para garantizar tu seguridad.
              </p>
            </div>

            <div className="mb-10 group">
              <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center uppercase tracking-wide group-hover:text-red-600 transition-colors">
                <svg className="w-6 h-6 mr-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                El Equipo Vecar
              </h3>
              <p className="text-gray-600 leading-relaxed font-medium pl-9 border-l-2 border-gray-200 mb-4">
                Somos expertos en neumáticos. Nuestro equipo técnico está comprometido con tu seguridad, brindándote el mejor asesoramiento para tus neumáticos.
              </p>

              <div className="flex flex-wrap gap-3 pl-9">
                <span className="bg-gray-900 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider border border-gray-900 hover:bg-white hover:text-gray-900 transition-colors">Expertos en Cubiertas</span>
                <span className="bg-gray-900 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider border border-gray-900 hover:bg-white hover:text-gray-900 transition-colors">Mejores Precios</span>
                <span className="bg-gray-900 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider border border-gray-900 hover:bg-white hover:text-gray-900 transition-colors">Seguridad </span>
              </div>
            </div>

            <div className="mb-8 group">
              <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center uppercase tracking-wide group-hover:text-red-600 transition-colors">
                <svg className="w-6 h-6 mr-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Misión
              </h3>
              <p className="text-gray-600 leading-relaxed font-medium pl-9 border-l-2 border-gray-200">
                Brindar los mejores productos, servicios y la mejor atencion. A través de la innovación y la mejora continua.
              </p>
            </div>

            <a
              href="https://wa.me/595985944899"
              className="inline-flex mt-2 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest py-4 px-10 text-sm transition-all duration-300 items-center justify-center w-fit border-b-4 border-red-800 active:translate-y-1 active:border-b-0"
            >
              Contactanos
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Sección de Ubicación con Mapa */}
      <section className="bg-gray-100 py-16 lg:py-20 border-t border-gray-300">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-gray-900 mb-4 uppercase tracking-tighter inline-flex items-center justify-center">
              <span className="w-3 h-12 bg-red-600 mr-4 block"></span>
              Nuestra Ubicación
              <span className="w-3 h-12 bg-red-600 ml-4 block"></span>
            </h2>
            <p className="text-gray-600 font-medium text-lg max-w-2xl mx-auto">
              Visítanos en nuestro taller. Estamos ubicados en una zona de fácil acceso.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Mapa embebido */}
            <div className="border-4 border-gray-900 overflow-hidden h-96 lg:h-[500px] shadow-xl">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4679.304008793526!2d-57.141126099999994!3d-25.387431100000004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x945c33fa7eb1b98d%3A0xa49c8f912b13410a!2sVecar%20Cubiertas!5e1!3m2!1ses!2spy!4v1767084256272!5m2!1ses!2spy"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación Vecar"
              ></iframe>
            </div>

            {/* Información de contacto */}
            <div className="bg-white border-2 border-gray-900 p-8 lg:p-10 h-96 lg:h-[500px] flex flex-col justify-center">
              <h3 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tight border-b-2 border-red-600 pb-3 inline-block">
                Información de Contacto
              </h3>

              <div className="space-y-6">
                <div className="flex items-start group">
                  <div className="bg-red-600 p-3 mr-4 border border-gray-900">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 uppercase text-sm tracking-wider mb-1">Dirección</h4>
                    <p className="text-gray-600 font-medium">Caacupe</p>
                    <p className="text-gray-600 font-medium">Paraguay</p>
                  </div>
                </div>

                <div className="flex items-start group">
                  <div className="bg-red-600 p-3 mr-4 border border-gray-900">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 uppercase text-sm tracking-wider mb-1">Teléfono</h4>
                    <a href="tel:+595985944899" className="text-gray-600 font-bold hover:text-red-600 transition-colors">
                      +595 985 944 899
                    </a>
                  </div>
                </div>

                <div className="flex items-start group">
                  <div className="bg-red-600 p-3 mr-4 border border-gray-900">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 uppercase text-sm tracking-wider mb-1">Email</h4>
                    <a href="mailto:vecarcubiertas@gmail.com" className="text-gray-600 font-bold hover:text-red-600 transition-colors">
                      vecarcubiertas@gmail.com
                    </a>
                  </div>
                </div>

                <a
                  href="https://maps.app.goo.gl/1LWoLgWijYNqWoK7A"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex mt-4 bg-gray-900 hover:bg-red-600 text-white font-bold uppercase tracking-widest py-3 px-8 text-xs transition-all duration-300 items-center justify-center w-full border-b-4 border-gray-700 hover:border-red-800 active:translate-y-1 active:border-b-0"
                >
                  Ver en Google Maps
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white text-gray-700 py-12 mt-16 border-t border-gray-200">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Información de la empresa */}
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Vecar</h2>
              <p className="text-gray-500 mb-4">
                Las mejores marcas de cubiertas y llantas con atención personalizada.
              </p>
              <div className="flex justify-center md:justify-start space-x-4">
                <a href="https://www.instagram.com/vecar_cubiertas/" target="_blank" rel="noopener noreferrer" className="group">
                  <div className="bg-gray-100 p-3 rounded-full hover:bg-pink-100 transition">
                    <svg className="w-5 h-5 text-pink-500 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7.75 2h8.5C19.55 2 22 4.45 22 7.75v8.5c0 3.3-2.45 5.75-5.75 5.75h-8.5C4.45 22 2 19.55 2 16.25v-8.5C2 4.45 4.45 2 7.75 2zm0 1.5C5.4 3.5 3.5 5.4 3.5 7.75v8.5C3.5 18.6 5.4 20.5 7.75 20.5h8.5c2.35 0 4.25-1.9 4.25-4.25v-8.5C20.5 5.4 18.6 3.5 16.25 3.5h-8.5zM12 7a5 5 0 110 10 5 5 0 010-10zm0 1.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm4.25-2.25a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5z" />
                    </svg>
                  </div>
                </a>
                <a href="https://wa.me/595985944899" target="_blank" rel="noopener noreferrer" className="group">
                  <div className="bg-gray-100 p-3 rounded-full hover:bg-green-100 transition">
                    <svg className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.52 3.48A11.92 11.92 0 0012.07 0a11.89 11.89 0 00-9.17 19.36L0 24l4.74-2.49A11.91 11.91 0 0012.07 24h.01a11.91 11.91 0 008.44-20.52zm-8.44 18.5h-.01a10.16 10.16 0 01-5.22-1.45l-.37-.22-3.13 1.65.66-3.09-.2-.39a10.17 10.17 0 1118.41-6.58 10.18 10.18 0 01-10.14 10.08z" />
                    </svg>
                  </div>
                </a>
              </div>
            </div>

            {/* Enlaces rápidos */}
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Información</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition">Sobre Nosotros</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition">Nuestros Productos</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition">Blog</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition">Contacto</a></li>
              </ul>
            </div>

            {/* Políticas legales */}
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Políticas</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => document.getElementById('privacy_modal').showModal()}
                    className="text-gray-600 hover:text-gray-900 transition"
                  >
                    Política de Privacidad
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => document.getElementById('shipping_modal').showModal()}
                    className="text-gray-600 hover:text-gray-900 transition"
                  >
                    Política de Envíos
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => document.getElementById('warranty_modal').showModal()}
                    className="text-gray-600 hover:text-gray-900 transition"
                  >
                    Política de Garantía
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => document.getElementById('returns_modal').showModal()}
                    className="text-gray-600 hover:text-gray-900 transition"
                  >
                    Devoluciones y Reembolsos
                  </button>
                </li>
              </ul>
            </div>

            {/* Contacto */}
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Contacto</h3>
              <ul className="space-y-2">
                <li className="flex items-center justify-center md:justify-start">
                  <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-gray-600">+595 985 944 899</span>
                </li>
                <li className="flex items-center justify-center md:justify-start">
                  <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:vecarcubiertas@gmail.com" className="text-gray-600 hover:text-gray-900 transition-colors">vecarcubiertas@gmail.com</a>
                </li>
                <li className="flex items-center justify-center md:justify-start">
                  <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <a href="https://maps.app.goo.gl/1LWoLgWijYNqWoK7A" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Caacupe, Paraguay
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-gray-200 pt-6 text-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Vecar. Todos los derechos reservados.
            </p>

            <p className="text-xs text-gray-400 mt-2">
              Desarrollado por{' '}
              <a
                href="https://marcosgnbsoft.onrender.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                MGNB
              </a>
            </p>
          </div>
        </div>

        {/* Modales para políticas */}
        <dialog id="privacy_modal" className="modal">
          <div className="modal-box max-w-3xl">
            <h3 className="font-bold text-lg">Política de Privacidad</h3>
            <div className="py-4 text-left">
              <p className="mb-4">En Vecar nos comprometemos a proteger tu privacidad. Esta política explica cómo recopilamos, usamos y protegemos tu información personal.</p>

              <h4 className="font-semibold mt-4">Información que recopilamos:</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>Datos personales al realizar una compra (nombre, dirección, email, teléfono)</li>
                <li>Información de transacciones y pagos</li>
                <li>Datos de navegación y cookies</li>
              </ul>

              <h4 className="font-semibold mt-4">Uso de la información:</h4>
              <p>Utilizamos tu información para procesar pedidos, mejorar nuestros servicios y comunicarnos contigo sobre promociones (si nos das tu consentimiento).</p>

              <h4 className="font-semibold mt-4">Protección de datos:</h4>
              <p>Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos contra accesos no autorizados o pérdidas.</p>
            </div>
            <div className="modal-action">
              <form method="dialog">
                <button className="btn">Cerrar</button>
              </form>
            </div>
          </div>
        </dialog>

        <dialog id="shipping_modal" className="modal">
          <div className="modal-box max-w-3xl">
            <h3 className="font-bold text-lg">Política de Envíos</h3>
            <div className="py-4 text-left">
              <h4 className="font-semibold">Áreas de entrega:</h4>
              <p className="mb-4">Realizamos envíos a todo Paraguay. Para envíos internacionales, contáctenos.</p>

              <h4 className="font-semibold">Tiempos de entrega:</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>Asunción: 24-48 horas hábiles</li>
                <li>Área Metropolitana: 2-3 días hábiles</li>
                <li>Interior del país: 3-5 días hábiles</li>
              </ul>

              <h4 className="font-semibold">Costos de envío:</h4>
              <p>En Asunción: Gratis para compras mayores a 3.000.000 Gs. <br />
                Interior: Los costos varían según la localidad y se calculan al finalizar la compra.</p>

              <h4 className="font-semibold mt-4">Seguimiento:</h4>
              <p>Todos los envíos incluyen número de seguimiento que será proporcionado por email.</p>
            </div>
            <div className="modal-action">
              <form method="dialog">
                <button className="btn">Cerrar</button>
              </form>
            </div>
          </div>
        </dialog>

        <dialog id="warranty_modal" className="modal">
          <div className="modal-box max-w-3xl">
            <h3 className="font-bold text-lg">Política de Garantía</h3>
            <div className="py-4 text-left">
              <h4 className="font-semibold">Cobertura:</h4>
              <p className="mb-4">Todos nuestros productos no cuentan con garantía.</p>

              <h4 className="font-semibold">Procedimiento:</h4>
              <ol className="list-decimal pl-5 mb-4">
                <li>Contactar a nuestro servicio al cliente dentro del plazo de entrega</li>
                <li>Proporcionar comprobante de compra</li>
                <li>Nuestro equipo evaluará el producto</li>
                <li>Si aplica, procederemos al reemplazo o reparación</li>
              </ol>

              <h4 className="font-semibold">Exclusiones:</h4>
              <p>La garantía no cubre daños por mal uso, modificaciones no autorizadas o desgaste normal del producto.</p>


            </div>
            <div className="modal-action">
              <form method="dialog">
                <button className="btn">Cerrar</button>
              </form>
            </div>
          </div>
        </dialog>

        <dialog id="returns_modal" className="modal">
          <div className="modal-box max-w-3xl">
            <h3 className="font-bold text-lg">Devoluciones y Reembolsos</h3>
            <div className="py-4 text-left">
              <h4 className="font-semibold">Plazo para devoluciones:</h4>
              <p className="mb-4">Aceptamos devoluciones dentro de las 12 horas posteriores a la recepción del producto.</p>

              <h4 className="font-semibold">Condiciones:</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>Producto debe estar en su empaque original</li>
                <li>Debe incluir todos los accesorios y manuales</li>
                <li>No debe mostrar signos de uso</li>
              </ul>

              <h4 className="font-semibold">Proceso:</h4>
              <ol className="list-decimal pl-5 mb-4">
                <li>Contactar a nuestro servicio al cliente</li>
                <li>Recibirá instrucciones para el envío de devolución</li>
                <li>Una vez recibido y verificado, procesaremos el reembolso</li>
              </ol>

              <h4 className="font-semibold">Reembolsos:</h4>
              <p>Los reembolsos se realizarán mediante el mismo método de pago original y pueden demorar hasta 5 días hábiles en procesarse.</p>

              <h4 className="font-semibold mt-4">Productos defectuosos:</h4>
              <p>Para productos recibidos con defectos, contáctenos inmediatamente para coordinar el reemplazo sin costo adicional. dentro del plazo de entrega.</p>
            </div>
            <div className="modal-action">
              <form method="dialog">
                <button className="btn">Cerrar</button>
              </form>
            </div>
          </div>
        </dialog>
      </footer>

      {
        cartItemCount > 0 && (
          <button
            onClick={handleOpenCart}
            className="fixed bottom-6 right-6 bg-gray-900 text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-all z-50"
          >
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 7M7 13l-1 2h13M9 21h2m4 0h2" />
              </svg>
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {cartItemCount}
              </span>
            </div>
          </button>
        )
      }

      <ShopCartModal
        userId={userId}
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        isAuthenticated={isAuthenticated}
      />

      {/* Animación de confeti */}
      <Confetti
        isVisible={showConfetti}
        onComplete={handleConfettiComplete}
      />
    </div >
  );
};

export default ShopHome;