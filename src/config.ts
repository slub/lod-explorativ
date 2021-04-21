export default {
  esHost: 'https://es.data.slub-dresden.de',
  backend: 'https://api.data.slub-dresden.de/explore',
  // backend: 'http://localhost:8080/explore',
  search: {
    resources: [
      // TODO: fine-tune boost factor
      'preferredName^2',
      'description',
      'alternativeHeadline',
      'nameShort',
      'nameSub',
      'author.name',
      // TODO: only boot mentions on loose query
      'mentions.name^3',
      'partOfSeries.name',
      'about.name',
      'about.keywords'
    ]
  }
};
