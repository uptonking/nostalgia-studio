export type AttachmentId = string;
export type AttachmentData = string | Blob | Buffer;

/**
 * Stub attachments are returned by PouchDB by default (attachments option set to false)
 */
export interface StubAttachment {
  /**
   * Mime type of the attachment
   */
  content_type: string;

  /**
   * Database digest of the attachment
   */
  digest: string;

  /**
   * Attachment is a stub
   */
  stub: true;

  /**
   * Length of the attachment
   */
  length: number;
}

/**
 * Full attachments are used to create new attachments or returned when the attachments option
 * is true.
 */
interface FullAttachment {
  /**
   * Mime type of the attachment
   */
  content_type: string;

  /** MD5 hash, starts with "md5-" prefix; populated by PouchDB for new attachments */
  digest?: string | undefined;

  /**
   * {string} if `binary` was `false`
   * {Blob|Buffer} if `binary` was `true`
   */
  data: AttachmentData;
}

export type Attachment = StubAttachment | FullAttachment;

export interface Attachments {
  [attachmentId: string]: Attachment;
}
