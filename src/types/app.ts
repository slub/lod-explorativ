import type { GeoES, PersonES, TopicES, EventES as EventES } from './es';

export interface TopAuthor {
  key: string;
  doc_count: number;
}

export interface DatePublished {
  year: number;
  count: number;
}

export interface Mention {
  name: string;
  docCount: number;
}

export interface ResourceAggregation {
  docCount: number;
  topAuthors: TopAuthor[];
  datePublished: DatePublished[];
  mentions: Mention[];
}

export interface Topic {
  id: string;
  name: string;
  alternateName: string;
  description: string;
  score: number;
  additionalTypes: AdditionalType[];
  aggregations: ResourceAggregation;
  aggregationsLoose: ResourceAggregation;
  altCount: number;
  authors: Map<PersonES, number>;
  locations: Map<GeoES, number>;
  related: Map<TopicES, number>;
  events: Map<EventES, number>;
}

export interface EntityCount {
  docCount: number;
}

export interface AdditionalType {
  id: string;
  description: string;
  name: string;
}
