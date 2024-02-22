import { merge } from 'webpack-merge';

import rspack from '@rspack/core';

import { devConfig } from '../../../webpacker/rspack.dev.mjs';

const devOutputConfig = merge(
  devConfig,

  {
    entry: {
      main: './src/index.ts',
    },
    output: {
      path: './dist',
      filename: 'index.js',
      // path: path.resolve(__dirname, '../build'),
    },
    target: ['web', 'es2020'],
    // target: ['node'],
    externals: ['react'],
    // externalsType: 'module',
    optimization: {
      // Disabling minification because it takes too long on CI
      minimize: false,
    },
    plugins: [
      // new rspack.CopyRspackPlugin({
      //   patterns: [
      //     {
      //       from: 'public',
      //     },
      //   ],
      // }),
    ],
    experiments: {
      outputModule: false,
    },
  },
);

console.log(JSON.stringify(devOutputConfig, null, 2));

export default devOutputConfig;
