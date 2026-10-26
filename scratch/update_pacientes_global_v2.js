const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/app/admin/pacientes/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(/\r\n/g, '\n');

// 1. Add import for useGlobalData
if (!content.includes("import { useGlobalData }")) {
  content = content.replace(
    "import LoadingSpinner from '../components/LoadingSpinner';",
    "import LoadingSpinner from '../components/LoadingSpinner';\nimport { useGlobalData } from '../components/GlobalDataContext';"
  );
}

// 2. Remove duplicate interfaces
content = content.replace(/\/\/ Interfaces for our component state\ninterface Paciente \{[\s\S]*?fechaNacimiento\?: string;\n\}\n\ninterface Turno \{[\s\S]*?estado: "PENDIENTE" \| 'CONFIRMADO' \| 'ATENDIDO' \| 'AUSENTE';\n\}\n\ninterface Historial \{[\s\S]*?notas: string;\n\}\n\n/g, "");

// 3. Remove fetch logic
const searchRegex = /  \/\/ Data lists from database\n  const \[pacientes, setPacientes\] = useState<Paciente\[\]>\(\[\]\);\n  const \[turnos, setTurnos\] = useState<Turno\[\]>\(\[\]\);\n  const \[historiales, setHistoriales\] = useState<Historial\[\]>\(\[\]\);\n  const \[loading, setLoading\] = useState\(true\);\n\n  \/\/ Load initial data from the database\n  useEffect\(\(\) => {[\s\S]*?isMounted = false;\n    };\n  }, \[\]\);/g;

const replacement = `  // Data lists from global context
  const { 
    pacientes, setPacientes, 
    turnos, setTurnos, 
    historiales, setHistoriales,
    loading 
  } = useGlobalData();`;

content = content.replace(searchRegex, replacement);

// 4. Remove LoadingSpinner overlay
content = content.replace(
  /      \{loading && <LoadingSpinner message="Cargando datos\.\.\." \/>\}\n/g,
  ""
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("pacientes/page.tsx updated");
