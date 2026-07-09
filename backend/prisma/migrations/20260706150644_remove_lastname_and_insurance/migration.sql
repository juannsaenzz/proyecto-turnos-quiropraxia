/*
  Warnings:

  - You are about to drop the column `apellido` on the `Paciente` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Paciente" DROP COLUMN "apellido",
ADD COLUMN     "fechaNacimiento" TEXT,
ALTER COLUMN "dni" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "telefono" DROP NOT NULL;
