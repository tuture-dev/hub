const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const yaml = require('js-yaml');

// Root path of this project.
const root = process.cwd();

// Path to hexo posts.
const postsDir = path.join(root, 'source', '_posts');

// Path to tutorial covers.
const coversDir = path.join(root, 'source', 'images', 'covers');

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
 * Compress all images (except for GIFs).
 */
function compressImages(assetsRoot, content) {
  let newContent = content;
  fs.readdirSync(assetsRoot).forEach(imgName => {
    const oldPath = path.join(assetsRoot, imgName);
    const { dir, name, ext } = path.parse(oldPath);

    if (ext !== '.gif') {
      const newPath = path.join(dir, `${name}.jpg`);

      // Compress images into degraded JPEG format and remove old ones.
      cp.execSync(`magick convert -quality 30% "${oldPath}" "${newPath}"`);

      // Remove useless images.
      if (oldPath !== newPath) {
        cp.execSync(`rm "${oldPath}"`);
      }

      // Update image paths in markdown.
      newContent = newContent.replace(new RegExp(imgName, 'g'), `${name}.jpg`);
    }
  });

  return newContent;
}

/**
 * Function for adjusting markdown content in place.
 */
function adjustContent(markdownPath, info) {
  const { assetsPath, coversPath, hash } = info;

  let content = fs.readFileSync(markdownPath).toString();

  // Move the cover(s) and compress.
  coversPath.forEach(cover => {
    if (content.match(cover)) {
      const newCoverName = `${hash}.jpg`;
      const targetCover = path.join(coversDir, newCoverName);
      cp.execSync(`magick convert -quality 70% "${cover}" "${targetCover}"`);

      content = content.replace(cover, `/images/covers/${newCoverName}`);
    }
  });

  // Perform image compression.
  content = compressImages(assetsPath, content);

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

  if (!fs.existsSync('tuture.yml')) {
    console.log('Not in a Tuture tutorial, skipping.');
    process.chdir(root);
    return;
  }

  // Build tutorial as usual.
  cp.execSync('tuture reload && tuture build --hexo');

  const titles = new Set(
    fs
      .readdirSync(buildDir)
      .filter(fname => fname.match(/.md$/))
      .map(fname => fname.replace('.md', '')),
  );

  const tuture = yaml.safeLoad(fs.readFileSync('tuture.yml').toString());
  const coversPath = [tuture.cover]
    .concat(tuture.splits ? tuture.splits.map(split => split.cover) : [])
    .filter(cover => cover);

  titles.forEach(title => {
    const hash = createHash(title);
    const assetsPath = path.join(buildDir, title);
    const mdPath = path.join(buildDir, `${title}.md`);

    adjustContent(mdPath, { assetsPath, coversPath, hash });

    fs.moveSync(mdPath, path.join(postsDir, `${hash}.md`), {
      overwrite: true,
    });
    fs.moveSync(assetsPath, path.join(postsDir, hash), { overwrite: true });
  });

  console.log(`Finished ${process.cwd()}.`);
  process.chdir(root);
}

module.exports = buildTutorial;
