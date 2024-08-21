# type-fetch

**type-fetch** is a lightweight, flexible HTTP client library for making API requests in JavaScript/TypeScript. It provides a straightforward API with built-in support for retries, caching, and content type handling. Whether you're building a web application or a Node.js service, **type-fetch** is designed to simplify and streamline your HTTP requests.

## Features

- **Flexible Request Methods**: Supports `GET`, `POST`, `PUT`, and `DELETE` requests.
- **Automatic Content-Type Handling**: Automatically sets the correct content type based on the request payload.
- **Retry Mechanism**: Configurable retry logic with custom retry delays and callbacks.
- **Caching**: Cache responses for `GET` requests to improve performance and reduce redundant API calls.
- **Debug Logging**: Optionally log request and cache information for easier debugging.

## Installation

Install **type-fetch**:

```bash
pnpm add @thatguyjamal/type-fetch
```

or

```bash
npm install @thatguyjamal/type-fetch
```

## Usage

### Basic Usage

Here's a basic example of how to use **type-fetch** for making HTTP requests:

```typescript
import { TFetchClient } from "@thatguyjamal/type-fetch";

// Create a new client instance with optional configuration
const client = new TFetchClient({
  debug: true,
  retry: {
    count: 3,
    delay: 1000,
    onRetry: () => console.log("Retrying..."),
  },
  cache: {
    enabled: true,
    maxAge: 300000, // Cache responses for 5 minutes
  },
});

type Post = {
  id: number;
  title: string;
  body: string;
  userId: number;
};

const { data, error } = await client.get<Post>(
  "https://jsonplaceholder.typicode.com/posts/1"
);

// Making a POST request with JSON data
const { data, error } = await client.post(
  "https://jsonplaceholder.typicode.com/posts",
  {
    type: "json", // other options: "text", "form", "blob"
    data: {
      title: "foo",
      body: "bar",
      userId: 1,
    },
  }
);

// Making a PUT request with JSON data
const { data, error } = await client.put(
  "https://jsonplaceholder.typicode.com/posts/1",
  {
    type: "json",
    data: {
      id: 1,
      title: "foo",
      body: "bar",
      userId: 1,
    },
  }
);

// Making a DELETE request
const { data, error } = await client.delete(
  "https://jsonplaceholder.typicode.com/posts/1"
);
```

### Configuration Options

- `debug` (boolean): Enables debug logging.
- `retry` (object): Configures retry logic.
  - `count` (number): Number of retry attempts.
  - `delay` (number): Delay between retries in milliseconds.
  - `onRetry` (function): Callback function to execute on each retry.
- `cache` (object): Configures caching for `GET` requests.
  - `enabled` (boolean): Enables or disables caching.
  - `maxAge` (number): Maximum age of cache entries in milliseconds.
  - `maxCachedEntries` (number): Maximum number of cached entries allowed.

### API

#### `TFetchClient`

- `constructor(opts?: Partial<TFetchClientOptions>)`: Creates a new instance with optional configuration.

- `get<T>(url: UrlOrString, headers?: HeadersInit): Promise<Result<T>>`: Makes a `GET` request.

- `post<T>(url: UrlOrString, body: ContentWrapper<unknown>): Promise<Result<T>>`: Makes a `POST` request.

- `put<T>(url: UrlOrString, body: ContentWrapper<unknown>): Promise<Result<T>>`: Makes a `PUT` request.

- `delete<T>(url: UrlOrString, headers?: HeadersInit): Promise<Result<T>>`: Makes a `DELETE` request.

## Testing

To run tests for **type-fetch** simply run `pnpm test` in the root directory.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request with your improvements.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
