'use strict'

var test = require('tape')
var remark = require('remark')
var heading = require('.')

test('mdast-util-heading-range()', function (t) {
  t.plan(57)

  t.equal(typeof heading, 'function', 'should be a function')

  t.throws(
    function () {
      heading({type: 'root', chilren: []}, null, function () {})
    },
    /^Error: Expected `string`, `regexp`, or `function` for `test`, not `null`$/,
    'should throw when `null` is passed in'
  )

  t.throws(
    function () {
      heading({type: 'root', chilren: []}, undefined, function () {})
    },
    /^Error: Expected `string`, `regexp`, or `function` for `test`, not `undefined`$/,
    'should throw when `undefined` is passed in'
  )

  t.equal(
    process(
      t,
      ['# Fo', '', '## Fooooo', '', 'Bar', '', '# Fo', ''].join('\n'),
      'foo+'
    ),
    ['# Fo', '', '## Fooooo', '', '# Fo', ''].join('\n'),
    'should accept a heading as string'
  )

  t.equal(
    process(
      t,
      ['# Fo', '', '## Fooooo', '', 'Bar', '', '# Fo', ''].join('\n'),
      /foo+/i
    ),
    ['# Fo', '', '## Fooooo', '', '# Fo', ''].join('\n'),
    'should accept a heading as a regex'
  )

  t.equal(
    process(
      t,
      ['# Fo', '', '## Fooooo', '', 'Bar', '', '# Fo', ''].join('\n'),
      function (value) {
        return value.toLowerCase().indexOf('foo') === 0
      }
    ),
    ['# Fo', '', '## Fooooo', '', '# Fo', ''].join('\n'),
    'should accept a heading as a function'
  )

  t.equal(
    process(t, ['# Fo', '', '## Fooooo', '', 'Bar', ''].join('\n'), 'foo+'),
    ['# Fo', '', '## Fooooo', ''].join('\n'),
    'should accept a missing closing heading'
  )

  t.equal(
    process(
      t,
      ['# Fo', '', '## ![Foo](bar.png)', '', 'Bar', '', '# Fo', ''].join('\n'),
      'foo+'
    ),
    ['# Fo', '', '## ![Foo](bar.png)', '', '# Fo', ''].join('\n'),
    'should accept images'
  )

  t.equal(
    process(
      t,
      ['# Fo', '', '## [Foo](bar.com)', '', 'Bar', '', '# Fo', ''].join('\n'),
      'foo+'
    ),
    ['# Fo', '', '## [Foo](bar.com)', '', '# Fo', ''].join('\n'),
    'should accept links'
  )

  t.equal(
    process(
      t,
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

  t.equal(
    process(t, ['# Fo', '', '## Bar', '', 'Baz', ''].join('\n'), 'foo+'),
    ['# Fo', '', '## Bar', '', 'Baz', ''].join('\n'),
    'should not fail without heading'
  )

  t.equal(
    process(
      t,
      ['# ', '', '## Foo', '', 'Bar', '', '## Baz', ''].join('\n'),
      'fo+'
    ),
    ['#', '', '## Foo', '', '## Baz', ''].join('\n'),
    'should not fail with empty headings'
  )

  remark()
    .use(function () {
      return function (node) {
        heading(node, 'foo', function () {
          return null
        })
      }
    })
    .process(
      ['Foo', '', '## Foo', '', 'Bar', ''].join('\n'),
      function (error, file) {
        t.ifError(error, 'should not fail (#1)')

        t.equal(
          String(file),
          ['Foo', '', '## Foo', '', 'Bar', ''].join('\n'),
          'should not remove anything when `null` is given'
        )
      }
    )

  remark()
    .use(function () {
      return function (node) {
        heading(node, 'foo', function () {
          return []
        })
      }
    })
    .process(
      ['Foo', '', '## Foo', '', 'Bar', ''].join('\n'),
      function (error, file) {
        t.ifError(error, 'should not fail (#2)')

        t.equal(
          String(file),
          ['Foo', ''].join('\n'),
          'should replace all previous nodes otherwise'
        )
      }
    )

  remark()
    .use(function () {
      return function (node) {
        heading(node, 'foo', function (start, nodes, end) {
          return [start, {type: 'thematicBreak'}, end]
        })
      }
    })
    .process(
      ['Foo', '', '## Foo', '', 'Bar', '', '## Baz', ''].join('\n'),
      function (error, file) {
        t.ifError(error, 'should not fail (#3)')

        t.equal(
          String(file),
          ['Foo', '', '## Foo', '', '***', '', '## Baz', ''].join('\n'),
          'should insert all returned nodes'
        )
      }
    )

  remark()
    .use(function () {
      return function (node) {
        heading(node, 'foo', function (start, nodes, end) {
          t.equal(nodes.length, 3)

          return [start].concat(nodes, end)
        })
      }
    })
    .process(
      ['# Alpha', '', '## Foo', '', 'one', '', 'two', '', 'three', ''].join(
        '\n'
      ),
      function (error, file) {
        t.ifError(error, 'should not fail (#4)')

        t.equal(
          String(file),
          ['# Alpha', '', '## Foo', '', 'one', '', 'two', '', 'three', ''].join(
            '\n'
          ),
          'should not insert an empty `end`'
        )
      }
    )

  t.equal(
    process(
      t,
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

  t.equal(
    process(
      t,
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

  t.equal(
    process(
      t,
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

function process(t, value, options) {
  return remark()
    .use(function () {
      return function (node) {
        heading(node, options, function (start, nodes, end, scope) {
          t.equal(typeof scope.start, 'number')
          t.assert(typeof scope.end === 'number' || scope.end === null)
          t.equal(scope.parent.type, 'root')
          return [start].concat([end])
        })
      }
    })
    .processSync(value)
    .toString()
}
