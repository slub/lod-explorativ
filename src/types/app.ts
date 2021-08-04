import type { Event, Geo, Person, Topic as TopicBackend } from './backend';

export interface DatePublished {
  year: number;
  count: number;
}

export interface AdditionalType {
  id: string;
  description: string;
  name: string;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  score: number;
  count: number;
  phraseCount: number;
  topicCount: number;
  mentionCount: number;
  additionalTypes: AdditionalType[];
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

export enum NodeType {
  PRIMARY_NODE = 'PRIMARY_NODE',
  SECONDARY_NODE = 'SECONDARY_NODE'
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  weight: number;
}

export interface GraphNode {
  id: string;
  type: NodeType;
  text: string;
  count: number;
  datePublished: DatePublished[];
  description: string;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
  vx?: number;
  vy?: number;
  r?: number;
  textX?: number;
  textY?: number;
  textAnchor?: string;
  dates?: GraphDot[];
  matchesQuery?: boolean;
  matchesRestrict?: boolean;
}

export interface GraphDot {
  year: number;
  count: number;
  dx: number;
  dy: number;
  dr: number;
  dc: string;
}
