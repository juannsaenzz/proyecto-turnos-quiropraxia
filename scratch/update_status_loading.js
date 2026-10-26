const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/app/admin/turnos/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add state variables
content = content.replace(
  `  const [showEditTurnoModal, setShowEditTurnoModal] = useState(false);`,
  `  const [showEditTurnoModal, setShowEditTurnoModal] = useState(false);\n  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);\n  const [isBulkUpdating, setIsBulkUpdating] = useState(false);`
);

// 2. Update updateTurnoEstado
content = content.replace(
  `  const updateTurnoEstado = async (id: number, nuevoEstado: "PENDIENTE" | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE') => {\n    setSelectedTurnos([]);\n    try {`,
  `  const updateTurnoEstado = async (id: number, nuevoEstado: "PENDIENTE" | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE') => {\n    setSelectedTurnos([]);\n    setUpdatingStatusId(id);\n    try {`
);

content = content.replace(
  `      alert(err.message || 'No se pudo actualizar el estado del turno.');\n    }\n  };`,
  `      alert(err.message || 'No se pudo actualizar el estado del turno.');\n    } finally {\n      setUpdatingStatusId(null);\n    }\n  };`
);

// 3. Update handleBulkUpdateEstado
content = content.replace(
  `  const handleBulkUpdateEstado = async (nuevoEstado: "PENDIENTE" | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE') => {\n    if (selectedTurnos.length === 0) return;\n    try {`,
  `  const handleBulkUpdateEstado = async (nuevoEstado: "PENDIENTE" | 'CONFIRMADO' | 'ATENDIDO' | 'AUSENTE') => {\n    if (selectedTurnos.length === 0) return;\n    setIsBulkUpdating(true);\n    try {`
);

// Wait, the alert message for handleBulkUpdateEstado is:
// alert(err.message || 'Error al actualizar turnos');
content = content.replace(
  `      alert(err.message || 'Error al actualizar turnos');\n    }\n  };`,
  `      alert(err.message || 'Error al actualizar turnos');\n    } finally {\n      setIsBulkUpdating(false);\n    }\n  };`
);

// 4. Update individual select UI
const individualSelectOld = `<select
                                            value={appt.estado}
                                            onChange={(e) => updateTurnoEstado(appt.id, e.target.value as any)}
                                            className={\`px-3 py-1.5 rounded-xl text-xs font-extrabold border uppercase tracking-wider outline-none cursor-pointer hover:opacity-80 transition appearance-none pr-8 \${styles.badge}\`}
                                          >
                                            <option value="PENDIENTE" className="text-slate-800 bg-white">PENDIENTE</option>
                                            <option value="CONFIRMADO" className="text-slate-800 bg-white">CONFIRMADO</option>
                                            <option value="ATENDIDO" className="text-slate-800 bg-white">ATENDIDO</option>
                                            <option value="AUSENTE" className="text-slate-800 bg-white">AUSENTE</option>
                                          </select>
                                          <ChevronDown className="absolute right-2 h-3 w-3 pointer-events-none opacity-70" />`;

const individualSelectNew = `<select
                                            value={appt.estado}
                                            onChange={(e) => updateTurnoEstado(appt.id, e.target.value as any)}
                                            disabled={updatingStatusId === appt.id}
                                            className={\`px-3 py-1.5 rounded-xl text-xs font-extrabold border uppercase tracking-wider outline-none cursor-pointer hover:opacity-80 transition appearance-none pr-8 disabled:opacity-50 disabled:cursor-not-allowed \${styles.badge}\`}
                                          >
                                            <option value="PENDIENTE" className="text-slate-800 bg-white">PENDIENTE</option>
                                            <option value="CONFIRMADO" className="text-slate-800 bg-white">CONFIRMADO</option>
                                            <option value="ATENDIDO" className="text-slate-800 bg-white">ATENDIDO</option>
                                            <option value="AUSENTE" className="text-slate-800 bg-white">AUSENTE</option>
                                          </select>
                                          {updatingStatusId === appt.id ? (
                                            <RefreshCw className="absolute right-2 h-3 w-3 pointer-events-none animate-spin text-slate-500" />
                                          ) : (
                                            <ChevronDown className="absolute right-2 h-3 w-3 pointer-events-none opacity-70" />
                                          )}`;

content = content.replace(individualSelectOld, individualSelectNew);

// 5. Update bulk select UI
const bulkSelectOld = `<select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleBulkUpdateEstado(e.target.value as any);
                                e.target.value = ""; 
                              }
                            }}
                            defaultValue=""
                            className="appearance-none pl-3 pr-8 py-1.5 border border-slate-700 bg-slate-800 text-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-slate-500 transition cursor-pointer"
                          >
                            <option value="" disabled className="bg-slate-900">Cambiar estado...</option>
                            <option value="PENDIENTE" className="bg-slate-900 text-slate-200">Pendiente</option>
                            <option value="CONFIRMADO" className="bg-slate-900 text-slate-200">Confirmado</option>
                            <option value="ATENDIDO" className="bg-slate-900 text-slate-200">Atendido</option>
                            <option value="AUSENTE" className="bg-slate-900 text-slate-200">Ausente</option>
                          </select>
                          <ChevronDown className="absolute right-2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />`;

const bulkSelectNew = `<select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleBulkUpdateEstado(e.target.value as any);
                                e.target.value = ""; 
                              }
                            }}
                            defaultValue=""
                            disabled={isBulkUpdating}
                            className="appearance-none pl-3 pr-8 py-1.5 border border-slate-700 bg-slate-800 text-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-slate-500 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="" disabled className="bg-slate-900">Cambiar estado...</option>
                            <option value="PENDIENTE" className="bg-slate-900 text-slate-200">Pendiente</option>
                            <option value="CONFIRMADO" className="bg-slate-900 text-slate-200">Confirmado</option>
                            <option value="ATENDIDO" className="bg-slate-900 text-slate-200">Atendido</option>
                            <option value="AUSENTE" className="bg-slate-900 text-slate-200">Ausente</option>
                          </select>
                          {isBulkUpdating ? (
                            <RefreshCw className="absolute right-2 h-3.5 w-3.5 text-slate-400 pointer-events-none animate-spin" />
                          ) : (
                            <ChevronDown className="absolute right-2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                          )}`;

content = content.replace(bulkSelectOld, bulkSelectNew);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Replaced successfully!");
