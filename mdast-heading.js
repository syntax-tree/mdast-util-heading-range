(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.mdastHeading = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

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
 * @param {string} value
 * @return {RegExp}
 */
function toExpression(value) {
    return new RegExp('^(' + value + ')$', 'i');
}

/**
 * Wrap an expression into an assertion function.
 *
 * @param {RegExp} expression
 * @return {Function}
 */
function wrapExpression(expression) {
    /**
     * Assert `value` matches the bound `expression`.
     *
     * @param {string} value
     * @return {boolean}
     */
    function assertion(value) {
        return expression.test(value);
    }

    return assertion;
}

/**
 * Check if `node` is a heading.
 *
 * @param {Node} node
 * @return {boolean}
 */
function isHeading(node) {
    return node && node.type === 'heading';
}

/**
 * Check if `node` is the main heading.
 *
 * @param {Node} node
 * @param {number?} depth
 * @param {function(string): boolean} test
 *
 * @return {boolean}
 */
function isOpeningHeading(node, depth, test) {
    return depth === null && isHeading(node) && test(toString(node), node);
}

/**
 * Check if `node` is the next heading.
 *
 * @param {Node} node
 * @param {number?} depth
 * @return {boolean}
 */
function isClosingHeading(node, depth) {
    return depth && isHeading(node) && node.depth <= depth;
}

/**
 * Search a node for heading range.
 *
 * @param {Node} root
 * @param {Function} test
 * @param {Function} callback
 */
function search(root, test, callback) {
    var index = -1;
    var children = root.children;
    var length = children.length;
    var depth = null;
    var start = null;
    var end = null;
    var nodes;
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
            children.slice(start + 1, end - start + 1),
            children[end],
            {
                'parent': root,
                'start': start,
                'end': end in children ? end : null
            }
        );

        if (nodes) {
            splice.apply(children, [start, end + 1].concat(nodes));
        }
    }
}

/**
 * Wrapper.
 *
 * @param {string|RegExp|Function} heading
 * @param {Function} callback
 * @return {function(node)}
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
     * @param {Node} node
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

},{"mdast-util-to-string":2}],2:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer. All rights reserved.
 * @module mdast-util-to-string
 * @fileoverview Utility to get the text value of a node.
 */

'use strict';

/**
 * Get the value of `node`.  Checks, `value`,
 * `alt`, and `title`, in that order.
 *
 * @param {Node} node - Node to get the internal value of.
 * @return {string} - Textual representation.
 */
function valueOf(node) {
    return node &&
        (node.value ? node.value :
        (node.alt ? node.alt : node.title)) || '';
}

/**
 * Returns the text content of a node.  If the node itself
 * does not expose plain-text fields, `toString` will
 * recursivly try its children.
 *
 * @param {Node} node - Node to transform to a string.
 * @return {string} - Textual representation.
 */
function toString(node) {
    return valueOf(node) ||
        (node.children && node.children.map(toString).join('')) ||
        '';
}

/*
 * Expose.
 */

module.exports = toString;

},{}]},{},[1])(1)
});