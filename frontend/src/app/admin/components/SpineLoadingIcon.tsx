import React from 'react';

export default function SpineLoadingIcon({ className = "h-10 w-10 text-emerald-500 animate-bounce" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Central column */}
      <path d="M12 2v20" />
      {/* Vertebra 1 */}
      <path d="M8 6h8c1.1 0 2 .9 2 2s-.9 2-2 2H8c-1.1 0-2-.9-2-2s.9-2 2-2z" />
      {/* Vertebra 2 */}
      <path d="M8 14h8c1.1 0 2 .9 2 2s-.9 2-2 2H8c-1.1 0-2-.9-2-2s.9-2 2-2z" />
      {/* Processes (side wings) */}
      <path d="M6 8h2" />
      <path d="M16 8h2" />
      <path d="M6 16h2" />
      <path d="M16 16h2" />
    </svg>
  );
}
