import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { merge } from 'webpack-merge';

import rspack from '@rspack/core';
// import NodePolyfillPlug from '@rspack/plugin-node-polyfill';

import { devConfig } from '../../../../webpacker/rspack.dev.mjs';
import {
  binaryUtilsPkg,
  binaryUtilsWeb,
  changesFilterPkg,
  changesFilterWeb,
  collatePkg,
  errorsPkg,
  fetchPkg,
  fetchWeb,
  md5Pkg,
  md5Web,
  mergePkg,
  selectorCorePkg,
  utilsPkg,
  utilsWeb,
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
    builtins: {},
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
      // new NodePolyfillPlug()
      // new rspack.ProgressPlugin({ prefix: 'pouch' }),
      // new BundleAnalyzerPlugin({}),
    ],
    resolve: {
      alias: {
        ...errorsPkg,
        ...collatePkg,
        ...binaryUtilsPkg,
        ...binaryUtilsWeb,
        ...md5Pkg,
        ...md5Web,
        ...utilsPkg,
        ...utilsWeb,
        ...fetchPkg,
        ...fetchWeb,
        ...mergePkg,
        ...selectorCorePkg,
        ...changesFilterPkg,
        ...changesFilterWeb,
      },
    },
  },
);

// console.log(JSON.stringify(devOutputConfig, null, 2));

export default devOutputConfig;
