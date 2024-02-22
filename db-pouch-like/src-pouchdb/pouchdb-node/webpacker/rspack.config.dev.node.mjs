import { merge } from 'webpack-merge';

import { devConfig } from '../../../../webpacker/rspack.dev.mjs';
import {
  abstractMapReducePkg,
  adapterHttpPkg,
  adapterLevelCorePkg,
  adapterLeveldbPkg,
  adapterUtilsPkg,
  binaryUtilsPkg,
  changesFilterPkg,
  checkpointerPkg,
  collatePkg,
  errorsPkg,
  fetchPkg,
  genReplicaIdPkg,
  jsonPkg,
  mapReducePkg,
  mapReduceUtilsPkg,
  md5Pkg,
  mergePkg,
  pouchdbCorePkg,
  replicaPkg,
  selectorCorePkg,
  sublevelPouchPkg,
  utilsPkg,
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
      filename: 'index.js',
      // path: path.resolve(__dirname, '../build'),
      module: true,
      chunkFormat: 'module',
      library: {
        type: 'module',
      },
    },
    // target: ['web'],
    target: ['node', 'es2020'],
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
      // new rspack.CopyRspackPlugin({
      //   patterns: [
      //     {
      //       from: 'public',
      //     },
      //   ],
      // }),
      // new rspack.DefinePlugin({
      //   'process.env.COVERAGE': "'false'",
      // }),
      // new NodePolyfillPlug(),
    ],
    resolve: {
      alias: {
        ...errorsPkg,
        ...collatePkg,
        ...jsonPkg,
        ...binaryUtilsPkg,
        ...md5Pkg,
        ...utilsPkg,
        ...fetchPkg,
        ...mergePkg,
        ...selectorCorePkg,
        ...changesFilterPkg,
        ...pouchdbCorePkg,
        ...adapterHttpPkg,
        ...genReplicaIdPkg,
        ...checkpointerPkg,
        ...replicaPkg,
        ...mapReduceUtilsPkg,
        ...abstractMapReducePkg,
        ...mapReducePkg,
        ...adapterUtilsPkg,
        ...sublevelPouchPkg,
        ...adapterLevelCorePkg,
        ...adapterLeveldbPkg,
      },
    },
  },
);

// console.log(JSON.stringify(devOutputConfig, null, 2));

export default devOutputConfig;
