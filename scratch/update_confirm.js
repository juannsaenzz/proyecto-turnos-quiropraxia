const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/app/admin/turnos/page.tsx',
  'frontend/src/app/admin/pacientes/page.tsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add state if not present
  if (!content.includes('const [isConfirming')) {
    content = content.replace(
      /const \[toastMessage, setToastMessage\] = useState<string \| null>\(null\);/,
      'const [toastMessage, setToastMessage] = useState<string | null>(null);\n  const [isConfirming, setIsConfirming] = useState(false);'
    );
  }

  // Update signature
  content = content.replace(
    /onConfirm: \(\) => void;/g,
    'onConfirm: () => void | Promise<void>;'
  );

  // Update onClick for confirm
  content = content.replace(
    /onClick=\{\(\) => \{\s*customConfirm\.onConfirm\(\);\s*setCustomConfirm\(null\);\s*\}\}/g,
    `disabled={isConfirming} onClick={async () => {
                  setIsConfirming(true);
                  try {
                    await customConfirm.onConfirm();
                  } finally {
                    setIsConfirming(false);
                    setCustomConfirm(null);
                  }
                }}`
  );

  // Update Cancel button
  content = content.replace(
    /onClick=\{\(\) => setCustomConfirm\(null\)\}/g,
    'disabled={isConfirming} onClick={() => setCustomConfirm(null)}'
  );

  // Update button content
  content = content.replace(
    /\{customConfirm\.confirmText \|\| 'Confirmar'\}/g,
    `{isConfirming ? <div className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Procesando...</div> : (customConfirm.confirmText || 'Confirmar')}`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
