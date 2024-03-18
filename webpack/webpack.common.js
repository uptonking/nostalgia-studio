// shared webpack config object for dev, build, prod, demo...

import CircularDependencyPlugin from 'circular-dependency-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';
import webpack from 'webpack';

// const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const isProd = process.env.NODE_ENV === 'production';

function checkAppEnv(env) {
  return (
    process.env.APP_ENV && process.env.APP_ENV.toLowerCase().indexOf(env) !== -1
  );
}
const isEnvReact = checkAppEnv('react');

export const commonConfig = {
  // mode: 'development',
  // devtool: 'eval-source-map',
  // entry: path.resolve(__dirname, '../src/render.js'),
  // output: {
  //   filename: 'main.js',
  //   path: path.resolve(__dirname, '../dist'),
  // },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        resolve: {
          fullySpecified: false, // .ts suffix can be omitted
        },
        use: [
          {
            loader: 'babel-loader',
            options: {
              rootMode: 'upward',
            },
          },
        ],
      },
      {
        test: /\.js$/,
        use: 'source-map-loader',
        enforce: 'pre',
      },
      {
        test: /\.(sa|sc|c)ss$/,
        exclude: /\.module\.(sa|sc|c)ss$/,
        use: [
          // isProd ? MiniCssExtractPlugin.loader : 'style-loader',
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: !isProd,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              // when node-sass and sass were installed，by default sass-loader prefers sass.
              // implementation: require('sass'),
            },
          },
        ],
      },
      {
        test: /\.module\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: !isProd,
              modules: isProd
                ? undefined
                : {
                    localIdentName: '[name]__[local]__[hash:base64:5]',
                  },
            },
          },
          {
            loader: 'sass-loader',
            options: {
              // when node-sass and sass were installed，by default sass-loader prefers sass.
              // implementation: require('sass'),
              sassOptions: {
                // fiber: require('fibers'),
              },
            },
          },
        ],
      },
      {
        test: /\.less$/i,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                // strictMath: true,
                javascriptEnabled: true,
              },
            },
          },
        ],
      },
      // Fonts
      {
        test: /\.(ttf|eot|woff|woff2)$/,
        type: 'asset/resource',
        // generator: {
        //   filename: 'fonts/[hash].[ext]',
        // },
      },
      // Files
      {
        test: /\.(jpg|jpeg|png|gif|svg|ico)$/,
        type: 'asset/resource',
        // generator: {
        //   filename: 'static/[hash].[ext]',
        // },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: 'styles.css',
    }),
    // new NodePolyfillPlugin({
    //   excludeAliases: ['console'],
    // }),
    // new CircularDependencyPlugin({
    //   // exclude detection of files based on a RegExp
    //   exclude: /a\.js|node_modules/,
    //   // include specific files based on a RegExp
    //   // include: /dir/,
    //   // add errors to webpack instead of warnings
    //   failOnError: true,
    //   // allow import cycles that include an asynchronous import,
    //   // e.g. via import(/* webpackMode: "weak" */ './file.js')
    //   allowAsyncCycles: false,
    //   // set the current working directory for displaying module paths
    //   cwd: process.cwd(),
    // }),
    // new HtmlWebpackPlugin({
    // template: path.resolve(process.cwd(), 'public/index.html'),
    // template: './public/demo.html',
    // filename: 'index.html',
    // }),
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {},
  },
  experiments: {
    topLevelAwait: true,
  },
  ignoreWarnings: [/Failed to parse source map/],
};
