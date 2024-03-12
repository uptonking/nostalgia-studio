# dev-log-rw-be-knex

# draft

# todo

# later

# maybe
- 3rd auth
# done
- knex执行 `.select(db.raw("string_agg(distinct tags.name, ',') as tagListCsv"))` 时 ，as 返回的对象属性名是全小写taglistcsv
# faq-not-yet
- 手动创建的nanoid值插入uuid类型的column时会异常
  - invalid input syntax for type uuid
  - 变通方案是使用knex工具方法生成的id， table.uuid('id', { primaryKey: true }).defaultTo(knex.fn.uuid()); 
