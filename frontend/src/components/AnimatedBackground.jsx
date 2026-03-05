import React from "react";
import "./AnimatedBackground.css";

const AnimatedBackground = () => {
  const particles = Array.from({ length: 60 }); // number of dots

  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {particles.map((_, i) => (
        <span
          key={i}
          className="particle"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${2 + Math.random() * 3}s`, // faster speed
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedBackground;
