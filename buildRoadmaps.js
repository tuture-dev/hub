const path = require('path');
const { listSubdirectories, buildRoadmap } = require('./utils');

const root = process.cwd();
const roadmapsRoot = path.resolve('roadmaps');

console.log('Building roadmaps ...');
listSubdirectories(roadmapsRoot).forEach(p => buildRoadmap(p));

process.chdir(root);
