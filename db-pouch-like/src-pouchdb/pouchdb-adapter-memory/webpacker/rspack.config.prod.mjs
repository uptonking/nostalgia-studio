import { merge } from 'webpack-merge';

import rspack from '@rspack/core';

import { prodConfig } from '../../../webpacker/rspack.prod.mjs';

const prodOutputConfig = merge(prodConfig, {
  entry: {
    // main: path.resolve(__dirname, '../src/render.tsx'),
    main: './src/index.ts',
  },
  output: {
    path: './dist',
    filename: 'index.js',
    // path: path.resolve(__dirname, '../build'),
    libraryTarget: 'module',
    module: true,
    chunkFormat: 'module',
  },
  target: ['web'],
  plugins: [
    // new rspack.CopyRspackPlugin({
    //   patterns: [
    //     {
    //       from: 'public',
    //     },
    //   ],
    // }),
  ],
  // devServer: {
  //   contentBase: path.resolve(__dirname, '../build'),
  // },
});

// console.log(JSON.stringify(prodOutputConfig, null, 2));

export default prodOutputConfig;
