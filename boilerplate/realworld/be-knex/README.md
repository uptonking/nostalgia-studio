# realworld-be-knex-api
- blog-ready realworld api boilerplate built with knex
# quickstart

```shell
# 1. configure your env
cp .env.example .env

# 2. start api server
npm run dev
```

- to view api docs, open a browser to http://localhost:8990/api/v1/docs/
# roadmap
- db tables id: migrate from uuid to nanoid
  - 手动创建的nanoid值插入uuid类型的column时会异常

- fix getAllArticles query string filters

- findAllArticles
  - return minimal articles data, only necessary data

- feat follow api
