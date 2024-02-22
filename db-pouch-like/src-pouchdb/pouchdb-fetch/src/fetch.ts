import fetchCookie from 'fetch-cookie';
import nodeFetch, { Headers } from 'node-fetch';

// import AbortController from 'abort-controller';
// import { Headers } from 'node-fetch';

// todo migrate to builtin fetch
const f = fetchCookie(nodeFetch) as typeof fetch;
// const f = fetchCookie(fetch) as typeof fetch

const aCtl = AbortController;

export { f as fetch, Headers, aCtl as AbortController };
