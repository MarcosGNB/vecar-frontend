// ProductDetailModal.js
import React from 'react';
import { formatGuarani } from '../utils/formatters';

const ProductDetailModal = ({ isOpen, onClose, product, relatedProducts, onAddToCart }) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
        >
          &times;
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          <img
            src={product.image}
            alt={product.name}
            className="object-contain w-full h-72 p-4 bg-white"
          />

          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">{product.name}</h2>
            <p className="text-gray-500 text-sm mb-4">Categoría: {product.category}</p>
            <p className="text-gray-700 mb-4">{product.description}</p>
            <p className="text-blue-600 text-2xl font-bold mb-4">{formatGuarani(product.price)}</p>
            <button
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg"
            >
              Agregar al carrito
            </button>
          </div>
        </div>

        {relatedProducts?.length > 0 && (
          <div className="p-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Productos relacionados</h3>
            <div className="grid grid-cols-2 gap-4">
              {relatedProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-gray-50 rounded-lg p-4 flex flex-col items-center text-center hover:shadow-md transition cursor-pointer"
                  onClick={() => {
                    onClose();
                    setTimeout(() => onAddToCart(p), 300); // Simula vista rápida
                  }}
                >
                  <img src={p.image} alt={p.name} className="h-24 object-contain mb-2" />
                  <p className="text-sm text-gray-700 font-medium">{p.name}</p>
                  <p className="text-blue-600 text-sm">{formatGuarani(p.price)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailModal;
