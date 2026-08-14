const fs = require('fs');
const collection = JSON.parse(fs.readFileSync('task-manager.postman_collection.json', 'utf8'));

function checkUrls(items, path = '') {
    for (const item of items) {
        const currentPath = path + '/' + item.name;
        if (item.item) {
            checkUrls(item.item, currentPath);
        } else if (item.request) {
            if (!item.request.url) {
                console.log('NO URL:', currentPath);
            } else if (typeof item.request.url === 'string') {
                console.log('URL IS STRING (not object):', currentPath, '-', item.request.url);
            } else if (!item.request.url.raw) {
                console.log('NO RAW URL:', currentPath);
            } else if (!item.request.url.path) {
                console.log('NO PATH ARRAY:', currentPath, '-', JSON.stringify(item.request.url));
            }
        }
    }
}

checkUrls(collection.item);
console.log('URL check complete.');
