const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const retry = require('retry');
const pLimit = require('p-limit');
const OSS = require('ali-oss');

const client = new OSS({
  accessKeyId: process.env.ACCESS_KEY_ID,
  accessKeySecret: process.env.ACCESS_KEY_SECRET,
  bucket: process.env.BUCKET_NAME,
  region: process.env.BUCKET_REGION,
});

const distDir = 'public';
const filePaths = [];

function walk(dirName) {
  const files = fs.readdirSync(dirName);

  files.forEach(file => {
    const fullPath = path.join(dirName, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walk(fullPath);
    } else {
      filePaths.push(fullPath);
    }
  });
}

walk(distDir);

const limit = pLimit(2);

const uploadTasks = filePaths.map(filePath =>
  limit(async () => {
    await client.put(filePath.substr(distDir.length + 1), filePath);
    console.log(`Upload ${filePath} successfully.`);
  }),
);

(async () => {
  await Promise.all(uploadTasks);
  console.log('Upload complete!');
})();
