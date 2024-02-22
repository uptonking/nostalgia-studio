import { merge } from 'webpack-merge';

import rspack from '@rspack/core';

import { devConfig } from '../../../../webpacker/rspack.dev.mjs';
import {
  binaryUtilsPkg,
  binaryUtilsWeb,
} from '../../scripts/build-browser-node-logic.mjs';

/** @type {import("@rspack/cli").Configuration} */
const devOutputConfig = merge(
  devConfig,

  {
    entry: {
      main: './src/index.ts',
    },
    output: {
      path: './lib',
      filename: 'index-browser.js',
      // path: path.resolve(__dirname, '../build'),
      module: true,
      chunkFormat: 'module',
      library: {
        type: 'module',
      },
    },
    // target: ['web'],
    target: ['web', 'es2020'],
    module: {
      rules: [
        // {
        //   test: /\.tsx$/,
        //   use: {
        //     loader: 'builtin:swc-loader',
        //     options: {
        //       sourceMap: true,
        //       jsc: {
        //         parser: {
        //           syntax: 'typescript',
        //           jsx: true,
        //         },
        //         externalHelpers: true,
        //         preserveAllComments: false,
        //         transform: {
        //           react: {
        //             runtime: 'automatic',
        //             throwIfNamespace: true,
        //             useBuiltins: false,
        //           },
        //         },
        //       },
        //     },
        //   },
        //   type: 'javascript/auto',
        // },
        // {
        //   test: /\.(jpg|jpeg|png|gif|svg|ico)$/,
        //   type: 'asset',
        // },
      ],
    },
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
    resolve: {
      alias: {
        ...binaryUtilsPkg,
        ...binaryUtilsWeb,
        './binaryMd5': './binaryMd5-browser',
        './stringMd5': './stringMd5-browser',
      },
    },
  },
);

// console.log(JSON.stringify(devOutputConfig, null, 2));

export default devOutputConfig;
