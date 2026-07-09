"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  CreditCard, 
  Mail, 
  Phone, 
  MessageSquare, 
  Send, 
  ShieldCheck, 
  Sparkles, 
  Activity, 
  Compass, 
  Lock
} from 'lucide-react';

export default function BookingPage() {
  const [form, setForm] = useState({
    ciudad: '',
    fecha: '',
    rangoHorario: 'Mañana',
    nombre: '',
    dni: '',
    email: '',
    telefono: '',
    mensaje: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const ciudades = ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleShiftSelect = (shift: 'Mañana' | 'Tarde') => {
    setForm(prev => ({ ...prev, rangoHorario: shift }));
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.ciudad) newErrors.ciudad = 'Por favor selecciona una ciudad';
    if (!form.fecha) newErrors.fecha = 'Por favor selecciona una fecha';
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (!form.dni.trim()) newErrors.dni = 'El DNI es obligatorio';
    if (!form.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'El email no es válido';
    }
    if (!form.telefono.trim()) newErrors.telefono = 'El teléfono es obligatorio';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Formatear mensaje de WhatsApp
    const message = `¡Hola! Me gustaría reservar un turno para Quiropraxia:
📍 *Ciudad:* ${form.ciudad}
📅 *Fecha:* ${form.fecha}
⏰ *Horario:* ${form.rangoHorario}

*Mis Datos:*
👤 *Nombre:* ${form.nombre}
🪪 *DNI:* ${form.dni}
📧 *Email:* ${form.email}
📞 *Teléfono:* ${form.telefono}
💬 *Mensaje:* ${form.mensaje || 'Sin comentarios adicionales.'}`;

    const encodedMessage = encodeURIComponent(message);
    // Usamos un número genérico para wa.me o simplemente abrimos la app para seleccionar contacto si no se define
    const whatsappUrl = `https://wa.me/5491122334455?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-tr from-teal-500 to-emerald-400 p-2 rounded-xl text-white shadow-md shadow-teal-500/20">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-teal-700 to-emerald-600 bg-clip-text text-transparent">
                QuiroVida
              </span>
              <span className="hidden sm:inline text-xs block text-slate-500 font-medium tracking-wide">
                Centro de Quiropraxia
              </span>
            </div>
          </div>
          
          <Link 
            href="/admin" 
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-medium text-slate-700 hover:text-teal-600 bg-slate-100 hover:bg-teal-50 rounded-xl transition duration-200 border border-transparent hover:border-teal-200/50"
          >
            <Lock className="h-4 w-4" />
            <span>Panel Admin</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Branding / Info */}
          <div className="lg:col-span-5 space-y-6 md:space-y-8 lg:sticky lg:top-24">
            <div className="space-y-4">
              <span className="inline-flex items-center space-x-1 px-3 py-1 text-xs font-semibold text-teal-700 bg-teal-50 rounded-full border border-teal-100">
                <Sparkles className="h-3.5 w-3.5 text-teal-500" />
                <span>Bienestar Natural</span>
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-none">
                Tu columna alineada, <br />
                <span className="text-teal-600">tu vida en armonía.</span>
              </h1>
              <p className="text-base md:text-lg text-slate-600">
                Reserva tu turno de quiropraxia de manera rápida. Selecciona tu sucursal, fecha y horario, y confirma al instante a través de WhatsApp.
              </p>
            </div>

            {/* Features list */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start space-x-3.5">
                <div className="flex-shrink-0 bg-teal-100 text-teal-600 p-2.5 rounded-lg">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Quiroprácticos Certificados</h3>
                  <p className="text-sm text-slate-500">Cuidado profesional personalizado para la salud de tu columna y sistema nervioso.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <div className="flex-shrink-0 bg-teal-100 text-teal-600 p-2.5 rounded-lg">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Múltiples Sucursales</h3>
                  <p className="text-sm text-slate-500 font-normal">Encuéntranos en Buenos Aires, Córdoba, Rosario y Mendoza.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <div className="flex-shrink-0 bg-teal-100 text-teal-600 p-2.5 rounded-lg">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Confirmación Inmediata</h3>
                  <p className="text-sm text-slate-500">Completa tus datos y envíanos la solicitud de turno directamente por WhatsApp.</p>
                </div>
              </div>
            </div>

            {/* Trust badge */}
            <div className="bg-slate-100/60 border border-slate-200/60 p-4 rounded-2xl flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
                QV
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Más de <span className="text-slate-800 font-bold">5,000 pacientes</span> han mejorado su postura y aliviado sus dolores con nosotros.
              </p>
            </div>
          </div>

          {/* Right Column: Booking Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-premium p-6 md:p-8 lg:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-b from-teal-50 to-transparent -mr-4 -mt-4 rounded-full blur-xl pointer-events-none" />
              
              <div className="mb-6 md:mb-8">
                <h2 className="text-2xl font-bold text-slate-950">Reserva tu Turno</h2>
                <p className="text-sm text-slate-500">Por favor completa el siguiente formulario con tus datos.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Ciudad */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                    <MapPin className="h-4 w-4 text-teal-500" />
                    <span>Ciudad / Sucursal</span>
                  </label>
                  <div className="relative">
                    <select
                      name="ciudad"
                      value={form.ciudad}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        errors.ciudad ? 'border-red-400 bg-red-50/10' : 'border-slate-200 focus:border-teal-500'
                      } bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition duration-150 appearance-none`}
                    >
                      <option value="">Selecciona una ciudad...</option>
                      {ciudades.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                  </div>
                  {errors.ciudad && <p className="text-xs text-red-500 mt-1 font-medium">{errors.ciudad}</p>}
                </div>

                {/* Fecha y Rango Horario */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Fecha */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                      <Calendar className="h-4 w-4 text-teal-500" />
                      <span>Fecha</span>
                    </label>
                    <input
                      type="date"
                      name="fecha"
                      value={form.fecha}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        errors.fecha ? 'border-red-400 bg-red-50/10' : 'border-slate-200 focus:border-teal-500'
                      } bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition duration-150`}
                    />
                    {errors.fecha && <p className="text-xs text-red-500 mt-1 font-medium">{errors.fecha}</p>}
                  </div>

                  {/* Rango Horario */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                      <Clock className="h-4 w-4 text-teal-500" />
                      <span>Rango Horario</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/50">
                      <button
                        type="button"
                        onClick={() => handleShiftSelect('Mañana')}
                        className={`py-2 px-3 text-sm font-medium rounded-lg text-center transition duration-200 ${
                          form.rangoHorario === 'Mañana'
                            ? 'bg-white text-teal-700 shadow-sm border border-slate-100'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Mañana (8:00 - 12:00)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShiftSelect('Tarde')}
                        className={`py-2 px-3 text-sm font-medium rounded-lg text-center transition duration-200 ${
                          form.rangoHorario === 'Tarde'
                            ? 'bg-white text-teal-700 shadow-sm border border-slate-100'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Tarde (14:00 - 20:00)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Datos Personales</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nombre */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                        <User className="h-4 w-4 text-teal-500" />
                        <span>Nombre y Apellido</span>
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        placeholder="Juan Pérez"
                        className={`w-full px-4 py-3 rounded-xl border ${
                          errors.nombre ? 'border-red-400 bg-red-50/10' : 'border-slate-200 focus:border-teal-500'
                        } bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition duration-150`}
                      />
                      {errors.nombre && <p className="text-xs text-red-500 mt-1 font-medium">{errors.nombre}</p>}
                    </div>

                    {/* DNI */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                        <CreditCard className="h-4 w-4 text-teal-500" />
                        <span>DNI</span>
                      </label>
                      <input
                        type="text"
                        name="dni"
                        value={form.dni}
                        onChange={handleChange}
                        placeholder="12.345.678"
                        className={`w-full px-4 py-3 rounded-xl border ${
                          errors.dni ? 'border-red-400 bg-red-50/10' : 'border-slate-200 focus:border-teal-500'
                        } bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition duration-150`}
                      />
                      {errors.dni && <p className="text-xs text-red-500 mt-1 font-medium">{errors.dni}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                        <Mail className="h-4 w-4 text-teal-500" />
                        <span>Email</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="ejemplo@correo.com"
                        className={`w-full px-4 py-3 rounded-xl border ${
                          errors.email ? 'border-red-400 bg-red-50/10' : 'border-slate-200 focus:border-teal-500'
                        } bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition duration-150`}
                      />
                      {errors.email && <p className="text-xs text-red-500 mt-1 font-medium">{errors.email}</p>}
                    </div>

                    {/* Teléfono */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                        <Phone className="h-4 w-4 text-teal-500" />
                        <span>Teléfono / WhatsApp</span>
                      </label>
                      <input
                        type="tel"
                        name="telefono"
                        value={form.telefono}
                        onChange={handleChange}
                        placeholder="+54 9 11 2345 6789"
                        className={`w-full px-4 py-3 rounded-xl border ${
                          errors.telefono ? 'border-red-400 bg-red-50/10' : 'border-slate-200 focus:border-teal-500'
                        } bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition duration-150`}
                      />
                      {errors.telefono && <p className="text-xs text-red-500 mt-1 font-medium">{errors.telefono}</p>}
                    </div>
                  </div>
                </div>

                {/* Mensaje */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                    <MessageSquare className="h-4 w-4 text-teal-500" />
                    <span>Mensaje adicional (Opcional)</span>
                  </label>
                  <textarea
                    name="mensaje"
                    value={form.mensaje}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Cuéntanos brevemente si tienes algún síntoma, dolor específico o si es tu primera consulta de quiropraxia..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition duration-150 resize-none"
                  />
                </div>

                {/* Botón de envío */}
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center space-x-2 py-3.5 px-6 font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 rounded-2xl shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30 transition duration-300 transform active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                >
                  <Send className="h-5 w-5" />
                  <span>Confirmar y Enviar por WhatsApp</span>
                </button>
              </form>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 text-sm text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} QuiroVida. Todos los derechos reservados.
          </div>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-teal-600 transition">Términos de Servicio</a>
            <a href="#" className="hover:text-teal-600 transition">Política de Privacidad</a>
            <a href="#" className="hover:text-teal-600 transition">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
