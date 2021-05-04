/**
 * @param queries         list of queries
 * @param queryFn         query template function
 * @param fields          fields in which to search
 * @param queryExtension  second query for result refinement
 */
export function multiQuery(
  queries: string[],
  queryFn: Function,
  args: {
    fields: string[];
    queryExtension: string;
    filter: boolean;
  }
) {
  return queries
    .map((q) => `{}\n${JSON.stringify(queryFn(q, args))}\n`)
    .join('');
}
