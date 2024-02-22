import type { Fetch } from './common';

export interface CommonDatabaseConfiguration {
  /**
   * Database name.
   */
  name?: string | undefined;
  /**
   * Database adapter to use.
   *
   * If unspecified, PouchDB will infer this automatically, preferring
   * IndexedDB to WebSQL in browsers that support both (i.e. Chrome,
   * Opera and Android 4.4+).
   */
  adapter?: string | undefined;
}

export interface LocalDatabaseConfiguration
  extends CommonDatabaseConfiguration {
  /**
   * Enables auto compaction, which means compact() is called after
   * every change to the database.
   *
   * Defaults to false.
   */
  auto_compaction?: boolean | undefined;
  /**
   * How many old revisions we keep track (not a copy) of.
   */
  revs_limit?: number | undefined;
  /**
   * Size of the database (Most significant for Safari)
   * option to set the max size in MB that Safari will grant to the local database. Valid options are: 10, 50, 100, 500 and 1000
   * ex_ new PouchDB("dbName", {size:100});
   */
  size?: number | undefined;
  /**
   * A special constructor option, which appends a prefix to the database name
   * and can be helpful for URL-based or file-based LevelDOWN path names.
   */
  prefix?: string | undefined;
  /**
   * Use a md5 hash to create a deterministic revision number for documents.
   * Setting it to false will mean that the revision number will be a random UUID.
   * Defaults to true.
   */
  deterministic_revs?: boolean | undefined;
}

export interface RemoteDatabaseConfiguration
  extends CommonDatabaseConfiguration {
  fetch?: Fetch | undefined;

  auth?:
    | {
        username?: string | undefined;
        password?: string | undefined;
      }
    | undefined;
  /**
   * Disables automatic creation of databases.
   */
  skip_setup?: boolean | undefined;
}

export type DatabaseConfiguration =
  | LocalDatabaseConfiguration
  | RemoteDatabaseConfiguration;
