export enum Endpoint {
  topicsearch = 'topicsearch',
  aggregations = 'aggregations',
  correlations = 'correlations'
}
export interface Event {
  id: string;
  name: string;
}

export interface Geo {
  id: string;
  name: string;
}

export interface Person {
  id: string;
  occupation: string[];
  alternateNames: string[];
  birthDate: string;
  deathDate: string;
  birthPlace: {
    '@id': string;
    description: string;
    name: string;
    sameAs: string;
  };
  honorificSuffic: string;
  name: string;
}

export interface Mention {
  id: string;
  name: string;
}

export interface Resource {
  id: string;
  authors: string[];
  datePublished: string;
  description: string[];
  inLanguage: string[];
  title: string;
  yearPublished: string;
  mentions: Mention[];
}

export interface AdditionalType {
  id: string;
  description: string;
  name: string;
}

export interface Topic {
  id: string;
  additionalTypes: AdditionalType[];
  alternateName: string[];
  description: string;
  name: string;
}

export interface Subject {
  aggs: Aggregations;
  docCount: number;
  topResources: {
    [id: string]: number;
  };
}

export interface Aggregation {
  [key: string]: number;
}

export interface Aggregations {
  datePublished: Aggregation;
  genres: Aggregation;
  mentions: Aggregation;
  topAuthors: Aggregation;
  topContributors: Aggregation;
  topMentionedTopics: Aggregation;
  [aggName: string]: Aggregation;
}

export interface AggregationResult {
  subjects: {
    [subject: string]: Subject;
  };
  superAgg: Aggregations;
  correlations: {
    topicAM: {
      [topicGroup: string]: number;
    };
  };
}

export interface EntityPool {
  events: Event[];
  geo: Geo[];
  persons: Person[];
  resources: Resource[];
  topics: Topic[];
}

export interface BackendAggregation {
  entityPool: EntityPool;
  phraseMatch: AggregationResult;
  topicMatch: AggregationResult;
}
