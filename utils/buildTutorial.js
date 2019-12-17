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
  const { assetsPath, cover, id } = info;

  let content = fs.readFileSync(markdownPath).toString();

  // Move the cover and compress.
  if (cover && content.match(cover)) {
    const newCoverName = `${id}.jpg`;
    const targetCover = path.join(coversDir, newCoverName);
    cp.execSync(`magick convert -quality 70% "${cover}" "${targetCover}"`);

    content = content.replace(cover, `/images/covers/${newCoverName}`);
  }

  // Perform image compression.
  content = compressImages(assetsPath, content);

  // Set the lang of all vue code blocks to html,
  // since highlight.js doesn't support vue syntax.
  content = content.replace(/```vue/g, '```html');

  fs.writeFileSync(markdownPath, content);
}

/**
 * Build a single hexo post.
 */
function buildSinglePost(name, id, cover) {
  const assetsPath = path.join(buildDir, name);
  const mdPath = path.join(buildDir, `${name}.md`);

  adjustContent(mdPath, { assetsPath, cover, id });

  fs.moveSync(mdPath, path.join(postsDir, `${id}.md`), {
    overwrite: true,
  });
  fs.moveSync(assetsPath, path.join(postsDir, id), { overwrite: true });
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

  const tuture = yaml.safeLoad(fs.readFileSync('tuture.yml').toString());

  if (tuture.splits) {
    tuture.splits.forEach(split =>
      buildSinglePost(split.name, split.id.toString(), split.cover),
    );
  } else {
    buildSinglePost(tuture.name, tuture.id.toString(), tuture.cover);
  }

  console.log(`Finished ${process.cwd()}.`);
  process.chdir(root);
}

module.exports = buildTutorial;
