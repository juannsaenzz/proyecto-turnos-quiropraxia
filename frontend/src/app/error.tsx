'use client'; // Error boundaries must be Client Components

import React, { useEffect } from 'react';
import Image from 'next/image';
import errorImg from '@/assets/error.jpg';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/3 w-80 h-80 bg-rose-900/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10 text-center flex flex-col items-center">
        <div className="w-24 h-24 mb-6 rounded-3xl overflow-hidden shadow-2xl shadow-rose-900/20 border border-slate-800 bg-slate-900">
          <Image src={errorImg} alt="Error" width={96} height={96} className="object-cover w-full h-full" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight mb-4">
          ¡Ups! Algo salió mal
        </h1>
        
        <p className="text-slate-400 font-medium mb-8 text-lg">
          No pudimos cargar la página o hubo un error de conexión con el servidor.
        </p>

        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm active:scale-[0.98]"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
