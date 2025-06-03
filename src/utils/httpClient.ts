export type ResponseInterceptor = (
  res: Response,
  options: RequestInit
) => Response | Promise<Response>;

export type FetchResponse<T> = {
  promise: Promise<T>;
  abort: () => void;
};

export enum HttpErrors {
  EmptyResponseError = "EmptyResponseError",
  ExpectationFailed = "ExpectationFailedError",
  ForbiddenRequestError = "ForbiddenRequestError",
  NotFoundRequestError = "NotFoundRequestError",
  UnknownRequestError = "UnknownRequestError",
  UnauthenticatedRequestError = "UnauthenticatedRequestError",
  InvalidRequestError = "InvalidRequestError",
  UnprocessableRequestError = "UnprocessableRequestError",
  ConflictError = "ConflictError",
}

class InvalidRequestError extends Error {
  errorData: unknown;

  constructor(errorData: unknown) {
    super("InvalidRequestError");
    this.name = "InvalidRequestError";
    this.errorData = errorData;
  }
}

class GenericRequestError extends Error {
  json: unknown;
  constructor(type: HttpErrors, json?: unknown) {
    super(type);
    this.name = type;
    this.json = json;
  }
}

//
// Globals
//
export const defaultContentType = "application/json; charset=utf-8";

const defaultHeaders: Record<string, string> = {
  "Content-Type": defaultContentType,
};

export const setDefaultHeader = (header: string, value: string): void => {
  defaultHeaders[header] = value;
};

export const clearDefaultHeader = (header: string): void => {
  delete defaultHeaders[header];
};

const responseInterceptors: ResponseInterceptor[] = [];

export const registerResponseInterceptor = (
  interceptor: ResponseInterceptor
): void => {
  responseInterceptors.push(interceptor);
};

export const unregisterResponseInterceptor = (
  interceptor: ResponseInterceptor
): void => {
  const index = responseInterceptors.indexOf(interceptor);
  if (index >= 0) {
    responseInterceptors.splice(index, 1);
  }
};

export const json = (body: Object) => {
  return new Blob([JSON.stringify(body)], { type: "application/json" });
};

export const customFetch = <T>(
  url: string,
  options: RequestInit & { next?: { revalidate?: number } } = {}
): FetchResponse<T> => {
  // Cancel logic
  const controller = new AbortController();

  // Inject default headers
  const headers = options?.headers || defaultHeaders;

  // Add default caching for API calls to reduce function invocations
  const cacheOptions = url.includes('/api/inscriptions/') || url.includes('/api/bsv20/') 
    ? { next: { revalidate: 300 }, ...options.next } // 5 min cache for critical endpoints
    : options.next;

  // do fetch
  let responsePromise: Promise<Response> = fetch(url, {
    ...options,
    headers,
    signal: controller.signal,
    next: cacheOptions,
  });

  // Register response interceptors
  responseInterceptors.forEach((interceptor) => {
    responsePromise = responsePromise.then((res: Response) =>
      interceptor(res, options)
    );
  });

  // handle result
  const returnPromise: Promise<T> = responsePromise.then(
    async (response: Response) => {
      if (response.status < 300) {
        return response.status !== 204
          ? ((await response.json()) as unknown as T)
          : // the logic is that if you have a specific case that needs to handle a 204 then you should declare the T as your type | undefined
            // this makes working with apis that don't use 204 (most of the time) a lot easier
            (undefined as unknown as T);
      } else {
        switch (response.status) {
          case 400:
            throw new InvalidRequestError(await response.json());
          case 401:
            throw new GenericRequestError(
              HttpErrors.UnauthenticatedRequestError
            );
          case 403:
            throw new GenericRequestError(
              HttpErrors.ForbiddenRequestError,
              await response.json()
            );
          case 404:
            throw new GenericRequestError(HttpErrors.NotFoundRequestError);
          case 409:
            throw new GenericRequestError(HttpErrors.ConflictError);
          case 417:
            throw new GenericRequestError(
              HttpErrors.ExpectationFailed,
              await response.json()
            );
          case 422:
            throw new GenericRequestError(
              HttpErrors.UnprocessableRequestError,
              await response.json()
            );
          default:
            throw new GenericRequestError(
              HttpErrors.UnknownRequestError,
              await response.json()
            );
        }
      }
    }
  );

  return {
    promise: returnPromise,
    abort: () => {
      controller.abort();
    },
  };
};

export const runIfNotAborted = (e: Error, callback: () => void) => {
  if (e.name !== "AbortError") {
    callback();
  }
};
