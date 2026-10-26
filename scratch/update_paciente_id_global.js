const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/app/admin/pacientes/[id]/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import for useGlobalData
if (!content.includes("import { useGlobalData }")) {
  content = content.replace(
    "import LoadingSpinner from '../../components/LoadingSpinner';",
    "import LoadingSpinner from '../../components/LoadingSpinner';\nimport { useGlobalData, Paciente, Turno } from '../../components/GlobalDataContext';"
  );
}

// 2. Remove the duplicate interfaces
content = content.replace(/interface Paciente {[\s\S]*?fechaNacimiento\?: string;\n}\n/g, "");
content = content.replace(/interface Turno {[\s\S]*?updatedBy\?: string;\n}\n/g, "");

// 3. Remove the fetch logic
const searchRegex = /  const \[paciente, setPaciente\] = useState<Paciente \| null>\(null\);\n  const \[turnos, setTurnos\] = useState<Turno\[\]>\(\[\]\);\n  const \[loading, setLoading\] = useState\(true\);\n[\s\S]*?fetchUser\(\);\n  \}, \[\]\);/g;

const replacement = `  // Data from global context
  const { pacientes, turnos, setTurnos, loading } = useGlobalData();
  const paciente = pacientes.find(p => p.id === pacienteId) || null;
  const patientTurnos = turnos.filter(t => t.pacienteId === pacienteId).sort((a, b) => new Date(b.fechaHora + 'T' + b.hora).getTime() - new Date(a.fechaHora + 'T' + a.hora).getTime());`;

content = content.replace(searchRegex, replacement);

// Also I need to replace `turnos` mapping with `patientTurnos` in the render block!
content = content.replace(/turnos\.filter/g, 'patientTurnos.filter');
content = content.replace(/turnos\.length/g, 'patientTurnos.length');
content = content.replace(/turnos\.map/g, 'patientTurnos.map');

// And remove `setTurnos` from inside `pacientes/[id]/page.tsx` where it modifies `turnos` to use the global setter properly!
// Actually wait! If I just keep `setTurnos` from context, the `prev => prev.map` will work correctly because it operates on the global array!
// BUT I also removed `loading` inside `useEffect`. Let's just leave `<LoadingSpinner />` if `loading` is true or if `!paciente` maybe? But `AdminLayout` handles global `loading`.
// In `pacientes/[id]/page.tsx`, there is `if (loading) return <LoadingSpinner />;` which is fine to keep because if global loading is true, it won't render anyway. But if global loading is false, it renders instantly!

fs.writeFileSync(filePath, content, 'utf8');
console.log("pacientes/[id]/page.tsx updated");
