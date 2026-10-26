const fs = require('fs');
const path = require('path');

// ==============================
// 1. TURNOS PAGE
// ==============================
const turnosPath = path.join(__dirname, '../frontend/src/app/admin/turnos/page.tsx');
let turnosContent = fs.readFileSync(turnosPath, 'utf8');

// Modals hide Volver arriba
turnosContent = turnosContent.replace(
  /{showScrollTop && \(/g,
  "{showScrollTop && !showNewTurnoModal && !showNewPacienteModal && selectedTurnoId === null && editingNotasId === null && customConfirm === null && !isEditingConfig && !showEditTurnoModal && ("
);

// Paciente name size & overflow
// Search for font-extrabold text-base tracking-tight text-slate-100 break-words
turnosContent = turnosContent.replace(
  /className="font-extrabold text-base tracking-tight text-slate-100 break-words"/g,
  'className="font-extrabold text-xl tracking-tight text-slate-100 break-words pr-2 line-clamp-2"'
);

fs.writeFileSync(turnosPath, turnosContent);

// ==============================
// 2. PACIENTES LIST PAGE
// ==============================
const pacientesPath = path.join(__dirname, '../frontend/src/app/admin/pacientes/page.tsx');
let pacientesContent = fs.readFileSync(pacientesPath, 'utf8');

// Add showScrollTop state if not present
if (!pacientesContent.includes('showScrollTop')) {
  pacientesContent = pacientesContent.replace(
    /const \[customConfirm, setCustomConfirm\] = useState[^\n]+;/g,
    "const [customConfirm, setCustomConfirm] = useState<any>(null);\n  const [showScrollTop, setShowScrollTop] = useState(false);"
  );
  
  // Add useEffect
  pacientesContent = pacientesContent.replace(
    /useEffect\(\(\) => {\n\s+setIsMounted\(true\);\n\s+}, \[\]\);/g,
    `useEffect(() => {\n    setIsMounted(true);\n  }, []);\n\n  useEffect(() => {\n    const handleScroll = () => {\n      setShowScrollTop(window.scrollY > 300);\n    };\n    window.addEventListener('scroll', handleScroll);\n    return () => window.removeEventListener('scroll', handleScroll);\n  }, []);`
  );
  
  // Add the button before the final </div>
  const buttonCode = `\n      {showScrollTop && !showNewPacienteModal && !showEditPacienteModal && customConfirm === null && (\n        <div className="fixed bottom-6 right-6 z-[80] flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">\n          <button\n            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}\n            className="p-3 bg-emerald-600 border border-emerald-500 text-white hover:bg-emerald-500 rounded-full shadow-xl shadow-emerald-900/40 transition"\n            title="Volver arriba"\n          >\n            <ArrowUp className="h-5 w-5" />\n          </button>\n        </div>\n      )}\n    </div>`;
  pacientesContent = pacientesContent.replace(/    <\/div>\n  \);\n}\n$/g, buttonCode + '\n  );\n}\n');
  
  // Add ArrowUp import if missing
  if (!pacientesContent.includes('ArrowUp')) {
    pacientesContent = pacientesContent.replace(/Trash2,/g, 'Trash2,\n  ArrowUp,');
  }
}

fs.writeFileSync(pacientesPath, pacientesContent);

// ==============================
// 3. PACIENTES ID PAGE
// ==============================
const idPath = path.join(__dirname, '../frontend/src/app/admin/pacientes/[id]/page.tsx');
let idContent = fs.readFileSync(idPath, 'utf8');

// Fix Date box size and time
idContent = idContent.replace(
  /<div className="bg-slate-950 rounded-xl px-4 py-3 border border-emerald-900\/30 flex flex-col items-center justify-center w-\[140px\] flex-shrink-0 shadow-inner">/g,
  '<div className="bg-slate-950 rounded-xl px-5 py-4 border border-emerald-900/30 flex flex-col items-center justify-center w-[160px] flex-shrink-0 shadow-inner shadow-emerald-900/10">'
);
idContent = idContent.replace(
  /<span className="text-sm font-bold text-emerald-500\/80 leading-none mb-1">\{formatDate\(turno\.fechaHora\)\.split\(\', \'\)\[0\]\}<\/span>/g,
  '<span className="text-base font-bold text-emerald-500/80 leading-none mb-1.5">{formatDate(turno.fechaHora).split(\', \')[0]}</span>'
);
idContent = idContent.replace(
  /<span className="text-base font-black text-emerald-400 leading-none">\{formatDate\(turno\.fechaHora\)\.split\(\', \'\)\[1\]\}<\/span>/g,
  '<span className="text-xl font-black text-emerald-400 leading-none mb-1.5">{formatDate(turno.fechaHora).split(\', \')[1]}</span>\n                          <span className="text-lg font-black text-white leading-none">{turno.hora}</span>'
);

// Remove the separate formatTime block
idContent = idContent.replace(
  /<div className="font-bold text-slate-200 text-xl flex items-center gap-2">\s*\{formatTime\(turno\.fechaHora\)\}\s*<\/div>/g,
  ''
);

// Add showScrollTop state if not present
if (!idContent.includes('showScrollTop')) {
  idContent = idContent.replace(
    /const \[customConfirm, setCustomConfirm\] = useState<any>\(null\);/g,
    "const [customConfirm, setCustomConfirm] = useState<any>(null);\n  const [showScrollTop, setShowScrollTop] = useState(false);"
  );
  
  // Add useEffect
  idContent = idContent.replace(
    /useEffect\(\(\) => setIsMounted\(true\), \[\]\);/g,
    `useEffect(() => setIsMounted(true), []);\n\n  useEffect(() => {\n    const handleScroll = () => {\n      setShowScrollTop(window.scrollY > 300);\n    };\n    window.addEventListener('scroll', handleScroll);\n    return () => window.removeEventListener('scroll', handleScroll);\n  }, []);`
  );
  
  // Add the button before the final </div>
  const buttonCode2 = `\n      {showScrollTop && editingTurno === null && customConfirm === null && (\n        <div className="fixed bottom-6 right-6 z-[80] flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">\n          <button\n            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}\n            className="p-3 bg-emerald-600 border border-emerald-500 text-white hover:bg-emerald-500 rounded-full shadow-xl shadow-emerald-900/40 transition"\n            title="Volver arriba"\n          >\n            <ArrowUp className="h-5 w-5" />\n          </button>\n        </div>\n      )}\n    </div>`;
  idContent = idContent.replace(/    <\/div>\n  \);\n}\n$/g, buttonCode2 + '\n  );\n}\n');
}

fs.writeFileSync(idPath, idContent);
console.log('Update Complete');
