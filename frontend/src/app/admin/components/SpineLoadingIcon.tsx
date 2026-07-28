import React from 'react';

export default function SpineLoadingIcon({ className = "h-12 w-12 text-emerald-500 animate-bounce" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <g transform="translate(0, 2.5)">
        {/* Discos Intervertebrales */}
        <line x1="10" y1="4.5" x2="10" y2="7.5" />
        <line x1="14" y1="4.5" x2="14" y2="7.5" />
        
        <line x1="10" y1="11.5" x2="10" y2="14.5" />
        <line x1="14" y1="11.5" x2="14" y2="14.5" />
        
        {/* Vértebra 1 */}
        <g transform="translate(0, 0)">
          <path d="M 8 0 Q 12 1.5 16 0 A 2 2 0 0 1 18 2 L 18 3 A 2 2 0 0 1 16 5 Q 12 3.5 8 5 A 2 2 0 0 1 6 3 L 6 2 A 2 2 0 0 1 8 0 Z" />
          <path d="M 6 2 L 4.5 2 A 1.5 1.5 0 1 0 4.5 3 L 6 3" />
          <path d="M 18 2 L 19.5 2 A 1.5 1.5 0 1 1 19.5 3 L 18 3" />
        </g>

        {/* Vértebra 2 */}
        <g transform="translate(0, 7)">
          <path d="M 8 0 Q 12 1.5 16 0 A 2 2 0 0 1 18 2 L 18 3 A 2 2 0 0 1 16 5 Q 12 3.5 8 5 A 2 2 0 0 1 6 3 L 6 2 A 2 2 0 0 1 8 0 Z" />
          <path d="M 6 2 L 4.5 2 A 1.5 1.5 0 1 0 4.5 3 L 6 3" />
          <path d="M 18 2 L 19.5 2 A 1.5 1.5 0 1 1 19.5 3 L 18 3" />
        </g>

        {/* Vértebra 3 */}
        <g transform="translate(0, 14)">
          <path d="M 8 0 Q 12 1.5 16 0 A 2 2 0 0 1 18 2 L 18 3 A 2 2 0 0 1 16 5 Q 12 3.5 8 5 A 2 2 0 0 1 6 3 L 6 2 A 2 2 0 0 1 8 0 Z" />
          <path d="M 6 2 L 4.5 2 A 1.5 1.5 0 1 0 4.5 3 L 6 3" />
          <path d="M 18 2 L 19.5 2 A 1.5 1.5 0 1 1 19.5 3 L 18 3" />
        </g>
      </g>
    </svg>
  );
}
