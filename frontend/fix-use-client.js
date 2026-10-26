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
    
    // Check if use client is not at the top
    if (content.includes('"use client"') && !content.trim().startsWith('"use client"')) {
      content = content.replace(/["']use client["'];?\s*/g, '');
      content = '"use client";\n\n' + content;
      fs.writeFileSync(file, content);
      console.log('Fixed use client in ' + file);
    }
  }
});
