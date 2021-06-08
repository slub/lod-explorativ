import type { Event, Geo, Person, Topic as TopicBackend } from './backend';
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
  description: string;
  score: number;
  count: number;
  mentionCount: number;
  additionalTypes: AdditionalType[];
  aggregations: ResourceAggregation;
  aggregationsLoose: ResourceAggregation;
  datePublished: DatePublished[];
  authors: Map<Person, number>;
  contributors: Map<Person, number>;
  locations: Map<Geo, number>;
  related: Map<TopicBackend, number>;
  events: Map<Event, number>;
}

export interface Resource {
  title: string;
  authors: { name: string }[];
  yearPublished: number;
  description: string;
  inLanguage: string[];
  score: number;
  topics: string[];
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
  MENTIONS_NAME_LINK = 'MENTIONS_NAME_LINK',
  TOPIC_AUTHOR = 'topicAuthor'
}

export enum NodeType {
  PRIMARY_NODE = 'PRIMARY_NODE',
  SECONDARY_NODE = 'SECONDARY_NODE',
  AUTHOR_NODE = 'AUTHOR_NODE'
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
  datePublished: DatePublished[];
}
