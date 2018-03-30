import Web3 from 'web3';
import http from 'http';
import url from 'url';
import fs from 'fs';

import normalHandler from './normal_hander';


const EXTENTION_TO_MIME = {
  'html': 'text/html',
  'js': 'application/javascript',
  'mjs': 'application/javascript',
};

export const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

// Cache of static contents
const staticFiles = {};

const cacheDirRecursively = (dir, level = '/') => {
  fs.readdirSync(dir).forEach(file => {
    const pathToFile = dir + file;
    const relativePathToFile = level + file;
    console.log(`Loading ${pathToFile} mapped to ${relativePathToFile}`);

    if (fs.lstatSync(pathToFile).isDirectory()) {
      cacheDirRecursively(`${pathToFile}/`, `${level}${file}/`);
    } else {
      // Cache file
      staticFiles[relativePathToFile] = fs.readFileSync(pathToFile);
    }
  });
};

// Cache static files into memory
cacheDirRecursively('./../client/');

// Creating server
http.createServer((request, response) => {
  const path = url.parse(request.url).path;

  if (path === '/') {
    // Root, return index html

    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write(staticFiles['/index.html']);
    response.end();
  } else {
    // Search if it is static file and cached
    const foundCached = staticFiles[path];

    if (foundCached === undefined) {
      // There is no static file for that, return 403
      response.writeHead(403, {'Content-Type': 'text/html'});
      response.write('403 File Not Found');
      response.end();
    } else {
      // There is cached content for the path
      const indexOfPeriod = path.indexOf('.') + 1;
      let contentType;

      if (indexOfPeriod >= path.length) {
        // Why...?
        contentType = 'plain/text'; // Only called when path is '*.'
      } else {
        // It's in bound, we can substr to get extension
        const fileExtension = path.substr(indexOfPeriod);

        contentType = EXTENTION_TO_MIME[fileExtension];

        if (contentType === undefined) {
          console.warn(`MIME type for extension ${fileExtension} is not mapped`);
          contentType = 'plain/text';
        }
      }

      response.writeHead(200, {'Content-Type': contentType});
      response.write(foundCached);
      response.end();
    }
  }

  console.log(`Got request for ${path}`);

}).listen(9876);

console.log('server running on port 9876');

