const fs = require('fs');
const path = 'task-manager.postman_collection.json';
const collection = JSON.parse(fs.readFileSync(path, 'utf8'));

function removeEmptyRequests(items) {
    return items.filter(item => {
        if (item.item) {
            item.item = removeEmptyRequests(item.item);
            return true;
        }
        if (item.request && !item.request.url) {
            console.log('Removing:', item.name);
            return false;
        }
        return true;
    });
}

collection.item = removeEmptyRequests(collection.item);
fs.writeFileSync(path, JSON.stringify(collection, null, 2));
console.log('Cleanup complete.');
