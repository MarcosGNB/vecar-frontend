import React, { useState, useEffect } from 'react';
import AuthButton from './AuthButton';
import AdminProductForm from './AdminProductForm';
import AdminUserForm from './AdminUserForm';
import { api } from '../utils/api';
import { formatGuarani, formatDate } from '../utils/formatters';

const ShopAdmin = ({ username, onLogout }) => {
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'users', 'orders'
  const [userSearch, setUserSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  // ...existing code...

  // Carga inicial
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
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const fetchedUsers = await api.getUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
        alert("Error al cargar usuarios.");
      } finally {
        setLoadingUsers(false);
      }
    };
    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const fetchedOrders = await api.getOrders();
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error al cargar órdenes:", error);
        alert("Error al cargar órdenes.");
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchProducts();
    fetchUsers();
    fetchOrders();
  }, []);

  // --- PRODUCTOS ---
  const handleAddProduct = async (newProductData) => {
    setFormLoading(true);
    try {
      const addedProduct = await api.addProduct(newProductData);
      setProducts(prev => [...prev, addedProduct]);
      alert('Producto agregado con éxito!');
    } catch (error) {
      console.error("Error al agregar producto:", error);
      alert("Error al agregar producto.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateProduct = async (productId, updatedData) => {
    setFormLoading(true);
    try {
      const updatedProduct = await api.updateProduct(productId, updatedData);
      setProducts(prev => prev.map(p => (p._id === productId ? updatedProduct : p)));
      setSelectedProduct(null);
      alert('Producto actualizado con éxito!');
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      alert("Error al actualizar producto.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
    setFormLoading(true);
    try {
      await api.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p._id !== productId));
      alert('Producto eliminado con éxito!');
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      alert("Error al eliminar producto.");
    } finally {
      setFormLoading(false);
    }
  };

  // --- USUARIOS ---
  const handleUpdateUser = async (userId, updatedData) => {
    setFormLoading(true);
    try {
      const updatedUser = await api.updateUser(userId, updatedData);
      setUsers(prev => prev.map(u => (u._id === userId ? updatedUser : u)));
      setSelectedUser(null);
      alert('Usuario actualizado con éxito!');
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      alert("Error al actualizar usuario.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;
    setFormLoading(true);
    try {
      await api.deleteUser(userId);
      setUsers(prev => prev.filter(u => u._id !== userId));
      alert('Usuario eliminado con éxito!');
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      alert("Error al eliminar usuario.");
    } finally {
      setFormLoading(false);
    }
  };

  // --- ÓRDENES ---
  const handleUpdateOrderStatus = async (orderId, newStatus, newPaymentStatus = null) => {
    setFormLoading(true);
    try {
      const updatedOrder = await api.updateOrderStatus(orderId, newStatus, newPaymentStatus);
      setOrders(prev => prev.map(o => (o._id === orderId ? updatedOrder : o)));
      alert('Estado de la orden actualizado con éxito!');
    } catch (error) {
      console.error("Error al actualizar estado de la orden:", error);
      alert("Error al actualizar estado de la orden.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="flex justify-between items-center py-4 px-6 bg-white shadow-md rounded-xl mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
        <div className="flex items-center space-x-4">
          <span className="text-gray-700">Bienvenido, <span className="font-semibold">{username}</span>!</span>
          <AuthButton text="Cerrar Sesión" onClick={onLogout} />
        </div>
      </header>

      <main className="container mx-auto">
        {/* Tabs */}
        <div className="flex mb-6 space-x-4">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${activeTab === 'products' ? 'bg-black text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
          >
            Gestión de Productos
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${activeTab === 'users' ? 'bg-black text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
          >
            Gestión de Usuarios
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${activeTab === 'orders' ? 'bg-black text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
          >
            Gestión de Órdenes
          </button>
        </div>

        {/* Productos */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <AdminProductForm
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                selectedProduct={selectedProduct}
                loading={formLoading}
              />
              {selectedProduct && (
                <AuthButton
                  text="Cancelar Edición"
                  onClick={() => setSelectedProduct(null)}
                  className="mt-4 bg-gray-500 hover:bg-gray-600"
                />
              )}
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Productos Existentes</h3>
                <input
                  type="text"
                  placeholder="Buscar producto por nombre o categoría..."
                  className="mb-4 px-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-black transition text-gray-800"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                />
                {loadingProducts ? (
                  <p className="text-center text-gray-600">Cargando productos...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg">
                      <thead>
                        <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                          <th className="py-3 px-6 text-left">ID</th>
                          <th className="py-3 px-6 text-left">Nombre</th>
                          <th className="py-3 px-6 text-left">Precio</th>
                          <th className="py-3 px-6 text-left">Promoción</th>
                          <th className="py-3 px-6 text-left">Estado</th>
                          <th className="py-3 px-6 text-left">Categoría</th>
                          <th className="py-3 px-6 text-left">Imagen</th>
                          <th className="py-3 px-6 text-left">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-600 text-sm font-light">
                        {products
                          .filter(product =>
                            product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                            product.category.toLowerCase().includes(productSearch.toLowerCase())
                          )
                          .map(product => (
                            <tr key={product._id} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="py-3 px-6 text-left whitespace-nowrap">{product._id}</td>
                              <td className="py-3 px-6 text-left">{product.name}</td>
                              <td className="py-3 px-6 text-left">{formatGuarani(product.price)}</td>
                              <td className="py-3 px-6 text-left">
                                {product.promotion?.isActive ? (
                                  <div>
                                    <span className="bg-green-100 text-green-800 py-1 px-2 rounded-full text-xs font-bold">Activa</span>
                                    <div className="text-xs text-gray-500 mt-1">{formatGuarani(product.promotion.discountedPrice)}</div>
                                  </div>
                                ) : (
                                  <span className="bg-gray-100 text-gray-500 py-1 px-2 rounded-full text-xs">Inactiva</span>
                                )}
                              </td>
                              <td className="py-3 px-6 text-left">
                                {product.isSoldOut ? (
                                  <span className="bg-red-100 text-red-800 py-1 px-2 rounded-full text-xs font-bold">Agotado</span>
                                ) : (
                                  <span className="bg-green-100 text-green-800 py-1 px-2 rounded-full text-xs font-bold">Disponible</span>
                                )}
                              </td>
                              <td className="py-3 px-6 text-left">{product.category}</td>
                              <td className="py-3 px-6 text-left">
                                <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded-md" />
                              </td>
                              <td className="py-3 px-6 text-left">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => setSelectedProduct(product)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md text-xs"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(product._id)}
                                    className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md text-xs"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Usuarios   */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <AdminUserForm
                onUpdateUser={handleUpdateUser}
                selectedUser={selectedUser}
                loading={formLoading}
              />
              {selectedUser && (
                <AuthButton
                  text="Cancelar Edición"
                  onClick={() => setSelectedUser(null)}
                  className="mt-4 bg-gray-500 hover:bg-gray-600"
                />
              )}
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Usuarios Registrados</h3>
                <input
                  type="text"
                  placeholder="Buscar usuario por nombre o email..."
                  className="mb-4 px-4 py-2 border rounded-lg w-full"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
                {loadingUsers ? (
                  <p className="text-center text-gray-600">Cargando usuarios...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg">
                      <thead>
                        <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                          <th className="py-3 px-6 text-left">ID</th>
                          <th className="py-3 px-6 text-left">Usuario</th>
                          <th className="py-3 px-6 text-left">Correo</th>
                          <th className="py-3 px-6 text-left">Rol</th>
                          <th className="py-3 px-6 text-left">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-600 text-sm font-light">
                        {users
                          .filter(user =>
                            user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                            user.email.toLowerCase().includes(userSearch.toLowerCase())
                          )
                          .map(user => (
                            <tr key={user._id} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="py-3 px-6 text-left whitespace-nowrap">{user._id}</td>
                              <td className="py-3 px-6 text-left">{user.username}</td>
                              <td className="py-3 px-6 text-left">{user.email}</td>
                              <td className="py-3 px-6 text-left">{user.role}</td>
                              <td className="py-3 px-6 text-left">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => setSelectedUser(user)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md text-xs"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user._id)}
                                    className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md text-xs"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Órdenes */}
        {activeTab === 'orders' && (
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Órdenes de Clientes</h3>
            {loadingOrders ? (
              <p className="text-center text-gray-600">Cargando órdenes...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                      <th className="py-3 px-6 text-left">ID Orden</th>
                      <th className="py-3 px-6 text-left">Usuario ID</th>
                      <th className="py-3 px-6 text-left">Fecha</th>
                      <th className="py-3 px-6 text-left">Total</th>
                      <th className="py-3 px-6 text-left">Método Pago</th>
                      <th className="py-3 px-6 text-left">Estado Pago</th>
                      <th className="py-3 px-6 text-left">Estado Orden</th>
                      <th className="py-3 px-6 text-left">Detalles</th>
                      <th className="py-3 px-6 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 text-sm font-light">
                    {orders.map(order => (
                      <tr key={order._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-6 text-left whitespace-nowrap">{order._id}</td>
                        <td className="py-3 px-6 text-left">{users.find(u => u._id === order.userId)?.username || order.userId}</td>
                        <td className="py-3 px-6 text-left">{formatDate(order.createdAt || order.date)}</td>
                        <td className="py-3 px-6 text-left">{formatGuarani(order.total)}</td>
                        <td className="py-3 px-6 text-left">{order.paymentMethod || 'N/A'}</td>
                        <td className="py-3 px-6 text-left">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.paymentStatus === 'Pagado' ? 'bg-green-200 text-green-800' :
                            order.paymentStatus === 'Pendiente' ? 'bg-yellow-200 text-yellow-800' :
                              'bg-gray-200 text-gray-800'
                            }`}>
                            {order.paymentStatus || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-left">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.status === 'Pendiente' ? 'bg-yellow-200 text-yellow-800' :
                            order.status === 'Completada' ? 'bg-green-200 text-green-800' :
                              'bg-gray-200 text-gray-800'
                            }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-left max-w-xs">
                          <ul className="list-disc list-inside max-h-40 overflow-auto">
                            {(order.products || []).map(item => (
                              <li key={item.productId || item._id}>
                                {item.name} ({item.quantity})
                              </li>
                            ))}
                          </ul>
                          {order.deliveryInfo && (
                            <>
                              <p className="text-xs text-gray-500 mt-1">
                                Delivery: {order.deliveryInfo.type === 'delivery' ? 'Sí' : 'No'}
                              </p>
                              <p className="text-xs text-gray-500">
                                WhatsApp: {order.deliveryInfo.whatsapp || 'N/A'}
                              </p>
                            </>
                          )}
                        </td>
                        <td className="py-3 px-6 text-left space-y-1">
                          {order.status !== 'Completada' && (
                            <AuthButton
                              text="Marcar Completada"
                              onClick={() => handleUpdateOrderStatus(order._id, 'Completada', 'Pagado')}
                              className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded-md text-xs block"
                              disabled={formLoading}
                            />
                          )}
                          {order.status !== 'Pendiente' && (
                            <AuthButton
                              text="Marcar Pendiente"
                              onClick={() => handleUpdateOrderStatus(order._id, 'Pendiente', 'Pendiente')}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded-md text-xs block"
                              disabled={formLoading}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ShopAdmin;
