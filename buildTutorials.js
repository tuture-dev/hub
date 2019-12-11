const path = require('path');
const { listSubdirectories, buildTutorial } = require('./utils');

const root = process.cwd();
const tutorialsRoot = path.resolve('tutorials');

console.log('\nBuilding tutorials ...');
listSubdirectories(tutorialsRoot).forEach(p => buildTutorial(p));

process.chdir(root);
