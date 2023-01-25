/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('./index.js').Test} Test
 * @typedef {import('./index.js').Options} Options
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {toMarkdown} from 'mdast-util-to-markdown'
import {headingRange} from './index.js'

test('mdast-util-heading-range()', () => {
  assert.equal(typeof headingRange, 'function', 'should be a function')

  assert.throws(
    () => {
      headingRange(
        /** @type {Root} */ ({type: 'root', children: []}),
        // @ts-expect-error: runtime.
        null,
        () => {}
      )
    },
    /^TypeError: Expected `string`, `regexp`, or `function` for `test`, not `null`$/,
    'should throw when `null` is passed in'
  )

  assert.throws(
    () => {
      headingRange(
        /** @type {Root} */ ({type: 'root', children: []}),
        // @ts-expect-error: runtime.
        undefined,
        () => {}
      )
    },
    /^TypeError: Expected `string`, `regexp`, or `function` for `test`, not `undefined`$/,
    'should throw when `undefined` is passed in'
  )

  assert.doesNotThrow(() => {
    headingRange(/** @type {Root} */ ({type: 'root'}), 'x', () => {})
  }, 'should not throw when a non-parent is passed')

  assert.equal(
    checkAndRemove(
      ['# Fo', '', '## Fooooo', '', 'Bar', '', '# Fo', ''].join('\n'),
      'foo+'
    ),
    ['# Fo', '', '## Fooooo', '', '# Fo', ''].join('\n'),
    'should accept a heading as string'
  )

  assert.equal(
    checkAndRemove(
      ['# Fo', '', '## Fooooo', '', 'Bar', '', '# Fo', ''].join('\n'),
      /foo+/i
    ),
    ['# Fo', '', '## Fooooo', '', '# Fo', ''].join('\n'),
    'should accept a heading as a regex'
  )

  assert.equal(
    checkAndRemove(
      ['# Fo', '', '## Fooooo', '', 'Bar', '', '# Fo', ''].join('\n'),
      (value) => value.toLowerCase().indexOf('foo') === 0
    ),
    ['# Fo', '', '## Fooooo', '', '# Fo', ''].join('\n'),
    'should accept a heading as a function'
  )

  assert.equal(
    checkAndRemove(['# Fo', '', '## Fooooo', '', 'Bar', ''].join('\n'), 'foo+'),
    ['# Fo', '', '## Fooooo', ''].join('\n'),
    'should accept a missing closing heading'
  )

  assert.equal(
    checkAndRemove(
      ['# Fo', '', '## ![Foo](bar.png)', '', 'Bar', '', '# Fo', ''].join('\n'),
      'foo+'
    ),
    ['# Fo', '', '## ![Foo](bar.png)', '', '# Fo', ''].join('\n'),
    'should accept images'
  )

  assert.equal(
    checkAndRemove(
      ['# Fo', '', '## [Foo](bar.com)', '', 'Bar', '', '# Fo', ''].join('\n'),
      'foo+'
    ),
    ['# Fo', '', '## [Foo](bar.com)', '', '# Fo', ''].join('\n'),
    'should accept links'
  )

  assert.equal(
    checkAndRemove(
      [
        '# Fo',
        '',
        '## [![Foo](bar.png)](bar.com)',
        '',
        'Bar',
        '',
        '# Fo',
        ''
      ].join('\n'),
      'foo+'
    ),
    ['# Fo', '', '## [![Foo](bar.png)](bar.com)', '', '# Fo', ''].join('\n'),
    'should accept an image in a link'
  )

  assert.equal(
    checkAndRemove(['# Fo', '', '## Bar', '', 'Baz', ''].join('\n'), 'foo+'),
    ['# Fo', '', '## Bar', '', 'Baz', ''].join('\n'),
    'should not fail without heading'
  )

  assert.equal(
    checkAndRemove(
      ['# ', '', '## Foo', '', 'Bar', '', '## Baz', ''].join('\n'),
      'fo+'
    ),
    ['#', '', '## Foo', '', '## Baz', ''].join('\n'),
    'should not fail with empty headings'
  )

  const treeNull = fromMarkdown(['Foo', '', '## Foo', '', 'Bar', ''].join('\n'))
  headingRange(treeNull, 'foo', () => null)
  assert.equal(
    toMarkdown(treeNull),
    ['Foo', '', '## Foo', '', 'Bar', ''].join('\n'),
    'should not remove anything when `null` is given'
  )

  const treeEmpty = fromMarkdown(
    ['Foo', '', '## Foo', '', 'Bar', ''].join('\n')
  )
  headingRange(treeEmpty, 'foo', () => [])
  assert.equal(
    toMarkdown(treeEmpty),
    ['Foo', ''].join('\n'),
    'should replace all previous nodes otherwise'
  )

  const treeFilled = fromMarkdown(
    ['Foo', '', '## Foo', '', 'Bar', '', '## Baz', ''].join('\n')
  )
  headingRange(treeFilled, 'foo', (start, _, end) => [
    start,
    {type: 'thematicBreak'},
    end
  ])
  assert.equal(
    toMarkdown(treeFilled),
    ['Foo', '', '## Foo', '', '***', '', '## Baz', ''].join('\n'),
    'should insert all returned nodes'
  )

  const treeEmptyEnd = fromMarkdown(
    ['# Alpha', '', '## Foo', '', 'one', '', 'two', '', 'three', ''].join('\n')
  )
  headingRange(treeEmptyEnd, 'foo', (start, nodes, end) => {
    assert.equal(nodes.length, 3)
    return [start, ...nodes, end]
  })
  assert.equal(
    toMarkdown(treeEmptyEnd),
    ['# Alpha', '', '## Foo', '', 'one', '', 'two', '', 'three', ''].join('\n'),
    'should not insert an empty `end`'
  )

  assert.equal(
    checkAndRemove(
      [
        '# Fo',
        '',
        '## Foo',
        '',
        'Bar',
        '',
        '[one]: example.com',
        '',
        '[two]: example.com',
        '',
        '# Fo',
        ''
      ].join('\n'),
      {test: 'foo', ignoreFinalDefinitions: true}
    ),
    [
      '# Fo',
      '',
      '## Foo',
      '',
      '[one]: example.com',
      '',
      '[two]: example.com',
      '',
      '# Fo',
      ''
    ].join('\n'),
    'ignoreFinalDefinitions: should exclude definitions with an end heading'
  )

  assert.equal(
    checkAndRemove(
      [
        '# Fo',
        '',
        '## Foo',
        '',
        '[one]: example.com',
        '',
        '[two]: example.com',
        '',
        '# Fo',
        ''
      ].join('\n'),
      {test: 'foo', ignoreFinalDefinitions: true}
    ),
    [
      '# Fo',
      '',
      '## Foo',
      '',
      '[one]: example.com',
      '',
      '[two]: example.com',
      '',
      '# Fo',
      ''
    ].join('\n'),
    'ignoreFinalDefinitions: should exclude only definitions'
  )

  assert.equal(
    checkAndRemove(
      [
        '# Fo',
        '',
        '## Foo',
        '',
        'Bar',
        '',
        '[one]: example.com',
        '',
        '[two]: example.com',
        ''
      ].join('\n'),
      {test: 'foo', ignoreFinalDefinitions: true}
    ),
    [
      '# Fo',
      '',
      '## Foo',
      '',
      '[one]: example.com',
      '',
      '[two]: example.com',
      ''
    ].join('\n'),
    'ignoreFinalDefinitions: should exclude definitions in the final section'
  )
})

/**
 * Process a fixture, removing the section.
 *
 * @param {string} value
 *   Input markdown.
 * @param {Test | Options} options
 *   Configuration.
 * @returns {string}
 *   Output markdown.
 */
function checkAndRemove(value, options) {
  const tree = fromMarkdown(value)

  headingRange(tree, options, (start, _, end, scope) => {
    assert.equal(typeof scope.start, 'number')
    assert.ok(typeof scope.end === 'number' || scope.end === null)
    assert.equal(scope.parent && scope.parent.type, 'root')
    return [start, end]
  })

  return toMarkdown(tree)
}
