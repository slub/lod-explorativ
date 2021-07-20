export default {
  backend: 'https://api.data.slub-dresden.de/explore',
  search: {
    resources: [
      'preferredName^2',
      'description',
      'nameShort',
      'nameSub',
      // boosting on mentions gives explicitly linked resources precedence
      'mentions.name^3',
      'partOfSeries.name',
      'about.name',
      'about.keywords'
    ]
  }
};
