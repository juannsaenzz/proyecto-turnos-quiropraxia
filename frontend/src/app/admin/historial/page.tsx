"use client";

import React, { useState, useEffect } from 'react';
import { useSidebar } from '../components/SidebarContext';
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
  Trash2
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
  estado: 'PENDIENTE' | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE';
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
  const [activeTab, setActiveTab] = useState<'turnos' | 'pacientes' | 'historial'>('historial');
  const [calendarViewMode, setCalendarViewMode] = useState<'day' | 'month'>('day');
  
  // Date and Sucursal Logic
  const [currentDate, setCurrentDate] = useState<string>('2026-07-07'); // Default date (Tuesday)
  const [selectedCity, setSelectedCity] = useState<string>('Maciá');
  const [selectedShift, setSelectedShift] = useState<'Mañana' | 'Tarde' | 'Ninguno'>('Tarde');
  const [savedConfig, setSavedConfig] = useState<{ ciudad: string; bloque: 'Mañana' | 'Tarde' | 'Ninguno' } | null>(null);
  
  // Modals state
  const [showNewTurnoModal, setShowNewTurnoModal] = useState(false);
  const [showNewPacienteModal, setShowNewPacienteModal] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [showNewHistorialModal, setShowNewHistorialModal] = useState(false);
  const [showEditPacienteModal, setShowEditPacienteModal] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
  const [showEditTurnoModal, setShowEditTurnoModal] = useState(false);
  const [editingTurno, setEditingTurno] = useState<Turno | null>(null);
  const [customConfirm, setCustomConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  } | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Feedback Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
        return { ciudad: 'Rosario del Tala', turno: 'Tarde' as const };
      case 2: // Martes
        return { ciudad: 'Maciá', turno: 'Tarde' as const };
      case 5: // Viernes
        // Default Gualeguay (Mañana) if hour < 15:00, Galarza (Tarde) if hour >= 15:00
        if (hourStr) {
          const hr = parseInt(hourStr.split(':')[0], 10);
          if (hr < 15) {
            return { ciudad: 'Gualeguay', turno: 'Mañana' as const };
          } else {
            return { ciudad: 'Galarza', turno: 'Tarde' as const };
          }
        }
        return { ciudad: 'Gualeguay', turno: 'Mañana' as const };
      default: // Saturday / Sunday
        return { ciudad: 'Cerrado', turno: 'Ninguno' as const };
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
        const response = await fetch(`http://localhost:3000/configuracion-dia/${currentDate}`);
        if (!response.ok) {
          throw new Error('Error al consultar configuración del día');
        }
        const data = await response.json();
        
        if (isMounted) {
          if (data && data.ciudad && data.bloque) {
            const mappedShift = data.bloque === 'MANANA' ? 'Mañana' : 'Tarde';
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
      const response = await fetch('http://localhost:3000/configuracion-dia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fecha: currentDate,
          ciudad: selectedCity,
          bloque: selectedShift === 'Mañana' ? 'MANANA' : 'TARDE',
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
      const response = await fetch('http://localhost:3000/historial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const resHistorial = await fetch('http://localhost:3000/historial');
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
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Data lists from database
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [historiales, setHistoriales] = useState<Historial[]>([]);

  // Load initial data from the database
  useEffect(() => {
    let isMounted = true;
    
    const loadDbData = async () => {
      try {
        // 1. Fetch Pacientes
        const resPacientes = await fetch('http://localhost:3000/pacientes');
        if (!resPacientes.ok) throw new Error('Error al cargar pacientes');
        const dataPacientes = await resPacientes.json();
        
        if (isMounted) {
          setPacientes(dataPacientes);
        }

        // 2. Fetch Turnos
        const resTurnos = await fetch('http://localhost:3000/turnos');
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
        const resHistorial = await fetch('http://localhost:3000/historial');
        if (!resHistorial.ok) throw new Error('Error al cargar historiales');
        const dataHistorial = await resHistorial.json();
        
        if (isMounted) {
          setHistoriales(dataHistorial);
        }
      } catch (error) {
        console.error('Error fetching database records:', error);
      }
    };

    loadDbData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Form states
  const [newTurno, setNewTurno] = useState({
    pacienteId: '',
    fechaHora: '2026-07-07',
    hora: '15:00',
    ciudad: 'Maciá',
    notas: '',
    estado: 'PENDIENTE' as 'PENDIENTE' | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE'
  });

  const [newPaciente, setNewPaciente] = useState({ 
    nombre: '', 
    dni: '', 
    email: '', 
    telefono: '', 
    fechaNacimiento: '' 
  });
  const [newHistorial, setNewHistorial] = useState({ pacienteId: '', fecha: '2026-07-07', notas: '' });

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
      const response = await fetch('http://localhost:3000/turnos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        pacienteId: '',
        fechaHora: currentDate,
        hora: '15:00',
        ciudad: selectedCity,
        notas: '',
        estado: 'PENDIENTE'
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
        title: 'Conflicto de Horario',
        message: `El día ${formattedDate} a las ${newTurno.hora} hs ya hay turnos programados para: ${conflictNames}. ¿Estás seguro de agendar este turno para ${p.nombre}?`,
        confirmText: 'Sí, agendar',
        cancelText: 'Cancelar',
        onConfirm: () => executeCreateTurno(p, isoDateTime, newTurno.hora)
      });
      return;
    }

    await executeCreateTurno(p, isoDateTime, newTurno.hora);
  };

  const executeUpdateTurno = async (updated: Turno) => {
    const isoDateTime = `${updated.fechaHora}T${updated.hora}:00.000Z`;
    try {
      const response = await fetch(`http://localhost:3000/turnos/${updated.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
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
        title: 'Conflicto de Horario',
        message: `El día ${formattedDate} a las ${editingTurno.hora} hs ya hay turnos programados para: ${conflictNames}. ¿Estás seguro de mover el turno para ${p.nombre} a este horario?`,
        confirmText: 'Sí, guardar',
        cancelText: 'Cancelar',
        onConfirm: () => executeUpdateTurno(updatedWithResolvedName)
      });
      return;
    }

    await executeUpdateTurno(updatedWithResolvedName);
  };

  const handleQuickRegisterPacienteWithName = async (name: string) => {
    if (!name || !name.trim()) return;
    try {
      const response = await fetch('http://localhost:3000/pacientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      const response = await fetch('http://localhost:3000/pacientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
    if (!newPaciente.nombre || !newPaciente.nombre.trim()) {
      alert("El nombre completo es obligatorio");
      return;
    }

    const dniTrimmed = newPaciente.dni ? newPaciente.dni.trim() : '';
    if (dniTrimmed && pacientes.some(p => p.dni === dniTrimmed)) {
      alert("Ya existe un paciente con este DNI");
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/pacientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        nombre: '',
        dni: '',
        email: '',
        telefono: '',
        fechaNacimiento: ''
      });
    } catch (error: any) {
      console.error('Error creating paciente:', error);
      alert(error.message || 'No se pudo registrar el paciente.');
    }
  };

  const handleUpdatePaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPaciente || !editingPaciente.nombre.trim()) {
      alert("El nombre completo es obligatorio");
      return;
    }

    const dniTrimmed = editingPaciente.dni ? editingPaciente.dni.trim() : '';
    if (dniTrimmed && pacientes.some(p => p.dni === dniTrimmed && p.id !== editingPaciente.id)) {
      alert("Ya existe otro paciente con este DNI");
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/pacientes/${editingPaciente.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
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
      title: 'Eliminar Paciente',
      message: `¿Estás seguro de que deseas eliminar al paciente "${nombre}"? Esta acción borrará de forma permanente todos sus turnos y su historial clínico.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await fetch(`http://localhost:3000/pacientes/${id}`, {
            method: 'DELETE',
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
    const details = appt ? ` de las ${appt.hora} hs para ${appt.pacienteNombre}` : '';
    setCustomConfirm({
      title: 'Eliminar Turno',
      message: `¿Estás seguro de que deseas eliminar el turno${details}? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await fetch(`http://localhost:3000/turnos/${id}`, {
            method: 'DELETE',
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
      const response = await fetch('http://localhost:3000/historial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

      setNewHistorial({ pacienteId: '', fecha: currentDate, notas: '' });
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'No se pudo crear la ficha clínica.');
    }
  };

  const updateTurnoEstado = async (id: number, nuevoEstado: 'PENDIENTE' | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE') => {
    try {
      const response = await fetch(`http://localhost:3000/turnos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
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

  const getEstadoStyles = (estado: 'PENDIENTE' | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE') => {
    switch (estado) {
      case 'PENDIENTE':
        return {
          card: 'bg-amber-950/25 border-amber-500/25 text-amber-200 shadow-amber-950/10 hover:border-amber-500/40',
          badge: 'bg-amber-950/50 border-amber-500/20 text-amber-300'
        };
      case 'CONFIRMADO':
        return {
          card: 'bg-blue-950/25 border-blue-500/25 text-blue-200 shadow-blue-950/10 hover:border-blue-500/40',
          badge: 'bg-blue-950/50 border-blue-500/20 text-blue-300'
        };
      case 'ATENDIDO':
        return {
          card: 'bg-emerald-950/25 border-emerald-500/25 text-emerald-200 shadow-emerald-950/10 hover:border-emerald-500/40',
          badge: 'bg-emerald-950/50 border-emerald-500/20 text-emerald-300'
        };
      case 'AUSENTE':
        return {
          card: 'bg-rose-950/25 border-rose-500/25 text-rose-200 shadow-rose-950/10 hover:border-rose-500/40',
          badge: 'bg-rose-950/50 border-rose-500/20 text-rose-300'
        };
      default:
        return {
          card: 'bg-slate-900 border-slate-800 text-slate-300',
          badge: 'bg-slate-950 border-slate-800 text-slate-400'
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
    { id: 'turnos', label: 'Calendario de Turnos', icon: Calendar },
    { id: 'pacientes', label: 'Pacientes', icon: Users },
    { id: 'historial', label: 'Historial Clínico', icon: FileText },
  ] as const;

  return (
    <>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[100] bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center space-x-3.5 border border-slate-800">
          <Check className="h-4 w-4 text-emerald-400 stroke-[3]" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="h-20 bg-slate-900 border-b border-slate-800/80 sticky top-0 z-30 px-6 sm:px-8 flex items-center justify-between -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 mb-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-400 hover:text-slate-200 p-2 hover:bg-slate-800 rounded-xl"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-extrabold text-slate-100 tracking-tight capitalize">
            Historial Clínico
          </h1>
        </div>
      </header>
      <main className="flex-grow p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">


            <div className="space-y-6">
              
              {/* VISTA 1: LISTADO DE DIAS */}
              {selectedHistorialDate === null ? (
                <>
                  <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <span className="font-extrabold text-slate-100 block text-sm sm:text-base">Historial por Días</span>
                      <span className="text-xs text-slate-500 font-medium">Selecciona un día para ver los pacientes y registrar notas de evolución</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="relative w-full sm:w-auto">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-550 pointer-events-none">
                          <Search className="h-4.5 w-4.5" />
                        </span>
                        <input 
                          type="text" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Buscar día, paciente o nota..."
                          className="w-full sm:w-60 pl-10 pr-4 py-2 border border-slate-850 bg-slate-950 text-white placeholder-slate-500 rounded-xl text-xs font-semibold focus:outline-none focus:border-slate-700 transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {(() => {
                      const datesSet = new Set<string>();
                      turnos.forEach(t => datesSet.add(t.fechaHora.split('T')[0]));
                      historiales.forEach(h => datesSet.add(h.fecha));
                      const sortedDates = Array.from(datesSet).sort((a, b) => b.localeCompare(a));

                      const filteredDates = sortedDates.filter(date => {
                        if (!searchQuery) return true;
                        const q = searchQuery.toLowerCase();
                        const formatted = getFormattedDateLabel(date).toLowerCase();
                        if (formatted.includes(q) || date.includes(q)) return true;

                        const dayTurnos = turnos.filter(t => t.fechaHora.split('T')[0] === date);
                        const hasMatchingPatient = dayTurnos.some(t => t.pacienteNombre.toLowerCase().includes(q));
                        if (hasMatchingPatient) return true;

                        const dayHistorial = historiales.filter(h => h.fecha === date);
                        const hasMatchingNotes = dayHistorial.some(h => h.notas.toLowerCase().includes(q));
                        if (hasMatchingNotes) return true;

                        return false;
                      });

                      if (filteredDates.length === 0) {
                        return (
                          <div className="bg-slate-900 p-8 text-center text-slate-500 rounded-3xl border border-slate-800">
                            No se encontraron días con registros.
                          </div>
                        );
                      }

                      return filteredDates.map(date => {
                        const dayTurnos = turnos.filter(t => t.fechaHora.split('T')[0] === date);
                        const totalTurnos = dayTurnos.length;
                        const attended = dayTurnos.filter(t => t.estado === 'ATENDIDO').length;
                        const absent = dayTurnos.filter(t => t.estado === 'AUSENTE').length;
                        const pending = dayTurnos.filter(t => t.estado === 'PENDIENTE').length;
                        const confirmed = dayTurnos.filter(t => t.estado === 'CONFIRMADO').length;

                        const cities = Array.from(new Set(dayTurnos.map(t => t.ciudad)));
                        const sucursalDefault = getDefaultsForDate(date).ciudad;
                        const sucursalesLabel = cities.length > 0 ? cities.join(' / ') : sucursalDefault;

                        return (
                          <div 
                            key={date}
                            onClick={() => {
                              setSelectedHistorialDate(date);
                              setDetailStatusFilter('TODOS');
                            }}
                            className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 hover:border-slate-700 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer"
                          >
                            <div className="space-y-1">
                              <span className="font-extrabold text-slate-100 text-sm sm:text-base first-letter:capitalize">
                                {getFormattedDateLabel(date)}
                              </span>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-semibold">
                                <span className="flex items-center gap-1 text-emerald-455">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {sucursalesLabel}
                                </span>
                                <span className="text-slate-700">•</span>
                                <span>{totalTurnos} {totalTurnos === 1 ? 'Paciente agendado' : 'Pacientes agendados'}</span>
                                {totalTurnos > 0 && (
                                  <>
                                    <span className="text-slate-700">•</span>
                                    <span className="text-emerald-450">{attended} Asistieron</span>
                                    {absent > 0 && <span className="text-rose-450">, {absent} Ausentes</span>}
                                    {pending + confirmed > 0 && <span className="text-slate-500">, {pending + confirmed} Pendientes</span>}
                                  </>
                                )}
                              </div>
                            </div>
                            <button 
                              className="px-4 py-2 text-xs font-bold text-slate-300 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-xl transition flex items-center gap-1"
                            >
                              <span>Ver Pacientes</span>
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </>
              ) : (
                /* VISTA 2: DETALLE DEL DIA SELECCIONADO */
                <>
                  {(() => {
                    const date = selectedHistorialDate;
                    const dayTurnos = turnos
                      .filter(t => t.fechaHora.split('T')[0] === date)
                      .sort((a, b) => a.hora.localeCompare(b.hora));

                    const displayedTurnos = dayTurnos.filter(t => {
                      if (detailStatusFilter === 'TODOS') return true;
                      return t.estado === detailStatusFilter;
                    });

                    return (
                      <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <button 
                            onClick={() => {
                              setSelectedHistorialDate(null);
                              setDetailStatusFilter('TODOS');
                            }}
                            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-xs font-bold transition bg-slate-900 hover:bg-slate-800 px-3 py-2 rounded-xl border border-slate-800/80 shadow-sm"
                          >
                            <ChevronLeft className="h-4.5 w-4.5" />
                            <span>Volver a la lista de días</span>
                          </button>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                          <span className="text-xs text-emerald-400 font-bold block uppercase tracking-widest">Evolución Clínica Diaria</span>
                          <h2 className="text-xl font-extrabold text-white mt-1 first-letter:capitalize">
                            {getFormattedDateLabel(date)}
                          </h2>
                          <p className="text-xs text-slate-450 mt-1 font-semibold">
                            Lista de pacientes registrados para este día. Puedes marcar su asistencia y redactar su evolución clínica.
                          </p>
                        </div>

                        {/* Control Box: Filter Attendance & Stats */}
                        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                          <div className="flex items-center space-x-2 text-xs text-slate-400">
                            <span className="font-bold">Total del día:</span>
                            <span className="bg-slate-950 px-2.5 py-1 rounded-lg text-slate-200 border border-slate-850 font-extrabold">{dayTurnos.length} pacientes</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-455">Filtrar Asistencia:</span>
                            <select
                              value={detailStatusFilter}
                              onChange={(e) => setDetailStatusFilter(e.target.value as any)}
                              className="px-3 py-1.5 rounded-xl text-xs font-black bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-slate-700 transition cursor-pointer"
                            >
                              <option value="TODOS">TODOS</option>
                              <option value="PENDIENTE">PENDIENTE</option>
                              <option value="CONFIRMADO">CONFIRMADO</option>
                              <option value="ATENDIDO">ATENDIDO</option>
                              <option value="AUSENTE">AUSENTE</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {displayedTurnos.length === 0 ? (
                            <div className="bg-slate-900 p-8 text-center text-slate-500 rounded-3xl border border-slate-800">
                              {dayTurnos.length === 0 
                                ? "No hay turnos registrados en la agenda para este día."
                                : `No hay pacientes con el estado ${detailStatusFilter} para este día.`
                              }
                            </div>
                          ) : (
                            displayedTurnos.map(t => {
                              const existingNote = historiales.find(h => h.pacienteId === t.pacienteId && h.fecha === date);
                              const draftValue = historialDrafts[`${t.pacienteId}-${date}`];
                              const noteText = draftValue !== undefined ? draftValue : (existingNote?.notas || '');

                              return (
                                <div 
                                  key={t.id}
                                  className="bg-slate-900 border border-slate-800/80 rounded-3xl py-3.5 px-5 space-y-3 shadow-sm"
                                >
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <div>
                                      <span className="font-extrabold text-slate-100 text-sm sm:text-base">{t.pacienteNombre}</span>
                                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold mt-0.5">
                                        <span className="text-emerald-450 bg-emerald-950/40 border border-emerald-900/30 px-1.5 py-0.2 rounded font-bold">
                                          ⏰ {t.hora}
                                        </span>
                                        <span>•</span>
                                        <span>Sucursal {t.ciudad}</span>
                                      </div>
                                    </div>

                                    {/* Attendance Status Selector */}
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-bold text-slate-450">Asistencia:</span>
                                      <select
                                        value={t.estado}
                                        onChange={async (e) => {
                                          await updateTurnoEstado(t.id, e.target.value as any);
                                        }}
                                        className={`px-2.5 py-1 rounded-xl text-xs font-black border focus:outline-none transition cursor-pointer ${
                                          t.estado === 'ATENDIDO' ? 'bg-emerald-950/50 border-emerald-800 text-emerald-450' :
                                          t.estado === 'CONFIRMADO' ? 'bg-blue-950/50 border-blue-800 text-blue-400' :
                                          t.estado === 'AUSENTE' ? 'bg-rose-950/50 border-rose-800 text-rose-455' :
                                          'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
                                        }`}
                                      >
                                        <option value="PENDIENTE" className="bg-slate-900 text-slate-200">PENDIENTE</option>
                                        <option value="CONFIRMADO" className="bg-slate-900 text-slate-200">CONFIRMADO</option>
                                        <option value="ATENDIDO" className="bg-slate-900 text-slate-200">ATENDIDO</option>
                                        <option value="AUSENTE" className="bg-slate-900 text-slate-200">AUSENTE</option>
                                      </select>
                                    </div>
                                  </div>

                                  {/* Notes Section: View Mode vs Edit Mode */}
                                  {editingNotePacienteId !== t.pacienteId ? (
                                    existingNote?.notas ? (
                                      <div className="flex items-start justify-between gap-4 bg-slate-950/40 p-3 rounded-2xl border border-slate-850/80">
                                        <div className="text-xs text-slate-300 leading-relaxed font-medium">
                                          {existingNote.notas}
                                        </div>
                                        <button
                                          onClick={() => {
                                            setEditingNotePacienteId(t.pacienteId);
                                          }}
                                          className="p-1.5 text-slate-400 hover:text-emerald-450 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition flex items-center justify-center shrink-0"
                                          title="Editar Evolución"
                                        >
                                          <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-between gap-4 bg-slate-950/20 px-4 py-2.5 rounded-2xl border border-slate-900/60">
                                        <span className="text-xs text-slate-500 font-semibold italic">Sin evolución registrada en este día.</span>
                                        <button
                                          onClick={() => {
                                            setEditingNotePacienteId(t.pacienteId);
                                          }}
                                          className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 rounded-xl hover:bg-emerald-900/40 transition shrink-0"
                                        >
                                          <Plus className="h-3 w-3" />
                                          <span>Agregar Nota</span>
                                        </button>
                                      </div>
                                    )
                                  ) : (
                                    <div className="space-y-2 pt-2 border-t border-slate-850/50">
                                      <textarea
                                        value={noteText}
                                        onChange={(e) => {
                                          setHistorialDrafts(prev => ({
                                            ...prev,
                                            [`${t.pacienteId}-${date}`]: e.target.value
                                          }));
                                        }}
                                        placeholder="Redacta la evolución, ajustes realizados, drop, etc..."
                                        rows={2}
                                        className="w-full px-4 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-xs font-semibold focus:outline-none resize-none focus:border-slate-700 transition placeholder-slate-655"
                                        autoFocus
                                      />
                                      <div className="flex justify-end gap-2">
                                        <button
                                          onClick={() => {
                                            setEditingNotePacienteId(null);
                                          }}
                                          className="px-3.5 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 transition"
                                        >
                                          Cancelar
                                        </button>
                                        <button
                                          onClick={async () => {
                                            await handleSaveHistorialNote(t.pacienteId, date, noteText);
                                            setEditingNotePacienteId(null);
                                          }}
                                          disabled={!noteText.trim()}
                                          className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-950 disabled:text-slate-600 disabled:border disabled:border-slate-800 disabled:shadow-none disabled:cursor-not-allowed rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
                                        >
                                          <Save className="h-3.5 w-3.5" />
                                          <span>Guardar</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>


      {/* MODAL: NUEVO TURNO */}
      {showNewTurnoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-800">
            <div className="px-6 py-5 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
              <span className="font-extrabold text-slate-100 text-lg">Agendar Turno</span>
              <button onClick={() => setShowNewTurnoModal(false)} className="text-slate-400 p-1.5 hover:bg-slate-800 rounded-xl transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTurno} className="p-6 space-y-4">
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
                        setPacienteSearchQuery(e.target.value);
                        setShowPacienteDropdown(true);
                        setActivePacienteIndex(-1);
                        
                        if (newTurno.pacienteId) {
                          setNewTurno({ ...newTurno, pacienteId: '' });
                        }
                      }}
                      onFocus={() => setShowPacienteDropdown(true)}
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
                          setNewTurno({ ...newTurno, pacienteId: '' });
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
                            isSelected ? 'bg-emerald-600 text-white' : isActive ? 'bg-slate-800 text-slate-200' : 'text-slate-300 hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span>{p.nombre}</span>
                            <span className={`text-xs ${isSelected ? 'text-emerald-200' : 'text-slate-500'} font-normal`}>
                              {p.dni ? `DNI: ${p.dni}` : 'Sin DNI'} {p.telefono ? `· Tél: ${p.telefono}` : ''}
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
                          activePacienteIndex === filteredPatientsForAutocomplete.length ? 'bg-slate-800/60' : ''
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-bold block uppercase">Fecha</label>
                  <input 
                    type="date"
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
                    className="w-full px-4 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
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
                    className="w-full px-4 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-slate-900 focus:border-slate-700 transition"
                    required
                  >
                    {getModalTimeSlots().map(time => (
                      <option key={time} value={time} className="bg-slate-900 text-slate-200">{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-bold block uppercase">Ciudad / Sucursal</label>
                  <select 
                    value={newTurno.ciudad}
                    className="w-full px-4 py-3 border border-slate-800 bg-slate-950/80 text-slate-500 rounded-2xl text-sm font-semibold focus:outline-none cursor-not-allowed opacity-60"
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
                    className="w-full px-4 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
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
                <button type="submit" className="px-6 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-950/20 transition">Agendar</button>
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

            <form onSubmit={handleUpdateTurnoSubmit} className="p-6 space-y-4">
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
                        setPacienteSearchQuery(e.target.value);
                        setShowPacienteDropdown(true);
                        setActivePacienteIndex(-1);
                        
                        if (editingTurno.pacienteId) {
                          setEditingTurno({ ...editingTurno, pacienteId: 0 });
                        }
                      }}
                      onFocus={() => setShowPacienteDropdown(true)}
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
                            isSelected ? 'bg-emerald-600 text-white' : isActive ? 'bg-slate-800 text-slate-200' : 'text-slate-300 hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span>{p.nombre}</span>
                            <span className={`text-xs ${isSelected ? 'text-emerald-200' : 'text-slate-500'} font-normal`}>
                              {p.dni ? `DNI: ${p.dni}` : 'Sin DNI'} {p.telefono ? `· Tél: ${p.telefono}` : ''}
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
                          activePacienteIndex === filteredPatientsForAutocomplete.length ? 'bg-slate-800/60' : ''
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-bold block uppercase">Fecha</label>
                  <input 
                    type="date"
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
                    className="w-full px-4 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
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
                    className="w-full px-4 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-slate-900 focus:border-slate-700 transition"
                    required
                  >
                    {getModalTimeSlots().map(time => (
                      <option key={time} value={time} className="bg-slate-900 text-slate-200">{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-bold block uppercase">Ciudad / Sucursal</label>
                  <select 
                    value={editingTurno.ciudad}
                    className="w-full px-4 py-3 border border-slate-800 bg-slate-950/80 text-slate-500 rounded-2xl text-sm font-semibold focus:outline-none cursor-not-allowed opacity-60"
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
                    className="w-full px-4 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
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
                <button type="submit" className="px-6 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-950/20 transition">
                  Guardar Cambios
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

            <form onSubmit={handleCreatePaciente} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold flex items-center gap-1 uppercase">
                  Nombre Completo <span className="text-rose-500 font-black text-sm">*</span>
                  <span className="text-[10px] text-slate-400 font-medium normal-case">(Obligatorio)</span>
                </label>
                <input 
                  type="text"
                  value={newPaciente.nombre}
                  onChange={(e) => setNewPaciente({ ...newPaciente, nombre: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-slate-900 focus:border-slate-700 transition"
                  placeholder="Ej: Juan Pérez"
                  autoFocus
                  required
                />
              </div>

              {/* Toggle optional section */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition"
                >
                  <span className={`transform transition-transform duration-200 ${showOptionalFields ? 'rotate-90' : ''}`}>▶</span>
                  <span>Más datos (Opcionales)</span>
                </button>
              </div>

              {showOptionalFields && (
                <div className="space-y-4 border-t border-slate-800 pt-4 transition-all duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-bold block uppercase">DNI</label>
                      <input 
                        type="text"
                        value={newPaciente.dni}
                        onChange={(e) => setNewPaciente({ ...newPaciente, dni: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
                        placeholder="Ej: 12345678"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-bold block uppercase">Teléfono</label>
                      <input 
                        type="text"
                        value={newPaciente.telefono}
                        onChange={(e) => setNewPaciente({ ...newPaciente, telefono: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
                        placeholder="Ej: 5493442XXXXXX"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-bold block uppercase">Correo</label>
                      <input 
                        type="email"
                        value={newPaciente.email}
                        onChange={(e) => setNewPaciente({ ...newPaciente, email: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
                        placeholder="Ej: juan@gmail.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-bold block uppercase">Fecha de Nacimiento</label>
                      <input 
                        type="date"
                        value={newPaciente.fechaNacimiento}
                        onChange={(e) => setNewPaciente({ ...newPaciente, fechaNacimiento: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
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
                <button type="submit" className="px-6 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-950/20 transition">
                  Registrar Paciente
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

            <form onSubmit={handleUpdatePaciente} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold flex items-center gap-1 uppercase">
                  Nombre Completo <span className="text-rose-500 font-black text-sm">*</span>
                  <span className="text-[10px] text-slate-400 font-medium normal-case">(Obligatorio)</span>
                </label>
                <input 
                  type="text"
                  value={editingPaciente.nombre}
                  onChange={(e) => setEditingPaciente({ ...editingPaciente, nombre: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-slate-900 focus:border-slate-700 transition"
                  placeholder="Ej: Juan Pérez"
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-4 border-t border-slate-800 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-450 font-bold block uppercase">DNI</label>
                    <input 
                      type="text"
                      value={editingPaciente.dni || ''}
                      onChange={(e) => setEditingPaciente({ ...editingPaciente, dni: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
                      placeholder="Ej: 12345678"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-450 font-bold block uppercase">Teléfono</label>
                    <input 
                      type="text"
                      value={editingPaciente.telefono || ''}
                      onChange={(e) => setEditingPaciente({ ...editingPaciente, telefono: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
                      placeholder="Ej: 5493442XXXXXX"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-450 font-bold block uppercase">Correo</label>
                    <input 
                      type="email"
                      value={editingPaciente.email || ''}
                      onChange={(e) => setEditingPaciente({ ...editingPaciente, email: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
                      placeholder="Ej: juan@gmail.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-450 font-bold block uppercase">Fecha de Nacimiento</label>
                    <input 
                      type="date"
                      value={editingPaciente.fechaNacimiento || ''}
                      onChange={(e) => setEditingPaciente({ ...editingPaciente, fechaNacimiento: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
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
                <button type="submit" className="px-6 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-950/20 transition">
                  Guardar Cambios
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

            <form onSubmit={handleCreateHistorial} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-550 font-bold block uppercase">Paciente</label>
                <select 
                  value={newHistorial.pacienteId}
                  onChange={(e) => setNewHistorial({ ...newHistorial, pacienteId: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
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
                  value={newHistorial.fecha}
                  onChange={(e) => setNewHistorial({ ...newHistorial, fecha: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
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
                <button type="submit" className="px-6 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-950/20 transition">Registrar</button>
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
            
            <p className="text-sm font-semibold text-slate-400 leading-relaxed">
              {customConfirm.message}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => setCustomConfirm(null)} 
                className="px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800/80 rounded-xl hover:bg-slate-800 transition"
              >
                {customConfirm.cancelText || 'Cancelar'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  customConfirm.onConfirm();
                  setCustomConfirm(null);
                }} 
                className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl transition shadow-sm ${
                  customConfirm.type === 'danger' 
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/20' 
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/20'
                }`}
              >
                {customConfirm.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </>
  );
}
