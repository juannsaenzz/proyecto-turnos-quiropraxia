const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/app/admin/turnos/page.tsx',
  'frontend/src/app/admin/pacientes/page.tsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add state
  if (!content.includes('const [isSubmitting')) {
    content = content.replace(
      /const \[toastMessage, setToastMessage\] = useState<string \| null>\(null\);/,
      'const [toastMessage, setToastMessage] = useState<string | null>(null);\n  const [isSubmitting, setIsSubmitting] = useState(false);'
    );
  }

  // Replace forms
  content = content.replace(
    /<form onSubmit={([a-zA-Z0-9_]+)}/g,
    '<form onSubmit={async (e) => { setIsSubmitting(true); try { await $1(e); } finally { setIsSubmitting(false); } }}'
  );

  // Replace buttons
  content = content.replace(
    /<button type="submit" className="([^"]+)">\s*([^<]+)\s*<\/button>/g,
    `<button type="submit" disabled={isSubmitting} className="$1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? <><RefreshCw className="h-4 w-4 animate-spin" /> Guardando...</> : '$2'}
                </button>`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
