process.env.NODE_ENV = "test";

// Set Vite environment variables for tests
process.env.VITE_API_BASE_URL = "http://localhost:3000/api/v1";
process.env.MODE = "test";
process.env.DEV = "false";
process.env.PROD = "false";
process.env.SSR = "false";

// Polyfill for Request/Response APIs required by react-router-dom v6
// These are not available in Node.js/jsdom by default
if (typeof globalThis.Request === "undefined") {
  // Minimal polyfill for Request API
  globalThis.Request = class Request {
    url: string;
    method: string;
    headers: Headers;
    body: BodyInit | null;
    bodyUsed: boolean;
    cache: RequestCache;
    credentials: RequestCredentials;
    destination: RequestDestination;
    integrity: string;
    keepalive: boolean;
    mode: RequestMode;
    redirect: RequestRedirect;
    referrer: string;
    referrerPolicy: ReferrerPolicy;
    signal: AbortSignal | null;

    constructor(input: string | Request, init?: RequestInit) {
      this.url = typeof input === "string" ? input : input.url;
      this.method = (init?.method || "GET").toUpperCase();
      this.headers = new Headers(init?.headers);
      this.body = init?.body || null;
      this.bodyUsed = false;
      this.cache = init?.cache || "default";
      this.credentials = init?.credentials || "same-origin";
      this.destination = "document";
      this.integrity = init?.integrity || "";
      this.keepalive = init?.keepalive || false;
      this.mode = init?.mode || "cors";
      this.redirect = init?.redirect || "follow";
      this.referrer = "about:client";
      this.referrerPolicy = init?.referrerPolicy || "";
      this.signal = init?.signal || null;
    }

    clone(): Request {
      return new Request(this.url, {
        method: this.method,
        headers: this.headers,
        body: this.body,
      });
    }
  } as any;

  globalThis.Response = class Response {
    status: number;
    statusText: string;
    headers: Headers;
    body: BodyInit | null;
    bodyUsed: boolean;
    ok: boolean;
    redirected: boolean;
    type: ResponseType;
    url: string;

    constructor(body?: BodyInit | null, init?: ResponseInit) {
      this.status = init?.status || 200;
      this.statusText = init?.statusText || "OK";
      this.headers = new Headers(init?.headers);
      this.body = body || null;
      this.bodyUsed = false;
      this.ok = this.status >= 200 && this.status < 300;
      this.redirected = false;
      this.type = "default";
      this.url = "";
    }

    clone(): Response {
      return new Response(this.body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers,
      });
    }
  } as any;

  globalThis.Headers = class Headers {
    private map = new Map<string, string>();

    constructor(init?: HeadersInit) {
      if (init) {
        if (Array.isArray(init)) {
          init.forEach(([key, value]) => this.map.set(key, value));
        } else if (init instanceof Headers) {
          init.forEach((value, key) => this.map.set(key, value));
        } else {
          Object.entries(init).forEach(([key, value]) =>
            this.map.set(key, String(value)),
          );
        }
      }
    }

    get(name: string): string | null {
      return this.map.get(name.toLowerCase()) || null;
    }

    set(name: string, value: string): void {
      this.map.set(name.toLowerCase(), value);
    }

    has(name: string): boolean {
      return this.map.has(name.toLowerCase());
    }

    delete(name: string): void {
      this.map.delete(name.toLowerCase());
    }

    forEach(
      callback: (value: string, key: string) => void,
      thisArg?: unknown,
    ): void {
      this.map.forEach((value, key) => {
        callback.call(thisArg, value, key);
      });
    }

    entries(): IterableIterator<[string, string]> {
      return this.map.entries();
    }

    keys(): IterableIterator<string> {
      return this.map.keys();
    }

    values(): IterableIterator<string> {
      return this.map.values();
    }

    [Symbol.iterator](): IterableIterator<[string, string]> {
      return this.map.entries();
    }
  } as any;
}
