import React from 'react';

const AuthCard = ({ children, title }) => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 my-8 border border-gray-100">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">{title}</h2>
      {children}
    </div>
  );
};

export default AuthCard;