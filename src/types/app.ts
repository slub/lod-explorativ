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

export interface AdditionalType {
  id: string;
  description: string;
  name: string;
}

export interface Topic extends TopicMeta {
  id: string;
  name: string;
  score: number;
  additionalTypes: AdditionalType[];
}
