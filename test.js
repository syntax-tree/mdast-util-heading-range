'use strict';

/*
 * Dependencies.
 */

var heading = require('./');
var mdast = require('mdast');
var assert = require('assert');

/**
 * Sample plugin which removes everything between
 * a heading named `name` (default: foo) and a following,
 * higher level heading.
 *
 * @param {MDAST} processor
 * @param {string} name
 */
function remover(processor, name) {
    processor.use(heading(name || 'foo', function (start, nodes, end, scope) {
        assert(typeof scope.start === 'number');
        assert(typeof scope.end === 'number' || scope.end === null);
        assert(scope.parent.type === 'root');

        return [start].concat(end ? [end] : []);
    }));
}

/**
 * Shortcut to process.
 *
 * @param {string} value
 * @param {string?} name
 * @return {string}
 */
function process(value, name) {
    return mdast().use(remover, name).process(value);
}

/*
 * Tests.
 */

describe('mdast-heading()', function () {
    it('should be a function', function () {
        assert(typeof heading === 'function');
    });
});

/*
 * Tests.
 */

describe('mdast-heading(heading, callback)', function () {
    it('should accept a heading as string', function () {
        assert(process(
            '# Fo\n' +
            '\n' +
            '## Fooooo\n' +
            '\n' +
            'Bar\n' +
            '\n' +
            '# Fo\n',
            'foo+'
        ) ===
            '# Fo\n' +
            '\n' +
            '## Fooooo\n' +
            '\n' +
            '# Fo\n'
        );
    });

    it('should accept a heading as an expression', function () {
        assert(process(
            '# Fo\n' +
            '\n' +
            '## Fooooo\n' +
            '\n' +
            'Bar\n' +
            '\n' +
            '# Fo\n',
            /foo+/i
        ) ===
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

        assert(process(
            '# Fo\n' +
            '\n' +
            '## Fooooo\n' +
            '\n' +
            'Bar\n' +
            '\n' +
            '# Fo\n',
            assertion
        ) ===
            '# Fo\n' +
            '\n' +
            '## Fooooo\n' +
            '\n' +
            '# Fo\n'
        );
    });

    it('should accept a missing closing heading', function () {
        assert(process(
            '# Fo\n' +
            '\n' +
            '## Foo\n' +
            '\n' +
            'Bar\n'
        ) ===
            '# Fo\n' +
            '\n' +
            '## Foo\n'
        );
    });

    it('should accept images', function () {
        assert(process(
            '# Fo\n' +
            '\n' +
            '## ![Foo](bar.png)\n' +
            '\n' +
            'Bar\n' +
            '\n' +
            '## Baz\n'
        ) ===
            '# Fo\n' +
            '\n' +
            '## ![Foo](bar.png)\n' +
            '\n' +
            '## Baz\n'
        );
    });

    it('should accept links', function () {
        assert(process(
            '# Fo\n' +
            '\n' +
            '## [Foo](bar.com)\n' +
            '\n' +
            'Bar\n' +
            '\n' +
            '## Baz\n'
        ) ===
            '# Fo\n' +
            '\n' +
            '## [Foo](bar.com)\n' +
            '\n' +
            '## Baz\n'
        );
    });

    it('should accept an image in a link', function () {
        assert(process(
            '# Fo\n' +
            '\n' +
            '## [![](./bar.png "foo")](bar.com)\n' +
            '\n' +
            'Bar\n' +
            '\n' +
            '## Baz\n'
        ) ===
            '# Fo\n' +
            '\n' +
            '## [![](./bar.png "foo")](bar.com)\n' +
            '\n' +
            '## Baz\n'
        );
    });

    it('should not fail without heading', function () {
        assert(process(
            '# Fo\n' +
            '\n' +
            'Bar\n' +
            '\n' +
            '## Baz\n'
        ) ===
            '# Fo\n' +
            '\n' +
            'Bar\n' +
            '\n' +
            '## Baz\n'
        );
    });

    it('should not fail with empty headings', function () {
        assert(process(
            '## \n' +
            '\n' +
            '# Foo\n' +
            '\n' +
            'Baz\n'
        ) ===
            '## \n' +
            '\n' +
            '# Foo\n'
        );
    });

    it('should not fail without nodes', function () {
        assert(process(
            '# Foo\n'
        ) ===
            '# Foo\n'
        );
    });

    it('should not remove anything when `null` is given', function (done) {
        mdast().use(function (processor) {
            processor.use(heading('foo', function () {
                return null;
            }));
        }).process('Foo\n\n## Foo\n\nBar\n', function (exception, doc) {
            assert(doc === 'Foo\n\n## Foo\n\nBar\n');

            done(exception);
        });
    });

    it('should replace all previous nodes otherwise', function (done) {
        mdast().use(function (processor) {
            processor.use(heading('foo', function () {
                return [];
            }));
        }).process('Foo\n\n## Foo\n\nBar\n', function (exception, doc) {
            assert(doc === 'Foo\n');

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
        }).process('Foo\n\n## Foo\n\nBar\n', function (exception, doc) {
            assert(doc === 'Foo\n\n* * *\n');

            done(exception);
        });
    });
});
