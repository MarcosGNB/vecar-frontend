import React, { useState, useEffect } from 'react';
import AuthInput from './AuthInput';
import AuthButton from './AuthButton';

const AdminProductForm = ({ onAddProduct, onUpdateProduct, selectedProduct, loading }) => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [isSoldOut, setIsSoldOut] = useState(false);

  // Estados para promoción
  const [promotionActive, setPromotionActive] = useState(false);
  const [promotionName, setPromotionName] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const categories = ['Cubiertas', 'Llantas', 'Accesorios', 'Baterías', 'Servicios', 'Repuestos'];

  useEffect(() => {
    if (selectedProduct) {
      setId(selectedProduct._id);
      setName(selectedProduct.name);
      setPrice(selectedProduct.price);
      setImage(selectedProduct.image);
      setDescription(selectedProduct.description);
      setCategory(selectedProduct.category);
      setIsSoldOut(selectedProduct.isSoldOut || false);

      // Cargar datos de promoción si existen
      if (selectedProduct.promotion) {
        setPromotionActive(selectedProduct.promotion.isActive || false);
        setPromotionName(selectedProduct.promotion.name || '');
        setDiscountedPrice(selectedProduct.promotion.discountedPrice || '');
        setStartDate(selectedProduct.promotion.startDate ? selectedProduct.promotion.startDate.split('T')[0] : '');
        setEndDate(selectedProduct.promotion.endDate ? selectedProduct.promotion.endDate.split('T')[0] : '');
      }
    } else {
      setId('');
      setName('');
      setPrice('');
      setImage('');
      setDescription('');
      setCategory('');
      setIsSoldOut(false);
      setPromotionActive(false);
      setPromotionName('');
      setDiscountedPrice('');
      setStartDate('');
      setEndDate('');
    }
  }, [selectedProduct]);

  const handleSubmit = () => {
    setError('');
    if (!name || !price || !image || !description || !category) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    if (isNaN(price) || parseFloat(price) <= 0) {
      setError('El precio debe ser un número positivo.');
      return;
    }

    // Validar promoción si está activa
    if (promotionActive) {
      if (!promotionName || !discountedPrice || !startDate || !endDate) {
        setError('Completa todos los campos de la promoción.');
        return;
      }
      if (isNaN(discountedPrice) || parseFloat(discountedPrice) <= 0) {
        setError('El precio promocional debe ser un número positivo.');
        return;
      }
      if (parseFloat(discountedPrice) >= parseFloat(price)) {
        setError('El precio promocional debe ser menor al precio normal.');
        return;
      }
      if (new Date(startDate) >= new Date(endDate)) {
        setError('La fecha de inicio debe ser anterior a la fecha de fin.');
        return;
      }
    }

    const productData = {
      name,
      price: parseFloat(price),
      image,
      description,
      category,
      isSoldOut,
      promotion: {
        isActive: promotionActive,
        name: promotionActive ? promotionName : '',
        discountedPrice: promotionActive ? parseFloat(discountedPrice) : null,
        startDate: promotionActive ? new Date(startDate) : null,
        endDate: promotionActive ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : null
      }
    };

    if (selectedProduct) {
      onUpdateProduct(id, productData);
    } else {
      onAddProduct(productData);
    }

    // Limpiar formulario después de enviar
    setId('');
    setName('');
    setPrice('');
    setImage('');
    setDescription('');
    setCategory('');
    setIsSoldOut(false);
    setPromotionActive(false);
    setPromotionName('');
    setDiscountedPrice('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h3>
      <div className="space-y-4">
        <AuthInput
          type="text"
          placeholder="Nombre del Producto"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <AuthInput
          type="number"
          placeholder="Precio (Gs.)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <AuthInput
          type="text"
          placeholder="URL de la Imagen"
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />
        <textarea
          placeholder="Descripción del Producto"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="3"
          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition text-gray-800 resize-none"
        ></textarea>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition text-gray-800"
        >
          <option value="">Selecciona una categoría</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Sección de Estado (Agotado) */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800">Disponibilidad</h4>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isSoldOut}
              onChange={(e) => setIsSoldOut(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">
              {isSoldOut ? 'Agotado' : 'Disponible'}
            </span>
          </label>
        </div>

        {/* Sección de Promoción */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">Promoción</h4>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={promotionActive}
                onChange={(e) => setPromotionActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {promotionActive ? 'Activa' : 'Inactiva'}
              </span>
            </label>
          </div>

          {promotionActive && (
            <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
              <AuthInput
                type="text"
                placeholder="Nombre de la promoción (ej: Black Friday)"
                value={promotionName}
                onChange={(e) => setPromotionName(e.target.value)}
              />
              <AuthInput
                type="number"
                placeholder="Precio Promocional (Gs.)"
                value={discountedPrice}
                onChange={(e) => setDiscountedPrice(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition text-gray-800"
                  />
                </div>
              </div>
              {price && discountedPrice && (
                <p className="text-sm text-green-600 font-medium">
                  Descuento: {Math.round(((parseFloat(price) - parseFloat(discountedPrice)) / parseFloat(price)) * 100)}%
                </p>
              )}
              {endDate && (() => {
                // Parsear la fecha manualmente para evitar problemas de zona horaria
                const [year, month, day] = endDate.split('-').map(Number);
                const end = new Date(year, month - 1, day, 23, 59, 59, 999);
                const now = new Date();
                const diff = end - now;

                if (diff <= 0) {
                  return (
                    <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                      <p className="text-sm text-red-700 font-semibold">⏰ Promoción expirada</p>
                    </div>
                  );
                }

                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                let timeText = '';
                if (days > 0) timeText = `${days}d ${hours}h restantes`;
                else if (hours > 0) timeText = `${hours}h ${minutes}m restantes`;
                else timeText = `${minutes}m restantes`;

                return (
                  <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                    <p className="text-sm text-blue-700 font-semibold">⏰ Tiempo restante: {timeText}</p>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <AuthButton text={loading ? "Procesando..." : (selectedProduct ? "Guardar Cambios" : "Agregar Producto")} onClick={handleSubmit} disabled={loading} />
      </div>
    </div>
  );
};

export default AdminProductForm;