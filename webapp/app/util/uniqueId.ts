const _uniqueId: { [key: string]: number } = {};

export function uniqueId(prefix: string = "uuid") {
  _uniqueId[prefix] = (_uniqueId[prefix] || 0) + 1;
  return prefix + _uniqueId[prefix];
}
