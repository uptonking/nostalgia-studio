// forked from https://github.com/visualjerk/quill-magic-url /MIT/20220826/ts

import type Quill from 'quill';
import Delta from 'quill-delta';

import {
  normalizeUrl,
  type Options as NormalizeUrlOptions,
} from '../utils/normalize-url';

export type MagicUrlOptions = {
  globalRegularExpression: RegExp;
  urlRegularExpression: RegExp;
  globalMailRegularExpression: RegExp;
  mailRegularExpression: RegExp;
  normalizeRegularExpression: RegExp;
  normalizeUrlOptions: NormalizeUrlOptions;
};

export type Normalizer = (stringToNormalize: string) => string;

const defaultOptions = {
  globalRegularExpression:
    /(https?:\/\/|www\.)[\w-\.]+\.[\w-\.]+(\/([\S]+)?)?/gi,
  urlRegularExpression: /(https?:\/\/|www\.)[\w-\.]+\.[\w-\.]+(\/([\S]+)?)?/gi,
  globalMailRegularExpression: /([\w-\.]+@[\w-\.]+\.[\w-\.]+)/gi,
  mailRegularExpression: /([\w-\.]+@[\w-\.]+\.[\w-\.]+)/gi,
  normalizeRegularExpression: /(https?:\/\/|www\.)[\S]+/i,
  normalizeUrlOptions: {
    stripWWW: false,
  },
};

/**
 * Checks for URLs and mail addresses during typing and pasting
 * and automatically converts them to links and normalizes the links URL.
 */
export class MagicUrl {
  quill: Quill;
  options: MagicUrlOptions;
  urlNormalizer: Normalizer;
  mailNormalizer: Normalizer;

  constructor(quill: Quill, options?: Partial<MagicUrlOptions>) {
    this.quill = quill;
    options = options || {};
    this.options = { ...defaultOptions, ...options };
    this.urlNormalizer = (url) => this.normalize(url);
    this.mailNormalizer = (mail) => `mailto:${mail}`;
    this.registerTypeListener();
    this.registerPasteListener();
    this.registerBlurListener();
  }
  registerPasteListener() {
    // Preserves existing links
    this.quill.clipboard.addMatcher('A', (node, delta) => {
      const href = (node as HTMLElement).getAttribute('href');
      const attributes = delta.ops[0]?.attributes;
      if (attributes?.link != null) {
        attributes.link = href;
      }
      return delta;
    });
    this.quill.clipboard.addMatcher(
      Node.TEXT_NODE,
      // @ts-expect-error fix-types
      (node: Node & { data: any }, delta): Delta => {
        if (typeof node.data !== 'string') {
          return undefined as unknown as Delta;
        }
        const urlRegExp = this.options.globalRegularExpression;
        const mailRegExp = this.options.globalMailRegularExpression;
        urlRegExp.lastIndex = 0;
        mailRegExp.lastIndex = 0;
        const newDelta = new Delta();
        let index = 0;

        let urlResult = urlRegExp.exec(node.data);
        let mailResult = mailRegExp.exec(node.data);
        const handleMatch = (
          result: RegExpExecArray,
          regExp: RegExp,
          normalizer: Normalizer,
        ) => {
          const head = node.data.substring(index, result.index);
          newDelta.insert(head);
          const match = result[0];
          newDelta.insert(match, { link: normalizer(match) });
          index = regExp.lastIndex;
          return regExp.exec(node.data);
        };
        while (urlResult !== null || mailResult !== null) {
          if (urlResult === null) {
            if (mailResult)
              mailResult = handleMatch(
                mailResult,
                mailRegExp,
                this.mailNormalizer,
              );
          } else if (mailResult === null) {
            urlResult = handleMatch(urlResult, urlRegExp, this.urlNormalizer);
          } else if (mailResult.index <= urlResult.index) {
            while (
              urlResult !== null &&
              urlResult.index < mailRegExp.lastIndex
            ) {
              urlResult = urlRegExp.exec(node.data);
            }
            mailResult = handleMatch(
              mailResult,
              mailRegExp,
              this.mailNormalizer,
            );
          } else {
            while (
              mailResult !== null &&
              mailResult.index < urlRegExp.lastIndex
            ) {
              mailResult = mailRegExp.exec(node.data);
            }
            urlResult = handleMatch(urlResult, urlRegExp, this.urlNormalizer);
          }
        }
        if (index > 0) {
          const tail = node.data.substring(index);
          newDelta.insert(tail);
          if (delta) delta!.ops = newDelta.ops;
        }
        return delta;
      },
    );
  }

  registerTypeListener() {
    this.quill.on('text-change', (delta) => {
      const ops = delta.ops;
      // Only return true, if last operation includes whitespace inserts
      // Equivalent to listening for enter, tab or space
      if (!ops || ops.length < 1 || ops.length > 2) {
        return;
      }
      const lastOp = ops[ops.length - 1];
      if (
        !lastOp.insert ||
        typeof lastOp.insert !== 'string' ||
        !lastOp.insert.match(/\s/)
      ) {
        return;
      }
      this.checkTextForUrl(Boolean(lastOp.insert.match(/ |\t/)));
    });
  }

  registerBlurListener() {
    this.quill.root.addEventListener('blur', () => {
      this.checkTextForUrl();
    });
  }

  checkTextForUrl(triggeredByInlineWhitespace = false) {
    const sel = this.quill.getSelection();
    if (!sel) {
      return;
    }
    const [leaf] = this.quill.getLeaf(sel.index);
    const leafIndex = this.quill.getIndex(leaf);

    if (!leaf['text']) {
      return;
    }

    // We only care about the leaf until the current cursor position
    const relevantLength = sel.index - leafIndex;
    // @ts-expect-error fix-types
    const text: string = leaf.text.slice(0, relevantLength);
    if (!text || leaf.parent.domNode.localName === 'a') {
      return;
    }

    // @ts-expect-error fix-types
    const nextLetter = leaf.text[relevantLength];
    // Do not proceed if we are in the middle of a word
    if (nextLetter != null && nextLetter.match(/\S/)) {
      return;
    }

    const bailOutEndingRegex = triggeredByInlineWhitespace ? /\s\s$/ : /\s$/;
    if (text.match(bailOutEndingRegex)) {
      return;
    }

    const urlMatches = text.match(this.options.urlRegularExpression);
    const mailMatches = text.match(this.options.mailRegularExpression);
    if (urlMatches) {
      this.handleMatches(leafIndex, text, urlMatches, this.urlNormalizer);
    } else if (mailMatches) {
      this.handleMatches(leafIndex, text, mailMatches, this.mailNormalizer);
    }
  }

  handleMatches(
    leafIndex: number,
    text: string,
    matches: RegExpMatchArray,
    normalizer: Normalizer,
  ) {
    const match = matches.pop();
    if (match) {
      const matchIndex = text.lastIndexOf(match);
      const after = text.split(match).pop();
      if (after && after.match(/\S/)) {
        return;
      }
      this.updateText(leafIndex + matchIndex, match.trim(), normalizer);
    }
  }

  updateText(index: number, string: string, normalizer: Normalizer) {
    const ops = new Delta()
      .retain(index)
      .retain(string.length, { link: normalizer(string) });
    this.quill.updateContents(ops);
  }

  normalize(url: string) {
    if (this.options.normalizeRegularExpression.test(url)) {
      try {
        return normalizeUrl(url, this.options.normalizeUrlOptions);
      } catch (error) {
        console.error(error);
      }
    }
    return url;
  }
}
