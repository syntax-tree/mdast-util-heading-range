'use strict';

/* eslint-env mocha */

/*
 * Dependencies.
 */

var heading = require('./');
var mdast = require('mdast');
var assert = require('assert');

/*
 * Methods.
 */

var equal = assert.strictEqual;

/**
 * Sample plugin which removes everything between
 * a heading named `name` (default: foo) and a following,
 * higher level heading.
 *
 * @param {MDAST} processor - Instance
 * @param {string} name - Example TOC name.
 */
function remover(processor, name) {
    processor.use(heading(name || 'foo', function (start, nodes, end, scope) {
        equal(typeof scope.start, 'number');
        assert(typeof scope.end === 'number' || scope.end === null);
        equal(scope.parent.type, 'root');

        return [start].concat(end ? [end] : []);
    }));
}

/**
 * Shortcut to process.
 *
 * @param {string} value - Value to process.
 * @param {*} options - configuration.
 * @return {string}
 */
function process(value, options) {
    return mdast().use(remover, options).process(value);
}

/*
 * Tests.
 */

describe('mdast-util-heading-range()', function () {
    it('should be a function', function () {
        equal(typeof heading, 'function');
    });
});

/*
 * Tests.
 */

describe('mdast-util-heading-range(heading, callback)', function () {
    it('should accept a heading as string', function () {
        equal(process(
            '# Fo\n' +
            '\n' +
            '## Fooooo\n' +
            '\n' +
            'Bar\n' +
            '\n' +
            '# Fo\n',
            'foo+'
        ),
            '# Fo\n' +
            '\n' +
            '## Fooooo\n' +
            '\n' +
            '# Fo\n'
        );
    });

    it('should accept a heading as an expression', function () {
        equal(process(
            '# Fo\n' +
            '\n' +
            '## Fooooo\n' +
            '\n' +
            'Bar\n' +
            '\n' +
            '# Fo\n',
            /foo+/i
        ),
            '# Fo\n' +
            '\n' +
            '## Fooooo\n' +
            '\n' +
            '# Fo\n'
        );
    });

    it('should accept a heading as a function', function () {
        /**
         * Assertion.
         */
        function assertion(value) {
            return value.toLowerCase().indexOf('foo') === 0;
        }

        equal(process(
            '# Fo\n' +
            '\n' +
            '## Fooooo\n' +
            '\n' +
            'Bar\n' +
            '\n' +
            '# Fo\n',
            assertion
        ),
            '# Fo\n' +
            '\n' +
            '## Fooooo\n' +
            '\n' +
            '# Fo\n'
        );
    });

    it('should accept a missing closing heading', function () {
        equal(process(
            '# Fo\n' +
            '\n' +
            '## Foo\n' +
            '\n' +
            'Bar\n'
        ),
            '# Fo\n' +
            '\n' +
            '## Foo\n'
        );
    });

    it('should accept images', function () {
        equal(process(
            '# Fo\n' +
            '\n' +
            '## ![Foo](bar.png)\n' +
            '\n' +
            'Bar\n' +
            '\n' +
            '## Baz\n'
        ),
            '# Fo\n' +
            '\n' +
            '## ![Foo](bar.png)\n' +
            '\n' +
            '## Baz\n'
        );
    });

    it('should accept links', function () {
        equal(process(
            '# Fo\n' +
            '\n' +
            '## [Foo](bar.com)\n' +
            '\n' +
            'Bar\n' +
            '\n' +
            '## Baz\n'
        ),
            '# Fo\n' +
            '\n' +
            '## [Foo](bar.com)\n' +
            '\n' +
            '## Baz\n'
        );
    });

    it('should accept an image in a link', function () {
        equal(process(
            '# Fo\n' +
            '\n' +
            '## [![](./bar.png "foo")](bar.com)\n' +
            '\n' +
            'Bar\n' +
            '\n' +
            '## Baz\n'
        ),
            '# Fo\n' +
            '\n' +
            '## [![](./bar.png "foo")](bar.com)\n' +
            '\n' +
            '## Baz\n'
        );
    });

    it('should not fail without heading', function () {
        equal(process(
            '# Fo\n' +
            '\n' +
            'Bar\n' +
            '\n' +
            '## Baz\n'
        ),
            '# Fo\n' +
            '\n' +
            'Bar\n' +
            '\n' +
            '## Baz\n'
        );
    });

    it('should not fail with empty headings', function () {
        equal(process(
            '## \n' +
            '\n' +
            '# Foo\n' +
            '\n' +
            'Baz\n'
        ),
            '## \n' +
            '\n' +
            '# Foo\n'
        );
    });

    it('should not fail without nodes', function () {
        equal(process(
            '# Foo\n'
        ),
            '# Foo\n'
        );
    });

    it('should not remove anything when `null` is given', function (done) {
        mdast().use(function (processor) {
            processor.use(heading('foo', function () {
                return null;
            }));
        }).process('Foo\n\n## Foo\n\nBar\n', function (exception, file, doc) {
            equal(doc, 'Foo\n\n## Foo\n\nBar\n');

            done(exception);
        });
    });

    it('should replace all previous nodes otherwise', function (done) {
        mdast().use(function (processor) {
            processor.use(heading('foo', function () {
                return [];
            }));
        }).process('Foo\n\n## Foo\n\nBar\n', function (exception, file, doc) {
            equal(doc, 'Foo\n');

            done(exception);
        });
    });

    it('should insert all returned nodes', function (done) {
        mdast().use(function (processor) {
            processor.use(heading('foo', function () {
                return [
                    {
                        'type': 'horizontalRule'
                    }
                ];
            }));
        }).process('Foo\n\n## Foo\n\nBar\n', function (exception, file, doc) {
            equal(doc, 'Foo\n\n* * *\n');

            done(exception);
        });
    });
});
