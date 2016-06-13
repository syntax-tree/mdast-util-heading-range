// Dependencies:
var heading = require('./index.js');
var remark = require('remark');

// Plug-in:
function plugin() {
    return function (node) {
        heading(node, 'foo', function (start, nodes, end) {
            return [
                start,
                {
                    'type': 'paragraph',
                    'children': [{
                        'type': 'text',
                        'value': 'Qux.'
                    }]
                },
                end
            ];
        });
    }
}

// Process a document.
var file = remark().use(plugin).process([
    '# Foo',
    '',
    'Bar.',
    '',
    '# Baz',
    ''
].join('\n'));

// Yields:
console.log('markdown', String(file));
