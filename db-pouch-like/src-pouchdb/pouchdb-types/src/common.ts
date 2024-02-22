import type { EventEmitter } from 'events';

import type { Attachments } from './attachment';

export type Fetch = (
  url: string | Request,
  opts?: RequestInit,
) => Promise<Response>;

export interface Error {
  /** HTTP Status Code during HTTP or HTTP-like operations */
  status?: number | undefined;
  name?: string | undefined;
  message?: string | undefined;
  reason?: string | undefined;
  error?: string | boolean | undefined;
  id?: string | undefined;
  rev?: RevisionId | undefined;
}

export type Callback<R> = (error: Error | null, result: R | null) => void;

export interface Options {
  fetch?: Fetch | undefined;
}

export type DocumentId = string;
export type DocumentKey = string;
export type RevisionId = string;

export type Availability =
  | 'available'
  | 'compacted'
  | 'not compacted'
  | 'missing';

export interface BasicResponse {
  /** `true` if the operation was successful; `false` otherwise */
  ok: boolean;
}
export interface Response extends BasicResponse {
  /** id of the targeted document */
  id: DocumentId;
  /** resulting revision of the targeted document */
  rev: RevisionId;
}

export interface Revision<Content extends {}> {
  ok: Document<Content> & RevisionIdMeta;
}
export interface RevisionInfo {
  rev: RevisionId;
  status: Availability;
}
export interface RevisionDiffOptions {
  [DocumentId: string]: string[];
}
export interface RevisionDiff {
  missing?: string[] | undefined;
  possible_ancestors?: string[] | undefined;
}
export interface RevisionDiffResponse {
  [DocumentId: string]: RevisionDiff;
}

export interface IdMeta {
  _id: DocumentId;
}
export interface RevisionIdMeta {
  _rev: RevisionId;
}
export interface GetMeta {
  /**
   * Conflicting leaf revisions.
   * - Only present if `GetOptions.conflicts` is `true`
   */
  _conflicts?: RevisionId[] | undefined;
  _rev: RevisionId;
  /** Only present if `GetOptions.revs` is `true` */
  _revs_info?: RevisionInfo[] | undefined;
  /** Only present if `GetOptions.revs_info` is `true` */
  _revisions?:
    | {
        ids: RevisionId[];
        start: number;
      }
    | undefined;

  /** Attachments where index is attachmentId */
  _attachments?: Attachments | undefined;
}

export type NewDocument<Content extends {}> = Content;
export type Document<Content extends {}> = Content & IdMeta;
export type ExistingDocument<Content extends {}> = Document<Content> &
  RevisionIdMeta;

/** Existing doc or just object with `_id` and `_rev` */
export type RemoveDocument = IdMeta & RevisionIdMeta;

export type PostDocument<Content extends {}> = NewDocument<Content> & {
  filters?: { [filterName: string]: string } | undefined;
  views?:
    | {
        [viewName: string]: {
          map: string;
          reduce?: string | undefined;
        };
      }
    | undefined;

  /** You can update an existing doc using _rev */
  _rev?: RevisionId | undefined;

  _attachments?: Attachments | undefined;
};

export type PutDocument<Content extends {}> = PostDocument<Content> &
  ChangesMeta & {
    _id?: DocumentId | undefined;
  };

export interface AllDocsOptions extends Options {
  /**
   * Include attachment data for each document.
   *
   * Requires `include_docs` to be `true`.
   *
   * By default, attachments are Base64-encoded.
   * @see binary
   */
  attachments?: boolean | undefined;
  /**
   * Return attachments as Buffers.
   *
   * Requires `include_docs` to be `true`.
   * Requires `attachments` to be `true`.
   */
  binary?: boolean | undefined;
  /**
   * Include conflict information for each document.
   *
   * Requires `include_docs` to be `true`.
   */
  conflicts?: boolean | undefined;
  /** Reverse ordering of results. */
  descending?: boolean | undefined;
  /** Include contents for each document. */
  include_docs?: boolean | undefined;
  /** Maximum number of documents to return. */
  limit?: number | undefined;
  /**
   * Number of documents to skip before returning.
   *
   * Causes poor performance on IndexedDB and LevelDB.
   */
  skip?: number | undefined;
  /**
   * Include an update_seq value indicating which sequence id
   * of the underlying database the view reflects.
   */
  update_seq?: boolean | undefined;
}
export interface AllDocsWithKeyOptions extends AllDocsOptions {
  /** Constrain results to documents matching this key. */
  key: DocumentKey;
}
export interface AllDocsWithKeysOptions extends AllDocsOptions {
  /** Constrains results to documents matching any of these keys. */
  keys: DocumentId[];
}
export interface AllDocsWithinRangeOptions extends AllDocsOptions {
  /** Low end of range, or high end if `descending` is `true`. */
  startkey: DocumentKey;
  /** High end of range, or low end if `descending` is `true`. */
  endkey: DocumentKey;
  /**
   * Include any documents identified by `endkey`.
   *
   * Defaults to `true`.
   */
  inclusive_end?: boolean | undefined;
}
export interface AllDocsMeta {
  /** Only present if `conflicts` is `true` */
  _conflicts?: RevisionId[] | undefined;

  _attachments?: Attachments | undefined;
}
export interface AllDocsResponse<Content extends {}> {
  /** The `skip` if provided, or in CouchDB the actual offset */
  offset: number;
  total_rows: number;
  update_seq?: number | string | undefined;
  rows: Array<{
    /** Only present if `include_docs` was `true`. */
    doc?: ExistingDocument<Content & AllDocsMeta> | undefined;
    id: DocumentId;
    key: DocumentKey;
    value: {
      rev: RevisionId;
      deleted?: boolean | undefined;
    };
  }>;
}
export interface AllDocsWithKeysResponse<Content extends {}> {
  /** The `skip` if provided, or in CouchDB the actual offset */
  offset: number;
  total_rows: number;
  update_seq?: number | string | undefined;
  rows: Array<
    | {
        /** Only present if `include_docs` was `true`. null if deleted is true */
        doc?: ExistingDocument<Content & AllDocsMeta> | null | undefined;
        id: DocumentId;
        key: DocumentKey;
        value: {
          rev: RevisionId;
          deleted?: boolean | undefined;
        };
      }
    | {
        /* answer for keys that are not found in the database */
        key: DocumentKey;
        error: 'not_found';
      }
  >;
}

export interface BulkDocsOptions extends Options {
  new_edits?: boolean | undefined;
}

export interface BulkGetOptions extends Options {
  docs: Array<{ id: string; rev?: RevisionId | undefined }>;
  revs?: boolean | undefined;
  attachments?: boolean | undefined;
  binary?: boolean | undefined;
}

export interface BulkGetResponse<Content extends {}> {
  results: Array<{
    id: string;
    docs: Array<{ ok: Content & GetMeta } | { error: Error }>;
  }>;
}

export interface ChangesMeta {
  _conflicts?: RevisionId[] | undefined;
  _deleted?: boolean | undefined;
  _attachments?: Attachments | undefined;
}

export interface ChangesOptions {
  /**
   * Does "live" changes.
   */
  live?: boolean | undefined;
  /**
   * Start the results from the change immediately after the given sequence number.
   * You can also pass `'now'` if you want only new changes (when `live` is `true`).
   */
  since?: 'now' | number | string | undefined;
  /**
   * Request timeout (in milliseconds).
   */
  timeout?: number | false | undefined;
  /** Include contents for each document. */
  include_docs?: boolean | undefined;
  /** Maximum number of documents to return. */
  limit?: number | false | undefined;
  /** Include conflicts. */
  conflicts?: boolean | undefined;
  /** Include attachments. */
  attachments?: boolean | undefined;
  /** Return attachment data as Blobs/Buffers, instead of as base64-encoded strings. */
  binary?: boolean | undefined;
  /** Reverse the order of the output documents. */
  descending?: boolean | undefined;
  /**
   * For http adapter only, time in milliseconds for server to give a heartbeat to keep long connections open.
   * Defaults to 10000 (10 seconds), use false to disable the default.
   */
  heartbeat?: number | false | undefined;

  /**
   * Reference a filter function from a design document to selectively get updates.
   * To use a view function, pass '_view' here and provide a reference to the view function in options.view.
   * See filtered changes for details.
   */
  filter?: string | ((doc: any, params: any) => any) | undefined;

  /** Only show changes for docs with these ids (array of strings). */
  doc_ids?: string[] | undefined;

  /**
   * Object containing properties that are passed to the filter function, e.g. {"foo:"bar"},
   * where "bar" will be available in the filter function as params.query.foo.
   * To access the params, define your filter function like function (doc, params).
   */
  query_params?: { [paramName: string]: any } | undefined;

  /**
   * Specify a view function (e.g. 'design_doc_name/view_name' or 'view_name' as shorthand for 'view_name/view_name') to act as a filter.
   * Documents counted as “passed” for a view filter if a map function emits at least one record for them.
   * Note: options.filter must be set to '_view' for this option to work.
   */
  view?: string | undefined;

  /**
   * Filter using a query/pouchdb-find selector. Note: Selectors are not supported in CouchDB 1.x.
   * Cannot be used in combination with the filter option.
   */
  // selector?: Find.Selector | undefined;

  /**
   * (previously options.returnDocs): Is available for non-http databases and defaults to true.
   * Passing false prevents the changes feed from keeping all the documents in memory – in other
   * words complete always has an empty results array, and the change event is the only way to get the event.
   * Useful for large change sets where otherwise you would run out of memory.
   */
  return_docs?: boolean | undefined;

  /**
   * Only available for http databases, this configures how many changes to fetch at a time.
   * Increasing this can reduce the number of requests made. Default is 25.
   */
  batch_size?: number | undefined;

  /**
   * Specifies how many revisions are returned in the changes array.
   * The default, 'main_only', will only return the current “winning” revision;
   * 'all_docs' will return all leaf revisions (including conflicts and deleted former conflicts).
   * Most likely you won’t need this unless you’re writing a replicator.
   */
  style?: 'main_only' | 'all_docs' | undefined;

  /**
   * Only available for http databases. Specifies that seq information only be generated every N changes.
   * Larger values can improve changes throughput with CouchDB 2.0 and later.
   * Note that last_seq is always populated regardless.
   */
  seq_interval?: number | undefined;
}

export interface ChangesResponseChange<Content extends {}> {
  id: string;
  seq: number | string;
  changes: Array<{ rev: string }>;
  deleted?: boolean | undefined;
  doc?: ExistingDocument<Content & ChangesMeta> | undefined;
}

export interface ChangesResponse<Content extends {}> {
  status: string;
  last_seq: number | string;
  results: Array<ChangesResponseChange<Content>>;
}

export interface Changes<Content extends {}>
  extends EventEmitter,
    Promise<ChangesResponse<Content>> {
  on(
    event: 'change',
    listener: (value: ChangesResponseChange<Content>) => any,
  ): this;
  on(
    event: 'complete',
    listener: (value: ChangesResponse<Content>) => any,
  ): this;
  on(event: 'error', listener: (value: any) => any): this;

  cancel(): void;
}

export interface GetOptions extends Options {
  /** Include list of conflicting leaf revisions. */
  conflicts?: boolean | undefined;
  /** Specific revision to fetch */
  rev?: RevisionId | undefined;
  /** Include revision history of the document. */
  revs?: boolean | undefined;
  /**
   * Include a list of revisions of the document, and their
   * availability.
   */
  revs_info?: boolean | undefined;

  /** Include attachment data. */
  attachments?: boolean | undefined;

  /** Return attachment data as Blobs/Buffers, instead of as base64-encoded strings. */
  binary?: boolean | undefined;

  /** Forces retrieving latest “leaf” revision, no matter what rev was requested. */
  latest?: boolean | undefined;
}

export interface GetOpenRevisions extends Options {
  /**
   * Fetch all leaf revisions if open_revs="all" or fetch all leaf
   * revisions specified in open_revs array. Leaves will be returned
   * in the same order as specified in input array.
   */
  open_revs: 'all' | RevisionId[];

  /** Include revision history of the document. */
  revs?: boolean | undefined;
}

export interface CompactOptions extends Options {
  interval?: number | undefined;
}

export interface PutOptions extends Options {
  force?: boolean | undefined;
}

export interface RemoveAttachmentResponse extends BasicResponse {
  id: DocumentId;
  rev: RevisionId;
}
