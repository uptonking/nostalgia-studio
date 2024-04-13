import { merge } from 'webpack-merge';
import nodeExternals from 'webpack-node-externals';

import rspack from '@rspack/core';

import { devConfig } from '../../../webpacker/rspack.dev.mjs';

/** @type {import("@rspack/cli").Configuration} */
const demoConfig = merge(
  devConfig,

  {
    entry: {
      main: './src/main.ts',
    },
    output: {
      filename: 'externals.js',
      path: './dist',
      // path: path.resolve(__dirname, '../build'),
      module: true,
      libraryTarget: 'module',
      chunkFormat: 'module',
    },
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
    plugins: [
      // new rspack.HtmlRspackPlugin({
      //   template: './public/app.html',
      // }),
      // new rspack.CopyRspackPlugin({
      //   patterns: [
      //     {
      //       from: 'public',
      //     },
      //   ],
      // }),
    ],
    externalsPresets: { node: true },
    externals: [nodeExternals({ modulesFromFile: true })],
    experiments: {
      // outputModule: false,
    },
    optimization: {
      moduleIds: 'named',
      chunkIds: 'named',
      minimize: false,
    },
  },
);

export default demoConfig;
