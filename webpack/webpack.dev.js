// default webpack config for dev, build & test

import path from 'path';
import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { merge } from 'webpack-merge';

import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';

import { commonConfig } from './webpack.common.js';

function checkAppEnv(env) {
  return process.env.REACT_APP_ENV?.toLowerCase()?.indexOf(env) > -1;
}

// 用在react项目打包阶段，会启用@babel/preset-react，不会启用react-refresh/babel
const isEnvReactHotReload = checkAppEnv('reacthot');

export const devConfig = merge(commonConfig, {
  mode: 'development',
  // eval-cheap-source-map 更快
  devtool: 'eval-source-map',
  // 解决热加载的问题 https://github.com/webpack/webpack-dev-server/issues/2758
  // target: process.env.NODE_ENV === 'production' ? 'browserslist' : 'web',
  target: 'web',
  plugins: [
    // new webpack.DefinePlugin({
    //   __DEV__: JSON.stringify(true),
    //   'process.env': { NODE_ENV: JSON.stringify(process.env.NODE_ENV) },
    // }),
    // new BundleAnalyzerPlugin(),
    // new webpack.HotModuleReplacementPlugin(),
    isEnvReactHotReload && new ReactRefreshWebpackPlugin(),
  ].filter(Boolean),
});
