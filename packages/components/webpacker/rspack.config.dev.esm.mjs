import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { merge } from 'webpack-merge';

import rspack from '@rspack/core';

import { devConfig } from '../../../webpacker/rspack.dev.mjs';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

console.log(';; foo ', path.resolve(__dirname, '../../foo/src/index.ts'));

const devOutputConfig = merge(
  devConfig,

  {
    entry: {
      main: './src/index.ts',
    },
    output: {
      path: './dist',
      filename: 'index-esm.js',
      // path: path.resolve(__dirname, '../build'),
      module: true,
      libraryTarget: 'module',
      chunkFormat: 'module',
    },
    // target: ['web', 'node'],
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
        // '@datalking/foo': path.resolve(__dirname, '../../foo/src/index.ts'),
        '@datalking/foo': '../../foo/src/index.ts',
        // '../foo/dist/index.js': path.resolve(__dirname, '../foo/src/index.ts'),
      },
    },
  },
);

// console.log(JSON.stringify(devOutputConfig, null, 2));

export default devOutputConfig;
