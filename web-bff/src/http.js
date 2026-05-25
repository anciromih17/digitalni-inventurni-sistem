async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  const rawBody = await response.text();
  let data = null;

  if (rawBody) {
    try {
      data = JSON.parse(rawBody);
    } catch (error) {
      data = {
        raw: rawBody,
      };
    }
  }

  if (!response.ok) {
    const message =
      data?.error ||
      data?.detail ||
      data?.raw ||
      `Upstream request failed: ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

module.exports = {
  requestJson,
};
