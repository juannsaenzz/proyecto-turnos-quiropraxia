const fs = require('fs');
const path = require('path');

const turnosPath = path.join(__dirname, '../frontend/src/app/admin/turnos/page.tsx');
let turnosContent = fs.readFileSync(turnosPath, 'utf8');

// Fix the syntax error from previous script
turnosContent = turnosContent.replace(
  "{showScrollTop && !showNewTurnoModal && !showNewPacienteModal && selectedTurnoId === null && editingNotasId === null && customConfirm === null && !isEditingConfig && !showEditTurnoModal && (",
  "{showScrollTop && !showNewTurnoModal && !showNewPacienteModal && !showNewHistorialModal && !showEditPacienteModal && !showEditTurnoModal && customConfirm === null && !isEditingConfig && ("
);

fs.writeFileSync(turnosPath, turnosContent);
console.log('Turnos Fixed');
