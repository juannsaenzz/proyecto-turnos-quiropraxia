"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebar } from '../../components/SidebarContext';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Menu,
  FileText,
  Edit2,
  Save,
  X,
  Trash2
} from 'lucide-react';

interface Turno {
  id: number;
  pacienteId: number;
  pacienteNombre: string;
  fechaHora: string;
  ciudad: string;
  notas: string;
  estado: 'PENDIENTE' | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE';
}

interface Paciente {
  id: number;
  nombre: string;
  dni: string | null;
  email: string | null;
  telefono: string | null;
  fechaNacimiento: string | null;
}

export default function HistorialPacientePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { setSidebarOpen } = useSidebar();
  const pacienteId = parseInt(params.id, 10);
  
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTurnos, setSelectedTurnos] = useState<number[]>([]);

  const [editingTurno, setEditingTurno] = useState<number | null>(null);
  const [editNotas, setEditNotas] = useState("");
  const [editEstado, setEditEstado] = useState<Turno['estado']>('PENDIENTE');
  const [isSaving, setIsSaving] = useState(false);

  // Hydration fix
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pacienteRes, turnosRes] = await Promise.all([
          fetch(`http://localhost:3000/pacientes/${pacienteId}`),
          fetch('http://localhost:3000/turnos')
        ]);

        if (pacienteRes.ok) {
          const data = await pacienteRes.json();
          setPaciente(data);
        }

        if (turnosRes.ok) {
          const allTurnos: Turno[] = await turnosRes.json();
          // Filter by patient ID and sort newest first
          const patientTurnos = allTurnos
            .filter(t => t.pacienteId === pacienteId)
            .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
          setTurnos(patientTurnos);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (pacienteId) fetchData();
  }, [pacienteId]);

  const handleEditClick = (turno: Turno) => {
    setEditingTurno(turno.id);
    setEditNotas(turno.notas || "");
    setEditEstado(turno.estado);
  };

  const handleCancelEdit = () => {
    setEditingTurno(null);
    setEditNotas("");
    setEditEstado('PENDIENTE');
  };

  const handleSaveTurno = async (id: number) => {
    setIsSaving(true);
    try {
      const res = await fetch(`http://localhost:3000/turnos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notas: editNotas })
      });

      if (res.ok) {
        setTurnos(turnos.map(t => 
          t.id === id ? { ...t, notas: editNotas } : t
        ));
        setEditingTurno(null);
      } else {
        console.error("Failed to update turno");
      }
    } catch (error) {
      console.error("Error updating turno", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickStatusChange = async (id: number, newEstado: Turno['estado']) => {
    // Actualización optimista para que cambie al instante
    setTurnos(prev => prev.map(t => 
      t.id == id ? { ...t, estado: newEstado } : t
    ));

    try {
      const res = await fetch(`http://localhost:3000/turnos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: newEstado })
      });

      if (!res.ok) {
        console.error("Failed to update turno status");
      }
    } catch (error) {
      console.error("Error updating turno status", error);
    }
  };

  const toggleTurnoSelection = (id: number) => {
    setSelectedTurnos(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const updateSelectedEstado = async (estado: Turno['estado']) => {
    if (selectedTurnos.length === 0) return;
    try {
      await Promise.all(selectedTurnos.map(id => fetch(`http://localhost:3000/turnos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
      })));
      setTurnos(prev => prev.map(t => selectedTurnos.includes(t.id) ? { ...t, estado } : t));
      setSelectedTurnos([]);
    } catch (error) {
      console.error("Error bulk updating", error);
    }
  };

  const deleteSelected = async () => {
    if (selectedTurnos.length === 0) return;
    if (!confirm(`¿Eliminar ${selectedTurnos.length} turnos?`)) return;
    try {
      await Promise.all(selectedTurnos.map(id => fetch(`http://localhost:3000/turnos/${id}`, {
        method: 'DELETE'
      })));
      setTurnos(prev => prev.filter(t => !selectedTurnos.includes(t.id)));
      setSelectedTurnos([]);
    } catch (error) {
      console.error("Error bulk deleting", error);
    }
  };

  if (!isMounted) return null;

  const getEstadoStyles = (estado: string) => {
    switch (estado) {
      case 'ATENDIDO': return 'bg-emerald-950/50 text-emerald-400 border-emerald-800';
      case 'CONFIRMADO': return 'bg-blue-950/50 text-blue-400 border-blue-800';
      case 'AUSENTE': return 'bg-rose-950/50 text-rose-400 border-rose-800';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'ATENDIDO': return 'ATENDIDO';
      case 'CONFIRMADO': return 'CONFIRMADO';
      case 'AUSENTE': return 'AUSENTE';
      default: return 'PENDIENTE';
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    try {
      const datePart = isoString.split('T')[0];
      const [year, month, day] = datePart.split('-');
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(d);
    } catch {
      return '';
    }
  };

  const formatTime = (isoString: string) => {
    if (!isoString || !isoString.includes('T')) return '';
    try {
      return isoString.split('T')[1].substring(0, 5);
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans relative">
      {/* Top Header */}
      <header className="h-20 bg-slate-900 border-b border-slate-800/80 sticky top-0 z-30 px-6 sm:px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-slate-200 p-2 hover:bg-slate-800 rounded-xl"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => router.back()}
              className="text-emerald-500 hover:text-emerald-400 p-2 hover:bg-emerald-950/30 rounded-full transition"
              title="Volver"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-extrabold text-slate-100 tracking-tight capitalize hidden sm:block">
              Historial de Turnos
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 sm:p-8 max-w-5xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : !paciente ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-slate-400">Paciente no encontrado</h2>
            <button onClick={() => router.back()} className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition">Volver a Pacientes</button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Patient Info Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              
              <div className="flex items-center gap-6 relative z-10">
                <div className="h-20 w-20 rounded-full bg-slate-800 border-2 border-emerald-900/50 flex items-center justify-center flex-shrink-0 shadow-inner">
                  <User className="h-10 w-10 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-100 tracking-tight">{paciente.nombre}</h2>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm font-medium text-slate-400">
                    {paciente.telefono && <div className="flex items-center gap-1.5 font-bold text-emerald-400"><Phone className="h-4 w-4 text-emerald-500" /> {paciente.telefono}</div>}
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/80 text-center min-w-[140px] relative z-10">
                <div className="text-3xl font-black text-emerald-400">{turnos.length}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Turnos Totales</div>
              </div>
            </div>

            {/* Turnos List */}
            <div>
              <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-500" />
                Registro de Turnos
              </h3>
              
              {turnos.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center shadow-lg">
                  <Calendar className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-300">Sin historial</h3>
                  <p className="text-slate-500 mt-2">Este paciente aún no tiene turnos registrados.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {turnos.map((turno) => (
                    <div key={turno.id} className={`group bg-slate-900 border rounded-2xl p-5 transition shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${selectedTurnos.includes(turno.id) ? 'ring-2 ring-emerald-500 bg-emerald-950/20 border-emerald-500/50' : 'border-slate-800 hover:border-slate-700 hover:shadow-md'}`}>
                      
                      {/* Left: Checkbox, Date & Time */}
                      <div className="flex items-center gap-5 md:w-1/3">
                        <div className="flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            checked={selectedTurnos.includes(turno.id)} 
                            onChange={() => toggleTurnoSelection(turno.id)}
                            className="w-5 h-5 accent-emerald-500 rounded border-slate-700 cursor-pointer"
                          />
                        </div>
                        <div className="bg-slate-950 rounded-xl px-4 py-3 border border-emerald-900/30 flex flex-col items-center justify-center min-w-[140px] shadow-inner">
                          <span className="text-base font-black text-emerald-400 leading-tight capitalize text-center text-balance">{formatDate(turno.fechaHora)}</span>
                        </div>
                        <div className="flex flex-col justify-center">
                          <div className="font-bold text-slate-200 text-xl flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            {formatTime(turno.fechaHora)}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-slate-400 mt-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {turno.ciudad}
                          </div>
                        </div>
                      </div>

                      {editingTurno === turno.id ? (
                        <>
                          {/* Middle: Editing Notes */}
                          <div className="md:w-1/3 flex items-center gap-3">
                            <textarea
                              value={editNotas}
                              onChange={(e) => setEditNotas(e.target.value)}
                              placeholder="Notas adicionales..."
                              className="flex-1 bg-slate-950 border border-emerald-900/50 rounded-xl p-3 text-sm text-slate-300 focus:outline-none focus:border-emerald-500 min-h-[60px] resize-none"
                            />
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => handleSaveTurno(turno.id)}
                                disabled={isSaving}
                                className="p-2 bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/30 rounded-lg transition disabled:opacity-50"
                                title="Guardar"
                              >
                                <Save className="h-5 w-5" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                                className="p-2 bg-rose-600/20 text-rose-500 hover:bg-rose-600/30 rounded-lg transition disabled:opacity-50"
                                title="Cancelar"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Right: Status */}
                          <div className="md:w-1/4 flex justify-end items-center">
                            <select
                              value={turno.estado}
                              onChange={(e) => handleQuickStatusChange(turno.id, e.target.value as Turno['estado'])}
                              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border uppercase tracking-wider outline-none cursor-pointer hover:opacity-80 transition ${getEstadoStyles(turno.estado)}`}
                            >
                              <option value="PENDIENTE" className="bg-slate-900 text-slate-300">PENDIENTE</option>
                              <option value="CONFIRMADO" className="bg-slate-900 text-blue-400">CONFIRMADO</option>
                              <option value="ATENDIDO" className="bg-slate-900 text-emerald-400">ATENDIDO</option>
                              <option value="AUSENTE" className="bg-slate-900 text-rose-400">AUSENTE</option>
                            </select>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Middle: Notes and Edit button */}
                          <div className="md:w-1/3 flex items-center gap-3">
                            <div className="flex-1 text-sm text-slate-400 bg-slate-950/50 rounded-xl p-3 border border-slate-800/50 min-h-[60px] flex items-center relative group-hover:border-slate-700/80 transition-colors">
                              {turno.notas ? (
                                <span className="italic">"{turno.notas}"</span>
                              ) : (
                                <span className="text-slate-600 italic">Sin notas adicionales</span>
                              )}
                            </div>
                            <button
                              onClick={() => handleEditClick(turno)}
                              className="p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-950/30 rounded-lg transition"
                              title="Editar nota"
                            >
                              <Edit2 className="h-5 w-5" />
                            </button>
                          </div>

                          {/* Right: Status */}
                          <div className="md:w-1/4 flex justify-end items-center">
                            <select
                              value={turno.estado}
                              onChange={(e) => handleQuickStatusChange(turno.id, e.target.value as Turno['estado'])}
                              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border uppercase tracking-wider outline-none cursor-pointer hover:opacity-80 transition ${getEstadoStyles(turno.estado)}`}
                            >
                              <option value="PENDIENTE" className="bg-slate-900 text-slate-300">PENDIENTE</option>
                              <option value="CONFIRMADO" className="bg-slate-900 text-blue-400">CONFIRMADO</option>
                              <option value="ATENDIDO" className="bg-slate-900 text-emerald-400">ATENDIDO</option>
                              <option value="AUSENTE" className="bg-slate-900 text-rose-400">AUSENTE</option>
                            </select>
                          </div>
                        </>
                      )}
                      
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Bulk Actions Bar */}
      {selectedTurnos.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 p-2 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5">
          <div className="px-4 font-bold text-slate-200">
            <span className="text-emerald-400">{selectedTurnos.length}</span> seleccionados
          </div>
          <div className="w-px h-8 bg-slate-700"></div>
          <button 
            onClick={deleteSelected}
            className="p-2 hover:bg-rose-500/20 text-rose-500 rounded-xl transition flex items-center justify-center border border-transparent hover:border-rose-500/30"
            title="Eliminar seleccionados"
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <div className="flex gap-2 bg-slate-950 rounded-xl p-1 border border-slate-800">
            <button onClick={() => updateSelectedEstado('PENDIENTE')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-800 transition">Pendientes</button>
            <button onClick={() => updateSelectedEstado('ATENDIDO')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-500 hover:bg-emerald-950/50 transition">Atendidos</button>
            <button onClick={() => updateSelectedEstado('CONFIRMADO')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-400 hover:bg-blue-950/50 transition">Confirmados</button>
            <button onClick={() => updateSelectedEstado('AUSENTE')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-950/50 transition">Ausentes</button>
          </div>
        </div>
      )}
    </div>
  );
}
