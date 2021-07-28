export default {
  backend: 'https://data.slub-dresden.de/explore',
  catalogURL: 'https://katalog.slub-dresden.de/?tx_find_find[q][topic][0]=',
  topicSearchFields: [
    'preferredName^1.1',
    'alternateName',
    'description',
    'additionalType.description',
    'additionalType.name',
    'category.en.name',
    'category.de.name'
  ]
};
