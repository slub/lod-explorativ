export default {
  esHost: 'https://es.data.slub-dresden.de',
  backend: 'https://api.data.slub-dresden.de/explore',
  // backend: 'http://localhost:8080/explore',
  search: {
    resources: [
      'preferredName^2',
      'description',
      'alternativeHeadline',
      'nameShort',
      'nameSub',
      'author.name',
      // boosting on mentions gives explicitly linked resources precedence
      'mentions.name^3',
      'partOfSeries.name',
      'about.name',
      'about.keywords'
    ]
  }
};
