// IndexedDB requires a versioned database structure, so we use the
// version here to manage migrations.
const ADAPTER_VERSION = 5;

// The object stores created for each database
// DOC_STORE stores the document meta data, its revision history and state
// Keyed by document id
const DOC_STORE = 'document-store';
// BY_SEQ_STORE stores a particular version of a document, keyed by its
// sequence id
const BY_SEQ_STORE = 'by-sequence';
// Where we store attachments
const ATTACH_STORE = 'attach-store';
// Where we store many-to-many relations
// between attachment digests and seqs
const ATTACH_AND_SEQ_STORE = 'attach-seq-store';

// Where we store database-wide meta data in a single record
// keyed by id: META_STORE
const META_STORE = 'meta-store';
// Where we store local documents
const LOCAL_STORE = 'local-store';
// Where we detect blob support
const DETECT_BLOB_SUPPORT_STORE = 'detect-blob-support';

export {
  ADAPTER_VERSION as ADAPTER_VERSION,
  DOC_STORE as DOC_STORE,
  BY_SEQ_STORE as BY_SEQ_STORE,
  ATTACH_STORE as ATTACH_STORE,
  ATTACH_AND_SEQ_STORE as ATTACH_AND_SEQ_STORE,
  META_STORE as META_STORE,
  LOCAL_STORE as LOCAL_STORE,
  DETECT_BLOB_SUPPORT_STORE as DETECT_BLOB_SUPPORT_STORE,
};
