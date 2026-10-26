const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/app/admin/pacientes/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import for useGlobalData
if (!content.includes("import { useGlobalData }")) {
  content = content.replace(
    "import LoadingSpinner from '../components/LoadingSpinner';",
    "import LoadingSpinner from '../components/LoadingSpinner';\nimport { useGlobalData, Paciente, Turno, Historial } from '../components/GlobalDataContext';"
  );
}

// 2. Remove the duplicate interfaces
content = content.replace(/interface Paciente {[\s\S]*?fechaNacimiento\?: string;\n}\n/g, "");
content = content.replace(/interface Turno {[\s\S]*?estado: "PENDIENTE" \| 'CONFIRMADO' \| 'ATENDIDO' \| 'AUSENTE';\n}\n/g, "");
content = content.replace(/interface Historial {[\s\S]*?notas: string;\n}\n/g, "");

// 3. Remove the fetch logic
const searchRegex = /  \/\/ Data lists from database\n  const \[pacientes, setPacientes\] = useState<Paciente\[\]>\(\[\]\);\n  const \[turnos, setTurnos\] = useState<Turno\[\]>\(\[\]\);\n  const \[historiales, setHistoriales\] = useState<Historial\[\]>\(\[\]\);\n  const \[loading, setLoading\] = useState\(true\);\n\n  \/\/ Load initial data from the database\n  useEffect\(\(\) => {[\s\S]*?isMounted = false;\n    };\n  }, \[\]\);/g;

const replacement = `  // Data lists from global context
  const { 
    pacientes, setPacientes, 
    turnos, setTurnos, 
    historiales, setHistoriales,
    loading 
  } = useGlobalData();`;

content = content.replace(searchRegex, replacement);

// 4. Remove `<LoadingSpinner message="Cargando datos..." />`
content = content.replace(
  /      {loading && <LoadingSpinner message="Cargando datos\.\.\." \/>}\n/g,
  ""
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("pacientes/page.tsx updated");
