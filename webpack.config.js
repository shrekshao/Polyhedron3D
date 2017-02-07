var path = require('path');

module.exports = {
  entry: './js/App.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  devServer: {
    port: 7000
  }
};