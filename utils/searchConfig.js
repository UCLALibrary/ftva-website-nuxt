const config = {
  collection: {
    filters:[
      {
        label: 'Filter by Topic',
        esFieldName: 'ftvaCollectionGroup.title.keyword',
        craftFieldValue: 'filterByTopic'
      },
      {
        label: 'Filter by Season',
        esFieldName: 'episodeSeason.keyword',
        craftFieldValue: 'filterBySeason'
      },
    ]
  }
}
export default config