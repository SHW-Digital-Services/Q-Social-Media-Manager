import React, { useState, useEffect } from 'react';
import { Q_LOGO_URL } from '../data/brandData';
import { getTransparentQLogoUrl } from '../lib/logoUtils';

interface QLogoProps {
  className?: string;
  alt?: string;
  size?: number | string;
  glow?: boolean;
}

export const QLogo: React.FC<QLogoProps> = ({
  className = 'w-full h-full object-contain',
  alt = 'Q Intelligence Cosmic Logomark',
  glow = false
}) => {
  const [logoSrc, setLogoSrc] = useState<string>(Q_LOGO_URL);

  useEffect(() => {
    let isMounted = true;
    getTransparentQLogoUrl().then(cleanUrl => {
      if (isMounted && cleanUrl) {
        setLogoSrc(cleanUrl);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <img
      src={logoSrc}
      alt={alt}
      crossOrigin="anonymous"
      className={`${className} filter brightness-110 contrast-125 saturate-125 ${
        glow 
          ? 'drop-shadow-[0_0_10px_rgba(192,132,252,0.85)] drop-shadow-[0_0_16px_rgba(56,189,248,0.5)]' 
          : 'drop-shadow-[0_0_4px_rgba(168,85,247,0.4)]'
      }`}
    />
  );
};
