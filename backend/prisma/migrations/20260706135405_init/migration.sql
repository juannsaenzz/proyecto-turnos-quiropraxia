-- CreateEnum
CREATE TYPE "EstadoTurno" AS ENUM ('CONFIRMADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paciente" (
    "id" SERIAL NOT NULL,
    "dni" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,

    CONSTRAINT "Paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Turno" (
    "id" SERIAL NOT NULL,
    "pacienteId" INTEGER NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL,
    "ciudad" TEXT NOT NULL,
    "notas" TEXT,
    "estado" "EstadoTurno" NOT NULL DEFAULT 'CONFIRMADO',

    CONSTRAINT "Turno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialClinico" (
    "id" SERIAL NOT NULL,
    "pacienteId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "notas" TEXT NOT NULL,

    CONSTRAINT "HistorialClinico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Paciente_dni_key" ON "Paciente"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "Paciente_email_key" ON "Paciente"("email");

-- AddForeignKey
ALTER TABLE "Turno" ADD CONSTRAINT "Turno_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialClinico" ADD CONSTRAINT "HistorialClinico_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
