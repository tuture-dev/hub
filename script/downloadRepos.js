const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');

const roadmaps = require('../roadmaps.json');
const tutorials = require('../tutorials.json');

function log(status, message) {
  let output;
  switch (status) {
    case 'info':
      output = `${chalk.blue('[INFO]')} ${message}`;
      break;
    case 'warning':
      output = `${chalk.yellow('[WARNING]')} ${message}`;
      break;
    case 'success':
      output = `${chalk.green('[SUCCESS]')} ${message}`;
      break;
    case 'fail':
      output = `${chalk.red('[FAIL]')} ${message}`;
      break;
    default:
      throw new Error(`Unsupported status: ${status}`);
  }

  console.log(output);
}

function downloadAll(object) {
  const { root, sources } = object;
  log('info', `Downloading ${root} with ${sources.length} sources ...`);

  const tasks = sources.map(
    source =>
      new Promise((resolve, reject) => {
        const repoPath = path.join(root, source.name);
        log('info', `Starting to download ${repoPath} ...`);

        // 如果已经下载过，则删除重新下载
        if (fs.existsSync(repoPath)) {
          log('warning', `Deleting ${repoPath} and re-download.`);
          fs.removeSync(repoPath);
        }

        exec(`git clone ${source.git} ${repoPath}`, err => {
          if (err) {
            log('fail', `Download failed: ${repoPath}!`);
            reject(err.message);
          } else {
            log('success', `Finished ${repoPath}!`);
            resolve();
          }
        });
      }),
  );

  Promise.all(tasks)
    .then(() => {
      log('success', `Download ${root} complete!`);
    })
    .catch(err => {
      log('fail', `Download ${root} failed: ${err}`);
    });
}

downloadAll(roadmaps);
downloadAll(tutorials);
