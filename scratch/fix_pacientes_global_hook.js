const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/app/admin/pacientes/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find the useGlobalData block
const blockRegex = /\s*\/\/ Data lists from global context\n\s*const \{\s*pacientes, setPacientes,\s*turnos, setTurnos,\s*historiales, setHistoriales,\s*loading\s*\} = useGlobalData\(\);/g;

// Remove it from its current location
content = content.replace(blockRegex, '');

// Insert it right after `export default function AdminPacientesPage() {`
// Wait, I don't know the exact name of the function in pacientes/page.tsx. It might be AdminDashboard or something.
// Let's search for `export default function`
const insertTargetRegex = /(export default function [^{]+\{\n)/;
const insertion = `  // Data lists from global context
  const { 
    pacientes, setPacientes, 
    turnos, setTurnos, 
    historiales, setHistoriales,
    loading 
  } = useGlobalData();\n`;

content = content.replace(insertTargetRegex, `$1${insertion}`);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Moved useGlobalData block in pacientes/page.tsx");
