import { TFetchClient } from "../lib/lib";

// Mock fetch function
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ id: 1, title: "Test Post" }),
  })
) as jest.Mock;

describe("TFetchClient Caching", () => {
  let client: TFetchClient;

  beforeEach(() => {
    client = new TFetchClient({
      cache: {
        enabled: true,
        maxAge: 300000,
      },
    });
  });

  it("should cache GET responses", async () => {
    const url = "https://jsonplaceholder.typicode.com/posts/1";

    // Make the first GET request
    const firstResponse = await client.get<{ id: number; title: string }>(url);
    expect(firstResponse.data).toEqual({ id: 1, title: "Test Post" });
    expect(global.fetch).toHaveBeenCalledTimes(1); // Fetch should be called once

    // Make the second GET request (should be cached)
    const secondResponse = await client.get<{ id: number; title: string }>(url);
    expect(secondResponse.data).toEqual({ id: 1, title: "Test Post" });
    expect(global.fetch).toHaveBeenCalledTimes(1); // Fetch should not be called again
  });
});
