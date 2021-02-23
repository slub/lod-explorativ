export interface Category {
  '@id': string;
  name: string;
  sameAs: string;
}

export interface IsBasedOn {
  '@id': string;
  '@type': string;
}

export interface Publisher {
  '@id': string;
  abbr: string;
  preferredName: string;
}

export interface SameAs {
  '@id': string;
  isBasedOn: IsBasedOn;
  publisher: Publisher;
}

export interface AdditionalType {
  '@id': string;
  description: string;
  name: string;
  sameAs: string;
}

export interface Identifier {
  '@type': string;
  propertyID: string;
  value: string;
}

export interface About {
  '@id': string;
  identifier: Identifier;
}

export interface Source {
  '@context': string;
  '@id': string;
  '@type': string;
  about: About[];
  additionalType: AdditionalType[];
  category: {
    [lang: string]: Category[];
  };
  dateModified: string;
  identifier: string;
  isBasedOn: string;
  preferredName: string;
  sameAs: SameAs[];
  _isil: string;
}

export interface Topic {
  _id: string;
  _index: string;
  _score: number;
  _type: string;
  _source: Source;
}

export interface Bucket {
  key: string;
  key_as_string: string;
  doc_count: number;
}

export interface Aggregation {
  buckets: Bucket[];
  doc_count_error_upper_bound: number;
  sum_other_doc_count: number;
}

export interface ResourceAggResponse {
  aggregations: {
    [name: string]: Aggregation;
  };
  hits: {
    hits: any[];
    max_score: number;
    total: {
      value: number;
      relation: string;
    };
  };
  status: number;
  timed_out: boolean;
  took: number;
}
