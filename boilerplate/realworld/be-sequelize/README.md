# realworld-be-sequelize-api
- blog-ready realworld api boilerplate built with sequelize.v6
# quickstart

```shell
# 1. configure your env
cp .env.example .env

# 2. start api server
npm run dev
```

- to view api docs, open a browser to http://localhost:8990/api/v1/docs/
# roadmap
- db tables id: migrate from integer to uuid string

- getAllArticles
  - query string filters
  - return minimal articles data, only necessary data

- make joint-table/relation-table explicit

- feat follow api

- update sequelize to v7
