/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async (knex) => {
  return knex.schema

    .createTable('users', (table) => {
      table.uuid('id', { primaryKey: true }).defaultTo(knex.fn.uuid());
      table.string('email').unique().notNullable();
      table.string('username').unique().notNullable();
      table.string('password').notNullable();
      table.string('name').nullable();
      table.string('image').defaultTo('');
      table.text('bio').defaultTo('');

      table.string('role').unsigned().nullable();
      table.boolean('confirmed').defaultTo(false);
      table.boolean('blocked').defaultTo(false);
      table.string('confirmation_token').nullable().defaultTo('');
      // table.string('reset_password_token').nullable().defaultTo('');

      table.timestamps(true, true);
    })

    .createTable('articles', (table) => {
      table.uuid('id', { primaryKey: true }).defaultTo(knex.fn.uuid());
      table.string('slug').unique().notNullable();
      table.string('title').notNullable();
      table.text('body').notNullable();
      table.string('description').notNullable();
      table.integer('favorites_count').notNullable().defaultTo(0);
      table
        .uuid('author')
        .notNullable()
        .references('users.id')
        .onDelete('CASCADE');
      table.timestamps(true, true);
    })

    .createTable('comments', (table) => {
      table.uuid('id', { primaryKey: true }).defaultTo(knex.fn.uuid());
      table.text('body').notNullable();
      table
        .uuid('author')
        .notNullable()
        .references('users.id')
        .onDelete('CASCADE');
      table
        .uuid('article')
        .notNullable()
        .references('articles.id')
        .onDelete('CASCADE');
      table.timestamps(true, true);
    })

    .createTable('favorites', (table) => {
      table.uuid('id', { primaryKey: true }).defaultTo(knex.fn.uuid());
      table
        .uuid('user')
        .notNullable()
        .references('users.id')
        .onDelete('CASCADE');
      table
        .uuid('article')
        .notNullable()
        .references('articles.id')
        .onDelete('CASCADE');
      table.timestamps(true, true);
    })

    .createTable('followers', (table) => {
      table.uuid('id', { primaryKey: true }).defaultTo(knex.fn.uuid());
      table
        .uuid('user')
        .notNullable()
        .references('users.id')
        .onDelete('CASCADE');
      table
        .uuid('follower')
        .notNullable()
        .references('users.id')
        .onDelete('CASCADE');
      table.unique(['user', 'follower']);
      table.timestamps(true, true);
    })

    .createTable('tags', (table) => {
      table.uuid('id', { primaryKey: true }).defaultTo(knex.fn.uuid());
      table.string('name').unique().notNullable();
      table.timestamps(true, true);
    })

    .createTable('articles_tags', (table) => {
      table.uuid('id', { primaryKey: true }).defaultTo(knex.fn.uuid());
      table
        .uuid('article')
        .notNullable()
        .references('articles.id')
        .onDelete('CASCADE');
      table.uuid('tag').notNullable().references('tags.id').onDelete('CASCADE');
      table.unique(['tag', 'article']);
      table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async (knex) => {
  return knex.schema
    .dropTableIfExists('users')
    .dropTableIfExists('articles')
    .dropTableIfExists('comments')
    .dropTableIfExists('favorites')
    .dropTableIfExists('followers')
    .dropTableIfExists('tags')
    .dropTableIfExists('articles_tags');
};
