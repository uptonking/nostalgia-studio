# nostalgia studio
- code playgrounds monorepo
# overview
- tech-stack
  - npm workspaces
  - rspack
  - other devtools: eslint, prettier

- project-structure
  - `packages` // common utils
    - foo: utils
  - `apps` // examples
    - app-nodejs: simple nodejs utils
  - `boilerplate` // quickstart template repos
    - app-react-rspack: simple react app
    - app-nodejs: simple nodejs utils
# quickstart
- requirements
  - npm v8.3+

```shell
# build all packages
npm run build

# start demo app
cd boilerplate/app-react-rspack
npm i
npm start
```

- open a browser and go to http://localhost:8999
# notes/limitations
- `APP_ENV` environment variable
  - if not set, building es6 and ts is supported, but not react
  - if `react*` is set, building react is supported
  - if `reacthot` is set, react hot reloading is supported

- npm
  - `npm run build` needs to run twice because npm workspaces doesn't support pkg compiled by dependent order
# roadmap
- rspack
  - HMR is not implemented for module chunk format yet
# license

> see license under each package
