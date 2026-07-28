import React from 'react';
import SpineLoadingIcon from './SpineLoadingIcon';

export default function LoadingSpinner({ message = "Cargando datos..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 gap-4">
      <SpineLoadingIcon className="h-16 w-16 text-emerald-500 animate-bounce" />
      <p className="text-emerald-500/80 font-medium animate-pulse text-base">{message}</p>
    </div>
  );
}
