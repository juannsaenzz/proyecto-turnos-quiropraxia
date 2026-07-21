"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import logo from '@/assets/2.png';
import { useRouter } from 'next/navigation';
import { useSidebar } from '../components/SidebarContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  Calendar, 
  Users, 
  FileText, 
  Menu, 
  X, 
  Search, 
  ChevronDown, 
  Plus, 
  Activity, 
  Clock, 
  MapPin,
  Check,
  Save,
  PlusCircle,
  SlidersHorizontal,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Pencil,
  Trash2,
  RefreshCw
} from 'lucide-react';

// Interfaces for our component state
interface Paciente {
  id: number;
  nombre: string;
  dni?: string;
  email?: string;
  telefono?: string;
  fechaNacimiento?: string;
}

interface Turno {
  id: number;
  pacienteId: number;
  pacienteNombre: string;
  fechaHora: string; // YYYY-MM-DD
  hora: string; // HH:MM
  ciudad: string;
  notas: string;
  estado: "PENDIENTE" | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE';
}

interface Historial {
  id: number;
  pacienteId: number;
  pacienteNombre: string;
  fecha: string; // YYYY-MM-DD
  notas: string;
}

const getCalendarCells = (dateStr: string) => {
  const [yearStr, monthStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed

  const firstDay = new Date(year, month, 1);
  // getDay(): 0 is Sunday, 1 is Monday...
  // We want Lunes (0) to Domingo (6).
  const startOffset = (firstDay.getDay() + 6) % 7;

  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells: { dateString: string; dayNumber: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

  // Previous month offset days
  const prevMonthDate = new Date(year, month, 0);
  const prevMonthDays = prevMonthDate.getDate();
  const prevMonthYear = prevMonthDate.getFullYear();
  const prevMonthMonth = prevMonthDate.getMonth() + 1;

  for (let i = startOffset - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const dateString = `${prevMonthYear}-${prevMonthMonth.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    cells.push({
      dateString,
      dayNumber: d,
      isCurrentMonth: false,
      isToday: false
    });
  }

  // Current month days
  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${(todayObj.getMonth() + 1).toString().padStart(2, '0')}-${todayObj.getDate().toString().padStart(2, '0')}`;

  for (let d = 1; d <= totalDays; d++) {
    const dateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    cells.push({
      dateString,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateString === todayStr
    });
  }

  // Next month offset days to fill 42 cells
  const nextMonthDate = new Date(year, month + 1, 1);
  const nextMonthYear = nextMonthDate.getFullYear();
  const nextMonthMonth = nextMonthDate.getMonth() + 1;
  const remaining = 42 - cells.length;

  for (let d = 1; d <= remaining; d++) {
    const dateString = `${nextMonthYear}-${nextMonthMonth.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    cells.push({
      dateString,
      dayNumber: d,
      isCurrentMonth: false,
      isToday: false
    });
  }

  return cells;
};

export default function AdminDashboard() {
  // Navigation & UI state
  const { setSidebarOpen } = useSidebar();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'turnos' | 'pacientes' | 'historial'>('pacientes');
  const [calendarViewMode, setCalendarViewMode] = useState<'day' | 'month'>('day');

  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [showGlobalSearchDropdown, setShowGlobalSearchDropdown] = useState(false);
  const globalSearchRef = useRef<HTMLDivElement>(null);

  // Click outside to close global search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (globalSearchRef.current && !globalSearchRef.current.contains(event.target as Node)) {
        setShowGlobalSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Date and Sucursal Logic
  const [currentDate, setCurrentDate] = useState<string>('2026-07-07'); // Default date (Tuesday)
  const [selectedCity, setSelectedCity] = useState<string>('Maciá');
  const [selectedShift, setSelectedShift] = useState<'Mañana' | 'Tarde' | 'Ninguno'>('Tarde');
  const [savedConfig, setSavedConfig] = useState<{ ciudad: string; bloque: "Mañana" | 'Tarde' | 'Ninguno' } | null>(null);
  
  // Modals state
  const [showNewTurnoModal, setShowNewTurnoModal] = useState(false);
  const [showNewPacienteModal, setShowNewPacienteModal] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [showNewHistorialModal, setShowNewHistorialModal] = useState(false);
  const [showEditPacienteModal, setShowEditPacienteModal] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({});
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
  const [showEditTurnoModal, setShowEditTurnoModal] = useState(false);
  const [editingTurno, setEditingTurno] = useState<Turno | null>(null);
  const [customConfirm, setCustomConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | 'warning' | 'info';
  } | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [visiblePacientesCount, setVisiblePacientesCount] = useState(10);

  // Sort state
  const [sortOption, setSortOption] = useState<'A-Z' | 'Z-A' | 'turnos-asc' | 'turnos-desc'>('A-Z');

  useEffect(() => {
    setVisiblePacientesCount(10);
  }, [searchQuery, sortOption]);
  
  // Feedback Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Clinical History workflow states
  const [selectedHistorialDate, setSelectedHistorialDate] = useState<string | null>(null);
  const [historialDrafts, setHistorialDrafts] = useState<{[key: string]: string}>({});
  const [editingNotePacienteId, setEditingNotePacienteId] = useState<number | null>(null);
  const [detailStatusFilter, setDetailStatusFilter] = useState<'TODOS' | 'PENDIENTE' | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE'>('TODOS');

  // Autocomplete search state for Pacientes inside Agendar Turno modal
  const [pacienteSearchQuery, setPacienteSearchQuery] = useState('');
  const [showPacienteDropdown, setShowPacienteDropdown] = useState(false);
  const [activePacienteIndex, setActivePacienteIndex] = useState(-1);

  // Reset autocomplete states when modals open
  useEffect(() => {
    if (showNewTurnoModal || showEditTurnoModal) {
      setPacienteSearchQuery('');
      setShowPacienteDropdown(false);
      setActivePacienteIndex(-1);
    }
  }, [showNewTurnoModal, showEditTurnoModal]);

  // Pre-populate patient search query when editing a turno
  useEffect(() => {
    if (editingTurno) {
      setPacienteSearchQuery(editingTurno.pacienteNombre);
    }
  }, [editingTurno]);

  // Trigger toast notification helper
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Rule system for automatic preselection
  const getDefaultsForDate = (dateStr: string, hourStr?: string) => {
    const dateParts = dateStr.split('-');
    const date = new Date(
      parseInt(dateParts[0], 10),
      parseInt(dateParts[1], 10) - 1,
      parseInt(dateParts[2], 10)
    );
    const day = date.getDay(); // 0 Sunday, 1 Monday, etc.

    switch (day) {
      case 1: // Lunes
      case 3: // Miércoles
      case 4: // Jueves
        return { ciudad: "Rosario del Tala", turno: "Tarde" as const };
      case 2: // Martes
        return { ciudad: "Maciá", turno: "Tarde" as const };
      case 5: // Viernes
        // Default Gualeguay (Mañana) if hour < 15:00, Galarza (Tarde) if hour >= 15:00
        if (hourStr) {
          const hr = parseInt(hourStr.split(':')[0], 10);
          if (hr < 15) {
            return { ciudad: "Gualeguay", turno: "Mañana" as const };
          } else {
            return { ciudad: "Galarza", turno: "Tarde" as const };
          }
        }
        return { ciudad: "Gualeguay", turno: "Mañana" as const };
      default: // Saturday / Sunday
        return { ciudad: "Cerrado", turno: "Ninguno" as const };
    }
  };

  const getTargetCityForAppointment = (dateStr: string, hourStr: string) => {
    if (dateStr === currentDate && savedConfig) {
      return savedConfig.ciudad;
    }
    const defaults = getDefaultsForDate(dateStr, hourStr);
    return defaults.ciudad;
  };

  // Trigger auto-selection and database lookup when date changes
  useEffect(() => {
    let isMounted = true;
    const fetchOverride = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/configuracion-dia/${currentDate}`);
        if (!response.ok) {
          throw new Error('Error al consultar configuración del día');
        }
        const data = await response.json();
        
        if (isMounted) {
          if (data && data.ciudad && data.bloque) {
            const mappedShift = data.bloque === 'MANANA' ? 'Mañana' : "Tarde";
            setSelectedCity(data.ciudad);
            setSelectedShift(mappedShift);
            setSavedConfig({ ciudad: data.ciudad, bloque: mappedShift });
          } else {
            const defaults = getDefaultsForDate(currentDate);
            setSelectedCity(defaults.ciudad);
            setSelectedShift(defaults.turno);
            setSavedConfig(null);
          }
        }
      } catch (error) {
        console.error('Error fetching day configuration:', error);
        if (isMounted) {
          const defaults = getDefaultsForDate(currentDate);
          setSelectedCity(defaults.ciudad);
          setSelectedShift(defaults.turno);
          setSavedConfig(null);
        }
      }
    };

    fetchOverride();
    return () => {
      isMounted = false;
    };
  }, [currentDate]);

  // Check if current configuration is modified compared to what's stored or default
  const isConfigModified = () => {
    if (savedConfig) {
      return selectedCity !== savedConfig.ciudad || selectedShift !== savedConfig.bloque;
    }
    const defaults = getDefaultsForDate(currentDate);
    return selectedCity !== defaults.ciudad || selectedShift !== defaults.turno;
  };

  const handleSaveConfig = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/configuracion-dia`, {
        method: "POST",
        headers: {
          'Content-Type': "application/json",
        },
        body: JSON.stringify({
          fecha: currentDate,
          ciudad: selectedCity,
          bloque: selectedShift === 'Mañana' ? 'MANANA' : "TARDE",
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar la configuración');
      }

      setSavedConfig({ ciudad: selectedCity, bloque: selectedShift });
      showToast('Agenda de hoy actualizada en la base de datos');
    } catch (error) {
      console.error('Error saving day configuration:', error);
      alert('No se pudo guardar la configuración de la agenda.');
    }
  };

  const handleSaveHistorialNote = async (pacienteId: number, fechaStr: string, notas: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/historial`, {
        method: "POST",
        headers: { 'Content-Type': "application/json" },
        body: JSON.stringify({
          pacienteId,
          fecha: fechaStr,
          notas
        })
      });
      if (!response.ok) {
        throw new Error('Error al guardar la nota clínica');
      }
      // Refresh clinical history from database
      const resHistorial = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/historial`);
      if (resHistorial.ok) {
        const data = await resHistorial.json();
        setHistoriales(data);
      }
      
      // Clear draft entry
      setHistorialDrafts(prev => {
        const next = { ...prev };
        delete next[`${pacienteId}-${fechaStr}`];
        return next;
      });

      showToast('Evolución guardada con éxito');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'No se pudo guardar la evolución clínica.');
    }
  };

  // Date Navigation offsets
  const changeDateOffset = (offset: number) => {
    const dateParts = currentDate.split('-');
    const date = new Date(
      parseInt(dateParts[0], 10),
      parseInt(dateParts[1], 10) - 1,
      parseInt(dateParts[2], 10)
    );
    date.setDate(date.getDate() + offset);
    
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setCurrentDate(`${yyyy}-${mm}-${dd}`);
  };

  // Format date helper for header display (e.g. "Lunes, 6 de Julio, 2026")
  const getFormattedDateLabel = (dateStr: string) => {
    const dateParts = dateStr.split('-');
    const date = new Date(
      parseInt(dateParts[0], 10),
      parseInt(dateParts[1], 10) - 1,
      parseInt(dateParts[2], 10)
    );
    return date.toLocaleDateString('es-ES', { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  // Data lists from database
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [historiales, setHistoriales] = useState<Historial[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data from the database
  useEffect(() => {
    let isMounted = true;
    
    const loadDbData = async () => {
      try {
        // 1. Fetch Pacientes
        const resPacientes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/pacientes`);
        if (!resPacientes.ok) throw new Error('Error al cargar pacientes');
        const dataPacientes = await resPacientes.json();
        
        if (isMounted) {
          setPacientes(dataPacientes);
        }

        // 2. Fetch Turnos
        const resTurnos = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/turnos`);
        if (!resTurnos.ok) throw new Error('Error al cargar turnos');
        const dataTurnos = await resTurnos.json();
        const mappedTurnos = dataTurnos.map((t: any) => {
          const datePart = t.fechaHora.split('T')[0];
          const timePart = t.fechaHora.split('T')[1].substring(0, 5);
          return {
            id: t.id,
            pacienteId: t.pacienteId,
            pacienteNombre: t.pacienteNombre,
            fechaHora: datePart,
            hora: timePart,
            ciudad: t.ciudad,
            notas: t.notas,
            estado: t.estado,
          };
        });
        
        if (isMounted) {
          setTurnos(mappedTurnos);
        }

        // 3. Fetch Historiales
        const resHistorial = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/historial`);
        if (!resHistorial.ok) throw new Error('Error al cargar historiales');
        const dataHistorial = await resHistorial.json();
        
        if (isMounted) {
          setHistoriales(dataHistorial);
        }
      } catch (error) {
        console.error('Error fetching database records:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDbData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Form states
  const [newTurno, setNewTurno] = useState({
    pacienteId: "",
    fechaHora: "2026-07-07",
    hora: "15:00",
    ciudad: "Maciá",
    notas: "",
    estado: "PENDIENTE" as 'PENDIENTE' | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE'
  });

  const [newPaciente, setNewPaciente] = useState({ 
    nombre: "", 
    dni: "", 
    email: "", 
    telefono: "", 
    fechaNacimiento: "" 
  });
  const [newHistorial, setNewHistorial] = useState({ pacienteId: "", fecha: "2026-07-07", notas: "" });

  // 15-Minute Grid generation based on shift, dynamically expanding for out-of-range appointments
  const get15MinTimeSlots = () => {
    const slots: string[] = [];
    if (selectedShift === 'Mañana') {
      // 07:00 to 15:00 (last slot starts at 14:45)
      for (let hour = 7; hour < 15; hour++) {
        for (let min = 0; min < 60; min += 15) {
          const hh = String(hour).padStart(2, '0');
          const mm = String(min).padStart(2, '0');
          slots.push(`${hh}:${mm}`);
        }
      }
    } else if (selectedShift === 'Tarde') {
      // 15:00 to 20:30 (last slot starts at 20:15)
      for (let hour = 15; hour < 21; hour++) {
        for (let min = 0; min < 60; min += 15) {
          if (hour === 20 && min > 15) break; // Stop at 20:15 (ends 20:30)
          const hh = String(hour).padStart(2, '0');
          const mm = String(min).padStart(2, '0');
          slots.push(`${hh}:${mm}`);
        }
      }
    }

    // Add any scheduled appointments for this day & city that are outside the range
    const activeAppts = turnos.filter(t => t.fechaHora === currentDate && t.ciudad === selectedCity);
    activeAppts.forEach(appt => {
      if (!slots.includes(appt.hora)) {
        slots.push(appt.hora);
      }
    });

    // Sort time slots chronologically
    slots.sort((a, b) => a.localeCompare(b));

    return slots;
  };

  const getModalTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 7; hour <= 20; hour++) {
      for (let min = 0; min < 60; min += 15) {
        if (hour === 20 && min > 30) break;
        const hh = String(hour).padStart(2, '0');
        const mm = String(min).padStart(2, '0');
        slots.push(`${hh}:${mm}`);
      }
    }
    return slots;
  };

  const timeSlots = get15MinTimeSlots();
  const ciudadesDisponibles = ['Rosario del Tala', 'Maciá', 'Gualeguay', 'Galarza', 'Cerrado'];

  // Handlers
  const executeCreateTurno = async (p: Paciente, isoDateTime: string, timeLabel: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/turnos`, {
        method: "POST",
        headers: {
          'Content-Type': "application/json",
        },
        body: JSON.stringify({
          pacienteId: p.id,
          fechaHora: isoDateTime,
          ciudad: newTurno.ciudad,
          notas: newTurno.notas,
          estado: newTurno.estado
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Error al agendar turno');
      }

      const creado = await response.json();
      
      const nuevoTurnoItem: Turno = {
        id: creado.id,
        pacienteId: creado.pacienteId,
        pacienteNombre: creado.pacienteNombre,
        fechaHora: creado.fechaHora.split('T')[0],
        hora: creado.fechaHora.split('T')[1].substring(0, 5),
        ciudad: creado.ciudad,
        notas: creado.notas,
        estado: creado.estado
      };

      setTurnos(prev => [...prev, nuevoTurnoItem]);
      setShowNewTurnoModal(false);
      showToast(`Turno de las ${timeLabel} agendado para ${p.nombre}`);

      // Reset
      setNewTurno({
        pacienteId: "",
        fechaHora: currentDate,
        hora: "15:00",
        ciudad: selectedCity,
        notas: "",
        estado: "PENDIENTE"
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'No se pudo crear el turno.');
    }
  };

  const handleCreateTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTurno.pacienteId) { alert("Por favor, selecciona un paciente."); return; }
    
    const p = pacientes.find(pat => pat.id === parseInt(newTurno.pacienteId));
    if (!p) return;

    // Check if there is already active appointments in the same date, time, and city
    const conflictos = turnos.filter(t => 
      t.fechaHora === newTurno.fechaHora && 
      t.hora === newTurno.hora && 
      t.ciudad === newTurno.ciudad
    );

    const isoDateTime = `${newTurno.fechaHora}T${newTurno.hora}:00.000Z`;

    if (conflictos.length > 0) {
      const parts = newTurno.fechaHora.split('-');
      const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
      const conflictNames = conflictos.map(c => c.pacienteNombre).join(', ');
      
      setCustomConfirm({
        title: "Conflicto de Horario",
        message: `El día ${formattedDate} a las ${newTurno.hora} hs ya hay turnos programados para: ${conflictNames}. ¿Estás seguro de agendar este turno para ${p.nombre}?`,
        confirmText: "Sí, agendar",
        cancelText: "Cancelar",
        onConfirm: () => executeCreateTurno(p, isoDateTime, newTurno.hora)
      });
      return;
    }

    await executeCreateTurno(p, isoDateTime, newTurno.hora);
  };

  const executeUpdateTurno = async (updated: Turno) => {
    const isoDateTime = `${updated.fechaHora}T${updated.hora}:00.000Z`;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/turnos/${updated.id}`, {
        method: "PUT",
        headers: {
          'Content-Type': "application/json",
        },
        body: JSON.stringify({
          pacienteId: updated.pacienteId,
          fechaHora: isoDateTime,
          ciudad: updated.ciudad,
          notas: updated.notas,
          estado: updated.estado
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Error al actualizar el turno');
      }

      const creado = await response.json();
      
      const nuevoTurnoItem: Turno = {
        id: creado.id,
        pacienteId: creado.pacienteId,
        pacienteNombre: creado.pacienteNombre,
        fechaHora: creado.fechaHora.split('T')[0],
        hora: creado.fechaHora.split('T')[1].substring(0, 5),
        ciudad: creado.ciudad,
        notas: creado.notas,
        estado: creado.estado
      };

      setTurnos(prev => prev.map(t => t.id === nuevoTurnoItem.id ? nuevoTurnoItem : t));
      setShowEditTurnoModal(false);
      setEditingTurno(null);
      showToast(`Turno actualizado con éxito`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'No se pudo actualizar el turno.');
    }
  };

  const handleUpdateTurnoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTurno || !editingTurno.pacienteId) { alert("Por favor, selecciona un paciente."); return; }
    
    const p = pacientes.find(pat => pat.id === parseInt(editingTurno.pacienteId.toString()));
    if (!p) return;

    // Check conflicts (exclude current appointment)
    const conflictos = turnos.filter(t => 
      t.id !== editingTurno.id &&
      t.fechaHora === editingTurno.fechaHora && 
      t.hora === editingTurno.hora && 
      t.ciudad === editingTurno.ciudad
    );

    const updatedWithResolvedName = {
      ...editingTurno,
      pacienteNombre: p.nombre
    };

    if (conflictos.length > 0) {
      const parts = editingTurno.fechaHora.split('-');
      const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
      const conflictNames = conflictos.map(c => c.pacienteNombre).join(', ');
      
      setCustomConfirm({
        title: "Conflicto de Horario",
        message: `El día ${formattedDate} a las ${editingTurno.hora} hs ya hay turnos programados para: ${conflictNames}. ¿Estás seguro de mover el turno para ${p.nombre} a este horario?`,
        confirmText: "Sí, guardar",
        cancelText: "Cancelar",
        onConfirm: () => executeUpdateTurno(updatedWithResolvedName)
      });
      return;
    }

    await executeUpdateTurno(updatedWithResolvedName);
  };

  const handleQuickRegisterPacienteWithName = async (name: string) => {
    if (!name || !name.trim()) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/pacientes`, {
        method: "POST",
        headers: {
          'Content-Type': "application/json",
        },
        body: JSON.stringify({
          nombre: name.trim()
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Error al registrar paciente');
      }

      const creado = await response.json();
      setPacientes(prev => [...prev, creado]);
      setNewTurno(prev => ({ ...prev, pacienteId: creado.id.toString() }));
      setPacienteSearchQuery(creado.nombre);
      setShowPacienteDropdown(false);
      showToast(`Paciente ${creado.nombre} registrado y seleccionado`);
    } catch (error: any) {
      console.error('Error creating patient quickly:', error);
      alert(error.message || 'No se pudo registrar el paciente.');
    }
  };

  const handleQuickRegisterPacienteWithNameFromEdit = async (name: string) => {
    if (!name || !name.trim()) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/pacientes`, {
        method: "POST",
        headers: {
          'Content-Type': "application/json",
        },
        body: JSON.stringify({
          nombre: name.trim()
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Error al registrar paciente');
      }

      const creado = await response.json();
      setPacientes(prev => [...prev, creado]);
      if (editingTurno) {
        setEditingTurno(prev => prev ? ({ ...prev, pacienteId: creado.id }) : null);
      }
      setPacienteSearchQuery(creado.nombre);
      setShowPacienteDropdown(false);
      showToast(`Paciente ${creado.nombre} registrado y seleccionado`);
    } catch (error: any) {
      console.error('Error creating patient quickly:', error);
      alert(error.message || 'No se pudo registrar el paciente.');
    }
  };

  const handleCreatePaciente = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!newPaciente.nombre || !newPaciente.nombre.trim()) {
      errors.nombre = "El nombre completo es obligatorio.";
    }

    const dniTrimmed = newPaciente.dni ? newPaciente.dni.trim() : "";
    if (dniTrimmed) {
      if (!/^\d{7,8}$/.test(dniTrimmed)) {
        errors.dni = "El DNI debe tener 7 u 8 números.";
      } else if (pacientes.some(p => p.dni === dniTrimmed)) {
        errors.dni = "Ya existe un paciente con este DNI.";
      }
    }

    if (newPaciente.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newPaciente.email.trim())) {
      errors.email = "Correo electrónico inválido.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/pacientes`, {
        method: "POST",
        headers: {
          'Content-Type': "application/json",
        },
        body: JSON.stringify({
          nombre: newPaciente.nombre.trim(),
          dni: dniTrimmed || undefined,
          email: newPaciente.email?.trim() || undefined,
          telefono: newPaciente.telefono?.trim() || undefined,
          fechaNacimiento: newPaciente.fechaNacimiento?.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Error al registrar paciente');
      }

      const creado = await response.json();

      setPacientes(prev => [...prev, creado]);
      setShowNewPacienteModal(false);
      showToast(`Paciente ${creado.nombre} registrado con éxito`);
      
      if (showNewTurnoModal) {
        setNewTurno(prev => ({ ...prev, pacienteId: creado.id.toString() }));
        setPacienteSearchQuery(creado.nombre);
        setShowPacienteDropdown(false);
      } else if (showEditTurnoModal) {
        setEditingTurno(prev => prev ? ({ ...prev, pacienteId: creado.id }) : null);
        setPacienteSearchQuery(creado.nombre);
        setShowPacienteDropdown(false);
      }
      
      setNewPaciente({
        nombre: "",
        dni: "",
        email: "",
        telefono: "",
        fechaNacimiento: ""
      });
    } catch (error: any) {
      console.error('Error creating paciente:', error);
      alert(error.message || 'No se pudo registrar el paciente.');
    }
  };

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
      showToast(`Paciente ${actualizado.nombre} actualizado con éxito`);
    } catch (error: any) {
      console.error('Error updating patient:', error);
      alert(error.message || 'No se pudo actualizar el paciente.');
    }
  };

  const handleDeletePaciente = (id: number, nombre: string) => {
    setCustomConfirm({
      title: "Eliminar Paciente",
      message: `¿Estás seguro de que deseas eliminar al paciente "${nombre}"? Esta acción borrará de forma permanente todos sus turnos y su historial clínico.`,
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      type: "danger",
      onConfirm: async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/pacientes/${id}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Error al eliminar el paciente');
          }

          setPacientes(prev => prev.filter(p => p.id !== id));
          setTurnos(prev => prev.filter(t => t.pacienteId !== id));
          setHistoriales(prev => prev.filter(h => h.pacienteId !== id));

          showToast(`Paciente "${nombre}" eliminado con éxito`);
        } catch (error: any) {
          console.error('Error deleting patient:', error);
          alert(error.message || 'No se pudo eliminar el paciente.');
        }
      }
    });
  };

  const handleDeleteTurno = (id: number) => {
    const appt = turnos.find(t => t.id === id);
    const details = appt ? ` de las ${appt.hora} hs para ${appt.pacienteNombre}` : "";
    setCustomConfirm({
      title: "Eliminar Turno",
      message: `¿Estás seguro de que deseas eliminar el turno${details}? Esta acción no se puede deshacer.`,
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      type: "danger",
      onConfirm: async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/turnos/${id}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Error al eliminar el turno');
          }

          setTurnos(prev => prev.filter(t => t.id !== id));
          showToast('Turno eliminado con éxito');
        } catch (error: any) {
          console.error('Error deleting appointment:', error);
          alert(error.message || 'No se pudo eliminar el turno.');
        }
      }
    });
  };

  const handleCreateHistorial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHistorial.pacienteId || !newHistorial.notas) {
      alert("Paciente y Notas son requeridos");
      return;
    }

    const p = pacientes.find(pat => pat.id === parseInt(newHistorial.pacienteId));
    if (!p) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/historial`, {
        method: "POST",
        headers: {
          'Content-Type': "application/json",
        },
        body: JSON.stringify({
          pacienteId: p.id,
          fecha: newHistorial.fecha,
          notas: newHistorial.notas
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Error al crear ficha clínica');
      }

      const creado = await response.json();

      const nuevoHistorialItem: Historial = {
        id: creado.id,
        pacienteId: creado.pacienteId,
        pacienteNombre: creado.pacienteNombre || p.nombre,
        fecha: creado.fecha,
        notas: creado.notas
      };

      setHistoriales(prev => [nuevoHistorialItem, ...prev]);
      setShowNewHistorialModal(false);
      showToast(`Nueva ficha clínica agregada para ${p.nombre}`);

      setNewHistorial({ pacienteId: "", fecha: currentDate, notas: "" });
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'No se pudo crear la ficha clínica.');
    }
  };

  const updateTurnoEstado = async (id: number, nuevoEstado: "PENDIENTE" | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE') => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/turnos/${id}`, {
        method: "PUT",
        headers: {
          'Content-Type': "application/json",
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar estado del turno');
      }

      const actualizado = await response.json();

      setTurnos(prevTurnos => 
        prevTurnos.map(t => t.id === id ? { ...t, estado: actualizado.estado } : t)
      );
      showToast(`Turno cambiado a estado ${nuevoEstado}`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'No se pudo actualizar el estado del turno.');
    }
  };

  const getEstadoStyles = (estado: "PENDIENTE" | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE') => {
    switch (estado) {
      case 'PENDIENTE':
        return {
          card: "bg-amber-950/25 border-amber-500/25 text-amber-200 shadow-amber-950/10 hover:border-amber-500/40",
          badge: "bg-amber-950/50 border-amber-500/20 text-amber-300"
        };
      case 'CONFIRMADO':
        return {
          card: "bg-blue-950/25 border-blue-500/25 text-blue-200 shadow-blue-950/10 hover:border-blue-500/40",
          badge: "bg-blue-950/50 border-blue-500/20 text-blue-300"
        };
      case 'ATENDIDO':
        return {
          card: "bg-emerald-950/25 border-emerald-500/25 text-emerald-200 shadow-emerald-950/10 hover:border-emerald-500/40",
          badge: "bg-emerald-950/50 border-emerald-500/20 text-emerald-300"
        };
      case 'AUSENTE':
        return {
          card: "bg-rose-950/25 border-rose-500/25 text-rose-200 shadow-rose-950/10 hover:border-rose-500/40",
          badge: "bg-rose-950/50 border-rose-500/20 text-rose-300"
        };
      default:
        return {
          card: "bg-slate-900 border-slate-800 text-slate-300",
          badge: "bg-slate-950 border-slate-800 text-slate-400"
        };
    }
  };

  // Filter calculations
  const calendarTurnos = turnos.filter(t => 
    t.fechaHora === currentDate && 
    t.ciudad === selectedCity &&
    t.pacienteNombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPacientes = pacientes.filter(p => 
    p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.dni && p.dni.includes(searchQuery))
  );

  const sortedPacientes = [...filteredPacientes].sort((a, b) => {
    if (sortOption === 'A-Z') return a.nombre.localeCompare(b.nombre);
    if (sortOption === 'Z-A') return b.nombre.localeCompare(a.nombre);
    if (sortOption === 'turnos-asc' || sortOption === 'turnos-desc') {
      const turnosA = turnos.filter(t => t.pacienteId === a.id).length;
      const turnosB = turnos.filter(t => t.pacienteId === b.id).length;
      return sortOption === 'turnos-asc' ? turnosA - turnosB : turnosB - turnosA;
    }
    return 0;
  });

  const filteredPatientsForAutocomplete = pacientes.filter(p => {
    const q = pacienteSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return p.nombre.toLowerCase().includes(q) || (p.dni && p.dni.includes(q));
  }).slice(0, 6);

  const filteredHistoriales = historiales.filter(h => 
    h.pacienteNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.notas.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const menuItems = [
    { id: "turnos", label: "Calendario de Turnos", icon: Calendar },
    { id: "pacientes", label: "Pacientes", icon: Users },
    { id: "historial", label: "Historial Clínico", icon: FileText },
  ] as const;

  return (
    <>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] bg-slate-900/95 backdrop-blur-xl px-8 py-6 rounded-3xl shadow-2xl border border-slate-700/50 flex flex-col items-center justify-center space-y-4 min-w-[280px] max-w-[90vw] text-center">
          <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 shadow-inner">
            <Check className="h-7 w-7 text-emerald-400 stroke-[3]" />
          </div>
          <span className="text-base font-bold text-slate-100 leading-snug">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="h-auto sm:h-20 bg-slate-900 border-b border-slate-800/80 sticky top-0 z-30 px-6 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center py-4 sm:py-0 gap-4 sm:gap-0">
          <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start space-x-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="text-slate-400 hover:text-slate-200 p-2 hover:bg-slate-800 rounded-xl ml-2 sm:ml-0"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12">
                <Image src={logo} alt="Logo" width={48} height={48} className="object-contain w-full h-full mix-blend-screen opacity-90 hover:opacity-100 transition-opacity" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-100 tracking-tight capitalize">
                Pacientes
              </h1>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="p-2.5 bg-slate-900 border border-slate-700 text-emerald-400 hover:text-white hover:bg-emerald-600 rounded-full shadow-lg transition group"
              title="Actualizar datos"
            >
              <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>

          {/* Global Paciente Search */}
          <div className="relative sm:absolute sm:left-1/2 sm:-translate-x-1/2 w-full sm:w-64 md:w-96" ref={globalSearchRef}>
            <div className="relative w-full">
              <input
                type="text"
                className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 rounded-2xl text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-slate-900 focus:border-emerald-500 transition"
                placeholder="Buscar paciente por nombre o DNI..."
                value={globalSearchQuery}
                onChange={(e) => {
                  setGlobalSearchQuery(e.target.value);
                  setSearchQuery(e.target.value); // Keep table filtered as well
                  setShowGlobalSearchDropdown(true);
                }}
                onFocus={() => setShowGlobalSearchDropdown(true)}
              />
              {globalSearchQuery.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setGlobalSearchQuery('');
                    setSearchQuery('');
                    setShowGlobalSearchDropdown(false);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 rounded-full hover:bg-slate-800 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              )}
            </div>
            {showGlobalSearchDropdown && globalSearchQuery.length > 0 && (
              <div className="absolute mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-lg max-h-60 overflow-y-auto z-50">
                {(() => {
                  const results = pacientes.filter(p => 
                    p.nombre.toLowerCase().includes(globalSearchQuery.toLowerCase()) || 
                    (p.dni && p.dni.includes(globalSearchQuery))
                  );
                  
                  if (results.length === 0) {
                    return <div className="p-3 text-sm text-slate-400 text-center">No se encontraron pacientes.</div>;
                  }
                  
                  return results.map(p => (
                    <div
                      key={p.id}
                      className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0 transition-colors"
                      onClick={() => {
                        setShowGlobalSearchDropdown(false);
                        setGlobalSearchQuery('');
                        setSearchQuery('');
                        router.push(`/admin/pacientes/${p.id}`);
                      }}
                    >
                      <div className="font-bold text-slate-200">{p.nombre}</div>
                      {/* DNI removed */}
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
      </header>
      
      <main className="flex-grow p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-850 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <span className="font-extrabold text-slate-100 text-sm sm:text-base">Pacientes Registrados</span>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative inline-flex items-center w-full sm:w-auto">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  className="w-full sm:w-auto appearance-none bg-slate-950 border border-slate-800 text-slate-300 text-sm font-semibold rounded-xl px-4 py-2 pr-10 focus:outline-none focus:border-emerald-500 transition cursor-pointer hover:bg-slate-900"
                >
                  <option value="A-Z">Orden alfabético (A-Z)</option>
                  <option value="Z-A">Orden alfabético (Z-A)</option>
                  <option value="turnos-desc">Mayor cantidad de turnos</option>
                  <option value="turnos-asc">Menor cantidad de turnos</option>
                </select>
                <ChevronDown className="absolute right-3 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
              <button 
                onClick={() => setShowNewPacienteModal(true)}
                className="w-full sm:w-auto px-5 py-2 font-bold text-sm text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition"
              >
                <UserPlus className="h-4 w-4" />
                <span>Registrar Paciente</span>
              </button>
            </div>
          </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-950/60 border-b border-slate-800 text-[10px] font-black uppercase text-slate-550 tracking-wider">
                      <th className="px-6 py-4">Paciente</th>
                      <th className="px-6 py-4 hidden md:table-cell">Teléfono</th>
                      <th className="px-6 py-4 hidden md:table-cell">DNI</th>
                      <th className="px-6 py-4 hidden md:table-cell">Email</th>
                      <th className="px-6 py-4 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-sm font-semibold text-slate-300">
                    {sortedPacientes.slice(0, visiblePacientesCount).map(p => (
                      <tr key={p.id} className="hover:bg-slate-850/40 transition">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => router.push(`/admin/pacientes/${p.id}`)}
                            className="font-extrabold text-white text-base capitalize tracking-tight max-w-[120px] sm:max-w-[180px] md:max-w-[250px] lg:max-w-[300px] truncate hover:text-emerald-400 transition-colors text-left"
                            title={`Ver historial de ${p.nombre}`}
                          >
                            {p.nombre}
                          </button>
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-400 whitespace-nowrap hidden md:table-cell">{p.telefono || '-'}</td>
                        <td className="px-6 py-4 text-slate-400 hidden md:table-cell">{p.dni || '-'}</td>
                        <td className="px-6 py-4 text-slate-400 font-medium max-w-[100px] sm:max-w-[150px] md:max-w-[200px] truncate hidden md:table-cell" title={p.email || ''}>{p.email || '-'}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">

                            <button 
                              onClick={() => {
                                setEditingPaciente(p);
                                setShowEditPacienteModal(true);
                              }}
                              className="p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-700 bg-slate-950/40 border border-slate-850/60 rounded-xl transition flex items-center justify-center"
                              title="Editar Paciente"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeletePaciente(p.id, p.nombre)}
                              className="p-1.5 text-rose-450 hover:bg-slate-800 hover:text-white hover:border-slate-700 bg-slate-950/40 border border-slate-850/60 rounded-xl transition flex items-center justify-center"
                              title="Eliminar Paciente"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredPacientes.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No se encontraron pacientes.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {(visiblePacientesCount < sortedPacientes.length || visiblePacientesCount > 10) && (
                <div className="p-4 border-t border-slate-800 flex justify-center gap-3 bg-slate-900/50">
                  {visiblePacientesCount < sortedPacientes.length && (
                    <button 
                      onClick={() => setVisiblePacientesCount(prev => prev + 10)}
                      className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-bold rounded-xl transition border border-slate-700 shadow-sm"
                    >
                      Ver más ({Math.min(10, sortedPacientes.length - visiblePacientesCount)})
                    </button>
                  )}
                  {visiblePacientesCount > 10 && (
                    <button 
                      onClick={() => setVisiblePacientesCount(10)}
                      className="px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white text-sm font-bold rounded-xl transition border border-slate-800 shadow-sm"
                    >
                      Ver menos
                    </button>
                  )}
                </div>
              )}
            </div>

          {/* TAB 3: HISTORIAL CLINICO */}
      {showNewTurnoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-800">
            <div className="px-6 py-5 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
              <span className="font-extrabold text-slate-100 text-lg">Agendar Turno</span>
              <button onClick={() => setShowNewTurnoModal(false)} className="text-slate-400 p-1.5 hover:bg-slate-800 rounded-xl transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={async (e) => { setIsSubmitting(true); try { await handleCreateTurno(e); } finally { setIsSubmitting(false); } }} className="p-6 space-y-4">
              <div className="space-y-1.5 relative">
                {showPacienteDropdown && (
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setShowPacienteDropdown(false)} 
                  />
                )}
                <label className="text-xs text-slate-500 font-bold block uppercase">Paciente</label>
                <div className="flex gap-2 relative z-50">
                  <div className="relative flex-1">
                    <input 
                      type="text"
                      placeholder="Buscar por nombre o DNI..."
                      value={pacienteSearchQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPacienteSearchQuery(val);
                        setShowPacienteDropdown(val.trim() !== '');
                        setActivePacienteIndex(-1);
                        
                        if (newTurno.pacienteId) {
                          setNewTurno({ ...newTurno, pacienteId: "" });
                        }
                      }}
                      onFocus={() => setShowPacienteDropdown(pacienteSearchQuery.trim() !== '')}
                      onKeyDown={(e) => {
                        if (!showPacienteDropdown) return;
                        
                        const hasInlineOption = pacienteSearchQuery.trim() !== '';
                        const itemsLength = filteredPatientsForAutocomplete.length + (hasInlineOption ? 1 : 0);
                        
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setActivePacienteIndex(prev => (prev + 1) % itemsLength);
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setActivePacienteIndex(prev => (prev - 1 + itemsLength) % itemsLength);
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          if (activePacienteIndex >= 0 && activePacienteIndex < filteredPatientsForAutocomplete.length) {
                            const p = filteredPatientsForAutocomplete[activePacienteIndex];
                            setNewTurno({ ...newTurno, pacienteId: p.id.toString() });
                            setPacienteSearchQuery(p.nombre);
                            setShowPacienteDropdown(false);
                          } else if (activePacienteIndex === filteredPatientsForAutocomplete.length && hasInlineOption) {
                            handleQuickRegisterPacienteWithName(pacienteSearchQuery);
                          } else if (filteredPatientsForAutocomplete.length > 0) {
                            const p = filteredPatientsForAutocomplete[0];
                            setNewTurno({ ...newTurno, pacienteId: p.id.toString() });
                            setPacienteSearchQuery(p.nombre);
                            setShowPacienteDropdown(false);
                          }
                        } else if (e.key === 'Escape') {
                          setShowPacienteDropdown(false);
                        }
                      }}
                      className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 rounded-2xl text-sm font-semibold text-white focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-slate-900 focus:border-slate-700 transition"
                      required
                    />
                    
                    {newTurno.pacienteId ? (
                      <button
                        type="button"
                        onClick={() => {
                          setNewTurno({ ...newTurno, pacienteId: "" });
                          setPacienteSearchQuery('');
                        }}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 rounded-full hover:bg-slate-800 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : (
                      <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowNewPacienteModal(true)}
                    className="px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl flex items-center justify-center transition border border-slate-700"
                    title="Registrar nuevo paciente completo"
                  >
                    <UserPlus className="h-4.5 w-4.5" />
                  </button>
                </div>

                {showPacienteDropdown && (
                  <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-slate-950 border border-slate-850 rounded-2xl shadow-2xl py-1.5 text-sm">
                    {filteredPatientsForAutocomplete.map((p, idx) => {
                      const isSelected = newTurno.pacienteId === p.id.toString();
                      const isActive = idx === activePacienteIndex;
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setNewTurno({ ...newTurno, pacienteId: p.id.toString() });
                            setPacienteSearchQuery(p.nombre);
                            setShowPacienteDropdown(false);
                          }}
                          onMouseEnter={() => setActivePacienteIndex(idx)}
                          className={`px-4 py-2.5 cursor-pointer font-semibold flex items-center justify-between transition ${
                            isSelected ? 'bg-emerald-600 text-white' : isActive ? 'bg-slate-800 text-slate-200' : "text-slate-300 hover:bg-slate-800/60"
                          }`}
                        >
                          <div className="flex flex-col">
                            <span>{p.nombre}</span>
                            <span className={`text-xs ${isSelected ? 'text-emerald-200' : "text-slate-500"} font-normal`}>
                              {p.dni ? `DNI: ${p.dni}` : "Sin DNI"} {p.telefono ? `· Tél: ${p.telefono}` : ""}
                            </span>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-white" />}
                        </div>
                      );
                    })}

                    {pacienteSearchQuery.trim() !== '' && (
                      <div
                        onClick={() => handleQuickRegisterPacienteWithName(pacienteSearchQuery)}
                        onMouseEnter={() => setActivePacienteIndex(filteredPatientsForAutocomplete.length)}
                        className={`px-4 py-3 border-t border-slate-800 cursor-pointer font-bold text-emerald-400 hover:bg-emerald-950/20 flex items-center gap-2 transition ${
                          activePacienteIndex === filteredPatientsForAutocomplete.length ? 'bg-slate-800/60' : ""
                        }`}
                      >
                        <PlusCircle className="h-4.5 w-4.5 text-emerald-400" />
                        <span>Registrar y seleccionar "{pacienteSearchQuery}"</span>
                      </div>
                    )}

                    {filteredPatientsForAutocomplete.length === 0 && pacienteSearchQuery.trim() === '' && (
                      <div className="px-4 py-3 text-slate-500 font-medium text-center">
                        Escribe para buscar...
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-bold block uppercase">Fecha</label>
                  <input 
                    type="date"
                    onClick={(e) => (e.target as any).showPicker?.()}
                    value={newTurno.fechaHora}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      const targetCity = getTargetCityForAppointment(newDate, newTurno.hora);
                      setNewTurno({ 
                        ...newTurno, 
                        fechaHora: newDate,
                        ciudad: targetCity 
                      });
                    }}
                    className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-bold block uppercase">Hora</label>
                  <select 
                    value={newTurno.hora}
                    onChange={(e) => {
                      const newHour = e.target.value;
                      const targetCity = getTargetCityForAppointment(newTurno.fechaHora, newHour);
                      setNewTurno({ 
                        ...newTurno, 
                        hora: newHour,
                        ciudad: targetCity
                      });
                    }}
                    className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-slate-900 focus:border-slate-700 transition"
                    required
                  >
                    {getModalTimeSlots().map(time => (
                      <option key={time} value={time} className="bg-slate-900 text-slate-200">{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-bold block uppercase">Ciudad / Sucursal</label>
                  <select 
                    value={newTurno.ciudad}
                    className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950/80 text-slate-500 rounded-2xl text-sm font-semibold focus:outline-none cursor-not-allowed opacity-60"
                    disabled
                  >
                    {ciudadesDisponibles.map(c => (
                      <option key={c} value={c} className="bg-slate-900 text-slate-200">{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-bold block uppercase">Estado</label>
                  <select 
                    value={newTurno.estado}
                    onChange={(e) => setNewTurno({ ...newTurno, estado: e.target.value as 'PENDIENTE' | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE' })}
                    className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
                  >
                    <option value="PENDIENTE" className="bg-slate-900 text-slate-200">PENDIENTE</option>
                    <option value="CONFIRMADO" className="bg-slate-900 text-slate-200">CONFIRMADO</option>
                    <option value="ATENDIDO" className="bg-slate-900 text-slate-200">ATENDIDO (Asistió)</option>
                    <option value="AUSENTE" className="bg-slate-900 text-slate-200">AUSENTE (Faltó)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold block uppercase">Notas</label>
                <textarea 
                  value={newTurno.notas}
                  onChange={(e) => setNewTurno({ ...newTurno, notas: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none resize-none focus:border-slate-700 transition"
                  placeholder="Ej: Molestias lumbares."
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowNewTurnoModal(false)} className="px-5 py-3 text-sm font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-2xl transition">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-950/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? <><RefreshCw className="h-4 w-4 animate-spin" /> Guardando...</> : "Agendar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR TURNO */}
      {showEditTurnoModal && editingTurno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-800">
            <div className="px-6 py-5 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
              <span className="font-extrabold text-slate-100 text-lg">Editar Turno</span>
              <button 
                onClick={() => {
                  setShowEditTurnoModal(false);
                  setEditingTurno(null);
                }} 
                className="text-slate-400 p-1.5 hover:bg-slate-800 rounded-xl transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={async (e) => { setIsSubmitting(true); try { await handleUpdateTurnoSubmit(e); } finally { setIsSubmitting(false); } }} className="p-6 space-y-4">
              <div className="space-y-1.5 relative">
                {showPacienteDropdown && (
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setShowPacienteDropdown(false)} 
                  />
                )}
                <label className="text-xs text-slate-500 font-bold block uppercase">Paciente</label>
                <div className="flex gap-2 relative z-50">
                  <div className="relative flex-1">
                    <input 
                      type="text"
                      placeholder="Buscar por nombre o DNI..."
                      value={pacienteSearchQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPacienteSearchQuery(val);
                        setShowPacienteDropdown(val.trim() !== '');
                        setActivePacienteIndex(-1);
                        
                        if (editingTurno.pacienteId) {
                          setEditingTurno({ ...editingTurno, pacienteId: 0 });
                        }
                      }}
                      onFocus={() => setShowPacienteDropdown(pacienteSearchQuery.trim() !== '')}
                      onKeyDown={(e) => {
                        if (!showPacienteDropdown) return;
                        
                        const hasInlineOption = pacienteSearchQuery.trim() !== '';
                        const itemsLength = filteredPatientsForAutocomplete.length + (hasInlineOption ? 1 : 0);
                        
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setActivePacienteIndex(prev => (prev + 1) % itemsLength);
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setActivePacienteIndex(prev => (prev - 1 + itemsLength) % itemsLength);
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          if (activePacienteIndex >= 0 && activePacienteIndex < filteredPatientsForAutocomplete.length) {
                            const p = filteredPatientsForAutocomplete[activePacienteIndex];
                            setEditingTurno({ ...editingTurno, pacienteId: p.id });
                            setPacienteSearchQuery(p.nombre);
                            setShowPacienteDropdown(false);
                          } else if (activePacienteIndex === filteredPatientsForAutocomplete.length && hasInlineOption) {
                            handleQuickRegisterPacienteWithNameFromEdit(pacienteSearchQuery);
                          } else if (filteredPatientsForAutocomplete.length > 0) {
                            const p = filteredPatientsForAutocomplete[0];
                            setEditingTurno({ ...editingTurno, pacienteId: p.id });
                            setPacienteSearchQuery(p.nombre);
                            setShowPacienteDropdown(false);
                          }
                        } else if (e.key === 'Escape') {
                          setShowPacienteDropdown(false);
                        }
                      }}
                      className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 rounded-2xl text-sm font-semibold text-white focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-slate-900 focus:border-slate-700 transition"
                      required
                    />
                    
                    {editingTurno.pacienteId ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTurno({ ...editingTurno, pacienteId: 0 });
                          setPacienteSearchQuery('');
                        }}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 rounded-full hover:bg-slate-800 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : (
                      <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowNewPacienteModal(true)}
                    className="px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl flex items-center justify-center transition border border-slate-700"
                    title="Registrar nuevo paciente completo"
                  >
                    <UserPlus className="h-4.5 w-4.5" />
                  </button>
                </div>

                {showPacienteDropdown && (
                  <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-slate-950 border border-slate-850 rounded-2xl shadow-2xl py-1.5 text-sm">
                    {filteredPatientsForAutocomplete.map((p, idx) => {
                      const isSelected = editingTurno.pacienteId === p.id;
                      const isActive = idx === activePacienteIndex;
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setEditingTurno({ ...editingTurno, pacienteId: p.id });
                            setPacienteSearchQuery(p.nombre);
                            setShowPacienteDropdown(false);
                          }}
                          onMouseEnter={() => setActivePacienteIndex(idx)}
                          className={`px-4 py-2.5 cursor-pointer font-semibold flex items-center justify-between transition ${
                            isSelected ? 'bg-emerald-600 text-white' : isActive ? 'bg-slate-800 text-slate-200' : "text-slate-300 hover:bg-slate-800/60"
                          }`}
                        >
                          <div className="flex flex-col">
                            <span>{p.nombre}</span>
                            <span className={`text-xs ${isSelected ? 'text-emerald-200' : "text-slate-500"} font-normal`}>
                              {p.dni ? `DNI: ${p.dni}` : "Sin DNI"} {p.telefono ? `· Tél: ${p.telefono}` : ""}
                            </span>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-white" />}
                        </div>
                      );
                    })}

                    {pacienteSearchQuery.trim() !== '' && (
                      <div
                        onClick={() => handleQuickRegisterPacienteWithNameFromEdit(pacienteSearchQuery)}
                        onMouseEnter={() => setActivePacienteIndex(filteredPatientsForAutocomplete.length)}
                        className={`px-4 py-3 border-t border-slate-800 cursor-pointer font-bold text-emerald-400 hover:bg-emerald-950/20 flex items-center gap-2 transition ${
                          activePacienteIndex === filteredPatientsForAutocomplete.length ? 'bg-slate-800/60' : ""
                        }`}
                      >
                        <PlusCircle className="h-4.5 w-4.5 text-emerald-400" />
                        <span>Registrar y seleccionar "{pacienteSearchQuery}"</span>
                      </div>
                    )}

                    {filteredPatientsForAutocomplete.length === 0 && pacienteSearchQuery.trim() === '' && (
                      <div className="px-4 py-3 text-slate-500 font-medium text-center">
                        Escribe para buscar...
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-bold block uppercase">Fecha</label>
                  <input 
                    type="date"
                    onClick={(e) => (e.target as any).showPicker?.()}
                    value={editingTurno.fechaHora}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      const targetCity = getTargetCityForAppointment(newDate, editingTurno.hora);
                      setEditingTurno({ 
                        ...editingTurno, 
                        fechaHora: newDate,
                        ciudad: targetCity 
                      });
                    }}
                    className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-bold block uppercase">Hora</label>
                  <select 
                    value={editingTurno.hora}
                    onChange={(e) => {
                      const newHour = e.target.value;
                      const targetCity = getTargetCityForAppointment(editingTurno.fechaHora, newHour);
                      setEditingTurno({ 
                        ...editingTurno, 
                        hora: newHour,
                        ciudad: targetCity
                      });
                    }}
                    className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-slate-900 focus:border-slate-700 transition"
                    required
                  >
                    {getModalTimeSlots().map(time => (
                      <option key={time} value={time} className="bg-slate-900 text-slate-200">{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-bold block uppercase">Ciudad / Sucursal</label>
                  <select 
                    value={editingTurno.ciudad}
                    className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950/80 text-slate-500 rounded-2xl text-sm font-semibold focus:outline-none cursor-not-allowed opacity-60"
                    disabled
                  >
                    {ciudadesDisponibles.map(c => (
                      <option key={c} value={c} className="bg-slate-900 text-slate-200">{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-bold block uppercase">Estado</label>
                  <select 
                    value={editingTurno.estado}
                    onChange={(e) => setEditingTurno({ ...editingTurno, estado: e.target.value as 'PENDIENTE' | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE' })}
                    className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
                  >
                    <option value="PENDIENTE" className="bg-slate-900 text-slate-200">PENDIENTE</option>
                    <option value="CONFIRMADO" className="bg-slate-900 text-slate-200">CONFIRMADO</option>
                    <option value="ATENDIDO" className="bg-slate-900 text-slate-200">ATENDIDO (Asistió)</option>
                    <option value="AUSENTE" className="bg-slate-900 text-slate-200">AUSENTE (Faltó)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold block uppercase">Notas / Observaciones</label>
                <textarea 
                  value={editingTurno.notas || ''}
                  onChange={(e) => setEditingTurno({ ...editingTurno, notas: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none resize-none focus:border-slate-700 transition"
                  placeholder="Ej: Molestias lumbares."
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowEditTurnoModal(false);
                    setEditingTurno(null);
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

      {/* MODAL: NUEVO PACIENTE */}
      {showNewPacienteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-800">
            <div className="px-6 py-5 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
              <span className="font-extrabold text-slate-100 text-lg">Registrar Paciente</span>
              <button 
                onClick={() => {
                  setShowNewPacienteModal(false);
                  setShowOptionalFields(false);
                }} 
                className="text-slate-400 p-1.5 hover:bg-slate-800 rounded-xl transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={async (e) => { setIsSubmitting(true); try { await handleCreatePaciente(e); } finally { setIsSubmitting(false); } }} className="p-6 space-y-4" noValidate>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold flex items-center gap-1 uppercase">
                  Nombre Completo <span className="text-rose-500 font-black text-sm">*</span>
                  <span className="text-[10px] text-slate-400 font-medium normal-case">(Obligatorio)</span>
                </label>
                <input 
                  type="text"
                  value={newPaciente.nombre}
                  onChange={(e) => {
                    setNewPaciente({ ...newPaciente, nombre: e.target.value });
                    if (formErrors.nombre) setFormErrors({ ...formErrors, nombre: undefined });
                  }}
                  className={`w-full pl-4 pr-10 py-3 border bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 transition ${formErrors.nombre ? 'border-rose-500 focus:ring-rose-500/10' : "border-slate-800 focus:ring-emerald-500/5 focus:bg-slate-900 focus:border-slate-700"}`}
                  placeholder="Ej: Juan Pérez"
                  autoFocus
                />
                {formErrors.nombre && <span className="text-rose-500 text-xs font-bold mt-1 block">{formErrors.nombre}</span>}
              </div>

              {/* Toggle optional section */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition"
                >
                  <span className={`transform transition-transform duration-200 ${showOptionalFields ? 'rotate-90' : ""}`}>▶</span>
                  <span>Más datos (Opcionales)</span>
                </button>
              </div>

              {showOptionalFields && (
                <div className="space-y-4 border-t border-slate-800 pt-4 transition-all duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-bold block uppercase">DNI</label>
                      <input 
                        type="text"
                        value={newPaciente.dni}
                        onChange={(e) => {
                          setNewPaciente({ ...newPaciente, dni: e.target.value.replace(/\D/g, '').slice(0, 8) });
                          if (formErrors.dni) setFormErrors({ ...formErrors, dni: undefined });
                        }}
                        className={`w-full pl-4 pr-10 py-3 border bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none transition ${formErrors.dni ? 'border-rose-500' : "border-slate-800 focus:border-slate-700"}`}
                        placeholder="Ej: 12345678"
                      />
                      {formErrors.dni && <span className="text-rose-500 text-xs font-bold mt-1 block">{formErrors.dni}</span>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-bold block uppercase">Teléfono</label>
                      <input 
                        type="text"
                        value={newPaciente.telefono}
                        onChange={(e) => {
                          setNewPaciente({ ...newPaciente, telefono: e.target.value.replace(/\D/g, '') });
                        }}
                        className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
                        placeholder="Ej: 5493442XXXXXX"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-bold block uppercase">Correo</label>
                      <input 
                        type="email"
                        value={newPaciente.email}
                        onChange={(e) => {
                          setNewPaciente({ ...newPaciente, email: e.target.value });
                          if (formErrors.email) setFormErrors({ ...formErrors, email: undefined });
                        }}
                        className={`w-full pl-4 pr-10 py-3 border bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none transition ${formErrors.email ? 'border-rose-500' : "border-slate-800 focus:border-slate-700"}`}
                        placeholder="Ej: juan@gmail.com"
                      />
                      {formErrors.email && <span className="text-rose-500 text-xs font-bold mt-1 block">{formErrors.email}</span>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-bold block uppercase">Fecha de Nacimiento</label>
                      <input 
                        type="date"
                    onClick={(e) => (e.target as any).showPicker?.()}
                        value={newPaciente.fechaNacimiento}
                        onChange={(e) => setNewPaciente({ ...newPaciente, fechaNacimiento: e.target.value })}
                        className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowNewPacienteModal(false);
                    setShowOptionalFields(false);
                  }} 
                  className="px-5 py-3 text-sm font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-2xl transition"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-950/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? <><RefreshCw className="h-4 w-4 animate-spin" /> Guardando...</> : "Registrar Paciente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditPacienteModal && editingPaciente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
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
      {/* MODAL: NUEVA FICHA CLÍNICA */}
      {showNewHistorialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-800">
            <div className="px-6 py-5 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
              <span className="font-extrabold text-slate-100 text-lg">Nueva Ficha Clínica</span>
              <button onClick={() => setShowNewHistorialModal(false)} className="text-slate-400 p-1.5 hover:bg-slate-800 rounded-xl transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={async (e) => { setIsSubmitting(true); try { await handleCreateHistorial(e); } finally { setIsSubmitting(false); } }} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-550 font-bold block uppercase">Paciente</label>
                <select 
                  value={newHistorial.pacienteId}
                  onChange={(e) => setNewHistorial({ ...newHistorial, pacienteId: e.target.value })}
                  className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
                  required
                >
                  <option value="" className="bg-slate-900 text-slate-400">Seleccionar paciente...</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">{p.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-550 font-bold block uppercase">Fecha</label>
                <input 
                  type="date"
                    onClick={(e) => (e.target as any).showPicker?.()}
                  value={newHistorial.fecha}
                  onChange={(e) => setNewHistorial({ ...newHistorial, fecha: e.target.value })}
                  className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-550 font-bold block uppercase">Notas de Evolución</label>
                <textarea 
                  value={newHistorial.notas}
                  onChange={(e) => setNewHistorial({ ...newHistorial, notas: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none resize-none focus:border-slate-700 transition"
                  required
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowNewHistorialModal(false)} className="px-5 py-3 text-sm font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-2xl transition">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-950/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? <><RefreshCw className="h-4 w-4 animate-spin" /> Guardando...</> : "Registrar"}
                </button>
              </div>
            </form>
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
                disabled={isConfirming} onClick={() => setCustomConfirm(null)} 
                className="px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800/80 rounded-xl hover:bg-slate-800 transition"
              >
                {customConfirm.cancelText || 'Cancelar'}
              </button>
              <button 
                type="button" 
                disabled={isConfirming} onClick={async () => {
                  setIsConfirming(true);
                  try {
                    await customConfirm.onConfirm();
                  } finally {
                    setIsConfirming(false);
                    setCustomConfirm(null);
                  }
                }} 
                className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl transition shadow-sm ${
                  customConfirm.type === 'danger' 
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/20' 
                    : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/20"
                }`}
              >
                {isConfirming ? <div className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Procesando...</div> : (customConfirm.confirmText || 'Confirmar')}
              </button>
            </div>
          </div>
        </div>
      )}
          </>
        )}
      </main>
    </>
  );
}
