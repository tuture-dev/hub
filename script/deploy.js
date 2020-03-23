const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const retry = require('retry');
const pRetry = require('p-retry');
const OSS = require('ali-oss');

const client = new OSS({
  accessKeyId: process.env.ACCESS_KEY_ID,
  accessKeySecret: process.env.ACCESS_KEY_SECRET,
  bucket: process.env.BUCKET_NAME,
  region: process.env.BUCKET_REGION,
});

const distDir = 'public';

function walk(dirName, callback) {
  fs.readdir(dirName, (err, files) => {
    if (err) {
      callback(err, null);
    }

    files.forEach(file => {
      const fullPath = path.join(dirName, file);
      fs.stat(fullPath, (err, file) => {
        if (err) {
          callback(err, null);
        }
        if (file.isDirectory()) {
          walk(fullPath, callback);
        } else {
          callback(null, fullPath);
        }
      });
    });
  });
}

walk(distDir, (err, filePath) => {
  if (err) throw err;

  pRetry(() => client.put(filePath.substr(distDir.length + 1), filePath), {
    retries: 5,
  })
    .then(() => console.log(chalk.green(`${filePath} uploaded!`)))
    .catch(err => {
      throw new Error(`${filePath} upload failed after 5 retries`);
    });
});
