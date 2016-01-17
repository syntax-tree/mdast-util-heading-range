var heading = require('./index.js');
var remark = require('remark');

// Process a document.
var doc = remark()
    .use(function () {
        return function (node) {
            heading(node, 'foo', function (start, nodes, end) {
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
            });
        }
    }).process([
        '# Foo',
        '',
        'Bar.',
        '',
        '# Baz',
        ''
    ].join('\n'));

// Yields:
console.log('markdown', doc);
