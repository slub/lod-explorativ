import type { Person } from './es';

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
  score: number;
  additionalTypes: AdditionalType[];
  aggregations: TopicMeta;
  // TODO: remove, added property for testing
  alternateAggs: Map<string, TopicMeta>;
  authors: Person[];
}

export interface AdditionalType {
  id: string;
  description: string;
  name: string;
}
