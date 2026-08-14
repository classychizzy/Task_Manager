const p2o = require('postman-to-openapi');
p2o('task-manager.postman_collection.json', 'docs/openapi.yaml', {})
  .then(() => console.log('Conversion complete: docs/openapi.yaml'))
  .catch(err => console.error('Conversion failed:', err));
