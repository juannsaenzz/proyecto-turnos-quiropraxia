const fs = require('fs');
const path = require('path');

// ==============================
// 1. LAYOUT
// ==============================
const layoutPath = path.join(__dirname, '../frontend/src/app/admin/layout.tsx');
let layoutContent = fs.readFileSync(layoutPath, 'utf8');
layoutContent = layoutContent.replace(
  'className="font-extrabold text-slate-100 block leading-tight text-base tracking-tight">Hola, {userName || \'Doc\'}</span>',
  'className="font-extrabold text-slate-100 block leading-tight text-xl tracking-tight">Hola, {userName || \'Doc\'}</span>'
);
fs.writeFileSync(layoutPath, layoutContent);

// ==============================
// 2. TURNOS
// ==============================
const turnosPath = path.join(__dirname, '../frontend/src/app/admin/turnos/page.tsx');
let turnosContent = fs.readFileSync(turnosPath, 'utf8');

// Header responsiveness
turnosContent = turnosContent.replace(
  '<header className="h-auto sm:h-20 bg-slate-900 border-b border-slate-800/80 sticky top-0 z-30 px-6 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center py-4 sm:py-0 gap-4 sm:gap-0">',
  '<header className="h-auto md:h-20 bg-slate-900 border-b border-slate-800/80 sticky top-0 z-30 px-6 md:px-8 flex flex-col md:flex-row items-start md:items-center py-4 md:py-0 gap-4 md:gap-0">'
);
turnosContent = turnosContent.replace(
  '<div className="flex items-center justify-between w-full sm:w-auto sm:justify-start space-x-4">',
  '<div className="flex items-center justify-between w-full md:w-auto md:justify-start space-x-4">'
);
turnosContent = turnosContent.replace(
  '<div className="relative sm:absolute sm:left-1/2 sm:-translate-x-1/2 w-full sm:w-64 md:w-96" ref={globalSearchRef}>',
  '<div className="relative md:absolute md:left-1/2 md:-translate-x-1/2 w-full md:w-96" ref={globalSearchRef}>'
);

// Status dropdown size on mobile
turnosContent = turnosContent.replace(
  /className=\{`px-3 py-1\.5 rounded-xl text-xs font-extrabold border uppercase tracking-wider outline-none cursor-pointer hover:opacity-80 transition appearance-none pr-8 \$\{styles\.badge\}`\}/g,
  'className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-extrabold border uppercase tracking-wider outline-none cursor-pointer hover:opacity-80 transition appearance-none pr-6 sm:pr-8 ${styles.badge}`}'
);

fs.writeFileSync(turnosPath, turnosContent);

// ==============================
// 3. PACIENTES LIST
// ==============================
const pacientesPath = path.join(__dirname, '../frontend/src/app/admin/pacientes/page.tsx');
let pacientesContent = fs.readFileSync(pacientesPath, 'utf8');

// Header responsiveness
pacientesContent = pacientesContent.replace(
  '<header className="h-auto sm:h-20 bg-slate-900 border-b border-slate-800/80 sticky top-0 z-30 px-6 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center py-4 sm:py-0 gap-4 sm:gap-0">',
  '<header className="h-auto md:h-20 bg-slate-900 border-b border-slate-800/80 sticky top-0 z-30 px-6 md:px-8 flex flex-col md:flex-row items-start md:items-center py-4 md:py-0 gap-4 md:gap-0">'
);
pacientesContent = pacientesContent.replace(
  '<div className="flex items-center justify-between w-full sm:w-auto sm:justify-start space-x-4">',
  '<div className="flex items-center justify-between w-full md:w-auto md:justify-start space-x-4">'
);
pacientesContent = pacientesContent.replace(
  '<div className="relative sm:absolute sm:left-1/2 sm:-translate-x-1/2 w-full sm:w-64 md:w-96" ref={globalSearchRef}>',
  '<div className="relative md:absolute md:left-1/2 md:-translate-x-1/2 w-full md:w-96" ref={globalSearchRef}>'
);

// Add showScrollTop if missing
if (!pacientesContent.includes('const [showScrollTop, setShowScrollTop] = useState(false);')) {
  pacientesContent = pacientesContent.replace(
    'const router = useRouter();',
    'const router = useRouter();\n  const [showScrollTop, setShowScrollTop] = useState(false);'
  );
  
  pacientesContent = pacientesContent.replace(
    'useEffect(() => {\n    setIsMounted(true);\n  }, []);',
    `useEffect(() => {\n    setIsMounted(true);\n  }, []);\n\n  useEffect(() => {\n    const scrollContainer = document.getElementById('main-scroll-container');\n    const target = scrollContainer || window;\n    const handleScroll = () => {\n      const scrollTop = scrollContainer ? scrollContainer.scrollTop : window.scrollY;\n      setShowScrollTop(scrollTop > 300);\n    };\n    target.addEventListener('scroll', handleScroll);\n    return () => target.removeEventListener('scroll', handleScroll);\n  }, []);`
  );
  
  const buttonCode = `\n      {showScrollTop && !showNewPacienteModal && !showEditPacienteModal && (\n        <div className="fixed bottom-6 right-6 z-[80] flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">\n          <button\n            onClick={() => {\n              const scrollContainer = document.getElementById('main-scroll-container');\n              if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: "smooth" });\n              else window.scrollTo({ top: 0, behavior: "smooth" });\n            }}\n            className="p-3 bg-emerald-600 border border-emerald-500 text-white hover:bg-emerald-500 rounded-full shadow-xl shadow-emerald-900/40 transition"\n            title="Volver arriba"\n          >\n            <ArrowUp className="h-5 w-5" />\n          </button>\n        </div>\n      )}\n    </div>`;
  pacientesContent = pacientesContent.replace(/    <\/div>\n  \);\n}\n$/g, buttonCode + '\n  );\n}\n');
  
  if (!pacientesContent.includes('ArrowUp')) {
    pacientesContent = pacientesContent.replace(/Trash2,/g, 'Trash2,\n  ArrowUp,');
  }
}

fs.writeFileSync(pacientesPath, pacientesContent);

// ==============================
// 4. PACIENTES ID PAGE
// ==============================
const idPath = path.join(__dirname, '../frontend/src/app/admin/pacientes/[id]/page.tsx');
let idContent = fs.readFileSync(idPath, 'utf8');

// Fix Patient name text size for mobile
idContent = idContent.replace(
  '<h2 className="text-3xl font-black text-slate-100 tracking-tight break-words">{paciente.nombre}</h2>',
  '<h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight break-words">{paciente.nombre}</h2>'
);

// Fix Header responsiveness
idContent = idContent.replace(
  '<header className="h-20 bg-slate-900 border-b border-slate-800/80 sticky top-0 z-30 px-6 sm:px-8 flex items-center justify-between shadow-sm">',
  '<header className="h-auto md:h-20 bg-slate-900 border-b border-slate-800/80 sticky top-0 z-30 px-6 md:px-8 py-4 md:py-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 shadow-sm">'
);

// Fix Scroll logic
idContent = idContent.replace(
  /useEffect\(\(\) => \{\n\s*const handleScroll = \(\) => \{\n\s*setShowScrollTop\(window\.scrollY > 300\);\n\s*\};\n\s*window\.addEventListener\('scroll', handleScroll\);\n\s*return \(\) => window\.removeEventListener\('scroll', handleScroll\);\n\s*\}, \[\]\);/g,
  `useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-container');
    const target = scrollContainer || window;
    const handleScroll = () => {
      const scrollTop = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
      setShowScrollTop(scrollTop > 300);
    };
    target.addEventListener('scroll', handleScroll);
    return () => target.removeEventListener('scroll', handleScroll);
  }, []);`
);

fs.writeFileSync(idPath, idContent);

console.log('Update Complete 3');
