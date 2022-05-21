/**
 * @typedef {import('unist').Parent} Parent
 * @typedef {import('mdast').Root|import('mdast').Content} Node
 * @typedef {import('mdast').Heading} Heading
 *
 * @typedef {(value: string, node: Heading) => boolean} TestFunction
 *   Function called for each heading with its content and `node` itself check
 *   if it’s the one to look for.
 *
 * @typedef {string|RegExp|TestFunction} Test
 *
 * @typedef Options
 *   Configuration (optional).
 * @property {Test} test
 *   Heading to look for.
 *   When `string`, wrapped in `new RegExp('^(' + value + ')$', 'i')`;
 *   when `RegExp`, wrapped in `function (value) {expression.test(value)}`
 * @property {boolean} [ignoreFinalDefinitions=false]
 *   Ignore final definitions otherwise in the section.
 *
 * @typedef ZoneInfo
 *   Extra info.
 * @property {Parent|null} parent
 *   Parent of the range.
 * @property {number} start
 *   index of `start` in `parent`
 * @property {number} end
 *   index of `end` in `parent`
 *
 * @callback Handler
 *   Callback called when a range is found.
 * @param {Heading|undefined} start
 *   Start of range.
 * @param {Array<Node>} between
 *   Nodes between `start` and `end`.
 * @param {Node|undefined} end
 *   End of range, if any.
 * @param {ZoneInfo} scope
 *   Extra info.
 */

import {toString} from 'mdast-util-to-string'

/**
 * Search `tree` and transform a section without affecting other parts with
 * `handler`.
 *
 * A “section” is a heading that passes `test`, until the next heading of the
 * same or lower depth, or the end of the document.
 * If `ignoreFinalDefinitions: true`, final definitions “in” the section are
 * excluded.
 *
 * @param {Node} tree
 * @param {Test|Options} options
 * @param {Handler} handler
 */
// eslint-disable-next-line complexity
export function headingRange(tree, options, handler) {
  let test = options
  /** @type {Array<Node>} */
  const children = 'children' in tree ? tree.children : []
  /** @type {boolean|undefined} */
  let ignoreFinalDefinitions

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

  let index = -1
  /** @type {number|undefined} */
  let start
  /** @type {number|undefined} */
  let end
  /** @type {number|undefined} */
  let depth

  // Find the range.
  while (++index < children.length) {
    const child = children[index]

    if (child.type === 'heading') {
      if (depth && child.depth <= depth) {
        end = index
        break
      }

      if (!depth && test(toString(child), child)) {
        depth = child.depth
        start = index
        // Assume no end heading is found.
        end = children.length
      }
    }
  }

  // When we have a starting heading.
  if (depth && end !== undefined && start !== undefined) {
    if (ignoreFinalDefinitions) {
      while (
        children[end - 1].type === 'definition' ||
        children[end - 1].type === 'footnoteDefinition'
      ) {
        end--
      }
    }

    /** @type {Array<Node>} */
    const nodes = handler(
      // @ts-expect-error `start` points to a heading.
      children[start],
      children.slice(start + 1, end),
      children[end],
      {parent: tree, start, end: children[end] ? end : null}
    )

    if (nodes) {
      // Ensure no empty nodes are inserted.
      // This could be the case if `end` is in `nodes` but no `end` node exists.
      /** @type {Array<Node>} */
      const result = []
      let index = -1

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
