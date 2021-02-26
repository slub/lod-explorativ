/**
 *
 * @param queries list of queries
 * @param queryFn function returns sub query object
 * @param fields  fields in which to search
 */
export function multiQuery(
  queries: string[],
  queryFn: Function,
  fields: string[] | string
) {
  return queries
    .map((q) => `{}\n${JSON.stringify(queryFn(q, fields))}\n`)
    .join('');
}
