/**
 * @typedef {import('unist').Parent} UnistParent
 * @typedef {import('mdast').Content} Content
 * @typedef {import('mdast').Heading} Heading
 * @typedef {import('mdast').Root} Root
 */

/**
 * @typedef {Content | Root} Node
 * @typedef {Extract<Node, UnistParent>} Parent
 *
 * @callback TestFunction
 *   Function called with headings to check if it’s the one to look for.
 * @param {string} value
 *   Plain-text heading.
 * @param {Heading} node
 *   Heading node.
 * @returns {boolean}
 *   Whether this is the heading that is searched for.
 *
 * @typedef {string | RegExp | TestFunction} Test
 *   A test.
 *
 * @typedef Options
 *   Configuration (optional).
 * @property {Test} test
 *   Heading to look for.
 *
 *   When `string`, wrapped in `new RegExp('^(' + value + ')$', 'i')`;
 *   when `RegExp`, wrapped in `(value) => expression.test(value)`
 * @property {boolean | null | undefined} [ignoreFinalDefinitions=false]
 *   Ignore final definitions otherwise in the section.
 *
 * @typedef ZoneInfo
 *   Extra info.
 * @property {Parent | null} parent
 *   Parent of the range.
 * @property {number} start
 *   index of `start` in `parent`
 * @property {number | null} end
 *   index of `end` in `parent`
 *
 * @callback Handler
 *   Callback called when a range is found.
 * @param {Heading} start
 *   Start of range (a heading node matching `test`).
 * @param {Array<Node>} between
 *   Nodes between `start` and `end`.
 * @param {Node | undefined} end
 *   End of range, if any.
 * @param {ZoneInfo} scope
 *   Extra info.
 * @returns {Array<Node | null | undefined> | null | undefined | void}
 *   Results.
 *
 *   If nothing is returned, nothing will be changed.
 *   If an array of nodes (can include `null` and `undefined`) is returned, the
 *   original section will be replaced by those nodes.
 */

import {toString} from 'mdast-util-to-string'

/**
 * Search `tree` and transform a section without affecting other parts with
 * `handler`.
 *
 * A “section” is a heading that passes `test`, until the next heading of the
 * same or lower depth, or the end of the document.
 *
 * If `ignoreFinalDefinitions: true`, final definitions “in” the section are
 * excluded.
 *
 * @param {Node} tree
 *   Tree to change.
 * @param {Test | Options} options
 *   Configuration.
 * @param {Handler} handler
 *   Handle a range.
 * @returns {void}
 *   Nothing.
 */
// eslint-disable-next-line complexity
export function headingRange(tree, options, handler) {
  let test = options
  /** @type {Array<Node>} */
  const children = 'children' in tree ? tree.children : []
  let ignoreFinalDefinitions = false

  // Object, not regex.
  if (test && typeof test === 'object' && !('exec' in test)) {
    ignoreFinalDefinitions = test.ignoreFinalDefinitions === true
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
  /** @type {number | undefined} */
  let start
  /** @type {number | undefined} */
  let end
  /** @type {number|  undefined} */
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

    /** @type {Heading} */
    // @ts-expect-error `start` points to a heading.
    const head = children[start]
    /** @type {Parent} */
    // @ts-expect-error always a parent, or we don’t come here.
    const parent = tree

    const nodes = handler(head, children.slice(start + 1, end), children[end], {
      parent,
      start,
      end: children[end] ? end : null
    })

    if (nodes) {
      // Ensure no empty nodes are inserted.
      // This could be the case if `end` is in `nodes` but no `end` node exists.
      /** @type {Array<Node>} */
      const result = []
      let index = -1

      while (++index < nodes.length) {
        const node = nodes[index]
        if (node) result.push(node)
      }

      children.splice(start, end - start + 1, ...result)
    }
  }
}

/**
 * Wrap an expression into an assertion function.
 *
 * @param {RegExp} expression
 *   Test expression.
 * @returns {TestFunction}
 *   Test function.
 */
function wrapExpression(expression) {
  return assertion

  /** @type {TestFunction} */
  function assertion(value) {
    return expression.test(value)
  }
}
