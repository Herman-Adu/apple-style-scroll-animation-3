import { promises as fs } from 'fs';
import path from 'path';

const ROOT = process.cwd();
const LIMIT = 300;

async function walk(dir) {
  const res = [];
  for (const name of await fs.readdir(dir)) {
    const p = path.join(dir, name);
    const st = await fs.stat(p);
    if (st.isDirectory()) res.push(...(await walk(p)));
    else res.push(p);
  }
  return res;
}

function countLines(text) {
  return text.split(/\r?\n/).length;
}

function findImports(text) {
  const re = /import\s+[^'"']+['"]([^'"]+)['"]/g;
  const imports = [];
  let m;
  while ((m = re.exec(text))) imports.push(m[1]);
  return imports;
}

function featureFromPath(p) {
  const parts = p.split(/[\\/]/);
  const idx = parts.indexOf('features');
  if (idx >= 0 && parts.length > idx + 1) return parts[idx + 1];
  return null;
}

async function main() {
  const scanTargets = ['features', 'lib'].map((d) => path.join(ROOT, d)).filter((p) => {
    try { return fs.stat(p); } catch { return false; }
  });

  const files = [];
  for (const dir of scanTargets) {
    try {
      const list = await walk(dir);
      for (const f of list) if (/\.(ts|tsx|js|jsx)$/.test(f)) files.push(f);
    } catch (err) {
      // ignore
    }
  }

  const large = [];
  const deepImports = [];

  for (const f of files) {
    try {
      const txt = await fs.readFile(f, 'utf8');
      const lines = countLines(txt);
      if (lines > LIMIT) large.push({ file: path.relative(ROOT, f), lines });

      const imports = findImports(txt);
      const feat = featureFromPath(f);
      for (const imp of imports) {
        if (imp.startsWith('@/features/')) {
          const impFeat = imp.split('/')[2];
          if (impFeat && impFeat !== feat) deepImports.push({ file: path.relative(ROOT, f), imports: imp });
        }
        if (imp.startsWith('../') || imp.startsWith('../../')) {
          // relative upward import - consider deep
          if (imp.includes('..')) deepImports.push({ file: path.relative(ROOT, f), imports: imp });
        }
      }
    } catch (err) {
      // ignore read errors
    }
  }

  console.log('\nArchitecture audit report');
  console.log('Limit per file:', LIMIT, 'lines');
  console.log('\nLarge files:');
  if (large.length === 0) console.log('  none');
  else large.sort((a,b)=>b.lines-a.lines).slice(0,50).forEach(l=>console.log(`  ${l.lines}\t${l.file}`));

  console.log('\nPotential deep imports:');
  if (deepImports.length === 0) console.log('  none');
  else deepImports.slice(0,200).forEach(d=>console.log(`  ${d.file} -> ${d.imports}`));

  console.log('\nExit: 0');
}

main().catch((e)=>{ console.error(e); process.exit(2); });
