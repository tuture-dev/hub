const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');

// Root path of this project.
const root = process.cwd();

// Path to hexo posts.
const postsDir = path.join(root, 'source', '_posts');

// Sub-directory for storing markdowns of each tutorial.
const buildDir = 'tuture-build';

/**
 * Hashing for each filename.
 */
function hashFilename(filename, digits = 7) {
  const hash = crypto.createHash('sha256');
  hash.update(filename);
  return `${hash.digest('hex').slice(0, digits)}.md`;
}

/**
 * Function for adjusting markdown content.
 */
function adjustContent(markdownPath) {
  let content = fs.readFileSync(markdownPath).toString();

  // Set the lang of all vue code blocks to html,
  // since highlight.js doesn't support vue syntax.
  content = content.replace(/```vue/g, '```html');

  fs.writeFileSync(markdownPath, content);
}

/**
 * Build tutorials and move them into hexo posts directory.
 */
function buildTutorial(tuturePath) {
  process.chdir(tuturePath);
  console.log(`Working on ${process.cwd()}.`);

  cp.execSync('tuture reload && tuture build --hexo');

  fs.readdirSync(buildDir).forEach(filename => {
    if (filename.match(/\.md$/)) {
      adjustContent(path.join(buildDir, filename));

      fs.moveSync(
        path.join(buildDir, filename),
        path.join(postsDir, hashFilename(filename)),
        { overwrite: true },
      );
    }
  });

  process.chdir(root);
}

fs.readdirSync('tutorials').forEach(tuturePath =>
  buildTutorial(path.resolve('tutorials', tuturePath)),
);

process.chdir(root);
