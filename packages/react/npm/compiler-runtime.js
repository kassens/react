'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-compiler-runtime.production.js');
} else {
  module.exports = require('./cjs/react-compiler-runtime.development.js');
}
