import CircularDependencyPlugin from 'circular-dependency-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import webpack from 'webpack';
import { merge } from 'webpack-merge';

import { devServerConfig } from '../../../webpack/webpack.server.js';

export const demoBuildConfig = merge(devServerConfig, {
  entry: './src/main.tsx',
  output: {
    filename: 'main.js',
    // path: '../dist',
    // path: path.resolve(__dirname, '../dist'),
    publicPath: '/',
  },
  plugins: [
    // new CircularDependencyPlugin({
    //   exclude: /a\.js|node_modules/,
    //   failOnError: true,
    //   allowAsyncCycles: false,
    //   cwd: process.cwd(),
    // }),
    new webpack.DefinePlugin({
      // 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      // 'process.env.BACKEND': JSON.stringify(process.env.BACKEND),
      'process.env': JSON.stringify(process.env),
    }),
    new HtmlWebpackPlugin({
      // template: path.resolve(process.cwd(), 'demo.html'),
      template: './public/app.html',
    }),
  ],
  resolve: {
    // alias: {
    //   react: path.resolve(__dirname, '../../node_modules/react'),
    //   'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
    // },
    fallback: {
      path: false,
    },
  },
  devServer: {
    // contentBase: path.resolve(__dirname, '../dist'),
    port: 8998,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        // pathRewrite: { '^/api': '' },
      },
    },
  },
});

export default demoBuildConfig;
