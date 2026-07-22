"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useSidebar } from '../../components/SidebarContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useGlobalData, Paciente, Turno } from '../../components/GlobalDataContext';
import Image from 'next/image';
import logo from '@/assets/2.png';
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
  Trash2,
  ChevronDown,
  AlertCircle,
  ArrowUp,
  RefreshCw,
  Pencil
} from 'lucide-react';



export default function HistorialPacientePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { setSidebarOpen } = useSidebar();
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setCurrentUserEmail(session.user.email);
      }
    };
    fetchUser();
  }, []);

  const pacienteId = parseInt(params.id, 10);
  
  const { pacientes, turnos: allTurnos, setTurnos, setPacientes, setHistoriales, loading } = useGlobalData();
  const paciente = pacientes.find(p => p.id === pacienteId) || null;
  const turnos = allTurnos
    .filter(t => t.pacienteId === pacienteId)
    .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());

  const [selectedTurnos, setSelectedTurnos] = useState<number[]>([]);

  // Modales de edicion de paciente
  const [showEditPacienteModal, setShowEditPacienteModal] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingTurno, setEditingTurno] = useState<number | null>(null);
  const [editNotas, setEditNotas] = useState("");
  const [editEstado, setEditEstado] = useState<Turno['estado']>('PENDIENTE');
  const [isSaving, setIsSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState<'desc' | 'asc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | Turno['estado']>('TODOS');
  const [visibleTurnosCount, setVisibleTurnosCount] = useState(5);

  const [customConfirm, setCustomConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  } | null>(null);

  // Scroll to top FAB state
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-container');
    const target = scrollContainer || window;
    
    const handleScroll = () => {
      const scrollTop = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
      if (scrollTop > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    target.addEventListener('scroll', handleScroll);
    return () => target.removeEventListener('scroll', handleScroll as EventListener);
  }, []);

  // Hydration fix
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const handleUpdatePaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingPaciente) return;

    const errors: Record<string, string> = {};
    if (!editingPaciente.nombre.trim()) {
      errors.nombre = "El nombre completo es obligatorio.";
    }

    const dniTrimmed = editingPaciente.dni ? editingPaciente.dni.trim() : "";
    if (dniTrimmed) {
      if (!/^\d{7,8}$/.test(dniTrimmed)) {
        errors.dni = "El DNI debe tener 7 u 8 números.";
      } else if (pacientes.some(p => p.dni === dniTrimmed && p.id !== editingPaciente.id)) {
        errors.dni = "Ya existe otro paciente con este DNI.";
      }
    }

    if (editingPaciente.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editingPaciente.email.trim())) {
      errors.email = "Correo electrónico inválido.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/pacientes/${editingPaciente.id}`, {
        method: "PUT",
        headers: {
          'Content-Type': "application/json",
        },
        body: JSON.stringify({
          nombre: editingPaciente.nombre.trim(),
          dni: dniTrimmed || undefined,
          email: editingPaciente.email?.trim() || undefined,
          telefono: editingPaciente.telefono?.trim() || undefined,
          fechaNacimiento: editingPaciente.fechaNacimiento?.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Error al actualizar paciente');
      }

      const actualizado = await response.json();

      setPacientes(prev => prev.map(p => p.id === actualizado.id ? actualizado : p));
      setTurnos(prev => prev.map(t => t.pacienteId === actualizado.id ? { ...t, pacienteNombre: actualizado.nombre } : t));
      setHistoriales(prev => prev.map(h => h.pacienteId === actualizado.id ? { ...h, pacienteNombre: actualizado.nombre } : h));

      setShowEditPacienteModal(false);
      setEditingPaciente(null);
    } catch (error: any) {
      console.error('Error updating patient:', error);
      alert(error.message || 'No se pudo actualizar el paciente.');
    }
  };

  const handleEditClick = (turno: Turno) => {
    setSelectedTurnos([]);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/turnos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notas: editNotas, updatedBy: currentUserEmail || undefined })
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
    setSelectedTurnos([]);
    setUpdatingStatusId(id);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/turnos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: newEstado, updatedBy: currentUserEmail || undefined })
      });

      if (!res.ok) {
        console.error("Failed to update turno status");
      } else {
        const actualizado = await res.json();
        setTurnos(prev => prev.map(t => 
          t.id == id ? { ...t, estado: actualizado.estado, updatedAt: actualizado.updatedAt, updatedBy: actualizado.updatedBy } : t
        ));
      }
    } catch (error) {
      console.error("Error updating turno status", error);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDeleteSingleTurno = (id: number) => {
    setSelectedTurnos([]);
    setCustomConfirm({
      title: 'Eliminar Turno',
      message: '¿Estás seguro de que deseas eliminar este turno? Esta acción no se puede deshacer.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/turnos/${id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            setTurnos(prev => prev.filter(t => t.id !== id));
            if (selectedTurnos.includes(id)) {
              setSelectedTurnos(prev => prev.filter(tId => tId !== id));
            }
            setCustomConfirm(null);
          } else {
            console.error("Failed to delete turno");
          }
        } catch (error) {
          console.error("Error deleting turno", error);
        }
      }
    });
  };

  const toggleTurnoSelection = (id: number) => {
    setSelectedTurnos(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const updateSelectedEstado = (estado: Turno['estado']) => {
    if (selectedTurnos.length === 0) return;
    setCustomConfirm({
      title: `Cambiar a ${estado}`,
      message: `¿Estás seguro de que deseas marcar los ${selectedTurnos.length} turnos seleccionados como ${estado}?`,
      confirmText: 'Guardar Cambios',
      cancelText: 'Cancelar',
      type: 'warning',
      onConfirm: async () => {
        try {
          await Promise.all(selectedTurnos.map(id => fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/turnos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado, updatedBy: currentUserEmail || undefined })
          })));
          setTurnos(prev => prev.map(t => selectedTurnos.includes(t.id) ? { ...t, estado, updatedAt: new Date().toISOString(), updatedBy: currentUserEmail || undefined } : t));
          setSelectedTurnos([]);
          setCustomConfirm(null);
        } catch (error) {
          console.error("Error bulk updating", error);
        }
      }
    });
  };

  const deleteSelected = () => {
    if (selectedTurnos.length === 0) return;
    
    setCustomConfirm({
      title: 'Eliminar Turnos',
      message: `¿Estás seguro de que deseas eliminar ${selectedTurnos.length} turnos? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm: async () => {
        try {
          await Promise.all(selectedTurnos.map(id => fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/turnos/${id}`, {
            method: 'DELETE'
          })));
          setTurnos(prev => prev.filter(t => !selectedTurnos.includes(t.id)));
          setSelectedTurnos([]);
          setCustomConfirm(null);
        } catch (error) {
          console.error("Error bulk deleting", error);
        }
      }
    });
  };

  if (!isMounted) return null;

  const getEstadoStyles = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'bg-amber-950/50 text-amber-300 border-amber-500/20';
      case 'CONFIRMADO': return 'bg-blue-950/50 text-blue-300 border-blue-500/20';
      case 'ATENDIDO': return 'bg-emerald-950/50 text-emerald-300 border-emerald-500/20';
      case 'AUSENTE': return 'bg-rose-950/50 text-rose-300 border-rose-500/20';
      default: return 'bg-slate-950 text-slate-400 border-slate-800';
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
      const weekday = new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(d);
      const formatted = `${weekday}, ${day}/${month}/${year}`;
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch (e) {
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

  const processedTurnos = [...turnos].filter(t => statusFilter === 'TODOS' || t.estado === statusFilter).sort((a, b) => {
    const dateA = new Date(a.fechaHora).getTime();
    const dateB = new Date(b.fechaHora).getTime();
    return sortOption === 'desc' ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans relative">
      {/* Top Header */}
      <header className="h-auto xl:h-20 bg-slate-900 border-b border-slate-800/80 sticky top-0 z-30 px-6 xl:px-8 flex flex-col xl:flex-row items-start xl:items-center py-4 xl:py-0 gap-4 xl:gap-0 shadow-sm">
        <div className="flex items-center justify-between w-full xl:w-auto xl:justify-start gap-2 sm:space-x-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="text-slate-400 hover:text-slate-200 p-1.5 sm:p-2 hover:bg-slate-800 rounded-xl shrink-0"
            >
              <Menu className="h-6 w-6" />
            </button>
            <button 
              onClick={() => router.back()}
              className="p-2 sm:p-2.5 bg-slate-900 border border-slate-700 text-emerald-400 hover:text-white hover:bg-emerald-600 rounded-full shadow-lg transition shrink-0"
              title="Volver"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="shrink-0 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12">
              <Image src={logo} alt="Logo" width={48} height={48} className="object-contain w-full h-full mix-blend-screen opacity-90 hover:opacity-100 transition-opacity" />
            </div>
            <h1 className="text-base sm:text-xl font-extrabold text-slate-100 tracking-tight truncate">
              Ficha del Paciente
            </h1>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="p-2 sm:p-2.5 bg-slate-900 border border-slate-700 text-emerald-400 hover:text-white hover:bg-emerald-600 rounded-full shadow-lg transition group shrink-0"
            title="Actualizar datos"
          >
            <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 sm:p-8 max-w-5xl mx-auto w-full">
        {loading ? (
          <LoadingSpinner />
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
              
              <div className="flex items-center gap-6 relative z-10 min-w-0">
                <div className="h-20 w-20 rounded-full bg-slate-800 border-2 border-emerald-900/50 flex items-center justify-center flex-shrink-0 shadow-inner">
                  <User className="h-10 w-10 text-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-4 flex-wrap">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight break-words">{paciente.nombre}</h2>
                    <button 
                      onClick={() => {
                        setEditingPaciente(paciente);
                        setShowEditPacienteModal(true);
                      }}
                      className="p-1 md:p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-700 bg-slate-950/40 border border-slate-850/60 rounded-lg transition flex items-center justify-center shrink-0"
                      title="Editar Paciente"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm font-medium text-slate-400">
                    {paciente.telefono && <div className="flex items-start sm:items-center gap-1.5 font-bold text-emerald-400"><Phone className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5 sm:mt-0" /> <span className="break-all whitespace-normal">{paciente.telefono}</span></div>}
                    {paciente.dni && <div className="flex items-center shrink-0">DNI: {paciente.dni}</div>}
                    {paciente.email && <div className="flex items-center break-all whitespace-normal">{paciente.email}</div>}
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/80 text-center min-w-[140px] relative z-10">
                <div className="text-3xl font-black text-emerald-400">{turnos.length}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Turnos</div>
              </div>
            </div>

            {/* Turnos List */}
            <div>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-sm mb-6">
                <span className="text-xl font-extrabold text-slate-100 tracking-tight">Historial de Turnos</span>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative inline-flex items-center w-full sm:w-auto">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="w-full sm:w-auto appearance-none bg-slate-950 border border-slate-800 text-slate-300 text-sm font-semibold rounded-xl px-4 py-2 pr-10 focus:outline-none focus:border-emerald-500 transition cursor-pointer hover:bg-slate-900"
                    >
                      <option value="TODOS">Todos los estados</option>
                      <option value="PENDIENTE">Solo Pendientes</option>
                      <option value="CONFIRMADO">Solo Confirmados</option>
                      <option value="ATENDIDO">Solo Atendidos</option>
                      <option value="AUSENTE">Solo Ausentes</option>
                    </select>
                    <ChevronDown className="absolute right-3 h-4 w-4 text-slate-500 pointer-events-none" />
                  </div>
                  <div className="relative inline-flex items-center w-full sm:w-auto">
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value as any)}
                      className="w-full sm:w-auto appearance-none bg-slate-950 border border-slate-800 text-slate-300 text-sm font-semibold rounded-xl px-4 py-2 pr-10 focus:outline-none focus:border-emerald-500 transition cursor-pointer hover:bg-slate-900"
                    >
                      <option value="desc">Más recientes primero</option>
                      <option value="asc">Más antiguos primero</option>
                    </select>
                    <ChevronDown className="absolute right-3 h-4 w-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>
              
              {turnos.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center shadow-lg">
                  <Calendar className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-300">Sin historial</h3>
                  <p className="text-slate-500 mt-2">Este paciente aún no tiene turnos registrados.</p>
                </div>
              ) : processedTurnos.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center shadow-lg">
                  <Calendar className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-300">Sin resultados</h3>
                  <p className="text-slate-500 mt-2">No se encontraron turnos con el estado seleccionado.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {processedTurnos.slice(0, visibleTurnosCount).map((turno) => (
                    <div key={turno.id} className={`group border rounded-2xl p-5 transition shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${selectedTurnos.includes(turno.id) ? 'ring-2 ring-emerald-500 bg-emerald-950/20 border-emerald-500/50' : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:shadow-md'}`}>
                      
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
                        <div className="bg-slate-950 rounded-xl px-5 py-4 border border-emerald-900/30 flex flex-col items-center justify-center w-[160px] flex-shrink-0 shadow-inner shadow-emerald-900/10">
                          <span className="text-base font-bold text-emerald-500/80 leading-none mb-1.5">{formatDate(turno.fechaHora).split(', ')[0]}</span>
                          <span className="text-xl font-black text-emerald-400 leading-none">{formatDate(turno.fechaHora).split(', ')[1]}</span>
                        </div>
                        <div className="flex flex-col justify-center">
                          <div className="font-bold text-slate-200 text-xl flex items-center gap-2">
                            {turno.hora}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-slate-400 mt-1">
                            {turno.ciudad}
                          </div>
                        </div>
                      </div>

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
                              className="p-1 md:p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-700 bg-slate-950/40 border border-slate-850/60 rounded-lg transition flex items-center justify-center"
                              title="Editar nota"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Right: Status and Delete */}
                          <div className="md:w-1/4 flex justify-center md:justify-end items-center gap-2 mt-4 md:mt-0">
                            <div className="relative inline-flex items-center">
                              <select
                                value={turno.estado}
                                onChange={(e) => handleQuickStatusChange(turno.id, e.target.value as Turno['estado'])}
                                disabled={updatingStatusId === turno.id}
                                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border uppercase tracking-wider outline-none cursor-pointer hover:opacity-80 transition appearance-none pr-8 disabled:opacity-50 disabled:cursor-not-allowed ${getEstadoStyles(turno.estado)}`}
                              >
                                <option value="PENDIENTE" className="text-slate-800 bg-white">PENDIENTE</option>
                                <option value="CONFIRMADO" className="text-slate-800 bg-white">CONFIRMADO</option>
                                <option value="ATENDIDO" className="text-slate-800 bg-white">ATENDIDO</option>
                                <option value="AUSENTE" className="text-slate-800 bg-white">AUSENTE</option>
                              </select>
                              {updatingStatusId === turno.id ? (
                                <RefreshCw className="absolute right-2 h-3 w-3 pointer-events-none animate-spin text-slate-500" />
                              ) : (
                                <ChevronDown className="absolute right-2 h-3 w-3 pointer-events-none opacity-70" />
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteSingleTurno(turno.id)}
                              className="p-1 md:p-1.5 text-rose-450 hover:bg-slate-800 hover:text-white hover:border-slate-700 bg-slate-950/40 border border-slate-850/60 rounded-lg transition flex items-center justify-center"
                              title="Eliminar turno"
                            >
                              <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            </button>
                          </div>
                      
                    </div>
                  ))}
                  {(visibleTurnosCount < processedTurnos.length || visibleTurnosCount > 5) && (
                    <div className="pt-4 flex justify-center gap-3">
                      {visibleTurnosCount < processedTurnos.length && (
                        <button 
                          onClick={() => setVisibleTurnosCount(prev => prev + 5)}
                          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-bold rounded-xl transition border border-slate-700 shadow-sm"
                        >
                          Ver más ({Math.min(5, processedTurnos.length - visibleTurnosCount)})
                        </button>
                      )}
                      {visibleTurnosCount > 5 && (
                        <button 
                          onClick={() => setVisibleTurnosCount(5)}
                          className="px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white text-sm font-bold rounded-xl transition border border-slate-800 shadow-sm"
                        >
                          Ver menos
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Scroll Top & Refresh Buttons */}
      {showScrollTop && customConfirm === null && editingTurno === null && (
        <div className="fixed bottom-6 right-6 z-[80] flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <button
            onClick={() => {
              const scrollContainer = document.getElementById('main-scroll-container');
              if (scrollContainer) {
                scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="p-3 bg-emerald-600 border border-emerald-500 text-white hover:bg-emerald-500 rounded-full shadow-xl shadow-emerald-900/40 transition"
            title="Volver arriba"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Floating Action Bar for Bulk Select */}
      {selectedTurnos.length > 0 && editingTurno === null && customConfirm === null && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[90] bg-slate-900 border border-slate-700 shadow-2xl shadow-emerald-900/20 rounded-2xl flex flex-col w-[calc(100vw-2rem)] sm:w-max max-w-xl sm:max-w-none transition-all overflow-hidden">
          
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-slate-800 bg-slate-800/30">
            <h3 className="text-white font-black text-sm">
              <span className="text-emerald-400 text-lg mr-1">{selectedTurnos.length}</span> seleccionados
            </h3>
            <button onClick={() => setSelectedTurnos([])} className="text-slate-400 hover:text-white transition">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Action Body */}
          <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            
            <button onClick={deleteSelected} className="p-2 px-3 text-rose-450 hover:bg-slate-800 hover:text-white hover:border-slate-700 bg-slate-950/40 border border-slate-850/60 rounded-lg transition flex items-center justify-center shrink-0 gap-2 w-full sm:w-auto" title="Eliminar Seleccionados">
              <Trash2 className="h-4 w-4" />
              <span className="sm:hidden text-xs font-bold">Eliminar Seleccionados</span>
            </button>
            
            {/* Divider (Vertical on desktop) */}
            <div className="hidden sm:block h-8 w-px bg-slate-700 shrink-0"></div>
            
            {/* Status buttons (Grid on mobile, Row on desktop) */}
            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full sm:w-auto shrink-0">
              <button onClick={() => updateSelectedEstado('PENDIENTE')} className="px-3 py-1.5 bg-amber-950/50 text-amber-300 border border-amber-500/20 rounded-xl text-xs font-bold hover:bg-amber-900/40 hover:border-amber-500/40 transition whitespace-nowrap">
                Pendientes
              </button>
              <button onClick={() => updateSelectedEstado('ATENDIDO')} className="px-3 py-1.5 bg-emerald-950/50 text-emerald-300 border border-emerald-500/20 rounded-xl text-xs font-bold hover:bg-emerald-900/40 hover:border-emerald-500/40 transition whitespace-nowrap">
                Atendidos
              </button>
              <button onClick={() => updateSelectedEstado('CONFIRMADO')} className="px-3 py-1.5 bg-blue-950/50 text-blue-300 border border-blue-500/20 rounded-xl text-xs font-bold hover:bg-blue-900/40 hover:border-blue-500/40 transition whitespace-nowrap">
                Confirmados
              </button>
              <button onClick={() => updateSelectedEstado('AUSENTE')} className="px-3 py-1.5 bg-rose-950/50 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-bold hover:bg-rose-900/40 hover:border-rose-500/40 transition whitespace-nowrap">
                Ausentes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR NOTA */}
      {editingTurno !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-800">
            <div className="px-6 py-5 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
              <span className="font-extrabold text-slate-100 text-lg">Modificar Nota</span>
              <button 
                onClick={handleCancelEdit} 
                className="text-slate-400 p-1.5 hover:bg-slate-800 rounded-xl transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold block uppercase">Notas adicionales</label>
                <textarea
                  value={editNotas}
                  onChange={(e) => setEditNotas(e.target.value)}
                  placeholder="Escribe una nota..."
                  className="w-full pl-4 pr-4 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition min-h-[100px] resize-none"
                />
              </div>

              <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-800/60">
                <button
                  onClick={handleCancelEdit}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-400 hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSaveTurno(editingTurno)}
                  disabled={isSaving}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 ${
                    (turnos.find(t => t.id === editingTurno)?.notas || "") !== editNotas
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-100'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-emerald-300" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    "Guardar Cambios"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION DIALOG MODAL */}
      {customConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-800 p-6 space-y-5">
            <div className="flex items-center space-x-3">
              {customConfirm.type === 'danger' ? (
                <div className="p-2 bg-rose-950/60 rounded-xl text-rose-400 border border-rose-900/30">
                  <AlertCircle className="h-6 w-6" />
                </div>
              ) : (
                <div className="p-2 bg-amber-950/60 rounded-xl text-amber-400 border border-amber-900/30">
                  <AlertCircle className="h-6 w-6" />
                </div>
              )}
              <h3 className="font-black text-slate-100 text-base sm:text-lg">{customConfirm.title}</h3>
            </div>
            
            <p className="text-sm font-semibold text-slate-400 leading-relaxed break-words">
              {customConfirm.message}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => setCustomConfirm(null)} 
                className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-2xl transition"
              >
                {customConfirm.cancelText || 'Cancelar'}
              </button>
              <button 
                type="button"
                onClick={() => {
                  customConfirm.onConfirm();
                }} 
                className={`px-5 py-2.5 text-sm font-bold text-white rounded-2xl shadow-lg transition ${
                  customConfirm.type === 'danger' 
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/20' 
                    : 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/20'
                }`}
              >
                {customConfirm.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditPacienteModal && editingPaciente && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-800">
            <div className="px-6 py-5 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
              <span className="font-extrabold text-slate-100 text-lg">Editar Paciente</span>
              <button 
                onClick={() => {
                  setShowEditPacienteModal(false);
                  setEditingPaciente(null);
                }} 
                className="text-slate-400 p-1.5 hover:bg-slate-800 rounded-xl transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={async (e) => { setIsSubmitting(true); try { await handleUpdatePaciente(e); } finally { setIsSubmitting(false); } }} className="p-6 space-y-4" noValidate>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold flex items-center gap-1 uppercase">
                  Nombre Completo <span className="text-rose-500 font-black text-sm">*</span>
                  <span className="text-[10px] text-slate-400 font-medium normal-case">(Obligatorio)</span>
                </label>
                <input 
                  type="text"
                  value={editingPaciente.nombre}
                  onChange={(e) => {
                    setEditingPaciente({ ...editingPaciente, nombre: e.target.value });
                    if (formErrors.nombre) setFormErrors({ ...formErrors, nombre: undefined });
                  }}
                  className={`w-full pl-4 pr-10 py-3 border bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 transition ${formErrors.nombre ? 'border-rose-500 focus:ring-rose-500/10' : "border-slate-800 focus:ring-emerald-500/5 focus:bg-slate-900 focus:border-slate-700"}`}
                  placeholder="Ej: Juan Pérez"
                  autoFocus
                />
                {formErrors.nombre && <span className="text-rose-500 text-xs font-bold mt-1 block">{formErrors.nombre}</span>}
              </div>

              <div className="space-y-4 border-t border-slate-800 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-450 font-bold block uppercase">DNI</label>
                    <input 
                      type="text"
                      value={editingPaciente.dni || ''}
                      onChange={(e) => {
                        setEditingPaciente({ ...editingPaciente, dni: e.target.value.replace(/\D/g, '').slice(0, 8) });
                        if (formErrors.dni) setFormErrors({ ...formErrors, dni: undefined });
                      }}
                      className={`w-full pl-4 pr-10 py-3 border bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none transition ${formErrors.dni ? 'border-rose-500' : "border-slate-800 focus:border-slate-700"}`}
                      placeholder="Ej: 12345678"
                    />
                    {formErrors.dni && <span className="text-rose-500 text-xs font-bold mt-1 block">{formErrors.dni}</span>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-450 font-bold block uppercase">Teléfono</label>
                    <input 
                      type="text"
                      value={editingPaciente.telefono || ''}
                      onChange={(e) => {
                        setEditingPaciente({ ...editingPaciente, telefono: e.target.value.replace(/\D/g, '') });
                      }}
                      className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
                      placeholder="Ej: 5493442XXXXXX"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-450 font-bold block uppercase">Correo</label>
                    <input 
                      type="email"
                      value={editingPaciente.email || ''}
                      onChange={(e) => {
                        setEditingPaciente({ ...editingPaciente, email: e.target.value });
                        if (formErrors.email) setFormErrors({ ...formErrors, email: undefined });
                      }}
                      className={`w-full pl-4 pr-10 py-3 border bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none transition ${formErrors.email ? 'border-rose-500' : "border-slate-800 focus:border-slate-700"}`}
                      placeholder="Ej: juan@gmail.com"
                    />
                    {formErrors.email && <span className="text-rose-500 text-xs font-bold mt-1 block">{formErrors.email}</span>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-450 font-bold block uppercase">Fecha de Nacimiento</label>
                    <input 
                      type="date"
                    onClick={(e) => (e.target as any).showPicker?.()}
                      value={editingPaciente.fechaNacimiento || ''}
                      onChange={(e) => setEditingPaciente({ ...editingPaciente, fechaNacimiento: e.target.value })}
                      className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowEditPacienteModal(false);
                    setEditingPaciente(null);
                  }} 
                  className="px-5 py-3 text-sm font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-2xl transition"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-950/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? <><RefreshCw className="h-4 w-4 animate-spin" /> Guardando...</> : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {updatingStatusId !== null && (
        <LoadingSpinner message="Actualizando estado..." />
      )}
    </div>
  );
}
