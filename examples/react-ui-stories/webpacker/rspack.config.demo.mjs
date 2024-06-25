import path from 'path';
import { fileURLToPath } from 'url';
import { merge } from 'webpack-merge';

import rspack from '@rspack/core';

import { devServerConfig } from '../../../webpacker/rspack.server.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import("@rspack/cli").Configuration} */
const demoConfig = merge(
  devServerConfig,

  {
    entry: {
      main: './src/render.tsx',
    },
    output: {
      filename: 'main.js',
      // path: './dist1',
      path: path.resolve(__dirname, './dist1'),
      // module: true,
      // libraryTarget: 'module',
      // chunkFormat: 'module',
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
      new rspack.DefinePlugin({
        'process.env.HOT_BUILD_DATE ': JSON.stringify(new Date().toISOString()),
      }),
      new rspack.HtmlRspackPlugin({
        template: './public/app.html',
      }),

      // new rspack.CopyRspackPlugin({
      //   patterns: [
      //     {
      //       from: 'public',
      //     },
      //   ],
      // }),
    ],
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
