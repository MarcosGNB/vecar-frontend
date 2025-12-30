import React, { useState, useEffect } from 'react';
import AuthLogin from './components/AuthLogin';
import AuthRegister from './components/AuthRegister';
import ShopHome from './components/ShopHome';
import ShopAdmin from './components/ShopAdmin';
import { getAuthToken, getUserData, removeAuthToken, removeUserData } from './utils/authHelpers';

const App = () => {
  const [currentPage, setCurrentPage] = useState('loading'); // 'loading', 'login', 'register', 'home', 'admin'
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    const userData = getUserData();
    if (token && userData) {
      setLoggedInUser(userData);
    }

    // Always go to home page (ShopHome) regardless of authentication status
    setCurrentPage('home');
  }, []);

  const handleLoginSuccess = (userData) => {
    setLoggedInUser(userData);
    setShowLoginModal(false);
    if (userData.role === 'admin') {
      setCurrentPage('admin');
    } else {
      setCurrentPage('home');
    }
  };

  const handleRegisterSuccess = (userData) => {
    setLoggedInUser(userData);
    setShowLoginModal(false);
    setCurrentPage('home'); // Después de registrarse, va directo a la home
  };

  const handleLogout = () => {
    removeAuthToken();
    removeUserData();
    setLoggedInUser(null);
    setCurrentPage('home'); // Stay on home page after logout
  };

  const navigateToRegister = () => {
    setCurrentPage('register');
  };

  const navigateToLogin = () => {
    setCurrentPage('login');
  };


  const navigateToHome = () => {
    setCurrentPage('home');
  };


  const handleLoginRequired = () => {
    setShowLoginModal(true);
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
  };

  if (currentPage === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-xl text-gray-700">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="font-sans antialiased">
      {currentPage === 'login' && (
        <AuthLogin
          onLoginSuccess={handleLoginSuccess}
          onNavigateToRegister={navigateToRegister}
          onNavigateToHome={navigateToHome}
        />
      )}
      {currentPage === 'register' && (
        <AuthRegister
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateToLogin={navigateToLogin}
          onNavigateToHome={navigateToHome}
        />
      )}
      {currentPage === 'home' && (
        <ShopHome
          username={loggedInUser?.username}
          userId={loggedInUser?._id}
          onLogout={handleLogout}
          onLoginRequired={handleLoginRequired}
          isAuthenticated={!!loggedInUser}
        />
      )}
      {currentPage === 'admin' && loggedInUser && loggedInUser.role === 'admin' && (
        <ShopAdmin
          username={loggedInUser.username}
          onLogout={handleLogout}
        />
      )}
      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Iniciar Sesión</h2>
              <button
                onClick={closeLoginModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <AuthLogin
              onLoginSuccess={handleLoginSuccess}
              onNavigateToRegister={() => {
                setShowLoginModal(false);
                navigateToRegister();
              }}
              isModal={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

// DONE