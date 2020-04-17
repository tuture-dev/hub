const fs = require('fs-extra');
const path = require('path');
const cp = require('child_process');
const yaml = require('js-yaml');

// Root path of this project.
const root = process.cwd();

// Path to hexo posts.
const postsDir = path.join(root, 'source', '_posts');

// Sub-directory for storing markdowns of each tutorial.

const workspace = '.tuture';

const collectionPath = path.join(workspace, 'collection.json');

const buildDir = path.join(workspace, 'build');

/**
 * Function for adjusting markdown content in place.
 */
function adjustContent(markdownPath, info) {
  const { cover, id } = info;

  let content = fs.readFileSync(markdownPath).toString();

  // Set the lang of all vue code blocks to html,
  // since highlight.js doesn't support vue syntax.
  content = content.replace(/```vue/g, '```html');

  // Replace tsx to ts.
  content = content.replace(/```tsx/g, '```ts');

  fs.writeFileSync(markdownPath, content);
}

/**
 * Build a single hexo post.
 */
function buildSingleArticle(article) {
  const { name, id, cover } = article;
  const truncatedId = id
    .toString()
    .slice(0, Number(process.env.ID_DIGITS) || 7);
  const mdPath = path.join(buildDir, `${name}.md`);

  adjustContent(mdPath, { cover, id: truncatedId });

  fs.copySync(mdPath, path.join(postsDir, `${truncatedId}.md`), {
    overwrite: true,
  });
}

/**
 * Build tutorials and move them into hexo posts directory.
 */
function buildTutorial(tuturePath) {
  process.chdir(tuturePath);
  console.log(`\nWorking on ${process.cwd()}.`);

  // Build tutorial as usual.
  cp.execSync('tuture reload && tuture build --hexo');
  console.log('Build complete.');

  const collection = JSON.parse(fs.readFileSync(collectionPath).toString());
  const idDigits = Number(process.env.ID_DIGITS) || 7;
  const convertId = (id) => id.toString().slice(0, idDigits);

  collection.articles.forEach((article) => buildSingleArticle(article));

  console.log(`Finished ${process.cwd()}.`);
  process.chdir(root);
}

module.exports = buildTutorial;
