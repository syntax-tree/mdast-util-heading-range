/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module mdast:util:heading-range
 * @fileoverview Markdown heading as ranges in mdast.
 */

'use strict';

/* eslint-env commonjs */

/*
 * Dependencies.
 */

var toString = require('mdast-util-to-string');

/*
 * Methods.
 */

var splice = [].splice;

/**
 * Transform a string into an applicable expression.
 *
 * @param {string} value - Value to transform.
 * @return {RegExp} - Expression.
 */
function toExpression(value) {
    return new RegExp('^(' + value + ')$', 'i');
}

/**
 * Wrap an expression into an assertion function.
 *
 * @param {RegExp} expression - Expression to test.
 * @return {Function} - Assertion.
 */
function wrapExpression(expression) {
    /**
     * Assert `value` matches the bound `expression`.
     *
     * @param {string} value - Value to check.
     * @return {boolean} - Whether `value` matches.
     */
    function assertion(value) {
        return expression.test(value);
    }

    return assertion;
}

/**
 * Check if `node` is a heading.
 *
 * @param {Node} node - Node to check.
 * @return {boolean} - Whether `node` is a heading.
 */
function isHeading(node) {
    return node && node.type === 'heading';
}

/**
 * Check if `node` is the main heading.
 *
 * @param {Node} node - Node to check.
 * @param {number?} depth - Depth to search for.
 * @param {function(string): boolean} test - Tester.
 * @return {boolean} - Whether `node` is an opening
 *   heading.
 */
function isOpeningHeading(node, depth, test) {
    return depth === null && isHeading(node) && test(toString(node), node);
}

/**
 * Check if `node` is the next heading.
 *
 * @param {Node} node - Node to check.
 * @param {number?} depth - Depth of the opening heading.
 * @return {boolean} - Whether `node` is a closing
 *   heading.
 */
function isClosingHeading(node, depth) {
    return depth && isHeading(node) && node.depth <= depth;
}

/**
 * Search a node for heading range.
 *
 * @param {Node} root - Node to search.
 * @param {Function} test - Assertion.
 * @param {Function} callback - Callback invoked when
 *   found.
 */
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
                'parent': root,
                'start': start,
                'end': end in children ? end : null
            }
        );

        clean = [];
        index = -1;
        length = nodes && nodes.length;

        /*
         * Ensure no empty nodes are inserted. This could
         * be the case if `end` is in `nodes` but no `end`
         * node exists.
         */

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

/**
 * Wrapper.
 *
 * @param {string|RegExp|Function} heading - Heading to
 *   search for.
 * @param {Function} callback - Callback invoked when
 *   found.
 * @return {function(node)} - Attacher.
 */
function wrapper(heading, callback) {
    var test = heading;

    if (typeof test === 'string') {
        test = toExpression(test);
    }

    if ('test' in test) {
        test = wrapExpression(test);
    }

    /**
     * Find a range based on a starting heading matching
     * `test`, up until the following closing with
     * equal or higher depth.
     *
     * @param {Node} node - Node to search in.
     */
    function transformer(node) {
        search(node, test, callback);
    }

    /**
     * `Attacher`.
     */
    function attacher() {
        return transformer;
    }

    return attacher;
}

/*
 * Expose.
 */

module.exports = wrapper;
