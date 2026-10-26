const fs = require('fs');
const path = require('path');

// Helper to replace text
function replace(content, search, replacement) {
  return content.split(search).join(replacement);
}

// 1. TURNOS
const turnosPath = path.join(__dirname, '../frontend/src/app/admin/turnos/page.tsx');
let turnosContent = fs.readFileSync(turnosPath, 'utf8');

turnosContent = replace(turnosContent, 'const router = useRouter();', 'const router = useRouter();\n  const [isNavigatingGlobal, setIsNavigatingGlobal] = useState(false);\n  const [isRegisteringQuick, setIsRegisteringQuick] = useState(false);');

turnosContent = replace(turnosContent, '<header className="h-auto md:h-20 bg-slate-900 border-b border-slate-800/80 sticky top-0 z-30 px-6 md:px-8 flex flex-col md:flex-row items-start md:items-center py-4 md:py-0 gap-4 md:gap-0">', '<header className="h-auto xl:h-20 bg-slate-900 border-b border-slate-800/80 sticky top-0 z-30 px-6 xl:px-8 flex flex-col xl:flex-row items-start xl:items-center py-4 xl:py-0 gap-4 xl:gap-0">');
turnosContent = replace(turnosContent, '<div className="flex items-center justify-between w-full md:w-auto md:justify-start space-x-4">', '<div className="flex items-center justify-between w-full xl:w-auto xl:justify-start space-x-4">');
turnosContent = replace(turnosContent, '<div className="relative md:absolute md:left-1/2 md:-translate-x-1/2 w-full md:w-96" ref={globalSearchRef}>', '<div className="relative xl:absolute xl:left-1/2 xl:-translate-x-1/2 w-full xl:w-96" ref={globalSearchRef}>');

// Search item click (Global search)
turnosContent = replace(turnosContent, `onClick={() => {
                      setGlobalSearchQuery('');
                      setShowGlobalSearchDropdown(false);
                      router.push(\`/admin/pacientes/\${p.id}\`);
                    }}`, `onClick={() => {
                      setGlobalSearchQuery('');
                      setShowGlobalSearchDropdown(false);
                      setIsNavigatingGlobal(true);
                      router.push(\`/admin/pacientes/\${p.id}\`);
                    }}`);

// Register Quick Loading
turnosContent = replace(turnosContent, `if (!name || !name.trim()) return;\n    try {`, `if (!name || !name.trim()) return;\n    setIsRegisteringQuick(true);\n    try {`);
turnosContent = replace(turnosContent, `} catch (error: any) {\n      console.error('Error creating patient quickly:', error);\n      alert(error.message || 'No se pudo registrar el paciente.');\n    }`, `} catch (error: any) {\n      console.error('Error creating patient quickly:', error);\n      alert(error.message || 'No se pudo registrar el paciente.');\n    } finally {\n      setIsRegisteringQuick(false);\n    }`);

// Status select size
turnosContent = turnosContent.replace(
  /className=\{`px-2 sm:px-3 py-1 sm:py-1\.5 rounded-xl text-\[10px\] sm:text-xs font-extrabold border uppercase tracking-wider outline-none cursor-pointer hover:opacity-80 transition appearance-none pr-6 sm:pr-8 \$\{styles\.badge\}`\}/g,
  'className={`pl-3 pr-7 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black border uppercase tracking-widest outline-none cursor-pointer hover:opacity-80 transition appearance-none ${styles.badge}`}'
);

// Overlays for loading
const overlays = `
      {isNavigatingGlobal && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <div className="animate-spin text-emerald-500 mb-4"><RefreshCw className="h-8 w-8" /></div>
          <span className="text-emerald-500 font-bold">Cargando paciente...</span>
        </div>
      )}
      {isRegisteringQuick && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <div className="animate-spin text-emerald-500 mb-4"><RefreshCw className="h-8 w-8" /></div>
          <span className="text-emerald-500 font-bold">Registrando paciente...</span>
        </div>
      )}
`;
turnosContent = turnosContent.replace('</div>\n  );\n}\n', overlays + '\n    </div>\n  );\n}\n');
fs.writeFileSync(turnosPath, turnosContent);

// 2. PACIENTES LIST
const pacientesPath = path.join(__dirname, '../frontend/src/app/admin/pacientes/page.tsx');
let pacientesContent = fs.readFileSync(pacientesPath, 'utf8');

if (!pacientesContent.includes('isNavigatingGlobal')) {
  pacientesContent = replace(pacientesContent, 'const router = useRouter();', 'const router = useRouter();\n  const [isNavigatingGlobal, setIsNavigatingGlobal] = useState(false);');
}

pacientesContent = replace(pacientesContent, '<header className="h-auto md:h-20 bg-slate-900 border-b border-slate-800/80 sticky top-0 z-30 px-6 md:px-8 flex flex-col md:flex-row items-start md:items-center py-4 md:py-0 gap-4 md:gap-0">', '<header className="h-auto xl:h-20 bg-slate-900 border-b border-slate-800/80 sticky top-0 z-30 px-6 xl:px-8 flex flex-col xl:flex-row items-start xl:items-center py-4 xl:py-0 gap-4 xl:gap-0">');
pacientesContent = replace(pacientesContent, '<div className="flex items-center justify-between w-full md:w-auto md:justify-start space-x-4">', '<div className="flex items-center justify-between w-full xl:w-auto xl:justify-start space-x-4">');
pacientesContent = replace(pacientesContent, '<div className="relative md:absolute md:left-1/2 md:-translate-x-1/2 w-full md:w-96" ref={globalSearchRef}>', '<div className="relative xl:absolute xl:left-1/2 xl:-translate-x-1/2 w-full xl:w-96" ref={globalSearchRef}>');

pacientesContent = replace(pacientesContent, `onClick={() => {
                      setGlobalSearchQuery('');
                      setShowGlobalSearchDropdown(false);
                      router.push(\`/admin/pacientes/\${p.id}\`);
                    }}`, `onClick={() => {
                      setGlobalSearchQuery('');
                      setShowGlobalSearchDropdown(false);
                      setIsNavigatingGlobal(true);
                      router.push(\`/admin/pacientes/\${p.id}\`);
                    }}`);

const pacientesOverlays = `
      {isNavigatingGlobal && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <div className="animate-spin text-emerald-500 mb-4"><RefreshCw className="h-8 w-8" /></div>
          <span className="text-emerald-500 font-bold">Cargando paciente...</span>
        </div>
      )}
`;
if (!pacientesContent.includes('Cargando paciente...')) {
  pacientesContent = pacientesContent.replace(/    <\/div>\n  \);\n}\n$/g, pacientesOverlays + '\n    </div>\n  );\n}\n');
}
fs.writeFileSync(pacientesPath, pacientesContent);

// 3. PACIENTES ID
const idPath = path.join(__dirname, '../frontend/src/app/admin/pacientes/[id]/page.tsx');
let idContent = fs.readFileSync(idPath, 'utf8');

idContent = replace(idContent, '<header className="h-auto md:h-20 bg-slate-900 border-b border-slate-800/80 sticky top-0 z-30 px-6 md:px-8 py-4 md:py-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 shadow-sm">', '<header className="h-auto xl:h-20 bg-slate-900 border-b border-slate-800/80 sticky top-0 z-30 px-6 xl:px-8 py-4 xl:py-0 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 xl:gap-0 shadow-sm">');
fs.writeFileSync(idPath, idContent);

console.log('Update 4 Complete');
