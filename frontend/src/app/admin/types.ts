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
  estado: 'PENDIENTE' | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE';
}

export interface Historial {
  id: number;
  pacienteId: number;
  pacienteNombre: string;
  fecha: string; // YYYY-MM-DD
  notas: string;
}
