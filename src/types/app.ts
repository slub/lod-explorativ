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

export interface Resource {
  title: string;
  authors: { name: string }[];
  yearPublished: number;
  description: string;
  inLanguage: string[];
  score: number;
}

export interface EntityCount {
  docCount: number;
}

export interface AdditionalType {
  id: string;
  description: string;
  name: string;
}

export enum LinkType {
  MENTIONS_ID_LINK = 'MENTIONS_ID_LINK',
  MENTIONS_NAME_LINK = 'MENTIONS_NAME_LINK'
}

export enum NodeType {
  primary = 'primary',
  secondary = 'secondary'
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  type: LinkType;
  weight: number;
}

export interface GraphNode {
  id: string;
  doc: Topic;
  type: NodeType;
  text: string;
  count: number;
  x?: number;
  y?: number;
}
