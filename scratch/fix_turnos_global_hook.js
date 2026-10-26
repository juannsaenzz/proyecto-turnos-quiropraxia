const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/app/admin/turnos/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find the useGlobalData block
const blockRegex = /\s*\/\/ Data lists from global context\n\s*const \{\s*pacientes, setPacientes,\s*turnos, setTurnos,\s*historiales, setHistoriales,\s*allConfigs, setAllConfigs,\s*loading, refreshData\s*\} = useGlobalData\(\);/g;

// Remove it from its current location
content = content.replace(blockRegex, '');

// Insert it right after `export default function AdminDashboard() {`
const insertTarget = "export default function AdminDashboard() {\n";
const insertion = `  // Data lists from global context
  const { 
    pacientes, setPacientes, 
    turnos, setTurnos, 
    historiales, setHistoriales, 
    allConfigs, setAllConfigs, 
    loading, refreshData 
  } = useGlobalData();\n`;

content = content.replace(insertTarget, insertTarget + insertion);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Moved useGlobalData block in turnos/page.tsx");
