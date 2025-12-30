import React from 'react';

const AuthButton = ({ text, onClick, disabled, className = '' }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-2 rounded-lg transition-colors text-white
        ${disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'}
        ${className}
      `}
    >
      {text}
    </button>
  );
};

export default AuthButton;