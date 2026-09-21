import React from 'react';
import { SocialPlatform } from '../types';
import { Globe } from 'lucide-react';

interface SocialPlatformBrandIconProps {
  platform: SocialPlatform | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
}

export const SocialPlatformBrandIcon: React.FC<SocialPlatformBrandIconProps> = ({
  platform,
  size = 'md',
  className = '',
  showBorder = true
}) => {
  const sizeClasses: Record<string, { container: string; icon: string }> = {
    xs: { container: 'w-5 h-5 rounded-md', icon: 'w-3 h-3' },
    sm: { container: 'w-8 h-8 rounded-lg', icon: 'w-4 h-4' },
    md: { container: 'w-10 h-10 rounded-xl', icon: 'w-5 h-5' },
    lg: { container: 'w-12 h-12 rounded-2xl', icon: 'w-6 h-6' },
    xl: { container: 'w-14 h-14 rounded-2xl', icon: 'w-7 h-7' }
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;
  const borderClass = showBorder ? 'border border-slate-200/80 shadow-2xs' : '';

  switch (platform) {
    case 'instagram':
      return (
        <div 
          className={`${selectedSize.container} flex items-center justify-center shrink-0 bg-gradient-to-tr from-[#fd5949] via-[#d6249f] to-[#285AEB] text-white ${borderClass} ${className}`}
          title="Instagram"
        >
          {/* Authentic Instagram glyph */}
          <svg className={selectedSize.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" />
          </svg>
        </div>
      );

    case 'threads':
      return (
        <div 
          className={`${selectedSize.container} flex items-center justify-center shrink-0 bg-black text-white ${borderClass} ${className}`}
          title="Threads"
        >
          {/* Authentic Threads "@" ligature glyph */}
          <svg className={selectedSize.icon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.186 24C5.556 24 0 18.667 0 12.008 0 5.378 5.518 0 12.064 0 18.067 0 23.3 4.417 23.953 10.608h-3.41c-.604-4.418-4.398-7.556-8.479-7.556-4.908 0-8.868 3.99-8.868 8.956 0 4.966 3.96 8.956 8.868 8.956 3.49 0 6.643-2.022 7.942-5.105h-7.942v-3.052h11.238c.115.688.174 1.397.174 2.112 0 6.66-5.467 12.081-11.49 12.081z" />
          </svg>
        </div>
      );

    case 'twitter':
      return (
        <div 
          className={`${selectedSize.container} flex items-center justify-center shrink-0 bg-[#000000] text-white ${borderClass} ${className}`}
          title="X (formerly Twitter)"
        >
          {/* Official X Logo */}
          <svg className={selectedSize.icon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
      );

    case 'linkedin':
      return (
        <div 
          className={`${selectedSize.container} flex items-center justify-center shrink-0 bg-[#0A66C2] text-white ${borderClass} ${className}`}
          title="LinkedIn"
        >
          {/* Authentic LinkedIn "in" symbol */}
          <svg className={selectedSize.icon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
        </div>
      );

    case 'tiktok':
      return (
        <div 
          className={`${selectedSize.container} flex items-center justify-center shrink-0 bg-black text-white ${borderClass} ${className}`}
          title="TikTok"
        >
          {/* Authentic TikTok Musical Note */}
          <svg className={selectedSize.icon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
          </svg>
        </div>
      );

    case 'bluesky':
      return (
        <div 
          className={`${selectedSize.container} flex items-center justify-center shrink-0 bg-[#0285FF] text-white ${borderClass} ${className}`}
          title="Bluesky"
        >
          {/* Official Bluesky Butterfly Logo */}
          <svg className={selectedSize.icon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.879.139 2.592 0 3.79 0 5.438c0 1.647.397 7.026.657 8.35.792 4.025 4.331 5.378 7.375 4.542-4.526 1.189-5.698 3.863-3.21 6.351 3.056 3.056 6.302-.279 7.178-2.68.876 2.401 4.122 5.736 7.178 2.68 2.488-2.488 1.316-5.162-3.21-6.351 3.044.836 6.583-.517 7.375-4.542.26-1.324.657-6.703.657-8.35 0-1.648-.139-2.846-.902-3.559-.659-.613-1.664-.935-4.3-.074-2.752 1.942-5.711 5.881-6.798 7.995z" />
          </svg>
        </div>
      );

    case 'facebook':
      return (
        <div 
          className={`${selectedSize.container} flex items-center justify-center shrink-0 bg-[#1877F2] text-white ${borderClass} ${className}`}
          title="Facebook"
        >
          {/* Authentic Facebook "f" logo */}
          <svg className={selectedSize.icon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </div>
      );

    case 'website':
      return (
        <div 
          className={`${selectedSize.container} flex items-center justify-center shrink-0 bg-gradient-to-tr from-purple-700 via-indigo-700 to-purple-900 text-white ${borderClass} ${className}`}
          title="Official Website (q-ai.online)"
        >
          <Globe className={selectedSize.icon} />
        </div>
      );

    default:
      return (
        <div 
          className={`${selectedSize.container} flex items-center justify-center shrink-0 bg-slate-800 text-white ${borderClass} ${className}`}
          title={platform}
        >
          <Globe className={selectedSize.icon} />
        </div>
      );
  }
};
