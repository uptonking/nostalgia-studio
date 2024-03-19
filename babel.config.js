export default function (api) {
  // api.env() returns the current NODE_ENV string.
  const env = api.env();
  const isProd = env?.toLowerCase() === 'production';

  function checkAppEnv(env) {
    return process.env.REACT_APP_ENV?.toLowerCase()?.indexOf(env) > -1;
  }

  // 用在react应用开发调试阶段，会启用 react-refresh/babel
  const isEnvReactHotReload = checkAppEnv('reacthot');
  // 用在react项目打包阶段，不会启用react-refresh/babel
  const isEnvReact = checkAppEnv('react');

  console.log(
    ';; env.APP_ENV, isEnvReact ',
    process.env.REACT_APP_ENV,
    isEnvReact,
    env,
  );

  // Plugins run before Presets. Plugin ordering is first to last.
  const plugins = [
    // ['@babel/plugin-proposal-decorators', { legacy: true }],
    // ['@babel/plugin-proposal-class-properties', { loose: false }],
    // '@babel/plugin-transform-private-methods',
    // ['@babel/plugin-syntax-import-assertions'],
    isEnvReactHotReload && 'react-refresh/babel',
  ].filter(Boolean);

  function configModule() {
    if (env === 'esm' || env === 'es6') {
      return false;
    }
    // auto defaults to node commonjs
    return 'auto';
  }

  // Preset ordering is reversed (last to first).
  const presets = [
    [
      '@babel/preset-env',
      {
        // modules: false,
        // modules: configModule(),
        // targets: 'defaults', // '> 0.5%, last 2 versions, not dead',
        targets: 'last 2 Chrome versions',
        useBuiltIns: 'usage',
        corejs: { version: '3.36', proposals: true },
        shippedProposals: true,
        debug: false,
      },
    ],
    [
      '@babel/preset-typescript',
      {
        // later: support other jsx
        isTSX: Boolean(isEnvReact),
        allExtensions: true,
        // onlyRemoveTypeImports: true,
        allowNamespaces: true,
        allowDeclareFields: true,
      },
    ],
    isEnvReact && [
      '@babel/preset-react',
      {
        development: !isProd,
        // ...babelPresetReactConfig,
      },
    ],
  ].filter(Boolean);

  // console.log('babel-presets, ', JSON.stringify(presets));

  const ignore = ['node_modules'];

  return {
    plugins,
    presets,
    ignore,
  };
}
