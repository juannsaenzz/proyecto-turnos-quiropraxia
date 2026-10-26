const fs = require('fs');
const path = require('path');

// ==============================
// 1. PACIENTES LIST PAGE
// ==============================
const pacientesPath = path.join(__dirname, '../frontend/src/app/admin/pacientes/page.tsx');
let pacientesContent = fs.readFileSync(pacientesPath, 'utf8');

// Fix scroll listener
pacientesContent = pacientesContent.replace(
  /const handleScroll = \(\) => \{\n\s*setShowScrollTop\(window\.scrollY > 300\);\n\s*\};\n\s*window\.addEventListener\('scroll', handleScroll\);\n\s*return \(\) => window\.removeEventListener\('scroll', handleScroll\);/g,
  `const scrollContainer = document.getElementById('main-scroll-container');
    const target = scrollContainer || window;
    const handleScroll = () => {
      const scrollTop = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
      setShowScrollTop(scrollTop > 300);
    };
    target.addEventListener('scroll', handleScroll);
    return () => target.removeEventListener('scroll', handleScroll);`
);

// Fix scroll to top action
pacientesContent = pacientesContent.replace(
  /onClick=\{\(\) => window\.scrollTo\(\{ top: 0, behavior: "smooth" \}\)\}/g,
  `onClick={() => {
              const scrollContainer = document.getElementById('main-scroll-container');
              if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
              else window.scrollTo({ top: 0, behavior: "smooth" });
            }}`
);

fs.writeFileSync(pacientesPath, pacientesContent);


// ==============================
// 2. PACIENTES ID PAGE
// ==============================
const idPath = path.join(__dirname, '../frontend/src/app/admin/pacientes/[id]/page.tsx');
let idContent = fs.readFileSync(idPath, 'utf8');

// Fix scroll listener
idContent = idContent.replace(
  /const handleScroll = \(\) => \{\n\s*setShowScrollTop\(window\.scrollY > 300\);\n\s*\};\n\s*window\.addEventListener\('scroll', handleScroll\);\n\s*return \(\) => window\.removeEventListener\('scroll', handleScroll\);/g,
  `const scrollContainer = document.getElementById('main-scroll-container');
    const target = scrollContainer || window;
    const handleScroll = () => {
      const scrollTop = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
      setShowScrollTop(scrollTop > 300);
    };
    target.addEventListener('scroll', handleScroll);
    return () => target.removeEventListener('scroll', handleScroll);`
);

// Fix scroll to top action
idContent = idContent.replace(
  /onClick=\{\(\) => window\.scrollTo\(\{ top: 0, behavior: "smooth" \}\)\}/g,
  `onClick={() => {
              const scrollContainer = document.getElementById('main-scroll-container');
              if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
              else window.scrollTo({ top: 0, behavior: "smooth" });
            }}`
);

// Fix patient name overflow (add min-w-0 to the wrapper div)
idContent = idContent.replace(
  /<div>\n\s*<h2 className="text-3xl font-black text-slate-100 tracking-tight break-words">\{paciente\.nombre\}<\/h2>/g,
  '<div className="min-w-0">\n                  <h2 className="text-3xl font-black text-slate-100 tracking-tight break-words">{paciente.nombre}</h2>'
);

// Re-add min-w-0 to the flex gap-6 wrapper to ensure it doesn't push the patient turnos count
idContent = idContent.replace(
  /<div className="flex items-center gap-6 relative z-10">/g,
  '<div className="flex items-center gap-6 relative z-10 min-w-0">'
);

// Fix the turno box and time. Move turno.hora up to above the city.
idContent = idContent.replace(
  /<span className="text-xl font-black text-emerald-400 leading-none mb-1\.5">\{formatDate\(turno\.fechaHora\)\.split\(\', \'\)\[1\]\}<\/span>\n\s*<span className="text-lg font-black text-white leading-none">\{turno\.hora\}<\/span>/g,
  '<span className="text-xl font-black text-emerald-400 leading-none">{formatDate(turno.fechaHora).split(\', \')[1]}</span>'
);

idContent = idContent.replace(
  /<div className="flex flex-col justify-center">\n\s*<div className="flex items-center gap-1\.5 text-sm text-slate-400 mt-1">\n\s*\{turno\.ciudad\}\n\s*<\/div>/g,
  `<div className="flex flex-col justify-center">
                          <div className="font-bold text-slate-200 text-xl flex items-center gap-2">
                            {turno.hora}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-slate-400 mt-1">
                            {turno.ciudad}
                          </div>`
);


fs.writeFileSync(idPath, idContent);

console.log('Done!');
