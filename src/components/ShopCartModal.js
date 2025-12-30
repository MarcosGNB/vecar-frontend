import React, { useState, useEffect } from 'react';
import AuthButton from './AuthButton';
import AuthInput from './AuthInput';
import { api } from '../utils/api';
import { formatGuarani } from '../utils/formatters';
import { FaCopy, FaCheck } from 'react-icons/fa';

const ShopCartModal = ({ userId, isOpen, onClose, isAuthenticated = false }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [updatingCart, setUpdatingCart] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [deliveryOption, setDeliveryOption] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [copied, setCopied] = useState({
    accountNumber: false,
    alias: false
  });
  const [formspreeLoading, setFormspreeLoading] = useState(false);

  // Función helper para verificar si una promoción está activa
  const isPromotionActive = (product) => {
    // Si el backend ya nos dice si está activa, usamos eso (prioridad)
    if (product.isPromotionActive !== undefined) return product.isPromotionActive;

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

  useEffect(() => {
    if (isOpen) {

      const fetchCart = async () => {
        setLoadingCart(true);
        try {
          let items = [];

          if (isAuthenticated && userId) {
            // Usuario autenticado: obtener del servidor
            console.log("🔄 Abriendo carrito para userId:", userId);
            items = await api.getCart(userId);
            console.log("✅ Productos recibidos del backend:", items);
          } else {
            // Usuario no autenticado: obtener del localStorage
            console.log("🔄 Abriendo carrito de invitado");
            const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
            console.log("✅ Productos del carrito de invitado:", guestCart);
            // Normalizar estructura para que coincida con el backend (flatten)
            items = guestCart.map(item => ({
              ...item.product,
              quantity: item.quantity,
              // Asegurar que el precio sea el correcto si ya se guardó con descuento
              price: item.product.price
            }));
          }

          setCartItems(items);
        } catch (error) {
          console.error("❌ Error al cargar el carrito:", error);
        } finally {
          setLoadingCart(false);
        }
      };
      fetchCart();
    }
  }, [isOpen, userId, isAuthenticated]);

  const handleRemoveItem = async (productId) => {
    setUpdatingCart(true);
    try {
      let updatedCart = [];

      if (isAuthenticated && userId) {
        // Usuario autenticado: eliminar del servidor
        console.log("🗑️ Eliminando producto del carrito:", { userId, productId });
        updatedCart = await api.removeFromCart(userId, productId);
        console.log("✅ Carrito actualizado después de eliminar:", updatedCart);
      } else {
        // Usuario no autenticado: eliminar del localStorage
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        const newGuestCart = guestCart.filter(item => item.product._id !== productId);
        localStorage.setItem('guestCart', JSON.stringify(newGuestCart));

        // Normalizar para el estado local
        updatedCart = newGuestCart.map(item => ({
          ...item.product,
          quantity: item.quantity
        }));
        console.log("✅ Carrito de invitado actualizado después de eliminar:", updatedCart);
      }

      setCartItems(updatedCart);
    } catch (error) {
      console.error("❌ Error al eliminar del carrito:", error);
    } finally {
      setUpdatingCart(false);
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    const quantity = parseInt(newQuantity);
    if (isNaN(quantity) || quantity < 0) return;

    setUpdatingCart(true);
    try {
      let updatedCart = [];

      if (isAuthenticated && userId) {
        // Usuario autenticado: actualizar en servidor
        console.log("✏️ Actualizando cantidad del producto:", { userId, productId, quantity });
        updatedCart = await api.updateCartItemQuantity(userId, productId, quantity);
        console.log("✅ Carrito actualizado después de cambio de cantidad:", updatedCart);
      } else {
        // Usuario no autenticado: actualizar en localStorage
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        const itemIndex = guestCart.findIndex(item => item.product._id === productId);

        if (itemIndex !== -1) {
          if (quantity === 0) {
            guestCart.splice(itemIndex, 1);
          } else {
            guestCart[itemIndex].quantity = quantity;
          }
        }

        localStorage.setItem('guestCart', JSON.stringify(guestCart));

        // Normalizar para el estado local
        updatedCart = guestCart.map(item => ({
          ...item.product,
          quantity: item.quantity
        }));
        console.log("✅ Carrito de invitado actualizado después de cambio de cantidad:", updatedCart);
      }

      setCartItems(updatedCart);
    } catch (error) {
      console.error("❌ Error al actualizar cantidad:", error);
    } finally {
      setUpdatingCart(false);
    }
  };

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      alert('Tu carrito está vacío. Agrega productos antes de finalizar la compra.');
      return;
    }
    setShowPaymentModal(true);
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [field]: true });
    setTimeout(() => setCopied({ ...copied, [field]: false }), 2000);
  };

  const sendFormspreeEmail = async (orderData) => {
    setFormspreeLoading(true);
    try {
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('total', formatGuarani(orderData.total));
      formData.append('paymentMethod', orderData.paymentMethod);
      formData.append('deliveryOption', orderData.deliveryInfo.type);

      if (orderData.deliveryInfo.type === 'delivery') {
        formData.append('whatsapp', orderData.deliveryInfo.whatsapp);
      }

      orderData.products.forEach((product, index) => {
        formData.append(`product_${index}_name`, product.name);
        formData.append(`product_${index}_quantity`, product.quantity);
        formData.append(`product_${index}_price`, formatGuarani(product.price));
      });

      const response = await fetch('https://formspree.io/f/xnjqroya', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al enviar el correo');
      }
    } catch (error) {
      console.error("Error al enviar correo por Formspree:", error);
    } finally {
      setFormspreeLoading(false);
    }
  };

  const handleFinalizePurchase = async () => {
    setUpdatingCart(true);
    try {
      const productDetails = cartItems.map(item => ({
        productId: item._id,
        name: item.name,
        quantity: item.quantity,
        price: getDisplayPrice(item), // Usar precio promocional si aplica
      }));

      const total = cartItems.reduce((sum, item) => sum + getDisplayPrice(item) * item.quantity, 0);

      const orderData = {
        userId,
        products: productDetails,
        total,
        paymentMethod,
        paymentStatus: paymentMethod === 'Efectivo' ? 'Pendiente' : 'Pagado',
      };

      if (deliveryOption === 'delivery' || deliveryOption === 'pickup') {
        orderData.deliveryInfo = {
          type: deliveryOption,
          whatsapp: whatsappNumber,
        };
      }

      console.log("🛒 Procesando orden con products:", orderData);


      await sendFormspreeEmail(orderData);


      await api.placeOrder(orderData);
      await api.clearCart(userId);
      setCartItems([]);
      alert('¡Compra realizada con éxito!');
      setShowPaymentModal(false);
      onClose();
    } catch (error) {
      console.error("❌ Error al procesar la compra:", error);
      alert("Error al procesar la compra.");
    } finally {
      setUpdatingCart(false);
    }
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + getDisplayPrice(item) * item.quantity, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-none shadow-none border-2 border-gray-900 w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-900 hover:text-red-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <h2 className="text-2xl font-black text-gray-900 mb-6 text-center uppercase tracking-tighter border-b-4 border-gray-900 pb-2">Orden de Pedido</h2>

        {loadingCart ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-gray-900 rounded-full"></div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 border border-gray-200 border-dashed">
            <p className="text-gray-500 font-bold uppercase">Tu carrito está vacío</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {cartItems.map(item => (
              <div key={item._id} className="flex items-start justify-between bg-white p-4 border border-gray-300 hover:border-gray-900 transition-colors">
                <img src={item.image} alt={item.name} className="w-20 h-20 object-cover border border-gray-200 mr-4" />
                <div className="flex-grow">
                  <h3 className="font-bold text-gray-900 uppercase text-sm leading-tight mb-1">{item.name}</h3>
                  <div className="flex flex-col mb-2">
                    {isPromotionActive(item) ? (
                      <>
                        <span className="text-xs text-gray-400 line-through">{formatGuarani(item.price)}</span>
                        <span className="text-red-600 font-black">{formatGuarani(item.promotion.discountedPrice)}</span>
                      </>
                    ) : (
                      <span className="text-gray-900 font-bold">{formatGuarani(item.price)}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-0">
                    <button
                      onClick={() => handleUpdateQuantity(item._id, parseInt(item.quantity) - 1)}
                      className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold flex items-center justify-center border border-gray-300"
                    >-</button>
                    <input
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => handleUpdateQuantity(item._id, e.target.value)}
                      className="w-12 h-8 border-y border-gray-300 text-center text-sm font-bold focus:outline-none"
                      disabled={updatingCart}
                    />
                    <button
                      onClick={() => handleUpdateQuantity(item._id, parseInt(item.quantity) + 1)}
                      className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold flex items-center justify-center border border-gray-300"
                    >+</button>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveItem(item._id)}
                  className="text-gray-400 hover:text-red-600 transition-colors ml-2"
                  disabled={updatingCart}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="border-t-2 border-gray-900 pt-6 mt-6">
          <div className="flex justify-between items-end mb-6">
            <span className="text-lg font-bold text-gray-600 uppercase">Total Estimado:</span>
            <span className="text-3xl font-black text-gray-900">{formatGuarani(totalAmount)}</span>
          </div>
          <AuthButton text="Finalizar Compra" onClick={handleProceedToCheckout} disabled={cartItems.length === 0 || updatingCart} />
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-none shadow-none border-2 border-gray-900 w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-gray-900 hover:text-red-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-xl font-black text-gray-900 mb-6 text-center uppercase tracking-tighter border-b-2 border-gray-900 pb-2">Opciones de Servicio</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-gray-900 text-xs font-bold uppercase tracking-wider mb-2">Método de Pago:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-none focus:outline-none focus:border-gray-900 text-sm font-medium"
                >
                  <option value="">SELECCIONA UN MÉTODO</option>
                  <option value="Efectivo">EFECTIVO</option>
                  <option value="Tarjeta/Transferencia">TARJETA / TRANSFERENCIA</option>
                </select>
              </div>

              {paymentMethod && (
                <div>
                  <label className="block text-gray-900 text-xs font-bold uppercase tracking-wider mb-2">Opción de Entrega / Servicio:</label>
                  <div className="flex space-x-0 border border-gray-300">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        className="peer sr-only"
                        name="deliveryOption"
                        value="delivery"
                        checked={deliveryOption === 'delivery'}
                        onChange={(e) => setDeliveryOption(e.target.value)}
                      />
                      <div className="p-3 text-center text-xs font-bold uppercase hover:bg-gray-100 peer-checked:bg-gray-900 peer-checked:text-white transition-all">
                        Delivery / Auxilio
                      </div>
                    </label>
                    <div className="w-px bg-gray-300"></div>
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        className="peer sr-only"
                        name="deliveryOption"
                        value="pickup"
                        checked={deliveryOption === 'pickup'}
                        onChange={(e) => setDeliveryOption(e.target.value)}
                      />
                      <div className="p-3 text-center text-xs font-bold uppercase hover:bg-gray-100 peer-checked:bg-gray-900 peer-checked:text-white transition-all">
                        Retiro del Local
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {(deliveryOption === 'delivery' || deliveryOption === 'pickup') && (
                <div className="bg-gray-50 border-l-4 border-gray-900 p-4">
                  <p className="font-bold text-gray-900 text-sm mb-2 uppercase">
                    {deliveryOption === 'delivery'
                      ? (paymentMethod === 'Efectivo'
                        ? 'Servicio de Delivery / Auxilio con pago en efectivo.'
                        : 'Servicio de Delivery / Auxilio con pago electrónico.')
                      : 'Retiro de productos en nuestro taller central.'}
                  </p>
                  <p className="mb-4 text-sm text-gray-600">
                    Por favor, ingresa tu WhatsApp para coordinar {deliveryOption === 'delivery' ? 'la ubicación del auxilio/entrega' : 'el horario de retiro'}:
                  </p>
                  <AuthInput
                    type="text"
                    placeholder="INGRESAR NÚMERO DE WHATSAPP"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                  />
                  <p className="mt-4 text-xs text-gray-500 font-medium">
                    Un asesor te contactará inmediatamente para confirmar detalles.
                  </p>
                </div>
              )}

              {deliveryOption === 'pickup' && paymentMethod === 'Efectivo' && (
                <div className="bg-gray-900 text-white p-4">
                  <p className="font-bold text-sm mb-1 uppercase">Te esperamos en el Local</p>
                  <p className="text-xs text-gray-300">
                    <a
                      href="https://maps.app.goo.gl/1LWoLgWijYNqWoK7A"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white underline hover:text-gray-300 font-bold"
                    >
                      VER UBICACIÓN EN MAPA &rarr;
                    </a>
                  </p>
                </div>
              )}

              {paymentMethod === 'Tarjeta/Transferencia' && (
                <div className="bg-white border border-gray-300 p-4">
                  <p className="font-black text-gray-900 text-xs uppercase mb-3 border-b border-gray-200 pb-2">Datos Bancarios para Transferencia:</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-600">BANCO:</span>
                      <span className="font-mono">UENO Bank</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-600">Nº CUENTA:</span>
                      <div className="flex items-center">
                        <span className="font-mono mr-2">619215997</span>
                        <button onClick={() => copyToClipboard('818335032', 'accountNumber')} className="text-gray-900 hover:text-red-600">
                          {copied.accountNumber ? <FaCheck className="text-green-600" /> : <FaCopy />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-600">ALIAS:</span>
                      <div className="flex items-center">
                        <span className="font-mono mr-2">6211990</span>
                        <button onClick={() => copyToClipboard('0976532870', 'alias')} className="text-gray-900 hover:text-red-600">
                          {copied.alias ? <FaCheck className="text-green-600" /> : <FaCopy />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-600">TITULAR:</span>
                      <span className="font-mono text-xs">Carlos Velazquez</span>
                    </div>
                  </div>

                  <p className="text-xs mt-4 text-red-600 font-bold">
                    * Enviar comprobante al WhatsApp para procesar la orden.
                  </p>
                </div>
              )}

              <AuthButton
                text={(updatingCart || formspreeLoading) ? "PROCESANDO..." : "CONFIRMAR ORDEN"}
                onClick={handleFinalizePurchase}
                disabled={
                  updatingCart ||
                  formspreeLoading ||
                  !paymentMethod ||
                  !deliveryOption ||
                  !whatsappNumber
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopCartModal;