var path = require('path');

module.exports = {
  entry: {
    app: './src/App.js',
    interactive_test: './src/interactive_test.js'
  },
  output: {
    filename: '[name].js',
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