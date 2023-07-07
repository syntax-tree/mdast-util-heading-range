# mdast-util-heading-range

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[mdast][] utility to find headings and replace the content in their section.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`headingRange(tree, test|options, handler)`](#headingrangetree-testoptions-handler)
    *   [`Handler`](#handler)
    *   [`Info`](#info)
    *   [`Options`](#options)
    *   [`Test`](#test)
    *   [`TestFunction`](#testfunction)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Security](#security)
*   [Related](#related)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This package is a utility that lets you find a certain heading, then takes the
content in their section (from it to the next heading of the same or lower
depth), and calls a given handler with the result, so that you can change or
replace things.

## When should I use this?

This utility is typically useful when you have certain sections that can be
generated.
For example, this utility is used by [`remark-toc`][remark-toc] to update the
above `Contents` heading.

A similar package, [`mdast-zone`][mdast-zone], does the same but uses comments
to mark the start and end of sections.

## Install

This package is [ESM only][esm].
In Node.js (version 16+), install with [npm][]:

```sh
npm install mdast-util-heading-range
```

In Deno with [`esm.sh`][esmsh]:

```js
import {headingRange} from 'https://esm.sh/mdast-util-heading-range@4'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {headingRange} from 'https://esm.sh/mdast-util-heading-range@4?bundle'
</script>
```

## Use

Say we have the following file, `example.md`:

```markdown
# Foo

Bar.

# Baz
```

…and a module `example.js`:

```js
import {read} from 'to-vfile'
import {remark} from 'remark'
import {headingRange} from 'mdast-util-heading-range'

const file = await remark()
  .use(myPluginThatReplacesFoo)
  .process(await read('example.md'))

console.log(String(file))

/** @type {import('unified').Plugin<[], import('mdast').Root>} */
function myPluginThatReplacesFoo() {
  return function (tree) {
    headingRange(tree, 'foo', function (start, nodes, end) {
      return [
        start,
        {type: 'paragraph', children: [{type: 'text', value: 'Qux.'}]},
        end
      ]
    })
  }
}
```

…now running `node example.js` yields:

```markdown
# Foo

Qux.

# Baz
```

## API

This package exports the identifier [`headingRange`][api-heading-range].
There is no default export.

### `headingRange(tree, test|options, handler)`

Search `tree` for a heading matching `test` and change its “section” with
`handler`.

A “section” ranges from the matched heading until the next heading of the
same or lower depth, or the end of the document.

If `ignoreFinalDefinitions: true`, final definitions “in” the section are
excluded.

###### Parameters

*   `tree` ([`Node`][node])
    — tree to change
*   `test` ([`Test`][api-test])
    — same as passing `{test: Test}`
*   `options` ([`Options`][api-options])
    — configuration
*   `handler` ([`Handler`][api-handler])
    — handle a section

###### Returns

Nothing (`undefined`).

### `Handler`

Callback called when a section is found (TypeScript type).

###### Parameters

*   `start` ([`Heading`][heading])
    — start of section (a heading node matching `test`)
*   `nodes` ([`Array<Node>`][node])
    — nodes between `start` and `end`
*   `end` ([`Node`][node] or `undefined`)
    — end of section, if any
*   `info` ([`Info`][api-info])
    — extra info

###### Returns

Results (`Array<Node | null | undefined>`, optional).

If nothing is returned, nothing will be changed.
If an array of nodes (can include `null` and `undefined`) is returned, the
original section will be replaced by those nodes.

### `Info`

Extra info (TypeScript type).

###### Fields

*   `parent` ([`Node`][node])
    — parent of the section
*   `start` (`number`)
    — index of `start` in `parent`
*   `end` (`number` or `undefined`)
    — index of `end` in `parent`

### `Options`

Configuration (TypeScript type).

###### Fields

*   `test` ([`Test`][api-test])
    — test for a heading
*   `ignoreFinalDefinitions` (`boolean`, default: `false`)
    — ignore final definitions otherwise in the section

### `Test`

Test for a heading (TypeScript type).

When `string`, wrapped in `new RegExp('^(' + value + ')$', 'i')`;
when `RegExp`, wrapped in `(value) => expression.test(value)`

###### Type

```ts
export type Test = RegExp | TestFunction | string
```

### `TestFunction`

Check if a node matches (TypeScript type).

###### Parameters

*   `value` (`string`)
    — plain-text heading
*   `node` ([`Heading`][heading])
    — heading node

###### Returns

Whether this is the heading that is searched for (`boolean`, optional).

## Types

This package is fully typed with [TypeScript][].
This package exports the types [`Handler`][api-handler],
[`Info`][api-info], [`Options`][api-options], [`Test`][api-test],
and [`TestFunction`][api-test-function].

## Compatibility

Projects maintained by the unified collective are compatible with maintained
versions of Node.js.

When we cut a new major release, we drop support for unmaintained versions of
Node.
This means we try to keep the current release line,
`mdast-util-heading-range@^4`, compatible with Node.js 16.

## Security

Improper use of `handler` can open you up to a [cross-site scripting (XSS)][xss]
attack as the value it returns is injected into the syntax tree.
This can become a problem if the tree is later transformed to [**hast**][hast].
The following example shows how a script is injected that could run when loaded
in a browser.

```js
/** @type {import('mdast-util-heading-range').Handler} */
function handler(start, nodes, end) {
  return [start, {type: 'html', value: '<script>alert(1)</script>'}, end]
}
```

Yields:

```markdown
# Foo

<script>alert(1)</script>

# Baz
```

Either do not use user input in `handler` or use
[`hast-util-santize`][hast-util-sanitize].

## Related

*   [`mdast-zone`](https://github.com/syntax-tree/mdast-zone)
    — similar but uses comments to mark the start and end of sections

## Contribute

See [`contributing.md`][contributing] in [`syntax-tree/.github`][health] for
ways to get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organisation, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/syntax-tree/mdast-util-heading-range/workflows/main/badge.svg

[build]: https://github.com/syntax-tree/mdast-util-heading-range/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/syntax-tree/mdast-util-heading-range.svg

[coverage]: https://codecov.io/github/syntax-tree/mdast-util-heading-range

[downloads-badge]: https://img.shields.io/npm/dm/mdast-util-heading-range.svg

[downloads]: https://www.npmjs.com/package/mdast-util-heading-range

[size-badge]: https://img.shields.io/badge/dynamic/json?label=minzipped%20size&query=$.size.compressedSize&url=https://deno.bundlejs.com/?q=mdast-util-heading-range

[size]: https://bundlejs.com/?q=mdast-util-heading-range

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/syntax-tree/unist/discussions

[npm]: https://docs.npmjs.com/cli/install

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[esmsh]: https://esm.sh

[typescript]: https://www.typescriptlang.org

[license]: license

[author]: https://wooorm.com

[health]: https://github.com/syntax-tree/.github

[contributing]: https://github.com/syntax-tree/.github/blob/main/contributing.md

[support]: https://github.com/syntax-tree/.github/blob/main/support.md

[coc]: https://github.com/syntax-tree/.github/blob/main/code-of-conduct.md

[mdast]: https://github.com/syntax-tree/mdast

[node]: https://github.com/syntax-tree/unist#node

[heading]: https://github.com/syntax-tree/mdast#heading

[xss]: https://en.wikipedia.org/wiki/Cross-site_scripting

[hast]: https://github.com/syntax-tree/hast

[mdast-zone]: https://github.com/syntax-tree/mdast-zone

[hast-util-sanitize]: https://github.com/syntax-tree/hast-util-sanitize

[remark-toc]: https://github.com/remarkjs/remark-toc

[api-heading-range]: #headingrangetree-testoptions-handler

[api-handler]: #handler

[api-options]: #options

[api-test]: #test

[api-test-function]: #testfunction

[api-info]: #info
