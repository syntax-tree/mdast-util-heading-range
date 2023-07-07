/**
 * @typedef {import('mdast').Heading} Heading
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast').RootContent} RootContent
 * @typedef {import('unist').Node} UnistNode
 * @typedef {import('unist').Parent} UnistParent
 */

/**
 * @typedef {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10} Uint
 *   Number; capped reasonably.
 */

/**
 * @typedef {I extends 0 ? 1 : I extends 1 ? 2 : I extends 2 ? 3 : I extends 3 ? 4 : I extends 4 ? 5 : I extends 5 ? 6 : I extends 6 ? 7 : I extends 7 ? 8 : I extends 8 ? 9 : 10} Increment
 *   Increment a number in the type system.
 * @template {Uint} [I=0]
 *   Index.
 */

/**
 * @typedef {(
 *   Tree extends UnistParent
 *     ? Depth extends Max
 *       ? Tree
 *       : Tree | InclusiveDescendant<Tree['children'][number], Max, Increment<Depth>>
 *     : Tree
 * )} InclusiveDescendant
 *   Collect all (inclusive) descendants of `Tree`.
 *
 *   > 👉 **Note**: for performance reasons, this seems to be the fastest way to
 *   > recurse without actually running into an infinite loop, which the
 *   > previous version did.
 *   >
 *   > Practically, a max of `2` is typically enough assuming a `Root` is
 *   > passed, but it doesn’t improve performance.
 *   > It gets higher with `List > ListItem > Table > TableRow > TableCell`.
 *   > Using up to `10` doesn’t hurt or help either.
 * @template {UnistNode} Tree
 *   Tree type.
 * @template {Uint} [Max=10]
 *   Max; searches up to this depth.
 * @template {Uint} [Depth=0]
 *   Current depth.
 */

/**
 * @typedef {(
 *   Node extends {children: Array<infer Child>}
 *   ? Child
 *   : never
 * )} InternalChild
 *   Collect nodes that can be parents of `Child`.
 * @template {UnistNode} Node
 *   All node types in a tree.
 * @template {UnistNode} Parent
 *   Node to search for.
 */

/**
 * @typedef {(
 *   Node extends UnistParent
 *   ? Node extends {children: Array<infer Children>}
 *     ? Kind extends Children ? Node : never
 *     : never
 *   : never
 * )} InternalParent
 *   Collect nodes that can be parents of `Child`.
 * @template {UnistNode} Node
 *   All node types in a tree.
 * @template {UnistNode} Kind
 *   Node to search for.
 */

/**
 * @typedef {InternalChild<InclusiveDescendant<Tree>, Kind>} Child
 *   Collect nodes in `Tree` that can be parents of `Child`.
 * @template {UnistNode} Tree
 *   All node types in a tree.
 * @template {UnistNode} Kind
 *   Node to search for.
 */

/**
 * @typedef {InternalParent<InclusiveDescendant<Tree>, Kind>} Parent
 *   Collect nodes in `Tree` that can be parents of `Child`.
 * @template {UnistNode} Tree
 *   All node types in a tree.
 * @template {UnistNode} Kind
 *   Node to search for.
 */

/**
 * @callback Handler
 *   Callback called when a section is found.
 * @param {Heading} start
 *   Start of section (a heading node matching `test`).
 * @param {Array<RootContent>} between
 *   Nodes between `start` and `end`.
 * @param {RootContent | undefined} end
 *   End of section, if any.
 * @param {Info} scope
 *   Extra info.
 * @returns {Array<RootContent | null | undefined> | null | undefined | void}
 *   Results.
 *
 *   If nothing is returned, nothing will be changed.
 *   If an array of nodes (can include `null` and `undefined`) is returned, the
 *   original section will be replaced by those nodes.
 *
 * @typedef Info
 *   Extra info.
 * @property {Parent<Root, Heading>} parent
 *   Parent of the section.
 * @property {number} start
 *   Index of `start` in `parent`.
 * @property {number | undefined} end
 *   Index of `end` in `parent`.
 *
 * @typedef Options
 *   Configuration.
 * @property {Test} test
 *   Test for a heading.
 * @property {boolean | null | undefined} [ignoreFinalDefinitions=false]
 *   Ignore final definitions otherwise in the section (default: `false`).
 *
 * @typedef {RegExp | TestFunction | string} Test
 *   Test for a heading.
 *
 *   When `string`, wrapped in `new RegExp('^(' + value + ')$', 'i')`;
 *   when `RegExp`, wrapped in `(value) => expression.test(value)`
 *
 * @callback TestFunction
 *   Check if a node matches.
 * @param {string} value
 *   Plain-text heading.
 * @param {Heading} node
 *   Heading node.
 * @returns {boolean | null | undefined | void}
 *   Whether this is the heading that is searched for.
 */

import {ok as assert} from 'devlop'
import {toString} from 'mdast-util-to-string'

/**
 * Search `tree` for a heading matching `test` and change its “section” with
 * `handler`.
 *
 * A “section” ranges from the matched heading until the next heading of the
 * same or lower depth, or the end of the document.
 *
 * If `ignoreFinalDefinitions: true`, final definitions “in” the section are
 * excluded.
 *
 * @param {Parent<Root, Heading>} tree
 *   Tree to change.
 * @param {Options | Test} options
 *   Configuration.
 * @param {Handler} handler
 *   Handle a section.
 * @returns {undefined}
 *   Nothing.
 */
// eslint-disable-next-line complexity
export function headingRange(tree, options, handler) {
  let test = options
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

    const head = children[start]
    assert(head.type === 'heading')

    const parent = tree
    assert('children' in parent, 'parent is a parent')

    const from = children.slice(start + 1, end)

    const nodes = handler(head, from, children[end], {
      parent,
      start,
      end: children[end] ? end : undefined
    })

    if (nodes) {
      // Ensure no empty nodes are inserted.
      // This could be the case if `end` is in `nodes` but no `end` node exists.
      /** @type {Array<RootContent>} */
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
