import type { EventEmitter } from 'events';

import type { AttachmentData, AttachmentId } from './attachment';
import type {
  AllDocsOptions,
  AllDocsResponse,
  AllDocsWithinRangeOptions,
  AllDocsWithKeyOptions,
  AllDocsWithKeysOptions,
  AllDocsWithKeysResponse,
  BulkDocsOptions,
  BulkGetOptions,
  BulkGetResponse,
  Callback,
  Changes,
  ChangesOptions,
  CompactOptions,
  Document,
  DocumentId,
  Fetch,
  GetMeta,
  GetOpenRevisions,
  GetOptions,
  Options,
  PostDocument,
  PutDocument,
  PutOptions,
  RemoveAttachmentResponse,
  RemoveDocument,
  Revision,
  RevisionDiffOptions,
  RevisionDiffResponse,
  RevisionId,
} from './common';
import type { DatabaseConfiguration } from './db-config';

/**
 * Pass this to `PouchDB.plugin()`.
 */
export type Plugin<PluginProps extends object = {}> =
  | PluginProps
  | ((
      db: Database & {
        -readonly [PluginProp in keyof PluginProps]: PluginProps[PluginProp];
      },
    ) => void);

export interface DatabaseInfo {
  /** Name of the database you gave when you called new PouchDB(), and also the unique identifier for the database. */
  db_name: string;
  /** Total number of non-deleted documents in the database. */
  doc_count: number;
  /** Sequence number of the database. It starts at 0 and gets incremented every time a document is added or modified */
  update_seq: number | string;
}

export interface Database<Content extends {} = {}> extends EventEmitter {
  /** The name passed to the PouchDB constructor and unique identifier of the database. */
  name: string;

  /** Fetch all documents matching the given options. */
  allDocs<Model>(
    options?:
      | AllDocsWithKeyOptions
      | AllDocsWithinRangeOptions
      | AllDocsOptions,
  ): Promise<AllDocsResponse<Content & Model>>;
  allDocs<Model>(
    options: AllDocsWithKeysOptions,
  ): Promise<AllDocsWithKeysResponse<Content & Model>>;

  /**
   * Create, update or delete multiple documents. The docs argument is an array of documents.
   * If you omit an _id parameter on a given document, the database will create a new document and assign the ID for you.
   * To update a document, you must include both an _id parameter and a _rev parameter,
   * which should match the ID and revision of the document on which to base your updates.
   * Finally, to delete a document, include a _deleted parameter with the value true.
   */
  bulkDocs<Model>(
    docs: Array<PutDocument<Content & Model>>,
    options: BulkDocsOptions | null,
    callback: Callback<Array<Response | Error>>,
  ): void;

  /**
   * Create, update or delete multiple documents. The docs argument is an array of documents.
   * If you omit an _id parameter on a given document, the database will create a new document and assign the ID for you.
   * To update a document, you must include both an _id parameter and a _rev parameter,
   * which should match the ID and revision of the document on which to base your updates.
   * Finally, to delete a document, include a _deleted parameter with the value true.
   */
  bulkDocs<Model>(
    docs: Array<PutDocument<Content & Model>>,
    options?: BulkDocsOptions,
  ): Promise<Array<Response | Error>>;

  /** Compact the database */
  compact(options?: CompactOptions): Promise<Response>;

  /** Compact the database */
  compact(options: CompactOptions, callback: Callback<Response>): void;

  /** Destroy the database */
  destroy(options: Options | null, callback: Callback<any>): void;

  /** Destroy the database */
  destroy(options?: Options | null): Promise<void>;

  /** Fetch a document */
  get<Model>(
    docId: DocumentId,
    options: GetOptions | null,
    callback: Callback<Document<Content & Model> & GetMeta>,
  ): void;

  /** Fetch a document */
  get<Model>(
    docId: DocumentId,
    options: GetOpenRevisions,
    callback: Callback<Array<Revision<Content & Model>>>,
  ): void;

  /** Fetch a document */
  get<Model>(
    docId: DocumentId,
    options?: GetOptions,
  ): Promise<Document<Content & Model> & GetMeta>;

  /** Fetch a document */
  get<Model>(
    docId: DocumentId,
    options: GetOpenRevisions,
  ): Promise<Array<Revision<Content & Model>>>;

  /**
   * Create a new document without providing an id.
   *
   * You should prefer put() to post(), because when you post(), you are
   * missing an opportunity to use allDocs() to sort documents by _id
   * (because your _ids are random).
   *
   * @see {@link https://pouchdb.com/2014/06/17/12-pro-tips-for-better-code-with-pouchdb.html|PouchDB Pro Tips}
   */
  post<Model>(
    doc: PostDocument<Content & Model>,
    options: Options | null,
    callback: Callback<Response>,
  ): void;

  /**
   * Create a new document without providing an id.
   *
   * You should prefer put() to post(), because when you post(), you are
   * missing an opportunity to use allDocs() to sort documents by _id
   * (because your _ids are random).
   *
   * @see {@link https://pouchdb.com/2014/06/17/12-pro-tips-for-better-code-with-pouchdb.html|PouchDB Pro Tips}
   */
  post<Model>(
    doc: PostDocument<Content & Model>,
    options?: Options,
  ): Promise<Response>;

  /**
   * Create a new document or update an existing document.
   *
   * If the document already exists, you must specify its revision _rev,
   * otherwise a conflict will occur.
   * There are some restrictions on valid property names of the documents.
   * If you try to store non-JSON data (for instance Date objects) you may
   * see inconsistent results.
   */
  put<Model>(
    doc: PutDocument<Content & Model>,
    options: PutOptions | null,
    callback: Callback<Response>,
  ): void;

  /**
   * Create a new document or update an existing document.
   *
   * If the document already exists, you must specify its revision _rev,
   * otherwise a conflict will occur.
   * There are some restrictions on valid property names of the documents.
   * If you try to store non-JSON data (for instance Date objects) you may
   * see inconsistent results.
   */
  put<Model>(
    doc: PutDocument<Content & Model>,
    options?: PutOptions,
  ): Promise<Response>;

  /** Remove a doc from the database */
  remove(
    doc: RemoveDocument,
    options: Options,
    callback: Callback<Response>,
  ): void;

  /** Remove a doc from the database */
  remove(
    docId: DocumentId,
    revision: RevisionId,
    options: Options,
    callback: Callback<Response>,
  ): void;

  /** Remove a doc from the database */
  remove(doc: RemoveDocument, options?: Options): Promise<Response>;

  /** Remove a doc from the database */
  remove(
    docId: DocumentId,
    revision: RevisionId,
    options?: Options,
  ): Promise<Response>;

  /** Get database information */
  info(callback: Callback<DatabaseInfo>): void;

  /** Get database information */
  info(): Promise<DatabaseInfo>;

  /**
   * A list of changes made to documents in the database, in the order they were made.
   * It returns an object with the method cancel(), which you call if you don’t want to listen to new changes anymore.
   *
   * It is an event emitter and will emit a 'change' event on each document change,
   * a 'complete' event when all the changes have been processed, and an 'error' event when an error occurs.
   * Calling cancel() will unsubscribe all event listeners automatically.
   */
  changes<Model>(
    options: ChangesOptions | null,
    callback: Callback<Changes<Content & Model>>,
  ): void;

  /**
   * A list of changes made to documents in the database, in the order they were made.
   * It returns an object with the method cancel(), which you call if you don’t want to listen to new changes anymore.
   *
   * It is an event emitter and will emit a 'change' event on each document change,
   * a 'complete' event when all the changes have been processed, and an 'error' event when an error occurs.
   * Calling cancel() will unsubscribe all event listeners automatically.
   */
  changes<Model>(options?: ChangesOptions): Changes<Content & Model>;

  /** Close the database */
  close(callback: Callback<any>): void;

  /** Close the database */
  close(): Promise<void>;

  /**
   * Attaches a binary object to a document.
   * This method will update an existing document to add the attachment, so it requires a rev if the document already exists.
   * If the document doesn’t already exist, then this method will create an empty document containing the attachment.
   */
  putAttachment(
    docId: DocumentId,
    attachmentId: AttachmentId,
    rev: RevisionId,
    attachment: AttachmentData,
    type: string,
    callback: Callback<Response>,
  ): void;

  /**
   * Attaches a binary object to a document.
   * This method will update an existing document to add the attachment, so it requires a rev if the document already exists.
   * If the document doesn’t already exist, then this method will create an empty document containing the attachment.
   */
  putAttachment(
    docId: DocumentId,
    attachmentId: AttachmentId,
    rev: RevisionId,
    attachment: AttachmentData,
    type: string,
  ): Promise<Response>;

  /**
   * Attaches a binary object to a document.
   * This method will update an existing document to add the attachment, so it requires a rev if the document already exists.
   * If the document doesn’t already exist, then this method will create an empty document containing the attachment.
   */
  putAttachment(
    docId: DocumentId,
    attachmentId: AttachmentId,
    attachment: AttachmentData,
    type: string,
    callback: Callback<Response>,
  ): void;

  /**
   * Attaches a binary object to a document.
   * This method will update an existing document to add the attachment, so it requires a rev if the document already exists.
   * If the document doesn’t already exist, then this method will create an empty document containing the attachment.
   */
  putAttachment(
    docId: DocumentId,
    attachmentId: AttachmentId,
    attachment: AttachmentData,
    type: string,
  ): Promise<Response>;

  /** Get attachment data */
  getAttachment(
    docId: DocumentId,
    attachmentId: AttachmentId,
    options: { rev?: RevisionId | undefined },
    callback: Callback<Blob | Buffer>,
  ): void;

  /** Get attachment data */
  getAttachment(
    docId: DocumentId,
    attachmentId: AttachmentId,
    options?: { rev?: RevisionId | undefined },
  ): Promise<Blob | Buffer>;

  /** Get attachment data */
  getAttachment(
    docId: DocumentId,
    attachmentId: AttachmentId,
    callback: Callback<Blob | Buffer>,
  ): void;

  /** Delete an attachment from a doc. You must supply the rev of the existing doc. */
  removeAttachment(
    docId: DocumentId,
    attachmentId: AttachmentId,
    rev: RevisionId,
    callback: Callback<RemoveAttachmentResponse>,
  ): void;

  /** Delete an attachment from a doc. You must supply the rev of the existing doc. */
  removeAttachment(
    docId: DocumentId,
    attachmentId: AttachmentId,
    rev: RevisionId,
  ): Promise<RemoveAttachmentResponse>;

  /** Given a set of document/revision IDs, returns the document bodies (and, optionally, attachment data) for each ID/revision pair specified. */
  bulkGet<Model>(
    options: BulkGetOptions,
    callback: Callback<BulkGetResponse<Content & Model>>,
  ): void;

  /** Given a set of document/revision IDs, returns the document bodies (and, optionally, attachment data) for each ID/revision pair specified. */
  bulkGet<Model>(
    options: BulkGetOptions,
  ): Promise<BulkGetResponse<Content & Model>>;

  /** Given a set of document/revision IDs, returns the subset of those that do not correspond to revisions stored in the database */
  revsDiff(
    diff: RevisionDiffOptions,
    callback: Callback<RevisionDiffResponse>,
  ): void;

  /** Given a set of document/revision IDs, returns the subset of those that do not correspond to revisions stored in the database */
  revsDiff(diff: RevisionDiffOptions): Promise<RevisionDiffResponse>;
}

/**
 * todo - remove this PouchDB definition, in favor of the class declaration
 */
interface Static<PluginProps extends object = {}> extends EventEmitter {
  new <Content extends {} = {}>(
    name?: string,
    options?: DatabaseConfiguration,
  ): Database<Content> & PluginProps;

  plugin<PluginSubProps extends object>(
    plugin: Plugin<PluginSubProps>,
  ): Static<PluginProps & PluginSubProps>;

  version: string;

  fetch: Fetch;

  on(event: 'created' | 'destroyed', listener: (dbName: string) => any): this;

  // debug: debug.IDebug;

  /**
   * The returned object is a constructor function that works the same as PouchDB,
   * except that whenever you invoke it (e.g. with new), the given options will be passed in by default.
   */
  defaults(options: DatabaseConfiguration): {
    new <Content extends {} = {}>(
      name?: string,
      options?: DatabaseConfiguration,
    ): Database<Content> & PluginProps;
  };
}

// declare module "pouchdb-core" {
//   const PouchDb: PouchDB.Static;
//   export = PouchDb;
// }
// declare var PouchDB: PouchDB.Static;
