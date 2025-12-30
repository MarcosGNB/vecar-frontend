import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { formatGuarani, formatDate } from '../utils/formatters';

const UserOrderHistory = ({ userId }) => {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return; // No cargar si no hay userId

    const fetchOrders = async () => {
      setLoadingOrders(true);
      setError(null);
      try {
        // Asumo que api.getOrders acepta un userId para filtrar
        const fetchedOrders = await api.getOrders(userId);
        setOrders(fetchedOrders || []);
      } catch (err) {
        console.error("Error al cargar el historial de órdenes:", err);
        setError("No se pudo cargar tu historial de compras.");
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [userId]);

  return (
    <div className="bg-white p-6 rounded-none shadow-sm border border-gray-300 max-w-7xl mx-auto">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 uppercase tracking-tight flex items-center">
        <span className="w-2 h-8 bg-red-600 mr-3 inline-block"></span>
        Historial de Compras
      </h3>

      {loadingOrders && (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-gray-900 rounded-full"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {!loadingOrders && !error && orders.length === 0 && (
        <div className="text-center py-16 bg-gray-50 border border-gray-200 border-dashed">
          <p className="text-gray-500 text-lg uppercase font-medium tracking-wide">Aún no tienes compras registradas</p>
          <p className="text-gray-400 text-sm mt-2">Tus pedidos aparecerán aquí</p>
        </div>
      )}

      {!loadingOrders && !error && orders.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-900 text-white uppercase text-xs font-bold tracking-wider">
                <th className="py-4 px-6 text-left rounded-none">ID Orden</th>
                <th className="py-4 px-6 text-left">Fecha</th>
                <th className="py-4 px-6 text-left">Total</th>
                <th className="py-4 px-6 text-left">Pago</th>
                <th className="py-4 px-6 text-left">Estado Pago</th>
                <th className="py-4 px-6 text-left">Estado Orden</th>
                <th className="py-4 px-6 text-left rounded-none">Detalles</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {orders.map((order, index) => (
                <tr key={order._id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="py-4 px-6 font-mono text-xs font-bold text-gray-500 break-words max-w-xs">{order._id.substring(0, 8)}...</td>
                  <td className="py-4 px-6 font-medium">{formatDate(order.createdAt || order.date)}</td>
                  <td className="py-4 px-6 font-bold text-gray-900">{formatGuarani(order.total)}</td>
                  <td className="py-4 px-6 uppercase text-xs font-bold">{order.paymentMethod || 'N/A'}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border ${order.paymentStatus === 'Pagado'
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : order.paymentStatus === 'Pendiente'
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}
                    >
                      {order.paymentStatus || 'N/A'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border ${order.status === 'Completada'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : order.status === 'Pendiente'
                            ? 'bg-orange-100 text-orange-800 border-orange-200'
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}
                    >
                      {order.status || 'N/A'}
                    </span>
                  </td>
                  <td className="py-4 px-6 max-w-sm text-xs">
                    <ul className="list-disc list-inside mb-2 text-gray-600">
                      {(order.products || order.items || []).map(item => (
                        <li key={item.productId || item._id || item.name} className="truncate">
                          <span className="font-bold text-gray-700">{item.name}</span> <span className="text-gray-500">x{item.quantity}</span>
                        </li>
                      ))}
                    </ul>

                    {order.deliveryInfo?.type === 'delivery' && (
                      <div className="flex items-center text-gray-500 mt-1">
                        <span className="font-bold mr-1">DELIVERY:</span> {order.deliveryInfo.whatsapp || 'Sin contacto'}
                      </div>
                    )}
                    {order.deliveryInfo?.type === 'pickup' && (
                      <div className="flex items-center text-gray-500 mt-1">
                        <span className="font-bold mr-1">RETIRO:</span> En tienda
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserOrderHistory;
