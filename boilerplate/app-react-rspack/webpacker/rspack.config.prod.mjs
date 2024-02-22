import { merge } from 'webpack-merge';

import rspack from '@rspack/core';

import { prodConfig } from '../../../webpacker/rspack.prod.mjs';

const prodOutputConfig = merge(prodConfig, {
  entry: {
    // main: path.resolve(__dirname, '../src/render.tsx'),
    main: './src/render.tsx',
  },
  output: {
    filename: 'main.js',
    path: './dist',
    // path: path.resolve(__dirname, '../build'),
    module: true,
    libraryTarget: 'module',
    chunkFormat: 'module',
  },
  target: 'web',
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: './public/react-app.html',
    }),
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

export default prodOutputConfig;
