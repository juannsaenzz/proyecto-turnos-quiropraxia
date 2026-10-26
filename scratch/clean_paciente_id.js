const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/app/admin/pacientes/[id]/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix name breaking
content = content.replace(
  /<h2 className="text-3xl font-black text-slate-100 tracking-tight break-words break-all">\{paciente\.nombre\}<\/h2>/,
  '<h2 className="text-3xl font-black text-slate-100 tracking-tight break-words">{paciente.nombre}</h2>'
);

// 2. Center the buttons on mobile
content = content.replace(
  /<div className="md:w-1\/4 flex justify-end items-center gap-2">/g,
  '<div className="md:w-1/4 flex justify-center md:justify-end items-center gap-2 mt-4 md:mt-0">'
);
// I also added mt-4 md:mt-0 to the button container so on mobile it has a bit of top margin if it wraps. Wait, the gap-4 on the parent might be enough. Let's just use what they asked.

// 3. Add sortOption state
if (!content.includes("const [sortOption, setSortOption]")) {
  content = content.replace(
    /const \[updatingStatusId, setUpdatingStatusId\] = useState<number \| null>\(null\);/,
    "const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);\n  const [sortOption, setSortOption] = useState<'desc' | 'asc'>('desc');"
  );
}

// 4. Update the turnos sorting and the header
const oldHeaderRegex = /\{\/\* Turnos List \*\/\}\n\s*<div>\n\s*<h3 className="text-xl font-bold text-slate-200 mb-6">\n\s*Historial de Turnos\n\s*<\/h3>/;

const newHeader = `{/* Turnos List */}
            <div>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-sm mb-6">
                <span className="font-extrabold text-slate-100 text-sm sm:text-base">Historial de Turnos</span>
                <div className="relative inline-flex items-center w-full sm:w-auto">
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as any)}
                    className="w-full sm:w-auto appearance-none bg-slate-950 border border-slate-800 text-slate-300 text-sm font-semibold rounded-xl px-4 py-2 pr-10 focus:outline-none focus:border-emerald-500 transition cursor-pointer hover:bg-slate-900"
                  >
                    <option value="desc">Más recientes primero</option>
                    <option value="asc">Más antiguos primero</option>
                  </select>
                  <ChevronDown className="absolute right-3 h-4 w-4 text-slate-500 pointer-events-none" />
                </div>
              </div>`;

content = content.replace(oldHeaderRegex, newHeader);

// 5. Replace `turnos.map` with `sortedTurnos.map`
if (!content.includes("const sortedTurnos = [...turnos].sort")) {
  // Insert sorting logic right before rendering the turnos list
  const mappingRegex = /\{turnos\.map\(\(turno\) => \(/;
  const mappingReplacement = `{[...turnos].sort((a, b) => {
                    const dateA = new Date(a.fechaHora).getTime();
                    const dateB = new Date(b.fechaHora).getTime();
                    return sortOption === 'desc' ? dateB - dateA : dateA - dateB;
                  }).map((turno) => (`
  content = content.replace(mappingRegex, mappingReplacement);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Applied changes to admin/pacientes/[id]/page.tsx");
