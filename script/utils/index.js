const fs = require('fs-extra');
const path = require('path');

function listSubdirectories(root) {
  return fs
    .readdirSync(root)
    .map(p => path.resolve(root, p))
    .filter(p => fs.lstatSync(p).isDirectory());
}

exports.listSubdirectories = listSubdirectories;

exports.buildRoadmap = require('./buildRoadmap');
exports.buildTutorial = require('./buildTutorial');
