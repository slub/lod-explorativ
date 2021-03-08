import type { Geo, Person, Topic as TopicES, Event as EventES } from './es';

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

export interface TopicMeta {
  resourcesCount: number;
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
  aggregations: TopicMeta;
  aggregationsLoose: TopicMeta;
  altCount: number;
  authors: Person[];
  locations: Geo[];
  related: TopicES[];
  events: EventES[];
}

export interface AdditionalType {
  id: string;
  description: string;
  name: string;
}
