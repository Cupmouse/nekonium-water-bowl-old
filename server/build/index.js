'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.web3 = undefined;

var _web = require('web3');

var _web2 = _interopRequireDefault(_web);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _normal_hander = require('./normal_hander');

var _normal_hander2 = _interopRequireDefault(_normal_hander);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var EXTENTION_TO_MIME = {
  'html': 'text/html',
  'js': 'application/javascript',
  'mjs': 'application/javascript'
};

var web3 = exports.web3 = new _web2.default(new _web2.default.providers.HttpProvider("http://localhost:8545"));

// Cache of static contents
var staticFiles = {};

var cacheDirRecursively = function cacheDirRecursively(dir) {
  var level = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '/';

  _fs2.default.readdirSync(dir).forEach(function (file) {
    var pathToFile = dir + file;
    var relativePathToFile = level + file;
    console.log('Loading ' + pathToFile + ' mapped to ' + relativePathToFile);

    if (_fs2.default.lstatSync(pathToFile).isDirectory()) {
      cacheDirRecursively(pathToFile + '/', '' + level + file + '/');
    } else {
      // Cache file
      staticFiles[relativePathToFile] = _fs2.default.readFileSync(pathToFile);
    }
  });
};

// Cache static files into memory
cacheDirRecursively('./../client/');

// Creating server
_http2.default.createServer(function (request, response) {
  var path = _url2.default.parse(request.url).path;

  if (path === '/') {
    // Root, return index html

    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.write(staticFiles['/index.html']);
    response.end();
  } else {
    // Search if it is static file and cached
    var foundCached = staticFiles[path];

    if (foundCached === undefined) {
      // There is no static file for that, return 403
      response.writeHead(403, { 'Content-Type': 'text/html' });
      response.write('403 File Not Found');
      response.end();
    } else {
      // There is cached content for the path
      var indexOfPeriod = path.indexOf('.') + 1;
      var contentType = void 0;

      if (indexOfPeriod >= path.length) {
        // Why...?
        contentType = 'plain/text'; // Only called when path is '*.'
      } else {
        // It's in bound, we can substr to get extension
        var fileExtension = path.substr(indexOfPeriod);

        contentType = EXTENTION_TO_MIME[fileExtension];

        if (contentType === undefined) {
          console.warn('MIME type for extension ' + fileExtension + ' is not mapped');
          contentType = 'plain/text';
        }
      }

      response.writeHead(200, { 'Content-Type': contentType });
      response.write(foundCached);
      response.end();
    }
  }

  console.log('Got request for ' + path);
}).listen(9876);

console.log('server running on port 9876');