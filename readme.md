# mdast-util-heading-range [![Build Status][build-badge]][build-status] [![Coverage Status][coverage-badge]][coverage-status] [![Chat][chat-badge]][chat]

Markdown heading as ranges in [**MDAST**][mdast].

## Installation

[npm][]:

```bash
npm install mdast-util-heading-range
```

## Usage

Say we have the following file, `example.md`:

```markdown
# Foo

Bar.

# Baz
```

And our script, `example.js`, looks as follows:

```javascript
var vfile = require('to-vfile');
var remark = require('remark');
var heading = require('mdast-util-heading-range');

remark()
  .use(plugin)
  .process(vfile.readSync('example.md'), function (err, file) {
    if (err) throw err;
    console.log(String(file));
  });

function plugin() {
  return transformer;
  function transformer(tree) {
    heading(tree, 'foo', mutate);
  }
  function mutate(start, nodes, end) {
    return [
      start,
      {type: 'paragraph', children: [{type: 'text', value: 'Qux.'}]},
      end
    ];
  }
}
```

Now, running `node example` yields:

```markdown
# Foo

Qux.

# Baz
```

## API

### `heading(tree, test|options, onrun)`

Search `tree` ([`Node`][node]) and transform a section without affecting other
parts with `onrun` ([`Function`][onrun]).
A Section is a heading that passes `test`, until the next heading of the same
or lower depth, or the end of the document.  If `ignoreFinalDefinitions: true`,
final definitions “in” the section are excluded.

###### `options`

*   `test` (`string`, `RegExp`, [`Function`][test])
    — Heading to look for.
    When `string`, wrapped in `new RegExp('^(' + value + ')$', 'i')`;
    when `RegExp`, wrapped in `function (value) {expression.test(value)}`
*   `ignoreFinalDefinitions` (`boolean`, default: `false`)
    — Ignore final definitions otherwise in the section

#### `function test(value, node)`

Function invoked for each heading with its content (`string`) and `node`
itself ([`Heading`][heading]) to check if it’s the one to look for.

###### Returns

`Boolean?`, `true` if this is the heading to use.

#### `function onrun(start, nodes, end?, scope)`

Callback invoked when a range is found.

###### Parameters

*   `start` ([`Heading`][heading]) — Start of range
*   `nodes` ([`Array.<Node>`][node]) — Nodes between `start` and `end`
*   `end` ([`Node?`][node]) — End of range, if any
*   `scope` (`Object`):

    *   `parent` ([`Node`][node]) — Parent of the range
    *   `start` (`number`) — Index of `start` in `parent`
    *   `end` (`number?`) — Index of `end` in `parent`

## Contribute

See [`contribute.md` in `syntax-tree/mdast`][contribute] for ways to get
started.

This organisation has a [Code of Conduct][coc].  By interacting with this
repository, organisation, or community you agree to abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/syntax-tree/mdast-util-heading-range.svg

[build-status]: https://travis-ci.org/syntax-tree/mdast-util-heading-range

[coverage-badge]: https://img.shields.io/codecov/c/github/syntax-tree/mdast-util-heading-range.svg

[coverage-status]: https://codecov.io/github/syntax-tree/mdast-util-heading-range

[chat-badge]: https://img.shields.io/gitter/room/wooorm/remark.svg

[chat]: https://gitter.im/wooorm/remark

[license]: license

[author]: https://wooorm.com

[npm]: https://docs.npmjs.com/cli/install

[mdast]: https://github.com/syntax-tree/mdast

[node]: https://github.com/syntax-tree/unist#node

[onrun]: #function-onrunstart-nodes-end-scope

[heading]: https://github.com/syntax-tree/mdast#heading

[test]: #function-testvalue-node

[contribute]: https://github.com/syntax-tree/mdast/blob/master/contributing.md

[coc]: https://github.com/syntax-tree/mdast/blob/master/code-of-conduct.md
