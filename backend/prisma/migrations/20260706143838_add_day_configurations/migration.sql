-- CreateTable
CREATE TABLE "ConfiguracionDia" (
    "id" TEXT NOT NULL,
    "fecha" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "bloque" TEXT NOT NULL,

    CONSTRAINT "ConfiguracionDia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracionDia_fecha_key" ON "ConfiguracionDia"("fecha");
