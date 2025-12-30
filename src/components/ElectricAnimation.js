import React, { useEffect, useState } from 'react';

const ElectricAnimation = ({ children, isVisible = true }) => {
  const [electricBolt, setElectricBolt] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setElectricBolt(true);
        setTimeout(() => setElectricBolt(false), 200);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isVisible]);

  return (
    <div className="relative">
      {children}
      {electricBolt && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400 opacity-20 animate-pulse"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-400 via-white to-blue-400 animate-ping"></div>
          <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-full h-1 bg-gradient-to-r from-blue-400 via-white to-blue-400 animate-ping"></div>
        </div>
      )}
    </div>
  );
};

export default ElectricAnimation; 