const path = require('path');
const { merge } = require('webpack-merge');
const devServerConfig = require('../../../webpack/webpack.server');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = merge(devServerConfig, {
  entry: path.resolve(__dirname, '../docs/render.tsx'),
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, '../dist'),
  },
  plugins: [
    new CircularDependencyPlugin({
      exclude: /a\.js|node_modules/,
      failOnError: true,
      allowAsyncCycles: false,
      cwd: process.cwd(),
    }),
    new HtmlWebpackPlugin({
      // template: path.resolve(process.cwd(), 'demo.html'),
      template: './public/index.html',
      // filename: 'index.html',
    }),
  ],
  // resolve: {
  //   alias: {
  //     react: path.resolve(__dirname, '../../node_modules/react'),
  //     'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
  //   },
  // },
  // devServer: {
  //   contentBase: path.resolve(__dirname, '../dist'),
  // },
});
