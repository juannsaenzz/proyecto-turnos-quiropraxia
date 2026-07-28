import React from 'react';
import Image from 'next/image';
import loadingImg from '@/assets/loading.png';

export default function SpineLoadingIcon({ className = "h-16 w-16 animate-bounce" }: { className?: string }) {
  return (
    <div className={className}>
      <Image 
        src={loadingImg} 
        alt="Cargando..." 
        width={64} 
        height={64} 
        className="w-full h-full object-contain" 
        priority
      />
    </div>
  );
}
