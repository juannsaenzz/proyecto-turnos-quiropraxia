"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
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
  updatedAt?: string;
  updatedBy?: string;
}

interface Historial {
  id: number;
  pacienteId: number;
  pacienteNombre: string;
  fecha: string; // YYYY-MM-DD
  notas: string;
}

const getTodayFormatted = () => {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
};

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
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [showGlobalSearchDropdown, setShowGlobalSearchDropdown] = useState(false);
  const globalSearchRef = useRef<HTMLDivElement>(null);

  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setCurrentUserEmail(user.email);
      }
    };
    fetchUser();
  }, [supabase]);

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

  const [activeTab, setActiveTab] = useState<'turnos' | 'pacientes' | 'historial'>('turnos');
  const [calendarViewMode, setCalendarViewMode] = useState<'day' | 'month'>('day');
  
  // NEW: State for bulk selection
  const [selectedTurnos, setSelectedTurnos] = useState<number[]>([]);
  
  // Date and Sucursal Logic
  const [currentDate, setCurrentDate] = useState<string>(getTodayFormatted()); // Default date
  const [selectedCity, setSelectedCity] = useState<string>('Maciá');
  const [selectedShift, setSelectedShift] = useState<'Mañana' | 'Tarde' | 'Ninguno'>('Tarde');
  const [savedConfigs, setSavedConfigs] = useState<Record<string, { ciudad: string; bloque: string }>>({});
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [tempCity, setTempCity] = useState<string>('Maciá');
  const [tempShift, setTempShift] = useState<'Mañana' | 'Tarde' | 'Ninguno'>('Tarde');
  const [showConfirmConfig, setShowConfirmConfig] = useState(false);
  const [allConfigs, setAllConfigs] = useState<{fecha: string; ciudad: string; bloque: string}[]>([]);

  // Prevent hydration mismatch by only rendering on client
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
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

  // Current time for the timeline indicator
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

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
    if (showNewTurnoModal) {
      setPacienteSearchQuery('');
    }
    if (showNewTurnoModal || showEditTurnoModal) {
      setShowPacienteDropdown(false);
      setActivePacienteIndex(-1);
    }
  }, [showNewTurnoModal, showEditTurnoModal]);

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
    // For simplicity, we just use defaults for the month view since overrides are per shift
    const defaults = getDefaultsForDate(dateStr, hourStr);
    return defaults.ciudad;
  };

  // Trigger auto-selection and database lookup when date changes
  useEffect(() => {
    let isMounted = true;
    const fetchOverride = async () => {
      try {
        const [resLegacy, resManana, resTarde] = await Promise.all([
          fetch(`http://localhost:3000/configuracion-dia/${currentDate}`).catch(() => null),
          fetch(`http://localhost:3000/configuracion-dia/${currentDate}_MANANA`).catch(() => null),
          fetch(`http://localhost:3000/configuracion-dia/${currentDate}_TARDE`).catch(() => null),
        ]);

        const parseJson = async (res: Response | null) => {
          if (!res || !res.ok) return null;
          try {
            const text = await res.text();
            return text ? JSON.parse(text) : null;
          } catch (e) {
            return null;
          }
        };

        const dataLegacy = await parseJson(resLegacy);
        const dataManana = await parseJson(resManana);
        const dataTarde = await parseJson(resTarde);
        
        if (isMounted) {
          const newConfigs: Record<string, { ciudad: string; bloque: string }> = {};
          
          // Legacy config applies to whatever block it specifies, unless overridden
          if (dataLegacy && dataLegacy.ciudad && dataLegacy.bloque) {
            const mappedShift = dataLegacy.bloque === 'MANANA' ? 'Mañana' : 'Tarde';
            newConfigs[mappedShift] = { ciudad: dataLegacy.ciudad, bloque: mappedShift };
          }
          if (dataManana && dataManana.ciudad) {
            newConfigs['Mañana'] = { ciudad: dataManana.ciudad, bloque: 'Mañana' };
          }
          if (dataTarde && dataTarde.ciudad) {
            newConfigs['Tarde'] = { ciudad: dataTarde.ciudad, bloque: 'Tarde' };
          }

          setSavedConfigs(newConfigs);
          
          if (newConfigs[selectedShift]) {
            setSelectedCity(newConfigs[selectedShift].ciudad);
          } else {
            const defaults = getDefaultsForDate(currentDate);
            // Default shift doesn't need to change if they are just loading, 
            // but if they just landed on the date, update it:
            setSelectedCity(defaults.ciudad);
            setSelectedShift(defaults.turno);
          }
        }
      } catch (error) {
        console.error('Error fetching day configuration:', error);
        if (isMounted) {
          const defaults = getDefaultsForDate(currentDate);
          setSelectedCity(defaults.ciudad);
          setSelectedShift(defaults.turno);
          setSavedConfigs({});
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
    if (savedConfigs[selectedShift]) {
      return selectedCity !== savedConfigs[selectedShift].ciudad;
    }
    const defaults = getDefaultsForDate(currentDate);
    return selectedCity !== defaults.ciudad || selectedShift !== defaults.turno;
  };

  const handleSaveConfig = async (city = selectedCity, shift = selectedShift) => {
    try {
      const response = await fetch('http://localhost:3000/configuracion-dia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fecha: `${currentDate}_${shift === 'Mañana' ? 'MANANA' : 'TARDE'}`,
          ciudad: city,
          bloque: shift === 'Mañana' ? 'MANANA' : 'TARDE',
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar la configuración');
      }

      setSavedConfigs(prev => ({
        ...prev,
        [shift]: { ciudad: city, bloque: shift }
      }));
      setAllConfigs(prev => {
        const fetchStr = `${currentDate}_${shift === 'Mañana' ? 'MANANA' : 'TARDE'}`;
        const filtered = prev.filter(c => c.fecha !== fetchStr);
        return [...filtered, { fecha: fetchStr, ciudad: city, bloque: shift === 'Mañana' ? 'MANANA' : 'TARDE' }];
      });
      showToast(`Agenda del ${currentDate.split('-').reverse().join('/')} en el turno ${shift.toLowerCase()} modificada a ${city}`);
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

        // 2.5 Fetch All Configs
        const resConfigs = await fetch('http://localhost:3000/configuracion-dia');
        if (!resConfigs.ok) throw new Error('Error al cargar configuraciones');
        const dataConfigs = await resConfigs.json();
        
        if (isMounted) {
          setAllConfigs(dataConfigs);
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
    fechaHora: getTodayFormatted(),
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
  const [newHistorial, setNewHistorial] = useState({ pacienteId: '', fecha: getTodayFormatted(), notas: '' });

  // 15-Minute Grid generation based on shift, dynamically expanding for out-of-range appointments
  const get15MinTimeSlots = () => {
    const slots: string[] = [];
    if (selectedCity === 'Cerrado' || selectedShift === 'Ninguno') {
      return slots;
    }

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
    const activeAppts = turnos.filter(t => {
      if (t.fechaHora !== currentDate || t.ciudad !== selectedCity) return false;
      const hr = parseInt(t.hora.split(':')[0], 10);
      if (selectedShift === 'Mañana') return hr < 15;
      if (selectedShift === 'Tarde') return hr >= 15;
      return false;
    });

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

    const newTurnoHr = parseInt(newTurno.hora.split(':')[0], 10);
    const newTurnoShift = newTurnoHr < 15 ? 'Mañana' : 'Tarde';
    
    const duplicatedPacienteTurnos = turnos.filter(t => {
      if (t.pacienteId === p.id && t.fechaHora === newTurno.fechaHora) {
        const tHr = parseInt(t.hora.split(':')[0], 10);
        const tShift = tHr < 15 ? 'Mañana' : 'Tarde';
        return tShift === newTurnoShift;
      }
      return false;
    });

    const isoDateTime = `${newTurno.fechaHora}T${newTurno.hora}:00.000Z`;

    if (conflictos.length > 0 || duplicatedPacienteTurnos.length > 0) {
      const parts = newTurno.fechaHora.split('-');
      const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
      
      let messages = [];
      if (duplicatedPacienteTurnos.length > 0) {
        messages.push(`El paciente ${p.nombre} ya tiene un turno para el día ${formattedDate} por la ${newTurnoShift.toLowerCase()} a las ${duplicatedPacienteTurnos[0].hora} hs.`);
      }
      if (conflictos.length > 0) {
        const conflictNames = conflictos.map(c => c.pacienteNombre).join(', ');
        messages.push(`A las ${newTurno.hora} hs ya hay turnos para: ${conflictNames}.`);
      }
      
      setCustomConfirm({
        title: 'Conflicto de Turno',
        message: `${messages.join(' ')} ¿Estás seguro de agendar este turno?`,
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
          estado: updated.estado,
          updatedBy: currentUserEmail || undefined
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
        estado: creado.estado,
        updatedAt: creado.updatedAt,
        updatedBy: creado.updatedBy
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

    const editTurnoHr = parseInt(editingTurno.hora.split(':')[0], 10);
    const editTurnoShift = editTurnoHr < 15 ? 'Mañana' : 'Tarde';
    
    const duplicatedPacienteTurnos = turnos.filter(t => {
      if (t.id !== editingTurno.id && t.pacienteId === p.id && t.fechaHora === editingTurno.fechaHora) {
        const tHr = parseInt(t.hora.split(':')[0], 10);
        const tShift = tHr < 15 ? 'Mañana' : 'Tarde';
        return tShift === editTurnoShift;
      }
      return false;
    });

    const updatedWithResolvedName = {
      ...editingTurno,
      pacienteNombre: p.nombre
    };

    if (conflictos.length > 0 || duplicatedPacienteTurnos.length > 0) {
      const parts = editingTurno.fechaHora.split('-');
      const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
      
      let messages = [];
      if (duplicatedPacienteTurnos.length > 0) {
        messages.push(`El paciente ${p.nombre} ya tiene otro turno para el día ${formattedDate} por la ${editTurnoShift.toLowerCase()} a las ${duplicatedPacienteTurnos[0].hora} hs.`);
      }
      if (conflictos.length > 0) {
        const conflictNames = conflictos.map(c => c.pacienteNombre).join(', ');
        messages.push(`A las ${editingTurno.hora} hs ya hay turnos para: ${conflictNames}.`);
      }
      
      setCustomConfirm({
        title: 'Conflicto de Turno',
        message: `${messages.join(' ')} ¿Estás seguro de mover el turno a este horario?`,
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
        body: JSON.stringify({ estado: nuevoEstado, updatedBy: currentUserEmail || undefined }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar estado del turno');
      }

      const actualizado = await response.json();

      setTurnos(prevTurnos => 
        prevTurnos.map(t => t.id === id ? { ...t, estado: actualizado.estado, updatedAt: actualizado.updatedAt, updatedBy: actualizado.updatedBy } : t)
      );
      showToast(`Turno cambiado a estado ${nuevoEstado}`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'No se pudo actualizar el estado del turno.');
    }
  };

  const toggleTurnoSelection = (id: number) => {
    setSelectedTurnos(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const handleBulkUpdateEstado = async (nuevoEstado: 'PENDIENTE' | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE') => {
    try {
      await Promise.all(selectedTurnos.map(id => fetch(`http://localhost:3000/turnos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado, updatedBy: currentUserEmail || undefined }),
      })));
      
      setTurnos(prevTurnos => 
        prevTurnos.map(t => selectedTurnos.includes(t.id) ? { ...t, estado: nuevoEstado, updatedAt: new Date().toISOString(), updatedBy: currentUserEmail } : t)
      );
      setSelectedTurnos([]);
      showToast(`${selectedTurnos.length} turnos marcados como ${nuevoEstado}`);
    } catch (err: any) {
      console.error(err);
      alert('Error al actualizar los turnos en lote');
    }
  };

  const handleBulkDeleteTurnos = () => {
    setCustomConfirm({
      title: 'Eliminar Turnos Seleccionados',
      message: `¿Estás seguro de que deseas eliminar los ${selectedTurnos.length} turnos seleccionados? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar todos',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm: async () => {
        try {
          await Promise.all(selectedTurnos.map(id => fetch(`http://localhost:3000/turnos/${id}`, {
            method: 'DELETE',
          })));
          
          setTurnos(prevTurnos => prevTurnos.filter(t => !selectedTurnos.includes(t.id)));
          setSelectedTurnos([]);
          showToast(`${selectedTurnos.length} turnos eliminados con éxito`);
        } catch (err: any) {
          console.error(err);
          alert('Error al eliminar los turnos en lote');
        }
      }
    });
  };

  const getEstadoStyles = (estado: 'PENDIENTE' | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE') => {
    switch (estado) {
      case 'PENDIENTE':
        return {
          card: 'bg-slate-900 border-2 border-amber-500/40 hover:border-amber-500/70',
          badge: 'bg-amber-950/50 border-amber-500/20 text-amber-300'
        };
      case 'CONFIRMADO':
        return {
          card: 'bg-slate-900 border-2 border-blue-500/40 hover:border-blue-500/70',
          badge: 'bg-blue-950/50 border-blue-500/20 text-blue-300'
        };
      case 'ATENDIDO':
        return {
          card: 'bg-slate-900 border-2 border-emerald-500/40 hover:border-emerald-500/70',
          badge: 'bg-emerald-950/50 border-emerald-500/20 text-emerald-300'
        };
      case 'AUSENTE':
        return {
          card: 'bg-slate-900 border-2 border-rose-500/40 hover:border-rose-500/70',
          badge: 'bg-rose-950/50 border-rose-500/20 text-rose-300'
        };
      default:
        return {
          card: 'bg-slate-900 border-2 border-slate-800 hover:border-slate-700',
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

  if (!isMounted) return null;

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
            className="text-slate-400 hover:text-slate-200 p-2 hover:bg-slate-800 rounded-xl"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-extrabold text-slate-100 tracking-tight capitalize">
            Agenda de Turnos
          </h1>
        </div>
        
        {/* Global Paciente Search */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden sm:block w-64 md:w-96" ref={globalSearchRef}>
          <div className="relative w-full">
            <input
              type="text"
              className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 rounded-2xl text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-slate-900 focus:border-emerald-500 transition"
              placeholder="Buscar paciente por nombre o DNI..."
              value={globalSearchQuery}
              onChange={(e) => {
                setGlobalSearchQuery(e.target.value);
                setShowGlobalSearchDropdown(true);
              }}
              onFocus={() => setShowGlobalSearchDropdown(true)}
            />
            {globalSearchQuery.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setGlobalSearchQuery('');
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

        {/* Dashboard Main Content */}
        <main className="flex-grow p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          
          {/* Sucursal de Hoy - Controls bar */}
          {activeTab === 'turnos' && calendarViewMode === 'day' && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-sm">
            <div className="flex flex-wrap items-center gap-5">
              {/* Date selection & offsets */}
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => changeDateOffset(-1)}
                  className="p-2 border border-slate-800 hover:bg-slate-800 rounded-xl transition text-slate-400"
                  title="Día anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <input 
                  type="date"
                    onClick={(e) => (e.target as any).showPicker?.()}
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  className="px-3.5 py-2 border border-slate-800 bg-slate-950 rounded-xl text-sm font-extrabold focus:outline-none focus:border-emerald-500 text-white cursor-pointer"
                />

                <button 
                  onClick={() => changeDateOffset(1)}
                  className="p-2 border border-slate-800 hover:bg-slate-800 rounded-xl transition text-slate-400"
                  title="Día siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                
                <button 
                  onClick={() => setCurrentDate(getTodayFormatted())}
                  className="px-3.5 py-1.5 ml-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
                  title="Ir a hoy"
                >
                  Hoy
                </button>
              </div>

              {/* Sucursal de Hoy details with override options */}
              <div className="flex items-center space-x-3.5 border-l border-slate-800 pl-5">
                <div className="p-2 bg-emerald-950/40 text-emerald-400 rounded-xl border border-emerald-900/30">
                  <MapPin className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <span className="text-slate-200 font-extrabold text-xl block py-1 pr-4 capitalize tracking-tight">{selectedCity}</span>
                  </div>
                  
                  <div className="border-l border-slate-800 pl-4 flex items-center">
                    <button
                      onClick={() => {
                        setTempCity(selectedCity);
                        setIsEditingConfig(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80"
                      title="Modificar Configuración"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Modificar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {activeTab === 'turnos' && (
                <>
                  <button 
                    onClick={() => {
                      setNewTurno({ ...newTurno, fechaHora: currentDate, ciudad: selectedCity });
                      setShowNewTurnoModal(true);
                    }}
                    className="w-full md:w-auto px-5 py-2.5 font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <Plus className="h-4.5 w-4.5" />
                    <span>Nuevo Turno</span>
                  </button>
                  <button 
                    onClick={() => setShowNewPacienteModal(true)}
                    className="w-full md:w-auto px-5 py-2.5 font-bold text-sm text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-2xl flex items-center justify-center gap-2 border border-slate-700 transition"
                  >
                    <UserPlus className="h-4.2 w-4.2" />
                    <span>Registrar Paciente</span>
                  </button>
                </>
              )}

            </div>
          </div>
          )}

          {activeTab === 'turnos' && calendarViewMode === 'month' && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-sm">
              {/* Month Navigation */}
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => {
                    const [y, m, d] = currentDate.split('-');
                    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 2, 1);
                    setCurrentDate(`${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-01`);
                  }}
                  className="p-2 border border-slate-800 hover:bg-slate-800 rounded-xl transition text-slate-400"
                  title="Mes anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <span className="text-base font-extrabold text-slate-100 min-w-[150px] text-center first-letter:capitalize">
                  {new Date(
                    parseInt(currentDate.split('-')[0], 10),
                    parseInt(currentDate.split('-')[1], 10) - 1,
                    1
                  ).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </span>

                <button 
                  onClick={() => {
                    const [y, m, d] = currentDate.split('-');
                    const date = new Date(parseInt(y, 10), parseInt(m, 10), 1);
                    setCurrentDate(`${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-01`);
                  }}
                  className="p-2 border border-slate-800 hover:bg-slate-800 rounded-xl transition text-slate-400"
                  title="Mes siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                
                <button 
                  onClick={() => setCurrentDate(getTodayFormatted())}
                  className="px-3.5 py-1.5 ml-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
                  title="Ir a hoy"
                >
                  Hoy
                </button>
              </div>

              {/* Quick buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => {
                    setNewTurno({ ...newTurno, fechaHora: currentDate, ciudad: selectedCity });
                    setShowNewTurnoModal(true);
                  }}
                  className="w-full md:w-auto px-5 py-2.5 font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Plus className="h-4.5 w-4.5" />
                  <span>Nuevo Turno</span>
                </button>
                <button 
                  onClick={() => setShowNewPacienteModal(true)}
                  className="w-full md:w-auto px-5 py-2.5 font-bold text-sm text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-2xl flex items-center justify-center gap-2 border border-slate-700 transition"
                >
                  <UserPlus className="h-4.2 w-4.2" />
                  <span>Registrar Paciente</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: CALENDARIO EN INTERVALOS DE 15 MINUTOS */}
          {activeTab === 'turnos' && (
            <>
              {calendarViewMode === 'day' ? (
                <div className="space-y-6">
                {/* Date label header info */}
                {(() => {
                  const dateParts = currentDate.split('-');
                  const dayOfWeek = new Date(
                    parseInt(dateParts[0], 10),
                    parseInt(dateParts[1], 10) - 1,
                    parseInt(dateParts[2], 10)
                  ).getDay();
                  
                  const morningTurnos = turnos.some(t => t.fechaHora === currentDate && parseInt(t.hora.split(':')[0], 10) < 15);
                  const isMorningAvailable = [0, 5, 6].includes(dayOfWeek) || !!savedConfigs['Mañana'] || morningTurnos;

                  const getCityForShift = (newShift: 'Mañana' | 'Tarde') => {
                    if (savedConfigs[newShift]) return savedConfigs[newShift].ciudad;
                    switch (dayOfWeek) {
                      case 1: case 3: case 4:
                        return newShift === 'Tarde' ? 'Rosario del Tala' : 'Cerrado';
                      case 2:
                        return newShift === 'Tarde' ? 'Maciá' : 'Cerrado';
                      case 5:
                        return newShift === 'Mañana' ? 'Gualeguay' : 'Galarza';
                      default:
                        return 'Cerrado';
                    }
                  };

                  return (
                    <div className="flex flex-col gap-4">
                      {/* Date and Place Box */}
                      <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                        <div>

                          <h2 className="text-xl font-extrabold mt-1 tracking-tight first-letter:capitalize">
                            {getFormattedDateLabel(currentDate)}
                          </h2>
                        </div>
                        <div className="bg-slate-950 px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider border border-slate-800 text-slate-300">
                          {selectedCity}
                        </div>
                      </div>

                      {/* View & Shift Toggles */}
                      <div className="flex items-center gap-4">
                        {/* View Toggle */}
                        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-sm">
                          <button
                            onClick={() => setCalendarViewMode('day')}
                            className="px-6 py-2 text-xs font-bold rounded-xl transition bg-emerald-600 text-white shadow-md shadow-emerald-900/10"
                          >
                            Día
                          </button>
                          <button
                            onClick={() => setCalendarViewMode('month')}
                            className="px-6 py-2 text-xs font-bold rounded-xl transition text-slate-400 hover:text-slate-200"
                          >
                            Mes
                          </button>
                        </div>

                        {/* Shift Toggle */}
                        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-sm">
                          <button 
                            onClick={() => {
                              setSelectedShift('Mañana');
                              setSelectedCity(getCityForShift('Mañana'));
                            }}
                            className={`px-6 py-2 text-xs font-bold rounded-xl transition-colors ${
                               selectedShift === 'Mañana' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Mañana
                          </button>
                          <button 
                             onClick={() => {
                               setSelectedShift('Tarde');
                               setSelectedCity(getCityForShift('Tarde'));
                             }}
                             className={`px-6 py-2 text-xs font-bold rounded-xl transition-colors ${
                               selectedShift === 'Tarde' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Tarde
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}


                {timeSlots.length === 0 ? (
                  <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-sm p-12 text-center flex flex-col items-center justify-center space-y-5">
                    <div className="h-14 w-14 bg-rose-950/40 text-rose-400 rounded-2xl border border-rose-900/30 flex items-center justify-center">
                      <AlertCircle className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-100">Sucursal Cerrada / Sin Turnos</h3>
                      <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
                        No hay atención configurada para este bloque horario.
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        setTempCity(selectedCity);
                        setIsEditingConfig(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2 mt-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Habilitar Sucursal
                    </button>
                  </div>
                ) : (
                  /* Google Calendar style schedule grid every 15 minutes */
                  <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-sm overflow-hidden">
                    <div className="divide-y divide-slate-800">
                      {timeSlots.map((time) => {
                        const matchedAppts = calendarTurnos.filter(t => t.hora === time);
                        
                        // Timeline logic
                        const isToday = currentDate === getTodayFormatted();
                        let showTimeline = false;
                        let timelinePercentage = 0;
                        if (isToday && currentTime) {
                          const options = { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false } as const;
                          const formatter = new Intl.DateTimeFormat('en-US', options);
                          const timeString = formatter.format(currentTime);
                          const [currHr, currMin] = timeString.split(':').map(Number);
                          const currentTotalMins = currHr * 60 + currMin;
                          const [slotHr, slotMin] = time.split(':').map(Number);
                          const slotTotalMins = slotHr * 60 + slotMin;
                          
                          if (currentTotalMins >= slotTotalMins && currentTotalMins < slotTotalMins + 15) {
                            showTimeline = true;
                            timelinePercentage = ((currentTotalMins - slotTotalMins) / 15) * 100;
                          }
                        }
                        
                        return (
                          <div key={time} className="relative flex min-h-[70px] group transition hover:bg-slate-950/40">
                            {/* Current Time Line */}
                            {showTimeline && (
                              <div 
                                className="absolute left-0 right-0 z-40 pointer-events-none" 
                                style={{ top: `${timelinePercentage}%` }}
                              >
                                <div className="absolute left-0 right-0 h-[2px] bg-emerald-600 -translate-y-1/2"></div>
                                <div className="absolute left-0 w-3 h-3 bg-emerald-600 rounded-full -translate-y-1/2"></div>
                              </div>
                            )}

                            {/* Time Column */}
                            <div className="w-24 sm:w-28 px-4 py-4.5 border-r border-slate-800 flex-shrink-0 flex items-center justify-end font-bold text-slate-400 text-sm">
                              {time}
                            </div>

                            {/* Appt Card Slot */}
                            <div className="flex-grow p-2.5 flex flex-col sm:flex-row gap-3 min-w-0">
                              {matchedAppts.length > 0 ? (
                                matchedAppts.map((appt) => {
                                  const styles = getEstadoStyles(appt.estado);
                                  return (
                                    <div 
                                      key={appt.id}
                                      className={`flex-grow p-4 rounded-2xl transition duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm relative group/card min-w-0 ${selectedTurnos.includes(appt.id) ? 'ring-2 ring-emerald-500 bg-emerald-950/20 border-emerald-500/50' : styles.card}`}
                                    >
                                      {/* Left: Checkbox & Name */}
                                      <div className="flex items-center gap-4 md:w-1/3 min-w-0">
                                        <div className="flex items-center justify-center flex-shrink-0">
                                          <input 
                                            type="checkbox" 
                                            checked={selectedTurnos.includes(appt.id)} 
                                            onChange={() => toggleTurnoSelection(appt.id)}
                                            className="w-5 h-5 accent-emerald-500 rounded border-slate-700 cursor-pointer"
                                          />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                          <span 
                                            className="font-extrabold text-base tracking-tight text-slate-100 truncate"
                                            title={appt.pacienteNombre}
                                          >
                                            {appt.pacienteNombre}
                                          </span>
                                          {appt.updatedAt && appt.updatedBy && (
                                            <span className="text-[10px] text-slate-400 font-medium">
                                              Modificado: {new Date(appt.updatedAt).toLocaleString('es-AR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'})} por {appt.updatedBy.split('@')[0]}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* Right: State Selector and Actions */}
                                      <div className="flex items-center gap-4 justify-end">
                                        <div className="relative inline-flex items-center">
                                          <select
                                            value={appt.estado}
                                            onChange={(e) => updateTurnoEstado(appt.id, e.target.value as any)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border uppercase tracking-wider outline-none cursor-pointer hover:opacity-80 transition appearance-none pr-8 ${styles.badge}`}
                                          >
                                            <option value="PENDIENTE" className="text-slate-800 bg-white">PENDIENTE</option>
                                            <option value="CONFIRMADO" className="text-slate-800 bg-white">CONFIRMADO</option>
                                            <option value="ATENDIDO" className="text-slate-800 bg-white">ATENDIDO</option>
                                            <option value="AUSENTE" className="text-slate-800 bg-white">AUSENTE</option>
                                          </select>
                                          <ChevronDown className="absolute right-2 h-3 w-3 pointer-events-none opacity-70" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button 
                                            onClick={() => {
                                              setEditingTurno(appt);
                                              setPacienteSearchQuery(appt.pacienteNombre || '');
                                              setShowEditTurnoModal(true);
                                            }}
                                            className="p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-700 bg-slate-950/40 border border-slate-800/60 rounded-xl transition flex items-center justify-center"
                                            title="Editar turno"
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteTurno(appt.id)}
                                            className="p-1.5 text-rose-400 hover:bg-slate-800 hover:text-white hover:border-slate-700 bg-slate-950/40 border border-slate-800/60 rounded-xl transition flex items-center justify-center"
                                            title="Eliminar turno"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                // Fast trigger add button
                                <button 
                                  onClick={() => {
                                    setNewTurno({
                                      ...newTurno,
                                      fechaHora: currentDate,
                                      hora: time,
                                      ciudad: selectedCity
                                    });
                                    setShowNewTurnoModal(true);
                                  }}
                                  className="w-full flex items-center justify-center border border-dashed border-slate-200 hover:border-slate-400 rounded-2xl p-2.5 text-xs font-bold text-slate-400 hover:text-slate-700 hover:bg-white transition"
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1" />
                                  <span>Agendar {time}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* MONTH VIEW MODE */
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

                  <h2 className="text-xl font-extrabold mt-1 tracking-tight first-letter:capitalize">
                    {new Date(
                      parseInt(currentDate.split('-')[0], 10),
                      parseInt(currentDate.split('-')[1], 10) - 1,
                      1
                    ).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </h2>
                </div>

                <div className="flex items-center gap-4">
                  {/* View Toggle */}
                  <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-sm">
                    <button
                      onClick={() => setCalendarViewMode('day')}
                      className="px-6 py-2 text-xs font-bold rounded-xl transition text-slate-400 hover:text-slate-200"
                    >
                      Día
                    </button>
                    <button
                      onClick={() => setCalendarViewMode('month')}
                      className="px-6 py-2 text-xs font-bold rounded-xl transition bg-emerald-600 text-white shadow-md shadow-emerald-900/10"
                    >
                      Mes
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                  {/* Days of week header */}
                  <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-4 bg-slate-950/60 border-b border-slate-800">
                    <div>Lun</div>
                    <div>Mar</div>
                    <div>Mié</div>
                    <div>Jue</div>
                    <div>Vie</div>
                    <div>Sáb</div>
                    <div>Dom</div>
                  </div>

                  {/* Grid cells */}
                  <div className="grid grid-cols-7 divide-x divide-y divide-slate-800/60 border-t border-slate-800/60">
                    {(() => {
                      const cells = getCalendarCells(currentDate);
                      return cells.map((cell, idx) => {
                        const dateTurnos = turnos.filter(t => t.fechaHora.split('T')[0] === cell.dateString);
                        
                        const configManana = allConfigs.find(c => c.fecha === `${cell.dateString}_MANANA`)?.ciudad || getDefaultsForDate(cell.dateString, '09:00').ciudad;
                        const configTarde = allConfigs.find(c => c.fecha === `${cell.dateString}_TARDE`)?.ciudad || getDefaultsForDate(cell.dateString, '16:00').ciudad;
                        
                        const validCities = [configManana, configTarde].filter(c => c !== 'Cerrado');
                        const uniqueValid = Array.from(new Set(validCities));
                        
                        let sucursalVal = 'Cerrado';
                        if (uniqueValid.length === 1) sucursalVal = uniqueValid[0];
                        else if (uniqueValid.length > 1) sucursalVal = uniqueValid.join(' y ');

                        const isSelected = cell.dateString === currentDate;

                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              setCurrentDate(cell.dateString);
                              setCalendarViewMode('day');
                            }}
                            className={`min-h-[105px] p-3 flex flex-col justify-between hover:bg-slate-850/30 transition cursor-pointer select-none ${
                              cell.isCurrentMonth ? 'bg-slate-900 text-slate-100' : 'bg-slate-950/35 text-slate-600'
                            } ${isSelected ? 'ring-2 ring-emerald-500 ring-inset z-10' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                                cell.isToday 
                                  ? 'bg-emerald-600 text-white font-black' 
                                  : cell.isCurrentMonth ? 'text-slate-300' : 'text-slate-600'
                              }`}>
                                {cell.dayNumber}
                              </span>
                            </div>

                            <div className="space-y-1 mt-2">
                              <div className={`text-[10px] font-bold truncate ${
                                cell.isCurrentMonth ? 'text-slate-200' : 'text-slate-700'
                              }`}>
                                <span className="hidden sm:inline truncate">{sucursalVal}</span>
                                <span className="sm:hidden truncate">
                                  {sucursalVal
                                    .replace('Rosario del Tala', 'Tala')
                                    .replace('Gualeguay', 'Gual')
                                    .replace('Galarza', 'Gal')
                                    .replace('Cerrado', 'Cerr')
                                    .replace(' y ', '/')
                                  }
                                </span>
                              </div>

                              {dateTurnos.length > 0 && (
                                <div className="bg-emerald-950/40 border border-emerald-900/30 text-emerald-450 font-black text-[9px] px-1.5 py-0.5 rounded-lg inline-flex items-center gap-1">
                                  <span>{dateTurnos.length}</span>
                                  <span className="hidden sm:inline">{dateTurnos.length === 1 ? 'turno' : 'turnos'}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            )}
            </>
          )}
        </main>

      {/* Floating Action Bar for Bulk Select */}
      {selectedTurnos.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[90] bg-slate-900 border border-slate-700 shadow-2xl shadow-emerald-900/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center sm:space-x-4 gap-3 sm:gap-0">
          <div className="text-slate-200 font-bold text-sm whitespace-nowrap">
            <span className="text-emerald-400 text-lg">{selectedTurnos.length}</span> seleccionados
          </div>
          <div className="hidden sm:block h-8 w-px bg-slate-700"></div>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={handleBulkDeleteTurnos} className="px-3 py-1.5 bg-rose-950/40 text-rose-400 border border-rose-500/30 rounded-xl hover:bg-rose-900/60 transition flex items-center justify-center" title="Eliminar Seleccionados">
              <Trash2 className="h-4 w-4" />
            </button>
            <div className="hidden sm:block h-6 w-px bg-slate-700/80 self-center mx-1"></div>
            <button onClick={() => handleBulkUpdateEstado('PENDIENTE')} className="px-3 py-1.5 bg-slate-600/20 text-slate-400 border border-slate-500/30 rounded-xl text-xs font-bold hover:bg-slate-600/30 transition">
              Pendientes
            </button>
            <button onClick={() => handleBulkUpdateEstado('ATENDIDO')} className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold hover:bg-emerald-600/30 transition">
              Atendidos
            </button>
            <button onClick={() => handleBulkUpdateEstado('CONFIRMADO')} className="px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold hover:bg-blue-600/30 transition">
              Confirmados
            </button>
            <button onClick={() => handleBulkUpdateEstado('AUSENTE')} className="px-3 py-1.5 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold hover:bg-rose-600/30 transition">
              Ausentes
            </button>
          </div>
          <button onClick={() => setSelectedTurnos([])} className="absolute -top-3 -right-3 p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-full border border-slate-700 hover:bg-slate-700 transition shadow-lg">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* MODAL: EDITAR AGENDA */}
      {isEditingConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-800">
            <div className="px-6 py-5 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
              <span className="font-extrabold text-slate-100 text-lg">Modificar Agenda</span>
              <button 
                onClick={() => setIsEditingConfig(false)} 
                className="text-slate-400 p-1.5 hover:bg-slate-800 rounded-xl transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold block uppercase">Ciudad / Sucursal</label>
                <div className="relative">
                  <select 
                    value={tempCity}
                    onChange={(e) => setTempCity(e.target.value)}
                    className="w-full appearance-none pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
                  >
                    {ciudadesDisponibles.map(c => (
                      <option key={c} value={c} className="bg-slate-900 text-slate-200">{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-800/60">
                <button
                  onClick={() => setIsEditingConfig(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-400 hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    const affectedTurnos = turnos.filter(t => {
                      if (t.fechaHora !== currentDate || t.ciudad !== selectedCity) return false;
                      const hr = parseInt(t.hora.split(':')[0], 10);
                      if (selectedShift === 'Mañana') return hr < 15;
                      if (selectedShift === 'Tarde') return hr >= 15;
                      return false;
                    });
                    
                    let extraMessage = '';
                    let confirmType: 'warning' | 'danger' | 'info' = 'warning';
                    
                    if (affectedTurnos.length > 0) {
                      if (tempCity === 'Cerrado') {
                        extraMessage = ` ATENCIÓN: Se eliminarán ${affectedTurnos.length} turnos que estaban agendados en ${selectedCity} para este bloque.`;
                        confirmType = 'danger';
                      } else {
                        extraMessage = ` Hay ${affectedTurnos.length} turnos que serán movidos automáticamente a ${tempCity}.`;
                      }
                    }

                    setCustomConfirm({
                      title: 'Modificar Agenda',
                      message: `¿Estás seguro de modificar la sucursal del día ${currentDate.split('-').reverse().join('/')} a ${tempCity} en el turno ${selectedShift}?${extraMessage}`,
                      confirmText: tempCity === 'Cerrado' && affectedTurnos.length > 0 ? 'Sí, modificar y eliminar' : 'Sí, guardar',
                      cancelText: 'Cancelar',
                      type: confirmType,
                      onConfirm: async () => {
                        try {
                          if (affectedTurnos.length > 0) {
                            if (tempCity === 'Cerrado') {
                              // Delete affected turnos
                              await Promise.all(affectedTurnos.map(t => fetch(`http://localhost:3000/turnos/${t.id}`, { method: 'DELETE' })));
                              setTurnos(prev => prev.filter(t => !affectedTurnos.find(at => at.id === t.id)));
                            } else {
                              // Move affected turnos
                              await Promise.all(affectedTurnos.map(t => {
                                const isoDateTime = `${t.fechaHora}T${t.hora}:00.000Z`;
                                return fetch(`http://localhost:3000/turnos/${t.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    pacienteId: t.pacienteId,
                                    fechaHora: isoDateTime,
                                    ciudad: tempCity,
                                    estado: t.estado,
                                    notas: t.notas,
                                    updatedBy: currentUserEmail || undefined
                                  })
                                });
                              }));
                              setTurnos(prev => prev.map(t => {
                                if (affectedTurnos.find(at => at.id === t.id)) {
                                  return { ...t, ciudad: tempCity };
                                }
                                return t;
                              }));
                            }
                          }
                          setSelectedCity(tempCity);
                          await handleSaveConfig(tempCity, selectedShift);
                          setIsEditingConfig(false);
                          
                          if (affectedTurnos.length > 0) {
                            showToast(tempCity === 'Cerrado' ? `${affectedTurnos.length} turnos eliminados` : `${affectedTurnos.length} turnos movidos a ${tempCity}`);
                          }
                        } catch (err) {
                          console.error("Error updating affected turnos:", err);
                          alert("Error al procesar los turnos afectados.");
                        }
                      }
                    });
                  }}
                  disabled={tempCity === selectedCity}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-sm ${
                    tempCity !== selectedCity 
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                        const val = e.target.value;
                        setPacienteSearchQuery(val);
                        setShowPacienteDropdown(val.trim() !== '');
                        setActivePacienteIndex(-1);
                        
                        if (newTurno.pacienteId) {
                          setNewTurno({ ...newTurno, pacienteId: '' });
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
                      className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 rounded-2xl text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-slate-900 focus:border-emerald-500 transition"
                      required
                    />
                    
                    {pacienteSearchQuery.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setNewTurno({ ...newTurno, pacienteId: '' });
                          setPacienteSearchQuery('');
                          setShowPacienteDropdown(false);
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
                          <span>{p.nombre}</span>
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
                  <div className="relative">
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
                      className="w-full appearance-none pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-slate-900 focus:border-slate-700 transition"
                      required
                    >
                      {getModalTimeSlots().map(time => (
                        <option key={time} value={time} className="bg-slate-900 text-slate-200">{time}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-bold block uppercase">Ciudad / Sucursal</label>
                  <div className="relative">
                    <select 
                      value={newTurno.ciudad}
                      className="w-full appearance-none pl-4 pr-10 py-3 border border-slate-800 bg-slate-950/80 text-slate-500 rounded-2xl text-sm font-semibold focus:outline-none cursor-not-allowed opacity-60"
                      disabled
                    >
                      {ciudadesDisponibles.map(c => (
                        <option key={c} value={c} className="bg-slate-900 text-slate-200">{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 opacity-60 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-bold block uppercase">Estado</label>
                  <div className="relative">
                    <select 
                      value={newTurno.estado}
                      onChange={(e) => setNewTurno({ ...newTurno, estado: e.target.value as 'PENDIENTE' | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE' })}
                      className="w-full appearance-none pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
                    >
                      <option value="PENDIENTE" className="bg-slate-900 text-slate-200">PENDIENTE</option>
                      <option value="CONFIRMADO" className="bg-slate-900 text-slate-200">CONFIRMADO</option>
                      <option value="ATENDIDO" className="bg-slate-900 text-slate-200">ATENDIDO</option>
                      <option value="AUSENTE" className="bg-slate-900 text-slate-200">AUSENTE</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
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
                            setEditingTurno({ ...editingTurno, pacienteId: p.id, pacienteNombre: p.nombre });
                            setPacienteSearchQuery(p.nombre);
                            setShowPacienteDropdown(false);
                          } else if (activePacienteIndex === filteredPatientsForAutocomplete.length && hasInlineOption) {
                            handleQuickRegisterPacienteWithNameFromEdit(pacienteSearchQuery);
                          } else if (filteredPatientsForAutocomplete.length > 0) {
                            const p = filteredPatientsForAutocomplete[0];
                            setEditingTurno({ ...editingTurno, pacienteId: p.id, pacienteNombre: p.nombre });
                            setPacienteSearchQuery(p.nombre);
                            setShowPacienteDropdown(false);
                          }
                        } else if (e.key === 'Escape') {
                          setShowPacienteDropdown(false);
                        }
                      }}
                      className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 rounded-2xl text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-slate-900 focus:border-emerald-500 transition"
                      required
                    />
                    
                    {pacienteSearchQuery.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTurno({ ...editingTurno, pacienteId: 0, pacienteNombre: '' });
                          setPacienteSearchQuery('');
                          setShowPacienteDropdown(false);
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
                            setEditingTurno({ ...editingTurno, pacienteId: p.id, pacienteNombre: p.nombre });
                            setPacienteSearchQuery(p.nombre);
                            setShowPacienteDropdown(false);
                          }}
                          onMouseEnter={() => setActivePacienteIndex(idx)}
                          className={`px-4 py-2.5 cursor-pointer font-semibold flex items-center justify-between transition ${
                            isSelected ? 'bg-emerald-600 text-white' : isActive ? 'bg-slate-800 text-slate-200' : 'text-slate-300 hover:bg-slate-800/60'
                          }`}
                        >
                          <span>{p.nombre}</span>
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
                  <div className="relative">
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
                      className="w-full appearance-none pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-slate-900 focus:border-slate-700 transition"
                      required
                    >
                      {getModalTimeSlots().map(time => (
                        <option key={time} value={time} className="bg-slate-900 text-slate-200">{time}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-bold block uppercase">Ciudad / Sucursal</label>
                  <div className="relative">
                    <select 
                      value={editingTurno.ciudad}
                      className="w-full appearance-none pl-4 pr-10 py-3 border border-slate-800 bg-slate-950/80 text-slate-500 rounded-2xl text-sm font-semibold focus:outline-none cursor-not-allowed opacity-60"
                      disabled
                    >
                      {ciudadesDisponibles.map(c => (
                        <option key={c} value={c} className="bg-slate-900 text-slate-200">{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 opacity-60 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-bold block uppercase">Estado</label>
                  <div className="relative">
                    <select 
                      value={editingTurno.estado}
                      onChange={(e) => setEditingTurno({ ...editingTurno, estado: e.target.value as 'PENDIENTE' | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE' })}
                      className="w-full appearance-none pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
                    >
                      <option value="PENDIENTE" className="bg-slate-900 text-slate-200">PENDIENTE</option>
                      <option value="CONFIRMADO" className="bg-slate-900 text-slate-200">CONFIRMADO</option>
                      <option value="ATENDIDO" className="bg-slate-900 text-slate-200">ATENDIDO</option>
                      <option value="AUSENTE" className="bg-slate-900 text-slate-200">AUSENTE</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
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
                  className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-slate-900 focus:border-slate-700 transition"
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
                        className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
                        placeholder="Ej: 12345678"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-bold block uppercase">Teléfono</label>
                      <input 
                        type="text"
                        value={newPaciente.telefono}
                        onChange={(e) => setNewPaciente({ ...newPaciente, telefono: e.target.value })}
                        className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
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
                        className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
                        placeholder="Ej: juan@gmail.com"
                      />
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
                  className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-slate-900 focus:border-slate-700 transition"
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
                      className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
                      placeholder="Ej: 12345678"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-450 font-bold block uppercase">Teléfono</label>
                    <input 
                      type="text"
                      value={editingPaciente.telefono || ''}
                      onChange={(e) => setEditingPaciente({ ...editingPaciente, telefono: e.target.value })}
                      className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
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
                      className="w-full pl-4 pr-10 py-3 border border-slate-800 bg-slate-950 text-white rounded-2xl text-sm font-semibold focus:outline-none focus:border-slate-700 transition"
                      placeholder="Ej: juan@gmail.com"
                    />
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
    </>
  );
}
