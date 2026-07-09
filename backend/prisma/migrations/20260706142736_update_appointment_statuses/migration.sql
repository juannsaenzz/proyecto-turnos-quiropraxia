/*
  Warnings:

  - The values [CANCELADO] on the enum `EstadoTurno` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EstadoTurno_new" AS ENUM ('PENDIENTE', 'CONFIRMADO', 'ATENDIDO', 'AUSENTE');
ALTER TABLE "public"."Turno" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "Turno" ALTER COLUMN "estado" TYPE "EstadoTurno_new" USING ("estado"::text::"EstadoTurno_new");
ALTER TYPE "EstadoTurno" RENAME TO "EstadoTurno_old";
ALTER TYPE "EstadoTurno_new" RENAME TO "EstadoTurno";
DROP TYPE "public"."EstadoTurno_old";
ALTER TABLE "Turno" ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE';
COMMIT;

-- AlterTable
ALTER TABLE "Turno" ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE';
