/**
 * Collection Utilities
 * Eliminates repeated patterns: Set-based deduplication, Map/lookup creation
 */

/**
 * Extracts unique, non-null values from an array of objects by a given field.
 * Replaces: [...new Set(items.map(item => item.field).filter(Boolean))]
 *
 * @param {Array} items - The source array
 * @param {string|Function} keyOrFn - Property name or accessor function
 * @returns {Array} Array of unique, truthy values
 */
export const extractUnique = (items, keyOrFn) => {
  if (!Array.isArray(items) || items.length === 0) return [];
  const accessor = typeof keyOrFn === 'function' ? keyOrFn : (item) => item?.[keyOrFn];
  return [...new Set(items.map(accessor).filter(Boolean))];
};

/**
 * Creates a Map from an array of objects using a specified key.
 * Replaces: new Map(items.map(item => [item.key, item]))
 *
 * @param {Array} items - The source array
 * @param {string|Function} keyOrFn - Property name or key accessor function
 * @returns {Map} Map with keys mapped to their corresponding items
 */
export const createMap = (items, keyOrFn) => {
  if (!Array.isArray(items) || items.length === 0) return new Map();
  const keyAccessor = typeof keyOrFn === 'function' ? keyOrFn : (item) => item?.[keyOrFn];
  return new Map(items.map((item) => [keyAccessor(item), item]));
};

/**
 * Creates a plain object lookup from an array.
 * Replaces: items.forEach(item => { map[item.id] = item })
 *
 * @param {Array} items - The source array
 * @param {string|Function} keyOrFn - Property name or key accessor function
 * @param {string|Function} [valueOrFn] - Optional value accessor (defaults to whole item)
 * @returns {Object} Plain object with keys mapped to items/values
 */
export const createLookup = (items, keyOrFn, valueOrFn) => {
  if (!Array.isArray(items) || items.length === 0) return {};
  const keyAccessor = typeof keyOrFn === 'function' ? keyOrFn : (item) => item?.[keyOrFn];
  const valueAccessor = valueOrFn
    ? typeof valueOrFn === 'function' ? valueOrFn : (item) => item?.[valueOrFn]
    : (item) => item;
  return items.reduce((acc, item) => {
    const key = keyAccessor(item);
    if (key != null) acc[key] = valueAccessor(item);
    return acc;
  }, {});
};

/**
 * Creates a Map grouping items by a specified key.
 * Useful when multiple items share the same key value.
 *
 * @param {Array} items - The source array
 * @param {string|Function} keyOrFn - Property name or key accessor function
 * @returns {Map} Map with keys mapped to arrays of items
 */
export const createGroupMap = (items, keyOrFn) => {
  if (!Array.isArray(items) || items.length === 0) return new Map();
  const keyAccessor = typeof keyOrFn === 'function' ? keyOrFn : (item) => item?.[keyOrFn];
  return items.reduce((map, item) => {
    const key = keyAccessor(item);
    if (key != null) {
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return map;
  }, new Map());
};
