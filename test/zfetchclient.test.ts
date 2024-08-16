import { ZFetchClient } from "../lib/lib";

describe("ZFetchClient with JSON Placeholder API", () => {
  const client = new ZFetchClient();

  test("should perform a GET request", async () => {
    const result = await client.get<{
      userId: number;
      id: number;
      title: string;
      completed: boolean;
    }>("https://jsonplaceholder.typicode.com/todos/1");

    expect(result.data).toBeDefined();
    expect(result.data?.userId).toBe(1);
    expect(result.error).toBeNull();
  });

  test("should return an error if the GET request fails", async () => {
    const result = await client.get<{
      userId: number;
      id: number;
      title: string;
      completed: boolean;
    }>("https://jsonplaceholder.typicode.com/invalid-url");

    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
  });

  test("should perform a POST request with JSON body", async () => {
    const result = await client.post<{ id: number }>(
      "https://jsonplaceholder.typicode.com/posts",
      {
        type: "json",
        data: { title: "foo", body: "bar", userId: 1 },
      }
    );

    expect(result.data).toBeDefined();
    expect(result.data?.id).toBeGreaterThan(0);
    expect(result.error).toBeNull();
  });

  test("should perform a PUT request with JSON body", async () => {
    const result = await client.put<{ id: number }>(
      "https://jsonplaceholder.typicode.com/posts/1",
      {
        type: "json",
        data: { id: 1, title: "foo", body: "bar", userId: 1 },
      }
    );

    expect(result.data).toBeDefined();
    expect(result.data?.id).toBe(1);
    expect(result.error).toBeNull();
  });

  test("should perform a DELETE request", async () => {
    const result = await client.delete<Record<string, unknown>>(
      "https://jsonplaceholder.typicode.com/posts/1"
    );

    expect(result.data).toEqual({});
    expect(result.error).toBeNull();
  });
});
