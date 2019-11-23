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
      cp.execSync(`magick convert -quality 20% ${oldPath} ${newPath} && rm ${oldPath}`);

      // Update image paths in markdown.
      newContent = newContent.replace(new RegExp(imgName, 'g'), `${name}.jpg`);
    }
  });

  return newContent;
}

/**
 * Function for adjusting markdown content in place.
 */
function adjustContent(assetsPath, markdownPath) {
  let content = fs.readFileSync(markdownPath).toString();

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

  titles.forEach(title => {
    const assetsPath = path.join(buildDir, title);
    const mdPath = path.join(buildDir, `${title}.md`);

    adjustContent(assetsPath, mdPath);

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
