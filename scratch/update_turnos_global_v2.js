const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/app/admin/turnos/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(/\r\n/g, '\n');

// 1. Add import for useGlobalData
if (!content.includes("import { useGlobalData }")) {
  content = content.replace(
    "import LoadingSpinner from '../components/LoadingSpinner';",
    "import LoadingSpinner from '../components/LoadingSpinner';\nimport { useGlobalData, Paciente, Turno, Historial, ConfiguracionDia } from '../components/GlobalDataContext';"
  );
} else {
  // if it exists without types, replace it
  content = content.replace(
    "import { useGlobalData } from '../components/GlobalDataContext';",
    "import { useGlobalData, Paciente, Turno, Historial, ConfiguracionDia } from '../components/GlobalDataContext';"
  );
}

// 2. Remove duplicate interfaces
content = content.replace(/\/\/ Interfaces for our component state\ninterface Paciente \{[\s\S]*?fechaNacimiento\?: string;\n\}\n\ninterface Turno \{[\s\S]*?updatedBy\?: string;\n\}\n\ninterface Historial \{[\s\S]*?notas: string;\n\}\n\n/g, "");

// 3. Remove fetch logic
const searchRegex = /  \/\/ Data lists from database\n  const \[pacientes, setPacientes\] = useState<Paciente\[\]>\(\[\]\);\n  const \[turnos, setTurnos\] = useState<Turno\[\]>\(\[\]\);\n  const \[historiales, setHistoriales\] = useState<Historial\[\]>\(\[\]\);\n  const \[loading, setLoading\] = useState\(true\);\n\n  \/\/ Load initial data from the database\n  useEffect\(\(\) => {[\s\S]*?isMounted = false;\n    };\n  }, \[\]\);/g;

const replacement = `  // Data lists from global context
  const { 
    pacientes, setPacientes, 
    turnos, setTurnos, 
    historiales, setHistoriales, 
    allConfigs, setAllConfigs, 
    loading, refreshData 
  } = useGlobalData();`;

content = content.replace(searchRegex, replacement);

// 4. Remove allConfigs state because it's now from context
content = content.replace(/  const \[allConfigs, setAllConfigs\] = useState<\{fecha: string; ciudad: string; bloque: string\}\[\]>\(\[\]\);\n/g, "");

// 5. Remove `<LoadingSpinner message="Cargando datos..." />` inside render
content = content.replace(
  /      \{loading && <LoadingSpinner message="Cargando datos\.\.\." \/>\}\n/g,
  ""
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("turnos/page.tsx updated via v2 script");
