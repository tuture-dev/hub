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
 * Hashing for each tutorial title.
 */
function createHash(title, digits = 7) {
  const hash = crypto.createHash('sha256');
  hash.update(title);
  return hash.digest('hex').slice(0, digits);
}

/**
 * Function for adjusting markdown content in place.
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

  const titles = new Set(
    fs.readdirSync(buildDir).map(fname => fname.replace('.md', '')),
  );

  titles.forEach(title => {
    const assetsPath = path.join(buildDir, title);
    const mdPath = path.join(buildDir, `${title}.md`);

    adjustContent(mdPath);

    const newTitle = createHash(title);
    fs.moveSync(mdPath, path.join(postsDir, `${newTitle}.md`), {
      overwrite: true,
    });
    fs.moveSync(assetsPath, path.join(postsDir, newTitle), { overwrite: true });
  });

  console.log(`Finished ${process.cwd()}.`);
  process.chdir(root);
}

fs.readdirSync('tutorials').forEach(tuturePath =>
  buildTutorial(path.resolve('tutorials', tuturePath)),
);

process.chdir(root);
