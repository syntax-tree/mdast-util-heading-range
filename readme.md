# mdast-util-heading-range [![Build Status][build-badge]][build-status] [![Coverage Status][coverage-badge]][coverage-status] [![Chat][chat-badge]][chat]

<!--lint disable list-item-spacing heading-increment no-duplicate-headings-->

Markdown heading as ranges in [**MDAST**][mdast].

## Installation

[npm][]:

```bash
npm install mdast-util-heading-range
```

**mdast-util-heading-range** is also available as an AMD, CommonJS, and
globals module, [uncompressed and compressed][releases].

## Usage

```javascript
var heading = require('mdast-util-heading-range');
var remark = require('remark');

function plugin() {
  return function (node) {
    heading(node, 'foo', function (start, nodes, end) {
      return [
        start,
        {
          type: 'paragraph',
          children: [{type: 'text', value: 'Qux.'}]
        },
        end
      ];
    });
  }
}

var file = remark().use(plugin).process([
  '# Foo',
  '',
  'Bar.',
  '',
  '# Baz',
  ''
].join('\n'));

console.log(String(file));
```

Yields:

```markdown
# Foo

Qux.

# Baz
```

## API

### `heading(node, test, onrun)`

Transform part of a document without affecting other parts, by changing
a section: a heading which passes `test`, until the next heading of the
same or lower depth, or the end of the document.

###### Parameters

*   `node` ([`Node`][node]) — Node to search;
*   `test` (`string`, `RegExp`, `function(string, Node): boolean`)
    — Heading to look for.  When `string`, wrapped in
    `new RegExp('^(' + value + ')$', 'i')`;  when `RegExp`, wrapped
    in `function (value) {expression.test(value)}`.
*   `onrun` ([`Function`][onrun]).

#### `function onrun(start, nodes, end?, scope)`

Callback invoked when a range is found.

###### Parameters

*   `start` (`Heading`) — Start of range;
*   `nodes` (`Array.<Node>`) — Nodes between `start` and `end`;
*   `end` (`Heading?`) — End of range, if any.
*   `scope` (`Object`):

    *   `parent` (`Node`) — Parent of the range;
    *   `start` (`number`) — Index of `start` in `parent`;
    *   `end` (`number?`) — Index of `end` in `parent`.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/wooorm/mdast-util-heading-range.svg

[build-status]: https://travis-ci.org/wooorm/mdast-util-heading-range

[coverage-badge]: https://img.shields.io/codecov/c/github/wooorm/mdast-util-heading-range.svg

[coverage-status]: https://codecov.io/github/wooorm/mdast-util-heading-range

[chat-badge]: https://img.shields.io/gitter/room/wooorm/remark.svg

[chat]: https://gitter.im/wooorm/remark

[releases]: https://github.com/wooorm/mdast-util-heading-range/releases

[license]: LICENSE

[author]: http://wooorm.com

[npm]: https://docs.npmjs.com/cli/install

[mdast]: https://github.com/wooorm/mdast

[node]: https://github.com/wooorm/mdast#node

[onrun]: #function-onrunstart-nodes-end-scope
