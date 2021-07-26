/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 * @typedef {import('mdast').Heading} Heading
 *
 * @typedef {(value: string, node: Heading) => boolean} TestFunction
 * @typedef {string|RegExp|TestFunction} Test
 *
 * @typedef Options
 * @property {Test} test
 * @property {boolean} [ignoreFinalDefinitions=false]
 *
 * @typedef ZoneInfo
 * @property {number} start
 * @property {number} end
 * @property {Parent|null} parent
 *
 * @callback Handler
 * @param {Heading|undefined} start
 * @param {Array.<Node>} between
 * @param {Node|undefined} end
 * @param {ZoneInfo} info
 */

import {toString} from 'mdast-util-to-string'

/**
 * Search `node` with `options` and invoke `callback`.
 *
 * @param {Node} node
 * @param {Test|Options} options
 * @param {Handler} handler
 */
// eslint-disable-next-line complexity
export function headingRange(node, options, handler) {
  var test = options
  /** @type {Array.<Node>} */
  // @ts-ignore looks like children.
  var children = node.children || []
  var index = -1
  /** @type {boolean} */
  var ignoreFinalDefinitions
  /** @type {number} */
  var depth
  /** @type {number} */
  var start
  /** @type {number} */
  var end
  /** @type {Array.<Node>} */
  var nodes
  /** @type {Array.<Node>} */
  var result
  /** @type {Node} */
  var child

  // Object, not regex.
  if (test && typeof test === 'object' && !('exec' in test)) {
    ignoreFinalDefinitions = test.ignoreFinalDefinitions
    test = test.test
  }

  // Transform a string into an applicable expression.
  if (typeof test === 'string') {
    test = new RegExp('^(' + test + ')$', 'i')
  }

  // Regex.
  if (test && 'exec' in test) {
    test = wrapExpression(test)
  }

  if (typeof test !== 'function') {
    throw new TypeError(
      'Expected `string`, `regexp`, or `function` for `test`, not `' +
        test +
        '`'
    )
  }

  // Find the range.
  while (++index < children.length) {
    child = children[index]

    if (child.type === 'heading') {
      // @ts-expect-error: looks like a heading.
      if (depth && child.depth <= depth) {
        end = index
        break
      }

      // @ts-ignore looks like a heading.
      if (!depth && test(toString(child), child)) {
        // @ts-ignore looks like a heading.
        depth = child.depth
        start = index
        // Assume no end heading is found.
        end = children.length
      }
    }
  }

  // When we have a starting heading.
  if (depth) {
    if (ignoreFinalDefinitions) {
      while (
        children[end - 1].type === 'definition' ||
        children[end - 1].type === 'footnoteDefinition'
      ) {
        end--
      }
    }

    nodes = handler(
      // @ts-ignore `start` points to a heading.
      children[start],
      children.slice(start + 1, end),
      children[end],
      {
        parent: node,
        start,
        end: children[end] ? end : null
      }
    )

    if (nodes) {
      // Ensure no empty nodes are inserted.
      // This could be the case if `end` is in `nodes` but no `end` node exists.
      result = []
      index = -1

      while (++index < nodes.length) {
        if (nodes[index]) result.push(nodes[index])
      }

      children.splice(start, end - start + 1, ...result)
    }
  }
}

/**
 * Wrap an expression into an assertion function.
 * @param {RegExp} expression
 * @returns {(value: string) => boolean}
 */
function wrapExpression(expression) {
  return assertion

  /**
   * Assert `value` matches the bound `expression`.
   * @param {string} value
   * @returns {boolean}
   */
  function assertion(value) {
    return expression.test(value)
  }
}
