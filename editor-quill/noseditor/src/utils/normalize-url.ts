// forked from https://github.com/sindresorhus/normalize-url /MIT/20240310/js

export type Options = {
  defaultProtocol?: 'https' | 'http';
  /**
	Prepends `defaultProtocol` to the URL if it's protocol-relative.
	@default true
	*/
  readonly normalizeProtocol?: boolean;

  /**
	Normalizes HTTPS URLs to HTTP.
	@default false
	*/
  readonly forceHttp?: boolean;

  /**
	Normalizes HTTP URLs to HTTPS.
	This option cannot be used with the `forceHttp` option at the same time.
	@default false
	*/
  readonly forceHttps?: boolean;

  /**
	Strip the [authentication](https://en.wikipedia.org/wiki/Basic_access_authentication) part of a URL.
	@default true
	*/
  readonly stripAuthentication?: boolean;

  /**
	Removes hash from the URL.
	@default false
	*/
  readonly stripHash?: boolean;

  /**
	Remove the protocol from the URL: `http://sindresorhus.com` → `sindresorhus.com`.
	It will only remove `https://` and `http://` protocols.
	@default false
	*/
  readonly stripProtocol?: boolean;

  /**
	Strip the [text fragment](https://web.dev/text-fragments/) part of the URL
	__Note:__ The text fragment will always be removed if the `stripHash` option 
  is set to `true`, as the hash contains the text fragment.
	@default true
	*/
  readonly stripTextFragment?: boolean;

  /**
	Removes `www.` from the URL.
	@default true
	*/
  readonly stripWWW?: boolean;

  /**
	Removes query parameters that matches any of the provided strings or regexes.
	@default [/^utm_\w+/i]
	*/
  readonly removeQueryParameters?: ReadonlyArray<RegExp | string> | boolean;

  /**
	Keeps only query parameters that matches any of the provided strings or regexes.
	__Note__: It overrides the `removeQueryParameters` option.

	@default undefined
	*/
  readonly keepQueryParameters?: ReadonlyArray<RegExp | string>;

  /**
	Removes trailing slash.
	__Note__: Trailing slash is always removed if the URL doesn't have a pathname unless the `removeSingleSlash` option is set to `false`.
	@default true
	*/
  readonly removeTrailingSlash?: boolean;

  /**
	Remove a sole `/` pathname in the output. This option is independent of `removeTrailingSlash`.
	@default true
	*/
  readonly removeSingleSlash?: boolean;

  /**
	Removes the default directory index file from path that matches any of the provided strings or regexes.
	When `true`, the regex `/^index\.[a-z]+$/` is used.
	@default false
	*/
  removeDirectoryIndex?: boolean | ReadonlyArray<RegExp | string>;

  /**
	Removes an explicit port number from the URL.
	Port 443 is always removed from HTTPS URLs and 80 is always removed from HTTP URLs regardless of this option.
	@default false
	*/
  readonly removeExplicitPort?: boolean;

  /**
	Sorts the query parameters alphabetically by key.
	@default true
	*/
  readonly sortQueryParameters?: boolean;
};

const DATA_URL_DEFAULT_MIME_TYPE = 'text/plain';
const DATA_URL_DEFAULT_CHARSET = 'us-ascii';

const testParameter = (name, filters) =>
  filters.some((filter) =>
    filter instanceof RegExp ? filter.test(name) : filter === name,
  );

const supportedProtocols = new Set(['https:', 'http:', 'file:']);

const hasCustomProtocol = (urlString) => {
  try {
    const { protocol } = new URL(urlString);

    return (
      protocol.endsWith(':') &&
      !protocol.includes('.') &&
      !supportedProtocols.has(protocol)
    );
  } catch {
    return false;
  }
};

const normalizeDataURL = (
  urlString,
  { stripHash } = { stripHash: undefined },
) => {
  const match = /^data:(?<type>[^,]*?),(?<data>[^#]*?)(?:#(?<hash>.*))?$/.exec(
    urlString,
  );

  if (!match) {
    throw new Error(`Invalid URL: ${urlString}`);
  }

  let { type, data, hash } = match.groups;
  const mediaType = type.split(';');
  hash = stripHash ? '' : hash;

  let isBase64 = false;
  if (mediaType[mediaType.length - 1] === 'base64') {
    mediaType.pop();
    isBase64 = true;
  }

  // Lowercase MIME type
  const mimeType = mediaType.shift()?.toLowerCase() ?? '';
  const attributes = mediaType
    .map((attribute) => {
      let [key, value = ''] = attribute
        .split('=')
        .map((string) => string.trim());

      // Lowercase `charset`
      if (key === 'charset') {
        value = value.toLowerCase();

        if (value === DATA_URL_DEFAULT_CHARSET) {
          return '';
        }
      }

      return `${key}${value ? `=${value}` : ''}`;
    })
    .filter(Boolean);

  const normalizedMediaType = [...attributes];

  if (isBase64) {
    normalizedMediaType.push('base64');
  }

  if (
    normalizedMediaType.length > 0 ||
    (mimeType && mimeType !== DATA_URL_DEFAULT_MIME_TYPE)
  ) {
    normalizedMediaType.unshift(mimeType);
  }

  return `data:${normalizedMediaType.join(';')},${isBase64 ? data.trim() : data}${hash ? `#${hash}` : ''}`;
};

/**
Normalize a URL.
- URLs with custom protocols are not normalized and just passed through by default. 
- Supported protocols are: `https`, `http`, `file`, and `data`.
- Human-friendly URLs with basic auth (for example, `user:password@sindresorhus.com`) are not handled because basic auth conflicts with custom protocols. 
@param urlString - URL to normalize, including [data URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs).
*/
export function normalizeUrl(urlString: string, options?: Options) {
  options = {
    defaultProtocol: 'http',
    normalizeProtocol: true,
    forceHttp: false,
    forceHttps: false,
    stripAuthentication: true,
    stripHash: false,
    stripTextFragment: true,
    stripWWW: true,
    removeQueryParameters: [/^utm_\w+/i],
    removeTrailingSlash: true,
    removeSingleSlash: true,
    removeDirectoryIndex: false,
    removeExplicitPort: false,
    sortQueryParameters: true,
    ...options,
  };

  // Legacy: Append `:` to the protocol if missing.
  if (
    typeof options.defaultProtocol === 'string' &&
    !options.defaultProtocol.endsWith(':')
  ) {
    options.defaultProtocol = `${options.defaultProtocol}:` as 'http';
  }

  urlString = urlString.trim();

  // Data URL
  if (/^data:/i.test(urlString)) {
    return normalizeDataURL(urlString, options as any);
  }

  if (hasCustomProtocol(urlString)) {
    return urlString;
  }

  const hasRelativeProtocol = urlString.startsWith('//');
  const isRelativeUrl = !hasRelativeProtocol && /^\.*\//.test(urlString);

  // Prepend protocol
  if (!isRelativeUrl) {
    urlString = urlString.replace(
      /^(?!(?:\w+:)?\/\/)|^\/\//,
      options.defaultProtocol,
    );
  }

  const urlObject = new URL(urlString);

  if (options.forceHttp && options.forceHttps) {
    throw new Error(
      'The `forceHttp` and `forceHttps` options cannot be used together',
    );
  }

  if (options.forceHttp && urlObject.protocol === 'https:') {
    urlObject.protocol = 'http:';
  }

  if (options.forceHttps && urlObject.protocol === 'http:') {
    urlObject.protocol = 'https:';
  }

  // Remove auth
  if (options.stripAuthentication) {
    urlObject.username = '';
    urlObject.password = '';
  }

  // Remove hash
  if (options.stripHash) {
    urlObject.hash = '';
  } else if (options.stripTextFragment) {
    urlObject.hash = urlObject.hash.replace(/#?:~:text.*?$/i, '');
  }

  // Remove duplicate slashes if not preceded by a protocol
  // NOTE: This could be implemented using a single negative lookbehind
  // regex, but we avoid that to maintain compatibility with older js engines
  // which do not have support for that feature.
  if (urlObject.pathname) {
    // TODO: Replace everything below with `urlObject.pathname = urlObject.pathname.replace(/(?<!\b[a-z][a-z\d+\-.]{1,50}:)\/{2,}/g, '/');` when Safari supports negative lookbehind.

    // Split the string by occurrences of this protocol regex, and perform
    // duplicate-slash replacement on the strings between those occurrences
    // (if any).
    const protocolRegex = /\b[a-z][a-z\d+\-.]{1,50}:\/\//g;

    let lastIndex = 0;
    let result = '';
    for (;;) {
      const match = protocolRegex.exec(urlObject.pathname);
      if (!match) {
        break;
      }

      const protocol = match[0];
      const protocolAtIndex = match.index;
      const intermediate = urlObject.pathname.slice(lastIndex, protocolAtIndex);

      result += intermediate.replace(/\/{2,}/g, '/');
      result += protocol;
      lastIndex = protocolAtIndex + protocol.length;
    }

    const remnant = urlObject.pathname.slice(
      lastIndex,
      urlObject.pathname.length,
    );
    result += remnant.replace(/\/{2,}/g, '/');

    urlObject.pathname = result;
  }

  // Decode URI octets
  if (urlObject.pathname) {
    try {
      urlObject.pathname = decodeURI(urlObject.pathname);
    } catch {}
  }

  // Remove directory index
  if (options.removeDirectoryIndex === true) {
    options.removeDirectoryIndex = [/^index\.[a-z]+$/];
  }

  if (
    Array.isArray(options.removeDirectoryIndex) &&
    options.removeDirectoryIndex.length > 0
  ) {
    let pathComponents = urlObject.pathname.split('/');
    const lastComponent = pathComponents[pathComponents.length - 1];

    if (testParameter(lastComponent, options.removeDirectoryIndex)) {
      pathComponents = pathComponents.slice(0, -1);
      urlObject.pathname = pathComponents.slice(1).join('/') + '/';
    }
  }

  if (urlObject.hostname) {
    // Remove trailing dot
    urlObject.hostname = urlObject.hostname.replace(/\.$/, '');

    // Remove `www.`
    if (
      options.stripWWW &&
      /^www\.(?!www\.)[a-z\-\d]{1,63}\.[a-z.\-\d]{2,63}$/.test(
        urlObject.hostname,
      )
    ) {
      // Each label should be max 63 at length (min: 1).
      // Source: https://en.wikipedia.org/wiki/Hostname#Restrictions_on_valid_host_names
      // Each TLD should be up to 63 characters long (min: 2).
      // It is technically possible to have a single character TLD, but none currently exist.
      urlObject.hostname = urlObject.hostname.replace(/^www\./, '');
    }
  }

  // Remove query unwanted parameters
  if (Array.isArray(options.removeQueryParameters)) {
    // We are intentionally spreading to get a copy.
    // @ts-expect-error fix-types
    for (const key of [...urlObject.searchParams.keys()]) {
      if (testParameter(key, options.removeQueryParameters)) {
        urlObject.searchParams.delete(key);
      }
    }
  }

  if (
    !Array.isArray(options.keepQueryParameters) &&
    options.removeQueryParameters === true
  ) {
    urlObject.search = '';
  }

  // Keep wanted query parameters
  if (
    Array.isArray(options.keepQueryParameters) &&
    options.keepQueryParameters.length > 0
  ) {
    // We are intentionally spreading to get a copy.
    // @ts-expect-error fix-types
    for (const key of [...urlObject.searchParams.keys()]) {
      if (!testParameter(key, options.keepQueryParameters)) {
        urlObject.searchParams.delete(key);
      }
    }
  }

  // Sort query parameters
  if (options.sortQueryParameters) {
    urlObject.searchParams.sort();

    // Calling `.sort()` encodes the search parameters, so we need to decode them again.
    try {
      urlObject.search = decodeURIComponent(urlObject.search);
    } catch {}
  }

  if (options.removeTrailingSlash) {
    urlObject.pathname = urlObject.pathname.replace(/\/$/, '');
  }

  // Remove an explicit port number, excluding a default port number, if applicable
  if (options.removeExplicitPort && urlObject.port) {
    urlObject.port = '';
  }

  const oldUrlString = urlString;

  // Take advantage of many of the Node `url` normalizations
  urlString = urlObject.toString();

  if (
    !options.removeSingleSlash &&
    urlObject.pathname === '/' &&
    !oldUrlString.endsWith('/') &&
    urlObject.hash === ''
  ) {
    urlString = urlString.replace(/\/$/, '');
  }

  // Remove ending `/` unless removeSingleSlash is false
  if (
    (options.removeTrailingSlash || urlObject.pathname === '/') &&
    urlObject.hash === '' &&
    options.removeSingleSlash
  ) {
    urlString = urlString.replace(/\/$/, '');
  }

  // Restore relative protocol, if applicable
  if (hasRelativeProtocol && !options.normalizeProtocol) {
    urlString = urlString.replace(/^http:\/\//, '//');
  }

  // Remove http/https
  if (options.stripProtocol) {
    urlString = urlString.replace(/^(?:https?:)?\/\//, '');
  }

  return urlString;
}

export default normalizeUrl;
