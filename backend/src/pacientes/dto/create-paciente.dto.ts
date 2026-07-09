import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';

export class CreatePacienteDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @IsString()
  @IsOptional()
  dni?: string;

  @IsEmail({}, { message: 'El formato de correo es inválido' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  fechaNacimiento?: string;
}
