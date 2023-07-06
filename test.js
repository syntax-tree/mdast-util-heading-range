/**
 * @typedef {import('mdast').InlineCode} InlineCode
 * @typedef {import('mdast').Root} Root
 * @typedef {import('./index.js').Test} Test
 * @typedef {import('./index.js').Options} Options
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {toMarkdown} from 'mdast-util-to-markdown'
import {headingRange} from './index.js'

test('headingRange', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('./index.js')).sort(), [
      'headingRange'
    ])
  })

  await t.test('should be a function', async function () {
    assert.equal(typeof headingRange, 'function')
  })

  await t.test('should throw when `null` is passed in', async function () {
    /** @type {Root} */
    const tree = {type: 'root', children: []}

    assert.throws(function () {
      headingRange(
        tree,
        // @ts-expect-error: check that a runtime error is passed.
        null,
        function () {}
      )
    }, /^TypeError: Expected `string`, `regexp`, or `function` for `test`, not `null`$/)
  })

  await t.test(
    'should not throw when a non-parent is passed',
    async function () {
      /** @type {InlineCode} */
      const tree = {type: 'inlineCode', value: 'asd'}

      assert.doesNotThrow(function () {
        headingRange(
          // @ts-expect-error: types know that `InlineCode` can’t have `Heading` as a child.
          tree,
          'x',
          function () {}
        )
      })
    }
  )

  await t.test('should accept a heading as string', async function () {
    assert.equal(
      checkAndRemove(
        ['# Fo', '', '## Fooooo', '', 'Bar', '', '# Fo', ''].join('\n'),
        'foo+'
      ),
      ['# Fo', '', '## Fooooo', '', '# Fo', ''].join('\n')
    )
  })

  await t.test('should accept a heading as a regex', async function () {
    assert.equal(
      checkAndRemove(
        ['# Fo', '', '## Fooooo', '', 'Bar', '', '# Fo', ''].join('\n'),
        /foo+/i
      ),
      ['# Fo', '', '## Fooooo', '', '# Fo', ''].join('\n')
    )
  })

  await t.test('should accept a heading as a function', async function () {
    assert.equal(
      checkAndRemove(
        ['# Fo', '', '## Fooooo', '', 'Bar', '', '# Fo', ''].join('\n'),
        function (value) {
          return value.toLowerCase().indexOf('foo') === 0
        }
      ),
      ['# Fo', '', '## Fooooo', '', '# Fo', ''].join('\n')
    )
  })

  await t.test('should accept a missing closing heading', async function () {
    assert.equal(
      checkAndRemove(
        ['# Fo', '', '## Fooooo', '', 'Bar', ''].join('\n'),
        'foo+'
      ),
      ['# Fo', '', '## Fooooo', ''].join('\n')
    )
  })

  await t.test('should accept images', async function () {
    assert.equal(
      checkAndRemove(
        ['# Fo', '', '## ![Foo](bar.png)', '', 'Bar', '', '# Fo', ''].join(
          '\n'
        ),
        'foo+'
      ),
      ['# Fo', '', '## ![Foo](bar.png)', '', '# Fo', ''].join('\n')
    )
  })

  await t.test('should accept links', async function () {
    assert.equal(
      checkAndRemove(
        ['# Fo', '', '## [Foo](bar.com)', '', 'Bar', '', '# Fo', ''].join('\n'),
        'foo+'
      ),
      ['# Fo', '', '## [Foo](bar.com)', '', '# Fo', ''].join('\n')
    )
  })

  await t.test('should accept an image in a link', async function () {
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
      ['# Fo', '', '## [![Foo](bar.png)](bar.com)', '', '# Fo', ''].join('\n')
    )
  })

  await t.test('should not fail without heading', async function () {
    assert.equal(
      checkAndRemove(['# Fo', '', '## Bar', '', 'Baz', ''].join('\n'), 'foo+'),
      ['# Fo', '', '## Bar', '', 'Baz', ''].join('\n')
    )
  })

  await t.test('should not fail with empty headings', async function () {
    assert.equal(
      checkAndRemove(
        ['# ', '', '## Foo', '', 'Bar', '', '## Baz', ''].join('\n'),
        'fo+'
      ),
      ['#', '', '## Foo', '', '## Baz', ''].join('\n')
    )
  })

  await t.test(
    'should not remove anything when `null` is given',
    async function () {
      const tree = fromMarkdown(['Foo', '', '## Foo', '', 'Bar', ''].join('\n'))

      headingRange(tree, 'foo', function () {
        return null
      })

      assert.equal(
        toMarkdown(tree),
        ['Foo', '', '## Foo', '', 'Bar', ''].join('\n')
      )
    }
  )

  await t.test(
    'should replace all previous nodes otherwise',
    async function () {
      const tree = fromMarkdown(['Foo', '', '## Foo', '', 'Bar', ''].join('\n'))

      headingRange(tree, 'foo', function () {
        return []
      })

      assert.equal(toMarkdown(tree), ['Foo', ''].join('\n'))
    }
  )

  await t.test('should insert all returned nodes', async function () {
    const tree = fromMarkdown(
      ['Foo', '', '## Foo', '', 'Bar', '', '## Baz', ''].join('\n')
    )

    headingRange(tree, 'foo', function (start, _, end) {
      return [start, {type: 'thematicBreak'}, end]
    })

    assert.equal(
      toMarkdown(tree),
      ['Foo', '', '## Foo', '', '***', '', '## Baz', ''].join('\n')
    )
  })

  await t.test('should not insert an empty `end`', async function () {
    const tree = fromMarkdown(
      ['# Alpha', '', '## Foo', '', 'one', '', 'two', '', 'three', ''].join(
        '\n'
      )
    )

    headingRange(tree, 'foo', function (start, nodes, end) {
      assert.equal(nodes.length, 3)
      return [start, ...nodes, end]
    })

    assert.equal(
      toMarkdown(tree),
      ['# Alpha', '', '## Foo', '', 'one', '', 'two', '', 'three', ''].join(
        '\n'
      )
    )
  })

  await t.test(
    'ignoreFinalDefinitions: should exclude definitions with an end heading',
    async function () {
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
        ].join('\n')
      )
    }
  )

  await t.test(
    'ignoreFinalDefinitions: should exclude only definitions',
    async function () {
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
        ].join('\n')
      )
    }
  )

  await t.test(
    'ignoreFinalDefinitions: should exclude definitions in the final section',
    async function () {
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
        ].join('\n')
      )
    }
  )
})

/**
 * Process a fixture, removing the section.
 *
 * @param {string} value
 *   Input markdown.
 * @param {Options | Test} options
 *   Configuration.
 * @returns {string}
 *   Output markdown.
 */
function checkAndRemove(value, options) {
  const tree = fromMarkdown(value)

  headingRange(tree, options, function (start, _, end, scope) {
    assert.equal(typeof scope.start, 'number')
    assert.ok(typeof scope.end === 'number' || scope.end === undefined)
    assert.equal(scope.parent && scope.parent.type, 'root')
    return [start, end]
  })

  return toMarkdown(tree)
}
