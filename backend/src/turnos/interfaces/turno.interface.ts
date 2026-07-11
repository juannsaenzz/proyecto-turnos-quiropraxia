export interface Turno {
  id: number;
  pacienteId: number;
  fechaHora: string; // ISO string representation
  ciudad: string;
  notas: string;
  estado: 'PENDIENTE' | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE';
  updatedAt?: Date;
  updatedBy?: string;
}
