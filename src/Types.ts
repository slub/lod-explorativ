export type AdditionalType = {
  id: string,
  name: string,
  description: string,
};

export type TopicType = {
  name: string,
  additionalTypes: AdditionalType[],
};
