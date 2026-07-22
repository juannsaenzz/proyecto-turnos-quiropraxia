import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function LoadingSpinner({ message = "Cargando datos..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 gap-4">
      <RefreshCw className="h-10 w-10 animate-spin text-emerald-500" />
      <p className="text-emerald-500/80 font-medium animate-pulse text-sm">{message}</p>
    </div>
  );
}
