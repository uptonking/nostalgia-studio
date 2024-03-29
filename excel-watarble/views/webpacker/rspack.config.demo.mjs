import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';
import { merge } from 'webpack-merge';

import rspack from '@rspack/core';

import { devServerConfig } from '../../../webpacker/rspack.server.mjs';

/** @type {import("@rspack/cli").Configuration} */
const demoConfig = merge(
  devServerConfig,

  {
    entry: {
      main: './src/main.tsx',
    },
    output: {
      filename: 'main.js',
      path: './dist',
      publicPath: '/',
      // path: path.resolve(__dirname, '../build'),
      // module: true,
      // libraryTarget: 'module',
      // chunkFormat: 'module',
    },
    target: ['web', 'es2020'],
    builtins: {
      emotion: true,
      react: {
        importSource: '@emotion/react',
      },
    },
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
      // new NodePolyfillPlugin({
      //   includeAliases: ['path'],
      // }),
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
    resolve: {
      fallback: {
        path: false,
      },
    },
    experiments: {
      // outputModule: false,
      rspackFuture: {
        newTreeshaking: false,
      },
    },
    optimization: {
      moduleIds: 'named',
      chunkIds: 'named',
      minimize: false,
    },
    stats: {
      preset: 'errors-only',
      timings: true,
      reasons: true,
      logging: 'error',
      loggingTrace: true,
    },
    devServer: {
      // contentBase: path.resolve(__dirname, '../build'),
      port: 8999,
      proxy: [
        {
          context: ['/api'],
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
        },
      ],
    },
  },
);

export default demoConfig;
