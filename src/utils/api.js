// Detecta automáticamente el entorno
// Prioriza la variable de entorno (para poder conectar local a prod si se quiere)
// Si no hay variable, usa localhost en desarrollo o la URL de Render en producción
const BASE_URL = 'https://vecar-backend.onrender.com/api';
console.log('🔍 API BASE_URL:', BASE_URL);
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 REACT_APP_API_URL:', process.env.REACT_APP_API_URL);


// --- USUARIOS ---
export const registerUser = async (userData) => {
  const res = await fetch(`${BASE_URL}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const loginUser = async (username, password) => {
  const res = await fetch(`${BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const getUsers = async () => {
  const res = await fetch(`${BASE_URL}/users`);
  return res.json();
};

export const updateUser = async (userId, updatedData) => {
  const res = await fetch(`${BASE_URL}/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedData),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const deleteUser = async (userId) => {
  const res = await fetch(`${BASE_URL}/users/${userId}`, { method: 'DELETE' });
  if (!res.ok) throw await res.json();
  return res.json();
};

// --- PRODUCTOS ---
export const getProducts = async () => {
  const res = await fetch(`${BASE_URL}/products`);
  return res.json();
};

export const addProduct = async (productData) => {
  const res = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const updateProduct = async (productId, updatedData) => {
  const res = await fetch(`${BASE_URL}/products/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedData),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const deleteProduct = async (productId) => {
  const res = await fetch(`${BASE_URL}/products/${productId}`, { method: 'DELETE' });
  if (!res.ok) throw await res.json();
  return res.json();
};

// --- CARRITO ---
export const getCart = async (userId) => {
  const res = await fetch(`${BASE_URL}/cart/${userId}`);
  if (!res.ok) throw await res.json();
  return res.json();
};

export const addToCart = async (userId, productId, quantity = 1) => {
  const res = await fetch(`${BASE_URL}/cart/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, productId, quantity }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const removeFromCart = async (userId, productId) => {
  const res = await fetch(`${BASE_URL}/cart/remove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, productId }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const updateCartItemQuantity = async (userId, productId, quantity) => {
  const res = await fetch(`${BASE_URL}/cart/update`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, productId, quantity }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const clearCart = async (userId) => {
  const res = await fetch(`${BASE_URL}/cart/clear/${userId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

// --- ÓRDENES ---
export const placeOrder = async (orderData) => {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const getOrders = async (userId = null) => {
  const url = userId ? `${BASE_URL}/orders?userId=${userId}` : `${BASE_URL}/orders`;
  const res = await fetch(url);
  if (!res.ok) throw await res.json();
  return res.json();
};

export const updateOrderStatus = async (orderId, newStatus, paymentStatus = null) => {
  const res = await fetch(`${BASE_URL}/orders/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus, paymentStatus }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

// --- EXPORT GENERAL ---
export const api = {
  // Usuarios
  registerUser,
  loginUser,
  getUsers,
  updateUser,
  deleteUser,

  // Productos
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,

  // Carrito
  getCart,
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,

  // Órdenes
  placeOrder,
  getOrders,
  updateOrderStatus,
};
