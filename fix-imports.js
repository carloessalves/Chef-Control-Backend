// fix-imports.js
import fs from 'fs';
import path from 'path';

const SRC_DIR = './src';

// Regex para capturar imports/exports relativos sem extensão
const importRegex = /((?:import|export)\s+(?:[\s\S]*?from\s+)?['"])(\.{1,2}\/[^'"]+?)(['"])/g;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  content = content.replace(importRegex, (match, prefix, importPath, suffix) => {
    // já tem extensão? pula
    if (/\.(js|json|ts)$/.test(importPath)) return match;

    const dir = path.dirname(filePath);
    const absPath = path.resolve(dir, importPath);

    let finalPath = importPath;

    if (fs.existsSync(absPath) && fs.statSync(absPath).isDirectory()) {
      // é uma pasta -> aponta pro index.js
      finalPath = `${importPath}/index.js`;
    } else {
      finalPath = `${importPath}.js`;
    }

    changed = true;
    return `${prefix}${finalPath}${suffix}`;
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✔ Atualizado: ${filePath}`);
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) {
      processFile(fullPath);
    }
  }
}

walk(SRC_DIR);
console.log('Concluído!');
