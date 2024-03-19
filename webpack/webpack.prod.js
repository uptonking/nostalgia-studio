// webpack config for production

import path from 'path';
import webpack from 'webpack';
import { merge } from 'webpack-merge';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { commonConfig } from './webpack.common.js';

export const prodConfig = merge(commonConfig, {
  mode: 'production',
  // false 不创建map
  devtool: 'source-map',
  target: 'browserslist',
  plugins: [
    new MiniCssExtractPlugin({
      // filename: '[name].css',
      filename: 'styles.css',
      // chunkFilename: '[id].css',
      ignoreOrder: false,
    }),
  ],
});
