const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Iniciando migración de turnos Jueves <-> Viernes...');
  
  // 1. Obtener todos los turnos futuros
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const turnos = await prisma.turno.findMany({
    where: {
      fechaHora: {
        gte: today,
      },
    },
  });

  let modificados = 0;

  for (const turno of turnos) {
    const d = new Date(turno.fechaHora);
    const day = d.getDay(); // 4 = Jueves, 5 = Viernes

    if (day === 4) {
      // Jueves -> Sumar 1 día para que sea Viernes
      d.setDate(d.getDate() + 1);
      console.log(`Moviendo turno del Jueves ${turno.fechaHora.toISOString()} -> Viernes ${d.toISOString()} (Ciudad: ${turno.ciudad})`);
      await prisma.turno.update({
        where: { id: turno.id },
        data: { fechaHora: d },
      });
      modificados++;
    } else if (day === 5) {
      // Viernes -> Restar 1 día para que sea Jueves
      d.setDate(d.getDate() - 1);
      console.log(`Moviendo turno del Viernes ${turno.fechaHora.toISOString()} -> Jueves ${d.toISOString()} (Ciudad: ${turno.ciudad})`);
      await prisma.turno.update({
        where: { id: turno.id },
        data: { fechaHora: d },
      });
      modificados++;
    }
  }

  console.log(`Migración de Turnos finalizada. Total modificados: ${modificados}`);

  // 2. Obtener Configuraciones de Días futuras
  const hoyStr = today.toISOString().split('T')[0];
  const configs = await prisma.configuracionDia.findMany();
  
  let configModificados = 0;
  for (const c of configs) {
    // c.fecha puede ser "YYYY-MM-DD" o "YYYY-MM-DD_MANANA"
    const datePart = c.fecha.split('_')[0];
    if (datePart >= hoyStr) {
      const d = new Date(datePart + "T12:00:00Z"); // Mediodía UTC para evitar issues de timezone
      const day = d.getUTCDay();
      
      let newDatePart = null;
      if (day === 4) {
        d.setUTCDate(d.getUTCDate() + 1);
        newDatePart = d.toISOString().split('T')[0];
      } else if (day === 5) {
        d.setUTCDate(d.getUTCDate() - 1);
        newDatePart = d.toISOString().split('T')[0];
      }

      if (newDatePart) {
        const newFecha = c.fecha.replace(datePart, newDatePart);
        console.log(`Moviendo configuración del ${c.fecha} -> ${newFecha}`);
        
        try {
          await prisma.configuracionDia.update({
            where: { id: c.id },
            data: { fecha: newFecha },
          });
          configModificados++;
        } catch (err) {
          console.error(`Error al mover config ${c.fecha}: Ya existe una configuración para ${newFecha}`);
        }
      }
    }
  }

  console.log(`Migración de Configuración finalizada. Total modificados: ${configModificados}`);
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
