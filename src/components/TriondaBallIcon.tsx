import React, { useState } from "react";

interface TriondaBallIconProps {
  className?: string;
  size?: number;
}

export default function TriondaBallIcon({ className = "", size = 48 }: TriondaBallIconProps) {
  const [imageError, setImageError] = useState(false);

  // High-definition official Adidas Trionda Match Ball 2026 image from stable public CDN
  const imageUrl = "https://assets.adidas.com/images/h_840,f_auto,q_auto/25ef11e2f3d54407945daf4a0104675e_9366/IY4828_01_standard.jpg";

  if (!imageError) {
    return (
      <img
        src={imageUrl}
        alt="Copa 2026 Trionda Match Ball"
        style={{ width: size, height: size }}
        className={`object-contain rounded-full select-none ${className}`}
        referrerPolicy="no-referrer"
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Glow / Shadow */}
      <defs>
        <radialGradient id="ballGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="triondaGreen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="triondaAmber" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
        <linearGradient id="triondaSilver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
      </defs>

      {/* Radial ambient glow behind the ball */}
      <circle cx="50" cy="50" r="48" fill="url(#ballGlow)" />

      {/* Ball Sphere Base */}
      <circle cx="50" cy="50" r="40" fill="#090d16" stroke="#10b981" strokeWidth="2" />

      {/* Classic Soccer Pentagons (Underlaid/Stylized) */}
      <path d="M50 32 L58 38 L55 47 L45 47 L42 38 Z" fill="#1e293b" stroke="#10b981" strokeWidth="1" strokeOpacity="0.4" />
      <path d="M50 32 L50 20" stroke="#10b981" strokeWidth="1" strokeOpacity="0.4" />
      <path d="M58 38 L68 35" stroke="#10b981" strokeWidth="1" strokeOpacity="0.4" />
      <path d="M55 47 L62 55" stroke="#10b981" strokeWidth="1" strokeOpacity="0.4" />
      <path d="M45 47 L38 55" stroke="#10b981" strokeWidth="1" strokeOpacity="0.4" />
      <path d="M42 38 L32 35" stroke="#10b981" strokeWidth="1" strokeOpacity="0.4" />

      {/* The Famous 2026 World Cup Ball "Trionda" - Three Dynamic Flowing Curves/Waves */}
      {/* Wave 1: Emerald/Green Wave */}
      <path
        d="M20 65 C 35 40, 65 70, 80 35 C 75 45, 45 35, 20 65 Z"
        fill="url(#triondaGreen)"
        opacity="0.9"
        className="animate-pulse"
      />
      
      {/* Wave 2: Amber/Gold Wave */}
      <path
        d="M22 61 C 36 43, 62 66, 78 39 C 71 45, 48 39, 22 61 Z"
        fill="url(#triondaAmber)"
        opacity="0.85"
      />

      {/* Wave 3: Pearl/Silver-White Wave */}
      <path
        d="M25 57 C 38 46, 58 62, 75 43 C 68 47, 50 43, 25 57 Z"
        fill="url(#triondaSilver)"
        opacity="0.95"
      />

      {/* Highlights & Reflections */}
      <path
        d="M30 20 C 40 15, 60 15, 70 20"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      <circle cx="35" cy="25" r="2" fill="#ffffff" opacity="0.6" />
    </svg>
  );
}
