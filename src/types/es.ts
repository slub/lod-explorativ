export enum Endpoint {
  search = 'search',
  msearch = 'msearch',
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

export interface GeoCoord {
  '@type': string;
  latitude: string;
  longitude: string;
}

export interface Entity {
  '@context': string;
  '@id': string;
  '@type': string;
  preferredName: string;
  about: About[];
  identifier: string;
  isBasedOn: string;
  sameAs: SameAs[];
  _isil: string;
}

export interface EventES extends Entity {
  alternateName: string;
  name: {
    [lang: string]: string;
  };
  startDate: Date;
  endDate: Date;
  category: {
    [lang: string]: Reference[];
  };
}

export interface TopicES extends Entity {
  additionalType: Reference[];
  category: {
    [lang: string]: Reference[];
  };
  dateModified: string;
  alternateName: string[];
  description: string;
}

export interface PersonES extends Entity {
  birthDate?: Date;
  deathDate?: Date;
  dateModified?: string;
  periodOfActivityStart?: Date;
  periodOfActivityEnd?: Date;
  hasOccupation?: Occupation[];
  alternateName: string;
  horrifiedSuffix: Suffix;
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
  _type: string;
  _version: number;
}

export interface GeoES extends Entity {
  adressRegion: string;
  alternateName: string[];
  dateModified: string;
  dateOfEstablishment: Date;
  dateOfTermination: Date;
  geo: GeoCoord;
}

export interface GetResponse {
  found: boolean;
  _id: string;
  _index: string;
  _primary_term: number;
  _seq_no: number;
  _source: any;
  _type: string;
  _version: number;
}

export interface TopicSearchResponse {
  _id: string;
  _index: string;
  _score: number;
  _type: string;
  _source: TopicES;
}

export interface PersonGetResponse extends GetResponse {
  _source: PersonES;
}

export interface GeoGetResponse extends GetResponse {
  _source: GeoES;
}

export interface TopicGetResponse extends GetResponse {
  _source: TopicES;
}

export interface EventGetResponse extends GetResponse {
  _source: EventES;
}
