const nav: any =
  typeof navigator !== 'undefined'
    ? navigator
    : { userAgent: '', vendor: '', platform: '' };
const doc: any =
  typeof document !== 'undefined'
    ? document
    : { documentElement: { style: {} } };

const ie_edge = /Edge\/(\d+)/.exec(nav.userAgent);
const ie_upto10 = /MSIE \d/.test(nav.userAgent);
const ie_11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(nav.userAgent);
const ie = Boolean(ie_upto10 || ie_11up || ie_edge);
const gecko = !ie && /gecko\/(\d+)/i.test(nav.userAgent);
const chrome = !ie && /Chrome\/(\d+)/.exec(nav.userAgent);
const webkit = 'webkitFontSmoothing' in doc.documentElement.style;
const safari = !ie && /Apple Computer/.test(nav.vendor);
const ios =
  safari && (/Mobile\/\w+/.test(nav.userAgent) || nav.maxTouchPoints > 2);

export default {
  mac: ios || /Mac/.test(nav.platform),
  windows: /Win/.test(nav.platform),
  linux: /Linux|X11/.test(nav.platform),
  ie,
  ie_version: ie_upto10
    ? doc.documentMode || 6
    : ie_11up
      ? Number(ie_11up[1])
      : ie_edge
        ? Number(ie_edge[1])
        : 0,
  gecko,
  gecko_version: gecko
    ? Number((/Firefox\/(\d+)/.exec(nav.userAgent) || [0, 0])[1])
    : 0,
  chrome: Boolean(chrome),
  chrome_version: chrome ? Number(chrome[1]) : 0,
  ios,
  android: /Android\b/.test(nav.userAgent),
  webkit,
  safari,
  webkit_version: webkit
    ? Number((/\bAppleWebKit\/(\d+)/.exec(nav.userAgent) || [0, 0])[1])
    : 0,
  tabSize:
    doc.documentElement.style.tabSize != null ? 'tab-size' : '-moz-tab-size',
};
