import {
	type CacheEntry,
	type ContentType,
	type ContentWrapper,
	DEFAULT_MAX_CACHED_ENTRIES,
	DEFAULT_RETRY_COUNT,
	DEFAULT_RETRY_DELAY,
	type Result,
	type TFetchClientOptions,
	TFetchError,
	Time,
	type UrlOrString,
} from "./types";

/**
 * TFetchClient class provides a wrapper around the Fetch API with features
 * such as retry logic, request caching, and configurable content types.
 *
 * @param opts Configuration options for the client.
 *
 * @returns An instance of TFetchClient.
 */
class TFetchClient {
	public readonly config: TFetchClientOptions; // Client configuration
	private cache: Map<string, CacheEntry<unknown>>; // In-memory cache for GET requests

	/**
	 * Creates an instance of TFetchClient with optional configuration.
	 * @param opts Configuration options for the client.
	 */
	public constructor(opts?: Partial<TFetchClientOptions>) {
		this.config = {
			debug: opts?.debug ?? false,
			retry: {
				count: opts?.retry?.count ?? DEFAULT_RETRY_COUNT,
				delay: opts?.retry?.delay ?? DEFAULT_RETRY_DELAY,
				onRetry: opts?.retry?.onRetry,
			},
			cache: {
				enabled: opts?.cache?.enabled ?? false,
				maxAge: opts?.cache?.maxAge ?? Time.Minute * 5,
				maxCachedEntries:
					opts?.cache?.maxCachedEntries ?? DEFAULT_MAX_CACHED_ENTRIES,
			},
		};

		this.cache = new Map();

		this.debug("TFetch Client initialized");
	}

	/**
	 * Performs a GET request to the specified URL with optional headers.
	 * Caches the response if caching is enabled and returns the cached response on subsequent requests.
	 * @template T The expected type of the response data.
	 * @param url The URL or string representing the endpoint.
	 * @param headers Optional headers to include in the request.
	 * @returns A promise resolving to the result of the GET request.
	 */
	public async get<T>(
		url: UrlOrString,
		headers?: HeadersInit,
	): Promise<Result<T>> {
		const ckey = this.GenerateCacheKey(url, headers);

		if (this.config.cache?.enabled) {
			const cachedResponse = this.getFromCache<T>(ckey);
			if (cachedResponse) {
				this.debug(`Cached response found for ${url}`);
				return { data: cachedResponse, error: null };
			}
		}

		const request = () =>
			fetch(url.toString(), {
				method: "GET",
				headers: {
					...headers,
				},
			});

		const result = await this.handleRequest<T>(request);

		if (this.config.cache?.enabled && result.data) {
			this.saveToCache(ckey, result.data);
		}

		return result;
	}

	/**
	 * Performs a POST request to the specified URL with the provided body content.
	 * @template T The expected type of the response data.
	 * @param url The URL or string representing the endpoint.
	 * @param body The content wrapper containing the type and data to be sent.
	 * @returns A promise resolving to the result of the POST request.
	 */
	public async post<T>(
		url: UrlOrString,
		body: ContentWrapper<unknown>,
	): Promise<Result<T>> {
		const headers = this.getHeaders(body.type);
		const serializedBody = this.serializeBody(body);

		const request = () =>
			fetch(url.toString(), {
				method: "POST",
				headers,
				body: serializedBody,
			});

		return this.handleRequest<T>(request);
	}

	/**
	 * Performs a PUT request to the specified URL with the provided body content.
	 * @template T The expected type of the response data.
	 * @param url The URL or string representing the endpoint.
	 * @param body The content wrapper containing the type and data to be sent.
	 * @returns A promise resolving to the result of the PUT request.
	 */
	public async put<T>(
		url: UrlOrString,
		body: ContentWrapper<unknown>,
	): Promise<Result<T>> {
		const headers = this.getHeaders(body.type);
		const serializedBody = this.serializeBody(body);

		const request = () =>
			fetch(url.toString(), {
				method: "PUT",
				headers,
				body: serializedBody,
			});

		return this.handleRequest<T>(request);
	}

	/**
	 * Performs a DELETE request to the specified URL with optional headers.
	 * @template T The expected type of the response data.
	 * @param url The URL or string representing the endpoint.
	 * @param headers Optional headers to include in the request.
	 * @returns A promise resolving to the result of the DELETE request.
	 */
	public async delete<T>(
		url: UrlOrString,
		headers?: HeadersInit,
	): Promise<Result<T>> {
		const request = () =>
			fetch(url.toString(), {
				method: "DELETE",
				headers: {
					...headers,
				},
			});
		return this.handleRequest<T>(request);
	}

	/**
	 * Handles the execution of a request with retry logic.
	 * @template T The expected type of the response data.
	 * @param request A function that returns a promise resolving to a Response object.
	 * @returns A promise resolving to the result of the request.
	 */
	private async handleRequest<T>(
		request: () => Promise<Response>,
	): Promise<Result<T>> {
		let attempts = 0;
		const maxRetries = this.config.retry.count || DEFAULT_RETRY_COUNT;
		const delay = this.config.retry.delay || DEFAULT_RETRY_DELAY;

		while (attempts <= maxRetries) {
			try {
				const response = await request();

				if (!response.ok) {
					const errorText = await response.text();
					return { data: null, error: new TFetchError(errorText) };
				}

				const data = (await response.json()) as T;
				return { data, error: null };
			} catch (error) {
				if (attempts < maxRetries) {
					attempts++;
					if (this.config.retry.onRetry) {
						this.config.retry.onRetry();
					}
					await this.sleep(delay);
				} else {
					return { data: null, error: error as TFetchError };
				}
			}
		}

		return {
			data: null,
			error: new TFetchError("Request failed after maximum retries"),
		};
	}

	/**
	 * Generates a cache key based on the URL and headers.
	 * @param url The URL or string representing the endpoint.
	 * @param headers Optional headers to include in the request.
	 * @returns A string representing the cache key.
	 */
	private GenerateCacheKey(url: UrlOrString, headers?: HeadersInit): string {
		const headersString = headers
			? JSON.stringify([...new Headers(headers).entries()])
			: "";
		return `${url.toString()}|${headersString}`;
	}

	/**
	 * Saves the response data to the cache with the specified key.
	 *
	 * This method also removes the oldest entries if the maxCachedEntries limit has been reached.
	 * This can be configured in the TFetchClientOptions.
	 *
	 * @template T The type of the data being cached.
	 * @param key The cache key under which the data will be stored.
	 * @param data The data to be cached.
	 */
	private saveToCache<T>(key: string, data: T): void {
		this.cleanupCache();
		const timestamp = Date.now();
		this.cache.set(key, { data, timestamp });
	}

	/**
	 * Retrieves data from the cache using the specified key.
	 * @template T The expected type of the cached data.
	 * @param key The cache key to look up.
	 * @returns The cached data if found and not expired, or null if not found.
	 */
	private getFromCache<T>(key: string): T | null {
		const cacheEntry = this.cache.get(key);

		if (!cacheEntry) return null;

		const { data, timestamp } = cacheEntry;
		const age = Date.now() - timestamp;

		if (age > (this.config.cache?.maxAge || 0)) {
			this.cache.delete(key);
			return null;
		}

		return data as T;
	}

	/**
	 * Removes the oldest entries from the cache if the maxCachedEntries limit has been reached.
	 * @returns void
	 */
	private cleanupCache(): void {
		// Remove the oldest entry if the maxCachedEntries limit has been reached
		if (
			this.config.cache?.maxCachedEntries &&
			this.config.cache?.maxCachedEntries === this.cache.size
		) {
			// Make sure to remove the oldest entry first (25% of the entries)
			const entries = [...this.cache.entries()].sort(
				(a, b) => a[1].timestamp - b[1].timestamp,
			);

			const entriesToRemove = Math.floor(entries.length * 0.25);

			let deleted = 0;

			for (let i = 0; i < entriesToRemove; i++) {
				const entry = entries[i];
				if (!entry) continue;
				this.cache.delete(entry[0]);
				deleted++;
			}
			this.debug(`Removed ${deleted} entries from cache cleanup.`);
		}
	}

	/**
	 * Pauses execution for a specified amount of time.
	 * @param ms The duration to sleep in milliseconds.
	 * @returns A promise that resolves after the specified duration.
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Returns appropriate headers for the specified content type.
	 * @param contentType The content type for which headers are needed.
	 * @returns An object representing the headers.
	 */
	private getHeaders(contentType: ContentType): HeadersInit {
		switch (contentType) {
			case "json":
				return { "Content-Type": "application/json" };
			case "form":
				return { "Content-Type": "application/x-www-form-urlencoded" };
			case "text":
				return { "Content-Type": "text/plain" };
			case "blob":
				return { "Content-Type": "application/octet-stream" };
			default:
				return {};
		}
	}

	/**
	 * Serializes the body content based on its type.
	 * @param body The content wrapper containing the type and data to be serialized.
	 * @returns The serialized body content as a string or Blob.
	 */
	private serializeBody(body: ContentWrapper<unknown>): string | Blob {
		switch (body.type) {
			case "json":
				return JSON.stringify(body.data);
			case "form":
				return new URLSearchParams(
					body.data as Record<string, string>,
				).toString();
			case "text":
				return String(body.data);
			case "blob":
				return body.data as Blob;
			default:
				throw new Error(`Unsupported content type: ${body.type}`);
		}
	}

	/**
	 * Logs a debug message if debug mode is enabled.
	 * @param message The message to log.
	 */
	private debug(message: string): void {
		if (this.config.debug) {
			console.log(`[DEBUG] ${message}`);
		}
	}
}

export { TFetchClient };
export type { TFetchClientOptions };
