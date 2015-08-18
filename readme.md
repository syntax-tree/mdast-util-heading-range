# mdast-heading [![Build Status](https://img.shields.io/travis/wooorm/mdast-heading.svg)](https://travis-ci.org/wooorm/mdast-heading) [![Coverage Status](https://img.shields.io/codecov/c/github/wooorm/mdast-heading.svg)](https://codecov.io/github/wooorm/mdast-heading)

Markdown heading as ranges in [**mdast**](https://github.com/wooorm/mdast).

## Installation

[npm](https://docs.npmjs.com/cli/install):

```bash
npm install mdast-heading
```

[Component.js](https://github.com/componentjs/component):

```bash
component install wooorm/mdast-heading
```

[Bower](http://bower.io/#install-packages):

```bash
bower install mdast-heading
```

[Duo](http://duojs.org/#getting-started):

```javascript
var heading = require('wooorm/mdast-heading');
```

UMD (globals/AMD/CommonJS) ([uncompressed](mdast-heading.js) and [compressed](mdast-heading.min.js)):

```html
<script src="path/to/mdast.js"></script>
<script src="path/to/mdast-heading.js"></script>
<script>
  mdast.use(mdastHeading);
</script>
```

## Table of Contents

*   [Usage](#usage)

*   [API](#api)

    *   [heading(test, onrun)](#headingtest-onrun)

        *   [function onrun(start, nodes, end?, scope)](#function-onrunstart-nodes-end-scope)

*   [License](#license)

## Usage

```javascript
var heading = require('mdast-heading');
var mdast = require('mdast');
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
var doc = mdast().use(heading('foo', onrun)).process(
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

[MIT](LICENSE) © [Titus Wormer](http://wooorm.com)
