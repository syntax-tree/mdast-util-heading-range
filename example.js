var heading = require('./index.js');
var mdast = require('mdast');

// Callback invoked when a heading is found.
function onrun(start, nodes, end) {
    return [
        start,
        {
            'type': 'paragraph',
            'children': [
                {
                    'type': 'text',
                    'value': 'Qux.'
                }
            ]
        },
        end
    ];
}

// Process a document.
var doc = mdast().use(heading('foo', onrun)).process(
    '# Foo\n' +
    '\n' +
    'Bar.\n' +
    '\n' +
    '# Baz\n'
);

// Yields:
console.log('markdown', doc);
