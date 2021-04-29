/**
 * @param queries         list of queries
 * @param queryFn         query template function
 * @param fields          fields in which to search
 * @param queryExtension  second query for result refinement
 */
export function multiQuery(
  queries: string[],
  queryFn: Function,
  fields: string[],
  queryExtension: string
) {
  return queries
    .map((q) => `{}\n${JSON.stringify(queryFn(q, fields, queryExtension))}\n`)
    .join('');
}
