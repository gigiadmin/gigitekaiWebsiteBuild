/**
 * Data API caller (legacy Manus Forge replacement stub).
 *
 * The original implementation routed requests through the Manus platform's
 * built-in data API gateway. As part of the off-Manus migration, each
 * data source (YouTube, etc.) should be replaced with a direct owned API
 * integration or an Azure/MCP connector.
 *
 * For now, calling this function throws a clear error explaining that the
 * Manus data API gateway is no longer available and the source must be
 * wired directly.
 */

export type DataApiCallOptions = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  formData?: Record<string, unknown>;
};

export async function callDataApi(
  apiId: string,
  _options: DataApiCallOptions = {}
): Promise<unknown> {
  throw new Error(
    `Manus Forge Data API gateway is no longer available (apiId: ${apiId}). ` +
      `Replace with a direct API integration (e.g., YouTube Data API, Azure Function, or MCP connector).`
  );
}
