# realworld-be-knex-api
- blog-ready realworld api boilerplate built with knex
# quickstart

```shell
# 1. configure your env - db/nodejs
cp .env.example .env

# 2. init postgresql
npm run knex:migrate

# 3. start api server
npm run dev
```

- to view api docs, open a browser to http://localhost:8990/api/v1/docs/
# roadmap
- getAllArticles
  - tagList not working
  - query string filters
  - return minimal articles data, only necessary data

- db
  - migrate group_concat(sqlite-only) to pg
  - support pg/sqlite

- db tables id: migrate from uuid to nanoid
  - 手动创建的nanoid值插入uuid类型的column时会异常

- feat follow api

- deprecate ajv in favor of joi
