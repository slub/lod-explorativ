export enum Endpoint {
  search = 'search',
  mget = 'mget'
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

export interface Reference {
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
  additionalType: Reference[];
  category: {
    [lang: string]: Reference[];
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

export interface Date {
  '@value': string;
  description: number;
  disambiguatingDescription: string;
}

export interface Occupation {
  description: string;
  name: string;
}

export interface Suffix {
  name: string;
  description: string;
}

export interface Person {
  '@context': string;
  '@id': string;
  '@type': string;
  birthDate?: Date;
  deathDate?: Date;
  dateModified?: string;
  periodOfActivityStart?: Date;
  periodOfActivityEnd?: Date;
  hasOccupation?: Occupation[];
  identifier: string;
  isBasedOn: string;
  preferredName: string;
  alternateName: string;
  horrifiedSuffix: Suffix;
  sameAs: SameAs[];
  about: About[];
  category: Reference[];
  sibling?: Reference[];
  children?: Reference[];
  colleague?: Reference[];
  follows?: Reference[];
  parent?: Reference[];
  knows?: Reference[];
  spouse?: Reference[];
  relatedTo?: Reference[];
  birthPlace?: Reference;
  deathPlace?: Reference;
  workLocation?: Reference[];
  _isil: string;
  _type: string;
  _version: number;
}

export interface PersonSearchResult {
  found: boolean;
  _id: string;
  _index: string;
  _primary_term: number;
  _seq_no: number;
  _source: Person;
  _type: string;
  _version: number;
}
