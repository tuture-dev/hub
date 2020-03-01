const fs = require('fs');
const path = require('path');
const COS = require('cos-nodejs-sdk-v5');

require('dotenv').config();

const cos = new COS({
  SecretId: process.env.SECRET_ID,
  SecretKey: process.env.SECRET_KEY,
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

const isProd = process.env.DEPLOY_ENV === 'production';

walk(distDir, (err, filePath) => {
  if (err) throw err;
  cos.putObject(
    {
      Bucket: process.env.BUCKET_NAME,
      Region: process.env.BUCKET_REGION,
      Key: filePath.substr(distDir.length + 1),
      Body: fs.createReadStream(filePath),
    },
    function(err, data) {
      console.log(err || data);
    },
  );
});
