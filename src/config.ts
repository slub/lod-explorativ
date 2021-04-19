export default {
  esHost: 'https://es.data.slub-dresden.de',
  backend: 'https://api.data.slub-dresden.de/explore',
  // backend: 'http://localhost:8080/explore',
  search: {
    resources: [
      'preferredName',
      'description',
      'alternativeHeadline',
      'nameShort',
      'nameSub',
      'author.name',
      'mentions.name',
      'partOfSeries.name',
      'about.name',
      'about.keywords'
    ]
  }
};
