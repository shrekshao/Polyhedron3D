var path = require('path');

module.exports = {
  entry: './src/App.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    loaders: [
      {
        test: /\.glsl$/,
        loader: "webpack-glsl-loader"
      },
    ]
  },
  devServer: {
    port: 7000
  }
};