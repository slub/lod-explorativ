export default {
  esHost: 'https://es.data.slub-dresden.de',
  backend: 'https://api.data.slub-dresden.de/explore',
  // backend: 'http://localhost:8080/explore',
  search: {
    resources: [
      'mentions.name',
      'preferredName',
      'partOfSeries.name',
      'about.name',
      'about.keywords',
      'description',
      'alternativeHeadline',
      'author.name',
      'nameShort',
      'nameSub'
    ]
  }
};
