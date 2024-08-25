/**
 * Interface defining the configuration options for the TFetchClient.
 */
export interface TFetchClientOptions {
	/** Enable or disable debug logging. */
	debug?: boolean;
	retry: {
		/** Number of retry attempts for failed requests. @default 0 */
		count?: number;
		/** Delay between retry attempts in milliseconds. @default 1 second */
		delay?: number;
		/** Callback function executed on each retry. @default undefined */
		onRetry?: () => void;
	};
	cache: {
		/** Enable or disable caching for GET requests. @default false */
		enabled?: boolean;
		/** Maximum age for cache entries in milliseconds. @default 5 minutes */
		maxAge?: number;
		/**
		 * Maximum number of cache entries before a cleanup is triggered.
		 *
		 * It is important to know the larger this size the more memory the library will use.
		 * So keeping this small can help reduce memory usage on lower-end servers. When this
		 * limit is hit, a cleanup is triggered and the oldest entries are remove on the next cache save.
		 *
		 * @default 5,000
		 */
		maxCachedEntries?: number;
	};
}

/**
 * A type representing a URL or string.
 */
export type UrlOrString = string | URL;

/**
 * A generic type representing the result of an asynchronous operation.
 * @template T The type of the data returned on success.
 * @template E The type of the error returned on failure (default is Error).
 */
export type Result<T, E = TFetchError> = { data: T | null; error: E | null };

/**
 * Supported content types for requests.
 */
export type ContentType = "json" | "form" | "text" | "blob";

/**
 * Interface wrapping content with its associated content type.
 * @template T The type of the data being wrapped.
 */
export interface ContentWrapper<T> {
	type: ContentType;
	data: T;
}

/**
 * Interface representing a cache entry.
 * @template T The type of the data stored in the cache.
 */
export interface CacheEntry<T> {
	data: T;
	timestamp: number;
}

/**
 * An error class for TFetchClient.
 * @param message The error message.
 * @returns A new TFetchError instance.
 */
export class TFetchError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "TFetchError";
	}
}

export const DEFAULT_RETRY_COUNT = 0;
export const DEFAULT_RETRY_DELAY = 1000;
export const DEFAULT_MAX_CACHED_ENTRIES = 5000;

/**
 * Enumeration of time constants in milliseconds.
 */
export enum Time {
	Second = 1000,
	Minute = 60 * Time.Second,
	Hour = 60 * Time.Minute,
	Day = 24 * Time.Hour,
}
