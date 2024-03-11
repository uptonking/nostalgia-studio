export function getSelect(table, prefix, fields) {
  return fields.map((f) => `${table}.${f} as ${prefix}_${f}`);
}
