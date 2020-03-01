const fs = require('fs-extra');
const path = require('path');
const cp = require('child_process');
const yaml = require('js-yaml');

// Root path of this project.
const root = process.cwd();

// Path to hexo posts.
const postsDir = path.join(root, 'source', '_posts');

// Path to tutorial covers.
const coversDir = path.join(root, 'source', 'images', 'covers');
if (!fs.existsSync(coversDir)) {
  fs.mkdirpSync(coversDir);
}

// Sub-directory for storing markdowns of each tutorial.
const buildDir = 'tuture-build';

const workspace = '.tuture';

const collectionPath = path.join(workspace, 'collection.json');
const assetsJsonPath = path.join(workspace, 'tuture-assets.json');
const assetsDir = path.join(workspace, 'assets');

/**
 * Compress all images (except for GIFs).
 */
function compressImages(content) {
  let newContent = content;
  const assets = JSON.parse(fs.readFileSync(assetsJsonPath).toString());

  assets.forEach(({ localPath, hostingUri }) => {
    const { dir, base, name, ext } = path.parse(localPath);

    if (ext !== '.gif') {
      const newPath = path.join(dir, `${name}.jpg`);
      const imgQuality = process.env.IMG_QUALITY || '30';

      // Compress images into degraded JPEG format and remove old ones.
      cp.execSync(
        `convert -quality ${imgQuality}% "${localPath}" "${newPath}"`,
      );

      // Remove useless images.
      if (localPath !== newPath) {
        cp.execSync(`rm "${localPath}"`);
      }

      // Update image paths in markdown.
      newContent = newContent.replace(hostingUri, `./${name}.jpg`);
    } else {
      newContent = newContent.replace(hostingUri, `./${base}`);
    }
  });

  return newContent;
}

/**
 * Function for adjusting markdown content in place.
 */
function adjustContent(markdownPath, info) {
  const { cover, id } = info;

  let content = fs.readFileSync(markdownPath).toString();

  // Move the cover and compress.
  if (cover && content.match(cover)) {
    const newCoverName = `${id}.jpg`;
    const targetCover = path.join(coversDir, newCoverName);
    const coverQuality = process.env.COVER_QUALITY || '70';

    cp.execSync(
      `convert -quality ${coverQuality}% "${cover}" "${targetCover}"`,
    );

    content = content.replace(cover, `/images/covers/${newCoverName}`);
  }

  // Perform image compression.
  content = compressImages(content);

  // Set the lang of all vue code blocks to html,
  // since highlight.js doesn't support vue syntax.
  content = content.replace(/```vue/g, '```html');

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
  fs.copySync(assetsDir, path.join(postsDir, truncatedId), {
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
  cp.execSync('tuture reload && tuture download-assets && tuture build --hexo');
  console.log('Build complete.');

  const collection = JSON.parse(fs.readFileSync(collectionPath).toString());
  const idDigits = Number(process.env.ID_DIGITS) || 7;
  const convertId = id => id.toString().slice(0, idDigits);

  collection.articles.forEach(article => buildSingleArticle(article));

  console.log(`Finished ${process.cwd()}.`);
  process.chdir(root);
}

module.exports = buildTutorial;
