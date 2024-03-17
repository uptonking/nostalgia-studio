import isRetryAllowed from 'is-retry-allowed';

import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosStatic,
} from './index';

export interface AxiosRetryConfig {
  /**
   * The number of times to retry before failing
   * default: 3
   */
  retries?: number;
  /**
   * Defines if the timeout should be reset between retries
   * default: false
   */
  shouldResetTimeout?: boolean;
  /**
   * A callback to further control if a request should be retried.
   * default: it retries if it is a network error or a 5xx error on an idempotent request (GET, HEAD, OPTIONS, PUT or DELETE).
   */
  retryCondition?: (error: AxiosError) => boolean | Promise<boolean>;
  /**
   * A callback to further control the delay between retry requests. By default there is no delay.
   */
  retryDelay?: (retryCount: number, error: AxiosError) => number;
  /**
   * A callback to get notified when a retry occurs, the number of times it has occurred, and the error
   */
  onRetry?: (
    retryCount: number,
    error: AxiosError,
    requestConfig: AxiosRequestConfig,
  ) => Promise<void> | void;
}

export interface AxiosRetryConfigExtended extends AxiosRetryConfig {
  /**
   * The number of times the request was retried
   */
  retryCount?: number;
  /**
   * The last time the request was retried (timestamp in milliseconds)
   */
  lastRequestTime?: number;
}

export interface AxiosRetryReturn {
  /**
   * The interceptorId for the request interceptor
   */
  requestInterceptorId: number;
  /**
   * The interceptorId for the response interceptor
   */
  responseInterceptorId: number;
}

export interface AxiosRetry {
  (
    axiosInstance: AxiosStatic | AxiosInstance,
    axiosRetryConfig?: AxiosRetryConfig,
  ): AxiosRetryReturn;

  isNetworkError(error: AxiosError): boolean;
  isRetryableError(error: AxiosError): boolean;
  isSafeRequestError(error: AxiosError): boolean;
  isIdempotentRequestError(error: AxiosError): boolean;
  isNetworkOrIdempotentRequestError(error: AxiosError): boolean;
  exponentialDelay(
    retryNumber?: number,
    error?: AxiosError,
    delayFactor?: number,
  ): number;
}

export function isNetworkError(error: AxiosError) {
  const CODE_EXCLUDE_LIST = ['ERR_CANCELED', 'ECONNABORTED'];
  if (error.response) {
    return false;
  }
  if (!error.code) {
    return false;
  }

  if (CODE_EXCLUDE_LIST.includes(error.code)) {
    return false;
  }
  return isRetryAllowed(error);
}

const SAFE_HTTP_METHODS = ['get', 'head', 'options'];
const IDEMPOTENT_HTTP_METHODS = SAFE_HTTP_METHODS.concat(['put', 'delete']);

export function isRetryableError(error: AxiosError): boolean {
  return (
    error.code !== 'ECONNABORTED' &&
    (!error.response ||
      (error.response.status >= 500 && error.response.status <= 599))
  );
}

export function isSafeRequestError(error: AxiosError): boolean {
  if (!error.config?.method) {
    return false;
  }

  return (
    isRetryableError(error) &&
    SAFE_HTTP_METHODS.indexOf(error.config.method) !== -1
  );
}

export function isIdempotentRequestError(error: AxiosError): boolean {
  if (!error.config?.method) {
    return false;
  }
  return (
    isRetryableError(error) &&
    IDEMPOTENT_HTTP_METHODS.indexOf(error.config.method) !== -1
  );
}

export function isNetworkOrIdempotentRequestError(error: AxiosError): boolean {
  return isNetworkError(error) || isIdempotentRequestError(error);
}

function noDelay() {
  return 0;
}

export function exponentialDelay(
  retryNumber = 0,
  _error: AxiosError | undefined = undefined,
  delayFactor = 100,
): number {
  const delay = 2 ** retryNumber * delayFactor;
  const randomSum = delay * 0.2 * Math.random();
  return delay + randomSum;
}

export const DEFAULT_OPTIONS: Required<AxiosRetryConfig> = {
  retries: 3,
  retryCondition: isNetworkOrIdempotentRequestError,
  retryDelay: noDelay,
  shouldResetTimeout: false,
  onRetry: () => {},
};

function getRequestOptions(
  config: AxiosRequestConfig,
  defaultOptions: AxiosRetryConfig,
): Required<AxiosRetryConfig> & AxiosRetryConfigExtended {
  return { ...DEFAULT_OPTIONS, ...defaultOptions, ...config.retry };
}

function setCurrentState(
  config: AxiosRequestConfig,
  defaultOptions: AxiosRetryConfig | undefined,
) {
  const currentState = getRequestOptions(config, defaultOptions || {});
  currentState.retryCount = currentState.retryCount || 0;
  currentState.lastRequestTime = currentState.lastRequestTime || Date.now();
  config.retry = currentState;
  return currentState as Required<AxiosRetryConfigExtended>;
}

async function shouldRetry(
  currentState: Required<AxiosRetryConfig> & AxiosRetryConfigExtended,
  error: AxiosError,
) {
  const { retries, retryCondition } = currentState;
  const shouldRetryOrPromise =
    (currentState.retryCount || 0) < retries && retryCondition(error);

  if (typeof shouldRetryOrPromise === 'object') {
    try {
      const shouldRetryPromiseResult = await shouldRetryOrPromise;
      return shouldRetryPromiseResult !== false;
    } catch (_err) {
      return false;
    }
  }
  return shouldRetryOrPromise;
}

const axiosRetry: AxiosRetry = (axiosInstance, defaultOptions) => {
  const requestInterceptorId = axiosInstance.interceptors.request.use(
    (config) => {
      setCurrentState(config, defaultOptions);
      return config;
    },
  );

  const responseInterceptorId = axiosInstance.interceptors.response.use(
    null,
    async (error) => {
      const { config } = error;
      if (!config) {
        return Promise.reject(error);
      }
      const currentState = setCurrentState(config, defaultOptions);
      if (await shouldRetry(currentState, error)) {
        currentState.retryCount += 1;
        const { retryDelay, shouldResetTimeout, onRetry } = currentState;
        const delay = retryDelay(currentState.retryCount, error);

        if (
          !shouldResetTimeout &&
          config.timeout &&
          currentState.lastRequestTime
        ) {
          const lastRequestDuration = Date.now() - currentState.lastRequestTime;
          const timeout = config.timeout - lastRequestDuration - delay;
          if (timeout <= 0) {
            return Promise.reject(error);
          }
          config.timeout = timeout;
        }
        config.transformRequest = [(data: any) => data];
        await onRetry(currentState.retryCount, error, config);
        return new Promise((resolve) => {
          setTimeout(() => resolve(axiosInstance(config)), delay);
        });
      }
      return Promise.reject(error);
    },
  );

  return { requestInterceptorId, responseInterceptorId };
};

axiosRetry.isNetworkError = isNetworkError;
axiosRetry.isSafeRequestError = isSafeRequestError;
axiosRetry.isIdempotentRequestError = isIdempotentRequestError;
axiosRetry.isNetworkOrIdempotentRequestError =
  isNetworkOrIdempotentRequestError;
axiosRetry.exponentialDelay = exponentialDelay;
axiosRetry.isRetryableError = isRetryableError;
export default axiosRetry;
