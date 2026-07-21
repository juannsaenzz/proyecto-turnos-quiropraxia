const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/app/admin/pacientes/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add visiblePacientesCount state
if (!content.includes('const [visiblePacientesCount')) {
  content = content.replace(
    /const \[searchQuery, setSearchQuery\] = useState\(''\);/,
    `const [searchQuery, setSearchQuery] = useState('');\n  const [visiblePacientesCount, setVisiblePacientesCount] = useState(10);`
  );
}

// 2. Add useEffect to reset pagination when search/sort changes
if (!content.includes('setVisiblePacientesCount(10);')) {
  content = content.replace(
    /const \[searchQuery, setSearchQuery\] = useState\(''\);\n  const \[visiblePacientesCount, setVisiblePacientesCount\] = useState\(10\);/,
    `const [searchQuery, setSearchQuery] = useState('');\n  const [visiblePacientesCount, setVisiblePacientesCount] = useState(10);\n\n  useEffect(() => {\n    setVisiblePacientesCount(10);\n  }, [searchQuery, sortOption]);`
  );
}

// 3. Apply slice to mapping
content = content.replace(
  /\{sortedPacientes\.map\(p => \(/g,
  `{sortedPacientes.slice(0, visiblePacientesCount).map(p => (`
);

// 4. Add "Ver más" button
const loadMoreButton = `
              {visiblePacientesCount < sortedPacientes.length && (
                <div className="p-4 border-t border-slate-800 flex justify-center bg-slate-900/50">
                  <button 
                    onClick={() => setVisiblePacientesCount(prev => prev + 10)}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-bold rounded-xl transition border border-slate-700 shadow-sm"
                  >
                    Ver más pacientes ({sortedPacientes.length - visiblePacientesCount} ocultos)
                  </button>
                </div>
              )}
            </div>`;

content = content.replace(
  /<\/table>\n\s*<\/div>\n\s*<\/div>/,
  `</table>\n              </div>\n${loadMoreButton}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Pagination added successfully!');
