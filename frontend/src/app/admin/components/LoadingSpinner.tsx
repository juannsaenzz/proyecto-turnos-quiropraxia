import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <RefreshCw className="h-10 w-10 animate-spin text-emerald-500" />
      <p className="text-emerald-500/80 font-medium animate-pulse text-sm">Cargando datos...</p>
    </div>
  );
}
