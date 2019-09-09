const {BigQuery} = require('@google-cloud/bigquery');

const bigQuery = new BigQuery({
  projectId: 'diburchat'
});

module.exports = async (event) => {
  const rows = [{
    event_timestamp: new Date(),
    ...event,
  }];

  // Insert data into a table
  await bigQuery
    .dataset('bonariv')
    .table('chat')
    .insert(rows);
}