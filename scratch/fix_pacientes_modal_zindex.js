const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/app/admin/pacientes/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove the opening of the ternary
const ternaryOpenRegex = /      <main className="flex-grow p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">\n        \{loading \? \(\n          <LoadingSpinner \/>\n        \) : \(\n          <>\n/;
if (ternaryOpenRegex.test(content)) {
  content = content.replace(ternaryOpenRegex, '      <main className="flex-grow p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">\n');
}

// 2. We need to move </main> to line 1262 and remove the closing of the ternary at the bottom.
// At the bottom of the file we have:
//           </>
//         )}
//       </main>
//     </>
//   );
// }

const ternaryCloseRegex = /          <\/>\n        \)\}\n      <\/main>\n    <\/>\n  \);\n\}/;
if (ternaryCloseRegex.test(content)) {
  content = content.replace(ternaryCloseRegex, '    </>\n  );\n}');
}

// 3. Now insert </main> right after the end of the `bg-slate-900 rounded-3xl ...` div.
// It ends just before `{showNewTurnoModal && (`
const insertMainCloseRegex = /(          \{\/\* TAB 3: HISTORIAL CLINICO \*\/\}\n      \{showNewTurnoModal && \()/;
if (insertMainCloseRegex.test(content)) {
  content = content.replace(insertMainCloseRegex, '      </main>\n$1');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully cleaned up ternary and moved </main> in pacientes/page.tsx");
