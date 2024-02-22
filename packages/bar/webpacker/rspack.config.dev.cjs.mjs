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
    experiments: {
      outputModule: false,
    },
  },
);

console.log(JSON.stringify(devOutputConfig, null, 2));

export default devOutputConfig;
