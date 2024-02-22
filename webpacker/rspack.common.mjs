// shared webpack config object for dev, build, prod, demo...
import rspack from '@rspack/core';

// import type { Configuration } from '@rspack/cli';

// const config: Configuration = {
/** @type {import("@rspack/cli").Configuration} */
export const commonConfig = {
  module: {
    rules: [
      {
        test: /\.(t|j)sx$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            isModule: true,
            sourceMap: true,
            jsc: {
              target: 'es2020',
              loose: false,
              externalHelpers: true,
              preserveAllComments: false,
              parser: {
                syntax: 'typescript',
                jsx: true,
              },
              transform: {
                react: {
                  // runtime: 'automatic',
                  runtime: 'classic',
                  throwIfNamespace: true,
                  useBuiltins: false,
                },
                // useDefineForClassFields: false,
              },
            },
          },
        },
        type: 'javascript/auto',
      },
      {
        test: /\.ts$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            isModule: true,
            sourceMap: true,
            jsc: {
              target: 'es2020',
              loose: false,
              externalHelpers: true,
              preserveAllComments: false,
              parser: {
                syntax: 'typescript',
              },
            },
          },
        },
        type: 'javascript/auto',
      },
      {
        test: /\.s(a|c)ss$/,
        use: [
          { loader: 'style-loader', options: { esModule: false } },
          'css-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.(jpg|jpeg|png|gif|svg|ico)$/,
        type: 'asset',
      },
      {
        test: /\.(ttf|eot|woff|woff2)$/,
        type: 'asset',
        // type: 'asset/resource',
      },
    ],
  },
  optimization: {
    // Disabling minification because it takes too long on CI
    minimize: false,
    // removeAvailableModules: true,
    // mergeDuplicateChunks: true,
  },
  plugins: [
    // new ReactRefreshPlugin(),
    new rspack.ProgressPlugin(),
  ],
  resolve: {
    extensions: ['.tsx', '.jsx', '.ts', '.js', '.mjs', '.cjs'],
  },
  experiments: {
    // css: true,
    outputModule: true,
    rspackFuture: {
      newTreeshaking: true,
      // disableApplyEntryLazily: true,
    },
  },
};
