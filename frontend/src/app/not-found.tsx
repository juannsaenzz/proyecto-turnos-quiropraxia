import React from 'react';
import Image from 'next/image';
import errorImg from '@/assets/error.jpg';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/3 w-80 h-80 bg-rose-900/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10 text-center flex flex-col items-center">
        <div className="w-24 h-24 mb-6 flex-shrink-0">
          <Image src={errorImg} alt="Página no encontrada" width={96} height={96} className="object-contain w-full h-full" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight mb-4">
          Página no encontrada
        </h1>
        
        <p className="text-slate-400 font-medium mb-8 text-lg">
          La URL ingresada no existe o fue movida a otra dirección.
        </p>

        <Link
          href="/admin/turnos"
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm active:scale-[0.98]"
        >
          Volver a inicio
        </Link>
      </div>
    </div>
  );
}
