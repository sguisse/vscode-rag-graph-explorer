//@ts-check
'use strict';

const path = require('path');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const mode = argv.mode || 'development';

  /** @type {import('webpack').Configuration} */
  const extensionConfig = {
    target: 'node',
    mode: mode,
    entry: './src/extension.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'extension.js',
      libraryTarget: 'commonjs'
    },
    externals: {
      vscode: 'commonjs vscode'
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [{ loader: 'ts-loader' }]
        }
      ]
    },
    devtool: mode === 'production' ? 'nosources-source-map' : 'eval-source-map'
  };

  /** @type {import('webpack').Configuration} */
  const webviewConfig = {
    target: 'web',
    mode: mode,
    entry: './src/webview/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'webview.js'
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx']
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [{ loader: 'ts-loader' }]
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    plugins: [
      // Dynamic safe injection based on current compiler mode argument
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env': JSON.stringify({})
      })
    ],
    devtool: mode === 'production' ? 'source-map' : 'eval-source-map'
  };

  return [extensionConfig, webviewConfig];
};
