import React from 'react';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const FadeIn: React.FC<FadeInProps> = ({ 
  children, 
  delay = 0, 
  duration = 300,
  className = '' 
}) => (
  <div
    className={className}
    style={{
      animation: `fadeIn ${duration}ms ease-out ${delay}ms forwards`,
      opacity: 0,
    }}
  >
    {children}
  </div>
);

interface SlideUpProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const SlideUp: React.FC<SlideUpProps> = ({ 
  children, 
  delay = 0, 
  duration = 400,
  className = '' 
}) => (
  <div
    className={className}
    style={{
      animation: `slideUp ${duration}ms ease-out ${delay}ms forwards`,
      opacity: 0,
    }}
  >
    {children}
  </div>
);

interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const ScaleIn: React.FC<ScaleInProps> = ({ 
  children, 
  delay = 0, 
  duration = 300,
  className = '' 
}) => (
  <div
    className={className}
    style={{
      animation: `scaleIn ${duration}ms ease-out ${delay}ms forwards`,
      opacity: 0,
    }}
  >
    {children}
  </div>
);

// Add keyframes if not already in index.css
const style = document.createElement('style');
style.textContent = `
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
`;
if (!document.head.querySelector('#transition-keyframes')) {
  style.id = 'transition-keyframes';
  document.head.appendChild(style);
}
