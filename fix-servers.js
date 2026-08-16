const fs = require('fs');
const YAML = require('yaml');

const path = 'docs/openapi.yaml';

// Read as raw text first, strip out just the broken servers section manually
// isn't reliable here since the file itself won't parse — so instead we
// fix the raw text directly for the servers block, then verify.
let content = fs.readFileSync(path, 'utf8');

const lines = content.split('\n');
const serverStart = lines.findIndex(l => l.trim() === 'servers:');

if (serverStart === -1) {
    console.error('Could not find "servers:" line');
    process.exit(1);
}

// Find where the servers block ends (next top-level key, i.e. line with no leading space)
let serverEnd = serverStart + 1;
while (serverEnd < lines.length && (lines[serverEnd].startsWith(' ') || lines[serverEnd].trim() === '')) {
    serverEnd++;
}

const newServersBlock = [
    'servers:',
    '  - url: http://localhost:9000/api/v1',
    '    description: Local development server'
];

const newLines = [
    ...lines.slice(0, serverStart),
    ...newServersBlock,
    ...lines.slice(serverEnd)
];

fs.writeFileSync(path, newLines.join('\n'));
console.log('Servers section replaced.');

// Now verify the whole file actually parses
try {
    YAML.parse(fs.readFileSync(path, 'utf8'));
    console.log('File is valid YAML.');
} catch (e) {
    console.error('Still invalid:', e.message);
}
