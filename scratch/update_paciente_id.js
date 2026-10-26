const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/app/admin/pacientes/[id]/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add state variable
content = content.replace(
  'const [isSaving, setIsSaving] = useState(false);',
  'const [isSaving, setIsSaving] = useState(false);\n  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);'
);

// 2. Add delay to handleQuickStatusChange
content = content.replace(
  '  const handleQuickStatusChange = async (id: number, newEstado: Turno[\'estado\']) => {\n    try {\n      const res = await fetch',
  '  const handleQuickStatusChange = async (id: number, newEstado: Turno[\'estado\']) => {\n    setUpdatingStatusId(id);\n    try {\n      await new Promise(resolve => setTimeout(resolve, 500));\n      const res = await fetch'
);

// 3. Add finally block
content = content.replace(
  '    } catch (error) {\n      console.error("Error updating turno status", error);\n    }\n  };',
  '    } catch (error) {\n      console.error("Error updating turno status", error);\n    } finally {\n      setUpdatingStatusId(null);\n    }\n  };'
);

// 4. Update Select UI. I will replace it exactly.
const searchSelect = `                              <select
                                value={turno.estado}
                                onChange={(e) => handleQuickStatusChange(turno.id, e.target.value as Turno['estado'])}
                                className={\`px-3 py-1.5 rounded-xl text-xs font-extrabold border uppercase tracking-wider outline-none cursor-pointer hover:opacity-80 transition appearance-none pr-8 \${getEstadoStyles(turno.estado)}\`}
                              >
                                <option value="PENDIENTE" className="text-slate-800 bg-white">PENDIENTE</option>
                                <option value="CONFIRMADO" className="text-slate-800 bg-white">CONFIRMADO</option>
                                <option value="ATENDIDO" className="text-slate-800 bg-white">ATENDIDO</option>
                                <option value="AUSENTE" className="text-slate-800 bg-white">AUSENTE</option>
                              </select>
                              <ChevronDown className="absolute right-2 h-3 w-3 pointer-events-none opacity-70" />`;

const replaceSelect = `                              <select
                                value={turno.estado}
                                onChange={(e) => handleQuickStatusChange(turno.id, e.target.value as Turno['estado'])}
                                disabled={updatingStatusId === turno.id}
                                className={\`px-3 py-1.5 rounded-xl text-xs font-extrabold border uppercase tracking-wider outline-none cursor-pointer hover:opacity-80 transition appearance-none pr-8 disabled:opacity-50 disabled:cursor-not-allowed \${getEstadoStyles(turno.estado)}\`}
                              >
                                <option value="PENDIENTE" className="text-slate-800 bg-white">PENDIENTE</option>
                                <option value="CONFIRMADO" className="text-slate-800 bg-white">CONFIRMADO</option>
                                <option value="ATENDIDO" className="text-slate-800 bg-white">ATENDIDO</option>
                                <option value="AUSENTE" className="text-slate-800 bg-white">AUSENTE</option>
                              </select>
                              {updatingStatusId === turno.id ? (
                                <RefreshCw className="absolute right-2 h-3 w-3 pointer-events-none animate-spin text-slate-500" />
                              ) : (
                                <ChevronDown className="absolute right-2 h-3 w-3 pointer-events-none opacity-70" />
                              )}`;

// In Windows, \r\n might be present, so we strip all carriage returns for reliable replacement
content = content.replace(/\r\n/g, '\n');
content = content.replace(searchSelect, replaceSelect);

// 5. Add overlay
content = content.replace(
  '      )}\n    </div>\n  );\n}',
  '      )}\n\n      {updatingStatusId !== null && (\n        <LoadingSpinner message="Actualizando estado..." />\n      )}\n    </div>\n  );\n}'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Replaced perfectly");
