const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const nextThursday = new Date("2026-10-08T00:00:00.000Z");
  const nextFriday = new Date("2026-10-09T00:00:00.000Z");

  const turnosJueves = await prisma.turno.findMany({
    where: {
      fechaHora: {
        gte: new Date("2026-10-08T00:00:00.000Z"),
        lt: new Date("2026-10-09T00:00:00.000Z")
      }
    },
    include: { paciente: true }
  });

  const turnosViernes = await prisma.turno.findMany({
    where: {
      fechaHora: {
        gte: new Date("2026-10-09T00:00:00.000Z"),
        lt: new Date("2026-10-10T00:00:00.000Z")
      }
    },
    include: { paciente: true }
  });

  console.log("=== JUEVES 8 DE OCTUBRE ===");
  turnosJueves.forEach(t => console.log(`${t.fechaHora.toISOString().substring(11,16)} - ${t.paciente.nombre} (${t.ciudad})`));

  console.log("\n=== VIERNES 9 DE OCTUBRE ===");
  turnosViernes.forEach(t => console.log(`${t.fechaHora.toISOString().substring(11,16)} - ${t.paciente.nombre} (${t.ciudad})`));
}

check().then(() => process.exit(0));
