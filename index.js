import {toString} from 'mdast-util-to-string'

// Search `node` with `options` and invoke `callback`.
// eslint-disable-next-line complexity
export function headingRange(node, options, callback) {
  var test = options
  var children = node.children
  var index = -1
  var ignoreFinalDefinitions
  var depth
  var start
  var end
  var nodes
  var result
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
  if (depth) {
    if (ignoreFinalDefinitions) {
      while (
        children[end - 1].type === 'definition' ||
        children[end - 1].type === 'footnoteDefinition'
      ) {
        end--
      }
    }

    nodes = callback(
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

// Wrap an expression into an assertion function.
function wrapExpression(expression) {
  return assertion

  // Assert `value` matches the bound `expression`.
  function assertion(value) {
    return expression.test(value)
  }
}
