const fs = require('fs-extra');
const path = require('path');

const buildDir = 'public';
const excludedFiles = ['.git', '.gitignore', 'node_modules', buildDir];

if (!fs.existsSync(buildDir)) {
  console.log('Build directory not ready. Stopping.');
  process.exit(1);
}

fs.readdirSync('.')
  .filter(fname => excludedFiles.indexOf(fname) < 0)
  .forEach(fname => fs.removeSync(fname));

fs.readdirSync(buildDir).forEach(fname =>
  fs.moveSync(path.join(buildDir, fname), fname, { overwrite: true }),
);
