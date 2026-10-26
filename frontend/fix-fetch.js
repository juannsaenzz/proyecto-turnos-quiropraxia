const fs = require('fs');
const files = [
  'c:/Users/juann/proyecto-turnos-quiropraxia/frontend/src/app/admin/components/GlobalDataContext.tsx',
  'c:/Users/juann/proyecto-turnos-quiropraxia/frontend/src/app/admin/pacientes/page.tsx',
  'c:/Users/juann/proyecto-turnos-quiropraxia/frontend/src/app/admin/turnos/page.tsx',
  'c:/Users/juann/proyecto-turnos-quiropraxia/frontend/src/app/admin/pacientes/[id]/page.tsx'
];
files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/await\s*\(/g, 'await authFetch(');
    content = content.replace(/return\s*\(/g, 'return authFetch('); // if any return fetch( was affected. Wait, return( is valid in React!
    fs.writeFileSync(file, content);
    console.log('Fixed await in ' + file);
  }
});
