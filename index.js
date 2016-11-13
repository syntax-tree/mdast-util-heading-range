'use strict';

/* Dependencies. */
var toString = require('mdast-util-to-string');

/* Expose. */
module.exports = headingRange;

/* Methods. */
var splice = [].splice;

/* Search `node` for `heading` and invoke `callback`. */
function headingRange(node, heading, callback) {
  var test = heading;

  if (typeof test === 'string') {
    test = toExpression(test);
  }

  if ('test' in test) {
    test = wrapExpression(test);
  }

  search(node, test, callback);
}

/* Search a node for heading range. */
function search(root, test, callback) {
  var index = -1;
  var children = root.children;
  var length = children.length;
  var depth = null;
  var start = null;
  var end = null;
  var nodes;
  var clean;
  var child;

  while (++index < length) {
    child = children[index];

    if (isClosingHeading(child, depth)) {
      end = index;
      break;
    }

    if (isOpeningHeading(child, depth, test)) {
      start = index;
      depth = child.depth;
    }
  }

  if (start !== null) {
    if (end === null) {
      end = length + 1;
    }

    nodes = callback(
      children[start],
      children.slice(start + 1, end),
      children[end],
      {
        parent: root,
        start: start,
        end: end in children ? end : null
      }
    );

    clean = [];
    index = -1;
    length = nodes && nodes.length;

    /* Ensure no empty nodes are inserted. This could
     * be the case if `end` is in `nodes` but no `end`
     * node exists. */
    while (++index < length) {
      if (nodes[index]) {
        clean.push(nodes[index]);
      }
    }

    if (nodes) {
      splice.apply(children, [start, end - start + 1].concat(clean));
    }
  }
}

/* Transform a string into an applicable expression. */
function toExpression(value) {
  return new RegExp('^(' + value + ')$', 'i');
}

/* Wrap an expression into an assertion function. */
function wrapExpression(expression) {
  return assertion;

  /* Assert `value` matches the bound `expression`. */
  function assertion(value) {
    return expression.test(value);
  }
}

/* Check if `node` is a heading. */
function isHeading(node) {
  return node && node.type === 'heading';
}

/* Check if `node` is the main heading. */
function isOpeningHeading(node, depth, test) {
  return depth === null && isHeading(node) && test(toString(node), node);
}

/* Check if `node` is the next heading. */
function isClosingHeading(node, depth) {
  return depth && isHeading(node) && node.depth <= depth;
}
