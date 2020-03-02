const cp = require('child_process');
const path = require('path');
const { listSubdirectories, buildTutorial } = require('./utils');

const root = process.cwd();
const tutorialsRoot = path.resolve('repos', 'tutorials');

console.log('Tuture Version');
console.log(cp.execSync('tuture -v').toString());

console.log('\nBuilding tutorials ...');
listSubdirectories(tutorialsRoot).forEach(p => buildTutorial(p));

process.chdir(root);
