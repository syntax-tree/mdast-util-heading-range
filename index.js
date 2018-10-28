'use strict'

var toString = require('mdast-util-to-string')

module.exports = headingRange

var splice = [].splice

// Search `node` with `options` and invoke `callback`.
function headingRange(node, options, callback) {
  var test = options
  var ignoreFinalDefinitions = false

  // Object, not regex.
  if (test && typeof test === 'object' && !('exec' in test)) {
    ignoreFinalDefinitions = test.ignoreFinalDefinitions === true
    test = test.test
  }

  if (typeof test === 'string') {
    test = toExpression(test)
  }

  // Regex
  if (test && 'exec' in test) {
    test = wrapExpression(test)
  }

  if (typeof test !== 'function') {
    throw new Error(
      'Expected `string`, `regexp`, or `function` for `test`, not `' +
        test +
        '`'
    )
  }

  search(node, test, ignoreFinalDefinitions, callback)
}

// Search a node for heading range.
function search(root, test, skip, callback) {
  var index = -1
  var children = root.children
  var length = children.length
  var depth = null
  var start = null
  var end = null
  var nodes
  var clean
  var child

  while (++index < length) {
    child = children[index]

    if (closing(child, depth)) {
      end = index
      break
    }

    if (opening(child, depth, test)) {
      start = index
      depth = child.depth
    }
  }

  if (start !== null) {
    if (end === null) {
      end = length
    }

    if (skip) {
      while (end > start) {
        child = children[end - 1]

        if (!definition(child)) {
          break
        }

        end--
      }
    }

    nodes = callback(
      children[start],
      children.slice(start + 1, end),
      children[end],
      {
        parent: root,
        start: start,
        end: children[end] ? end : null
      }
    )

    clean = []
    index = -1
    length = nodes && nodes.length

    // Ensure no empty nodes are inserted.  This could be the case if `end` is
    // in `nodes` but no `end` node exists.
    while (++index < length) {
      if (nodes[index]) {
        clean.push(nodes[index])
      }
    }

    if (nodes) {
      splice.apply(children, [start, end - start + 1].concat(clean))
    }
  }
}

// Transform a string into an applicable expression.
function toExpression(value) {
  return new RegExp('^(' + value + ')$', 'i')
}

// Wrap an expression into an assertion function.
function wrapExpression(expression) {
  return assertion

  // Assert `value` matches the bound `expression`.
  function assertion(value) {
    return expression.test(value)
  }
}

// Check if `node` is a heading.
function heading(node) {
  return node && node.type === 'heading'
}

// Check if `node` is the main heading.
function opening(node, depth, test) {
  return depth === null && heading(node) && test(toString(node), node)
}

// Check if `node` is the next heading.
function closing(node, depth) {
  return depth && heading(node) && node.depth <= depth
}

function definition(node) {
  return node.type === 'definition' || node.type === 'footnoteDefinition'
}
