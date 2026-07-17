const serializeNumber = (value: number): string => {
  if (!Number.isFinite(value)) throw new TypeError('JCS does not support non-finite numbers.');
  return JSON.stringify(value);
};

/** RFC 8785 JSON Canonicalization Scheme for JSON-compatible values. */
export const canonicalize = (value: unknown): string => {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') return serializeNumber(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const entries = Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`);
    return `{${entries.join(',')}}`;
  }
  throw new TypeError('Value is not JSON-compatible.');
};
