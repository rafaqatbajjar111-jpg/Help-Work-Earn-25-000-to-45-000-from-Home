import React from 'react';

export const Logo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    id="help-work-logo"
  >
    <rect width="100" height="100" rx="24" fill="currentColor" fillOpacity="0.1" />
    <path 
      d="M30 35H70M30 50H70M30 65H55" 
      stroke="currentColor" 
      strokeWidth="8" 
      strokeLinecap="round" 
    />
    <path 
      d="M70 65L75 70L85 60" 
      stroke="currentColor" 
      strokeWidth="6" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <rect 
      x="20" y="20" width="60" height="60" 
      rx="8" 
      stroke="currentColor" 
      strokeWidth="4" 
      strokeDasharray="2 6"
    />
  </svg>
);
