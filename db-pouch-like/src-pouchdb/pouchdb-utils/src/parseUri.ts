// originally parseUri 1.2.2, now patched by us
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
const keys = [
  'source',
  'protocol',
  'authority',
  'userInfo',
  'user',
  'password',
  'host',
  'port',
  'relative',
  'path',
  'directory',
  'file',
  'query',
  'anchor',
];
const qName = 'queryKey';
const qParser = /(?:^|&)([^&=]*)=?([^&]*)/g;

// use the "loose" parser
/* eslint no-useless-escape: 0 */
const parser =
  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

function parseUri(str) {
  const m = parser.exec(str);
  const uri = {};
  let i = 14;

  while (i--) {
    const key = keys[i];
    const value = m[i] || '';
    const encoded = ['user', 'password'].indexOf(key) !== -1;
    uri[key] = encoded ? decodeURIComponent(value) : value;
  }

  uri[qName] = {};
  uri[keys[12]].replace(qParser, function ($0, $1, $2) {
    if ($1) {
      uri[qName][$1] = $2;
    }
  });

  return uri;
}

export default parseUri;
