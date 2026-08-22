export const requestJson = async <T>(
  url: string,
  init: RequestInit,
): Promise<T> => {
  const response = await fetch(url, init);
  const body = await response.text();
  if (!response.ok) {
    const safeBody = body.slice(0, 1_500);
    throw new Error(
      `${init.method ?? "GET"} ${new URL(url).pathname} failed (${response.status}): ${safeBody}`,
    );
  }
  return body ? (JSON.parse(body) as T) : (undefined as T);
};
