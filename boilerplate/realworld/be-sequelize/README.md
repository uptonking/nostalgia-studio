# realworld-be-sequelize-api
- blog-ready realworld api boilerplate built with sequelize
# quickstart

```shell
# 1. configure your env
cp .env.example .env

# 2. start api server
npm run dev
```

- to view api docs, open a browser to http://localhost:8990/api/v1/docs/
# roadmap
- db tables id migrate from integer to uuid string

- fix getAllArticles query string filters

- make joint-table/relation-table explicit

- update sequelize to v7

- findAllArticles
  - return minimal articles data, only necessary data

- feat follow api
