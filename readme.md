# mdast-util-heading-range [![Build Status][travis-badge]][travis] [![Coverage Status][coverage-badge]][coverage]

Markdown heading as ranges in [**mdast**][mdast].

## Installation

[npm][npm-install]:

```bash
npm install mdast-util-heading-range
```

**mdast-util-heading-range** is also available for [duo][],
and as an AMD, CommonJS, and globals module,
[uncompressed and compressed][releases].

## Usage

```javascript
var heading = require('mdast-util-heading-range');
var remark = require('remark');
```

Callback invoked when a heading is found.

```javascript
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
```

Process a document.

```javascript
var doc = remark().use(heading('foo', onrun)).process(
    '# Foo\n' +
    '\n' +
    'Bar.\n' +
    '\n' +
    '# Baz\n'
);
```

Yields:

```markdown
# Foo

Qux.

# Baz
```

## API

### heading(test, onrun)

Transform part of a document without affecting other parts, by changing a
section: a heading which passes `test`, until the next heading of the same
or lower depth, or the end of the document.

**Parameters**

*   `test` (`string`, `RegExp`, `function(string, Node): boolean`)
    — Heading to look for:

    *   When `string`, wrapped in
        `new RegExp('^(' + value + ')$', 'i')`;

    *   Then, when `RegExp`, wrapped in
        `function (value) {expression.test(value)}`.

*   [`onrun`](#function-onrunstart-nodes-end-scope)
    (`Array.<Node>? = function (start, nodes, end)`)
    — Callback invoked when a range is found.

**Returns**

`Function` — Should be passed to [`mdast.use()`](https://github.com/wooorm/mdast#mdastuseplugin-options).

#### function onrun(start, nodes, end?, scope)

**Parameters**

*   `start` (`Heading`) — Start of range;

*   `nodes` (`Array.<Node>`) — Nodes between `start` and `end`;

*   `end` (`Heading?`) — End of range, if any.

*   `scope` (`Object`):

    *   `parent` (`Node`) — Parent of the range;
    *   `start` (`number`) — Index of `start` in `parent`;
    *   `end` (`number?`) — Index of `end` in `parent`.

**Returns**

`Array.<Node>?` — Zero or more nodes to replace the range (including
`start`, and `end`) with.

## License

[MIT][license] © [Titus Wormer][home]

<!-- Definitions -->

[travis-badge]: https://img.shields.io/travis/wooorm/mdast-util-heading-range.svg

[travis]: https://travis-ci.org/wooorm/mdast-util-heading-range

[coverage-badge]: https://img.shields.io/codecov/c/github/wooorm/mdast-util-heading-range.svg

[coverage]: https://codecov.io/github/wooorm/mdast-util-heading-range

[mdast]: https://github.com/wooorm/mdast

[npm-install]: https://docs.npmjs.com/cli/install

[duo]: http://duojs.org/#getting-started

[releases]: https://github.com/wooorm/mdast-util-heading-range/releases

[license]: LICENSE

[home]: http://wooorm.com
