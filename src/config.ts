export default {
  esHost: 'https://es.data.slub-dresden.de',
  search: {
    resources: [
      'mentions.name',
      'preferredName',
      'partOfSeries.name',
      'about.name',
      'about.keywords',
      'description'
      // 'alternativeHeadline'
      // TODO: should we also search in authors?
      // 'author.name',
      // 'nameShort',
      // 'nameSub',
    ]
  }
};
