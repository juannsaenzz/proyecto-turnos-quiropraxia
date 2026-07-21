"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Paciente {
  id: number;
  nombre: string;
  dni?: string;
  email?: string;
  telefono?: string;
  fechaNacimiento?: string;
}

export interface Turno {
  id: number;
  pacienteId: number;
  pacienteNombre: string;
  fechaHora: string; // YYYY-MM-DD
  hora: string; // HH:MM
  ciudad: string;
  notas: string;
  estado: "PENDIENTE" | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE';
  updatedAt?: string;
  updatedBy?: string;
}

export interface Historial {
  id: number;
  pacienteId: number;
  pacienteNombre: string;
  fecha: string; // YYYY-MM-DD
  notas: string;
}

export interface ConfiguracionDia {
  fecha: string; 
  ciudad: string; 
  bloque: string;
}

interface GlobalDataContextType {
  pacientes: Paciente[];
  setPacientes: React.Dispatch<React.SetStateAction<Paciente[]>>;
  turnos: Turno[];
  setTurnos: React.Dispatch<React.SetStateAction<Turno[]>>;
  historiales: Historial[];
  setHistoriales: React.Dispatch<React.SetStateAction<Historial[]>>;
  allConfigs: ConfiguracionDia[];
  setAllConfigs: React.Dispatch<React.SetStateAction<ConfiguracionDia[]>>;
  loading: boolean;
  refreshData: () => Promise<void>;
}

import LoadingSpinner from './LoadingSpinner';

const GlobalDataContext = createContext<GlobalDataContextType | undefined>(undefined);

export function GlobalDataProvider({ children }: { children: React.ReactNode }) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [historiales, setHistoriales] = useState<Historial[]>([]);
  const [allConfigs, setAllConfigs] = useState<ConfiguracionDia[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDbData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Pacientes
      const resPacientes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/pacientes`);
      if (!resPacientes.ok) throw new Error('Error al cargar pacientes');
      const dataPacientes = await resPacientes.json();
      setPacientes(dataPacientes);

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
          updatedAt: t.updatedAt,
          updatedBy: t.updatedBy
        };
      });
      setTurnos(mappedTurnos);

      // 3. Fetch All Configs
      const resConfigs = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/configuracion-dia`);
      if (!resConfigs.ok) throw new Error('Error al cargar configuraciones');
      const dataConfigs = await resConfigs.json();
      setAllConfigs(dataConfigs);

      // 4. Fetch Historiales
      const resHistorial = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/historial`);
      if (!resHistorial.ok) throw new Error('Error al cargar historiales');
      const dataHistorial = await resHistorial.json();
      setHistoriales(dataHistorial);

    } catch (error) {
      console.error('Error fetching database records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDbData();
  }, []);

  return (
    <GlobalDataContext.Provider value={{
      pacientes, setPacientes,
      turnos, setTurnos,
      historiales, setHistoriales,
      allConfigs, setAllConfigs,
      loading,
      refreshData: loadDbData
    }}>
      {loading ? <LoadingSpinner message="Cargando datos..." /> : children}
    </GlobalDataContext.Provider>
  );
}

export function useGlobalData() {
  const context = useContext(GlobalDataContext);
  if (context === undefined) {
    throw new Error('useGlobalData must be used within a GlobalDataProvider');
  }
  return context;
}
