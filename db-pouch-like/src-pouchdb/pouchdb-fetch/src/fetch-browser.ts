/** AbortController was introduced quite a while after fetch and
 * isnt required for PouchDB to function so polyfill if needed
 */
const aCtl =
  typeof AbortController !== 'undefined'
    ? AbortController
    : function () {
        return { abort: function () {} };
      };

const f = fetch;
const h = Headers;

export { f as fetch, h as Headers, aCtl as AbortController };
