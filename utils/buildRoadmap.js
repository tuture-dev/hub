const fs = require('fs-extra');
const path = require('path');

// Root path of this project.
const root = process.cwd();

// Path to hexo posts.
const roadmapsDir = path.join(root, 'source', 'roadmaps');

function buildRoadmap(roadmapPath) {
  process.chdir(roadmapPath);
  console.log(`Working on ${process.cwd()}.`);

  if (!fs.existsSync('README.md')) {
    console.log('Not a valid roadmap, skipping.');
    process.chdir(root);
    return;
  }

  const roadmapName = path.parse(roadmapPath).name;
  let content = fs.readFileSync('README.md').toString();
  const frontmatter = fs.readFileSync('frontmatter.yml').toString();

  // Remove markdown TOC.
  content = content.replace(/## 目录[\w\W]+## 入门/, '## 入门');

  // Append front matter.
  content = `${frontmatter}\n${content}`;

  // Save roadmap to target directory.
  const targetDir = path.join(roadmapsDir, roadmapName);
  fs.ensureDirSync(targetDir);
  fs.writeFileSync(path.join(targetDir, 'index.md'), content);

  // Move assets directory.
  fs.moveSync('assets', path.join(targetDir, 'assets'));
}

module.exports = buildRoadmap;
