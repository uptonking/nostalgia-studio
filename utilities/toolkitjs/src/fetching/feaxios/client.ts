import { AxiosError, CanceledError } from './error';
import type {
  AxiosInterceptor,
  AxiosInterceptorOptions,
  AxiosRequestConfig,
  AxiosResponse,
  CreateAxiosDefaults,
  FulfillCallback,
  InternalAxiosRequestConfig,
  Method,
  RejectCallback,
} from './types';

async function prepareAxiosResponse(
  options: InternalAxiosRequestConfig,
  res: Response,
) {
  const response: AxiosResponse = { config: options } as AxiosResponse;
  response.status = res.status;
  response.statusText = res.statusText;
  response.headers = res.headers;
  if (options.responseType === 'stream') {
    response.data = res.body;
    return response;
  }
  response.rawResponse = res;
  return res[options.responseType || 'text']()
    .then((data) => {
      if (options.transformResponse) {
        Array.isArray(options.transformResponse)
          ? options.transformResponse.map(
              (fn) =>
                (data = fn.call(options, data, res!.headers, res!.status)),
            )
          : (data = options.transformResponse(data, res!.headers, res!.status));
        response.data = data;
      } else {
        response.data = data;
        response.data = JSON.parse(data);
      }
    })
    .catch(Object)
    .then(() => response);
}

async function handleFetch(
  options: InternalAxiosRequestConfig,
  fetchOptions: RequestInit,
) {
  let res: Response | null = null;

  if ('any' in AbortSignal) {
    const signals: AbortSignal[] = [];
    if (options.timeout) {
      signals.push(AbortSignal.timeout(options.timeout));
    }
    if (options.signal) {
      signals.push(options.signal);
    }
    if (signals.length > 0) {
      //@ts-ignore
      fetchOptions.signal = AbortSignal.any(signals) as AbortSignal;
    }
  } else {
    if (options.timeout) {
      fetchOptions.signal = AbortSignal.timeout(options.timeout);
    }
  }

  const request = new Request(options.url!, fetchOptions);

  try {
    res = await fetch(request);
    const ok = options.validateStatus
      ? options.validateStatus(res.status)
      : res.ok;
    if (!ok) {
      return Promise.reject(
        new AxiosError(
          `Request failed with status code ${res?.status}`,
          [AxiosError.ERR_BAD_REQUEST, AxiosError.ERR_BAD_RESPONSE][
            Math.floor(res!.status / 100) - 4
          ],
          options,
          request,
          await prepareAxiosResponse(options, res!),
        ),
      );
    }
    return await prepareAxiosResponse(options, res);
  } catch (error) {
    if (
      (error as Error).name === 'AbortError' ||
      (error as Error).name === 'TimeoutError'
    ) {
      const isTimeoutError = (error as Error).name === 'TimeoutError';
      return Promise.reject(
        isTimeoutError
          ? new AxiosError(
              options.timeoutErrorMessage ||
                `timeout of ${options.timeout} ms exceeded`,
              AxiosError.ECONNABORTED,
              options,
              request,
            )
          : new CanceledError(null, options),
      );
    } else {
      return Promise.reject(
        new AxiosError(
          (error as Error).message,
          undefined,
          options,
          request,
          undefined,
        ),
      );
    }
  }
}

function buildURL(options: InternalAxiosRequestConfig) {
  let url = options.url || '';
  if (options.baseURL) {
    url = options.url?.replace(/^(?!.*\/\/)\/?/, options.baseURL + '/')!;
  }

  if (options.params) {
    url +=
      (options.url!.indexOf('?') !== -1 ? '&' : '?') +
      (options.paramsSerializer
        ? options.paramsSerializer(options.params)
        : new URLSearchParams(options.params));
  }

  return url;
}

function mergeAxiosOptions(
  input: AxiosRequestConfig,
  defaults: CreateAxiosDefaults,
) {
  const merged = {
    ...defaults,
    ...input,
  };

  if (defaults?.params && input?.params) {
    merged.params = {
      ...defaults?.params,
      ...input?.params,
    };
  }

  if (defaults?.headers && input?.headers) {
    merged.headers = new Headers(defaults.headers || {});
    const headers = new Headers(input.headers || {});
    headers.forEach((value, key) => {
      (merged.headers as Headers).set(key, value);
    });
  }
  return merged as InternalAxiosRequestConfig;
}

function mergeFetchOptions(input: RequestInit, defaults: RequestInit) {
  const merged = {
    ...defaults,
    ...input,
  };
  if (defaults?.headers && input?.headers) {
    merged.headers = new Headers(defaults.headers || {});
    const headers = new Headers(input.headers || {});
    headers.forEach((value, key) => {
      (merged.headers as Headers).set(key, value);
    });
  }
  return merged as InternalAxiosRequestConfig;
}

async function request(
  configOrUrl: string | AxiosRequestConfig,
  config?: AxiosRequestConfig,
  defaults?: CreateAxiosDefaults,
  method?: Method,
  interceptors?: {
    request: AxiosInterceptorManager<InternalAxiosRequestConfig>;
    response: AxiosInterceptorManager<AxiosResponse>;
  },
  data?: any,
) {
  if (typeof configOrUrl === 'string') {
    config = config || {};
    config.url = configOrUrl;
  } else {
    config = configOrUrl || {};
  }

  const options = mergeAxiosOptions(config, defaults || {});

  options.fetchOptions = options.fetchOptions || {};

  options.timeout = options.timeout || 0;

  options.headers = options.headers || new Headers();

  data = data || options.data;

  if (options.transformRequest) {
    if (Array.isArray(options.transformRequest)) {
      options.transformRequest.map(
        (fn) => (data = fn.call(options, data, options.headers)),
      );
    } else {
      options.transformRequest(data, options.headers);
    }
  }

  if (
    data &&
    options.headers.get('content-type') !==
      'application/x-www-form-urlencoded' &&
    typeof data === 'object' &&
    typeof data.append !== 'function' &&
    typeof data.text !== 'function'
  ) {
    data = JSON.stringify(data);
    options.headers.set('content-type', 'application/json');
  }

  if (
    data &&
    options.headers.get('content-type') === 'application/x-www-form-urlencoded'
  ) {
    data = new URLSearchParams(data);
  }

  options.url = buildURL(options);

  options.method = method || options.method || 'get';

  if (interceptors && interceptors.request.length > 0) {
    const chain = interceptors.request.handlers
      .filter(
        (interceptor) =>
          !interceptor?.runWhen ||
          (typeof interceptor.runWhen === 'function' &&
            interceptor.runWhen(options)),
      )
      .map((interceptor) => [interceptor.fulfilled, interceptor.rejected])
      .flat();

    let result = options;

    for (let i = 0, len = chain.length; i < len; i += 2) {
      const onFulfilled = chain[i];
      const onRejected = chain[i + 1];

      try {
        if (onFulfilled) result = onFulfilled(result);
      } catch (error) {
        if (onRejected) (onRejected as RejectCallback)!(error);
        break;
      }
    }
  }

  const init = mergeFetchOptions(
    {
      method: options.method.toUpperCase(),
      body: data,
      headers: options.headers,
      credentials: options.withCredentials ? 'include' : undefined,
      signal: options.signal,
    },
    options.fetchOptions,
  );

  let resp = handleFetch(options, init as RequestInit);
  if (interceptors && interceptors.response.length > 0) {
    const chain = interceptors.response.handlers
      .map((interceptor) => [interceptor.fulfilled, interceptor.rejected])
      .flat();

    for (let i = 0, len = chain.length; i < len; i += 2) {
      resp = resp.then(chain[i], chain[i + 1]);
    }
  }

  return resp;
}

function initFormConfig(config?: AxiosRequestConfig) {
  config = config || {};
  config.headers = new Headers(config.headers || {});
  config.headers.set('content-type', 'application/x-www-form-urlencoded');
  return config;
}

class Axios {
  defaults: CreateAxiosDefaults;
  interceptors: {
    request: AxiosInterceptorManager<InternalAxiosRequestConfig>;
    response: AxiosInterceptorManager<AxiosResponse>;
  };
  constructor(defaults?: CreateAxiosDefaults) {
    this.defaults = defaults || ({} as CreateAxiosDefaults);
    this.interceptors = {
      request: new AxiosInterceptorManager<InternalAxiosRequestConfig>(),
      response: new AxiosInterceptorManager<AxiosResponse>(),
    };
  }

  getUri = (config?: AxiosRequestConfig) => {
    const merged = mergeAxiosOptions(config || {}, this.defaults);
    return buildURL(merged);
  };

  request = <T = any, R = AxiosResponse<T>, D = any>(
    config: AxiosRequestConfig<D>,
  ) => request(config, this.defaults) as Promise<R>;

  get = <T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>,
  ) =>
    request(url, config, this.defaults, 'get', this.interceptors) as Promise<R>;

  delete = <T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>,
  ) =>
    request(
      url,
      config,
      this.defaults,
      'delete',
      this.interceptors,
    ) as Promise<R>;

  head = <T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>,
  ) =>
    request(
      url,
      config,
      this.defaults,
      'head',
      this.interceptors,
    ) as Promise<R>;

  options = <T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>,
  ) =>
    request(
      url,
      config,
      this.defaults,
      'options',
      this.interceptors,
    ) as Promise<R>;

  post = <T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ) =>
    request(
      url,
      config,
      this.defaults,
      'post',
      this.interceptors,
      data,
    ) as Promise<R>;

  put = <T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ) =>
    request(
      url,
      config,
      this.defaults,
      'put',
      this.interceptors,
      data,
    ) as Promise<R>;

  patch = <T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ) =>
    request(
      url,
      config,
      this.defaults,
      'patch',
      this.interceptors,
      data,
    ) as Promise<R>;

  postForm = <T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ) => {
    return this.post(url, data, initFormConfig(config)) as Promise<R>;
  };
  putForm = <T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ) => {
    return this.put(url, data, initFormConfig(config)) as Promise<R>;
  };
  patchForm = <T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ) => {
    return this.patch(url, data, initFormConfig(config)) as Promise<R>;
  };
  all = <T>(promises: Array<T | Promise<T>>) => Promise.all(promises);
}

class AxiosInterceptorManager<V> {
  handlers: Array<AxiosInterceptor<V>> = [];
  constructor() {
    this.handlers = [];
  }
  use = (
    onFulfilled?: FulfillCallback<V>,
    onRejected?: RejectCallback,
    options?: AxiosInterceptorOptions,
  ): number => {
    this.handlers.push({
      fulfilled: onFulfilled,
      rejected: onRejected,
      runWhen: options?.runWhen,
    });
    return this.handlers.length - 1;
  };

  eject = (id: number): void => {
    if (this.handlers[id]) {
      this.handlers[id] = null!;
    }
  };

  clear = (): void => {
    this.handlers = [];
  };

  get length() {
    return this.handlers.length;
  }
}

export function isAxiosError<T = any, D = any>(
  payload: any,
): payload is AxiosError<T, D> {
  return (
    payload !== null &&
    typeof payload === 'object' &&
    (payload as AxiosError<T, D>).isAxiosError
  );
}

function createAxiosInstance(defaults?: CreateAxiosDefaults) {
  const axiosInstance = new Axios(defaults);

  const axios = (
    url: string | AxiosRequestConfig,
    config?: AxiosRequestConfig,
  ) => request(url, config, defaults, undefined, axiosInstance.interceptors);

  axios.defaults = axiosInstance.defaults;

  axios.interceptors = axiosInstance.interceptors;

  [
    'get',
    'delete',
    'head',
    'options',
    'post',
    'put',
    'patch',
    'all',
    'request',
    'postForm',
    'putForm',
    'patchForm',
    'getUri',
  ].forEach((method) => (axios[method] = axiosInstance[method]));

  return axios as AxiosInstance;
}

function createAxiosStatic(defaults?: CreateAxiosDefaults) {
  const axios = createAxiosInstance(defaults) as AxiosStatic;

  axios.create = (newDefaults?: CreateAxiosDefaults) =>
    createAxiosInstance(newDefaults);

  return axios;
}

export interface AxiosInstance extends Axios {
  <T = any, R = AxiosResponse<T>, D = any>(
    config: AxiosRequestConfig<D>,
  ): Promise<R>;
  <T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>,
  ): Promise<R>;
}

export interface AxiosStatic extends AxiosInstance {
  create: (defaults?: CreateAxiosDefaults) => AxiosInstance;
}

export const axios = createAxiosStatic();

export { AxiosError, CanceledError };
