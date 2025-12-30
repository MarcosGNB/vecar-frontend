import React, { useEffect, useState } from 'react';

const Confetti = ({ isVisible, onComplete }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (isVisible) {
      // Crear partículas de confeti
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -20,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        size: Math.random() * 8 + 4,
        opacity: 1,
        color: ['#3B82F6', '#1D4ED8', '#1E40AF', '#60A5FA', '#93C5FD'][Math.floor(Math.random() * 5)]
      }));
      
      setParticles(newParticles);

      // Animar las partículas
      const animationDuration = 3000;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / animationDuration;

        setParticles(prev => 
          prev.map(particle => ({
            ...particle,
            x: particle.x + particle.vx * 0.1,
            y: particle.y + particle.vy,
            rotation: particle.rotation + particle.rotationSpeed,
            opacity: 1 - progress,
            vy: particle.vy + 0.1 // gravedad
          }))
        );

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          onComplete();
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: particle.x,
            top: particle.y,
            transform: `rotate(${particle.rotation}deg)`,
            opacity: particle.opacity,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: '50%',
            boxShadow: `0 0 ${particle.size}px ${particle.color}`
          }}
        />
      ))}
    </div>
  );
};

export default Confetti; 