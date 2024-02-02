/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

// NOTE: We're explicitly not using JSX in this file. This is intended to test
// classic JS without JSX.

let React;
let ReactDOM;
let ReactTestUtils;

let ReactFeatureFlags = require('shared/ReactFeatureFlags');

describe('ReactElementValidator', () => {
  let ComponentClass;

  beforeEach(() => {
    jest.resetModules();

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');
    ComponentClass = class extends React.Component {
      render() {
        return React.createElement('div');
      }
    };
  });

  it('warns for keys for arrays of elements in rest args', () => {
    expect(() => {
      React.createElement(ComponentClass, null, [
        React.createElement(ComponentClass),
        React.createElement(ComponentClass),
      ]);
    }).toErrorDev('Each child in a list should have a unique "key" prop.');
  });

  it('warns for keys for arrays of elements with owner info', () => {
    class InnerClass extends React.Component {
      render() {
        return React.createElement(ComponentClass, null, this.props.childSet);
      }
    }

    class ComponentWrapper extends React.Component {
      render() {
        return React.createElement(InnerClass, {
          childSet: [
            React.createElement(ComponentClass),
            React.createElement(ComponentClass),
          ],
        });
      }
    }

    expect(() => {
      ReactTestUtils.renderIntoDocument(React.createElement(ComponentWrapper));
    }).toErrorDev(
      'Each child in a list should have a unique "key" prop.' +
        '\n\nCheck the render method of `InnerClass`. ' +
        'It was passed a child from ComponentWrapper. ',
    );
  });

  it('warns for keys for arrays with no owner or parent info', () => {
    function Anonymous() {
      return <div />;
    }
    Object.defineProperty(Anonymous, 'name', {value: undefined});

    const divs = [<div />, <div />];

    expect(() => {
      ReactTestUtils.renderIntoDocument(<Anonymous>{divs}</Anonymous>);
    }).toErrorDev(
      'Warning: Each child in a list should have a unique ' +
        '"key" prop. See https://reactjs.org/link/warning-keys for more information.\n' +
        '    in div (at **)',
    );
  });

  it('warns for keys for arrays of elements with no owner info', () => {
    const divs = [<div />, <div />];

    expect(() => {
      ReactTestUtils.renderIntoDocument(<div>{divs}</div>);
    }).toErrorDev(
      'Warning: Each child in a list should have a unique ' +
        '"key" prop.\n\nCheck the top-level render call using <div>. See ' +
        'https://reactjs.org/link/warning-keys for more information.\n' +
        '    in div (at **)',
    );
  });

  it('warns for keys with component stack info', () => {
    function Component() {
      return <div>{[<div />, <div />]}</div>;
    }

    function Parent(props) {
      return React.cloneElement(props.child);
    }

    function GrandParent() {
      return <Parent child={<Component />} />;
    }

    expect(() => ReactTestUtils.renderIntoDocument(<GrandParent />)).toErrorDev(
      'Warning: Each child in a list should have a unique ' +
        '"key" prop.\n\nCheck the render method of `Component`. See ' +
        'https://reactjs.org/link/warning-keys for more information.\n' +
        '    in div (at **)\n' +
        '    in Component (at **)\n' +
        '    in Parent (at **)\n' +
        '    in GrandParent (at **)',
    );
  });

  it('does not warn for keys when passing children down', () => {
    function Wrapper(props) {
      return (
        <div>
          {props.children}
          <footer />
        </div>
      );
    }

    ReactTestUtils.renderIntoDocument(
      <Wrapper>
        <span />
        <span />
      </Wrapper>,
    );
  });

  it('warns for keys for iterables of elements in rest args', () => {
    const iterable = {
      '@@iterator': function () {
        let i = 0;
        return {
          next: function () {
            const done = ++i > 2;
            return {
              value: done ? undefined : React.createElement(ComponentClass),
              done: done,
            };
          },
        };
      },
    };

    expect(() =>
      React.createElement(ComponentClass, null, iterable),
    ).toErrorDev('Each child in a list should have a unique "key" prop.');
  });

  it('does not warns for arrays of elements with keys', () => {
    React.createElement(ComponentClass, null, [
      React.createElement(ComponentClass, {key: '#1'}),
      React.createElement(ComponentClass, {key: '#2'}),
    ]);
  });

  it('does not warns for iterable elements with keys', () => {
    const iterable = {
      '@@iterator': function () {
        let i = 0;
        return {
          next: function () {
            const done = ++i > 2;
            return {
              value: done
                ? undefined
                : React.createElement(ComponentClass, {key: '#' + i}),
              done: done,
            };
          },
        };
      },
    };

    React.createElement(ComponentClass, null, iterable);
  });

  it('does not warn when the element is directly in rest args', () => {
    React.createElement(
      ComponentClass,
      null,
      React.createElement(ComponentClass),
      React.createElement(ComponentClass),
    );
  });

  it('does not warn when the array contains a non-element', () => {
    React.createElement(ComponentClass, null, [{}, {}]);
  });

  it('gives a helpful error when passing invalid types', () => {
    function Foo() {}
    expect(() => {
      React.createElement(undefined);
      React.createElement(null);
      React.createElement(true);
      React.createElement({x: 17});
      React.createElement({});
      React.createElement(React.createElement('div'));
      React.createElement(React.createElement(Foo));
      React.createElement(React.createElement(React.createContext().Consumer));
      React.createElement({$$typeof: 'non-react-thing'});
    }).toErrorDev(
      [
        'Warning: React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function (for composite ' +
          'components) but got: undefined. You likely forgot to export your ' +
          "component from the file it's defined in, or you might have mixed up " +
          'default and named imports.',
        'Warning: React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function (for composite ' +
          'components) but got: null.',
        'Warning: React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function (for composite ' +
          'components) but got: boolean.',
        'Warning: React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function (for composite ' +
          'components) but got: object.',
        'Warning: React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function (for composite ' +
          'components) but got: object. You likely forgot to export your ' +
          "component from the file it's defined in, or you might have mixed up " +
          'default and named imports.',
        'Warning: React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function (for composite ' +
          'components) but got: <div />. Did you accidentally export a JSX literal ' +
          'instead of a component?',
        'Warning: React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function (for composite ' +
          'components) but got: <Foo />. Did you accidentally export a JSX literal ' +
          'instead of a component?',
        'Warning: React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function (for composite ' +
          'components) but got: <Context.Consumer />. Did you accidentally ' +
          'export a JSX literal instead of a component?',
        'Warning: React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function (for composite ' +
          'components) but got: object.',
      ],
      {withoutStack: true},
    );

    // Should not log any additional warnings
    React.createElement('div');
  });

  it('includes the owner name when passing null, undefined, boolean, or number', () => {
    function ParentComp() {
      return React.createElement(null);
    }

    expect(() => {
      expect(() => {
        ReactTestUtils.renderIntoDocument(React.createElement(ParentComp));
      }).toThrowError(
        'Element type is invalid: expected a string (for built-in components) ' +
          'or a class/function (for composite components) but got: null.' +
          (__DEV__ ? '\n\nCheck the render method of `ParentComp`.' : ''),
      );
    }).toErrorDev(
      'Warning: React.createElement: type is invalid -- expected a string ' +
        '(for built-in components) or a class/function (for composite ' +
        'components) but got: null.' +
        '\n\nCheck the render method of `ParentComp`.\n    in ParentComp',
    );
  });

  it('warns for fragments with illegal attributes', () => {
    class Foo extends React.Component {
      render() {
        return React.createElement(React.Fragment, {a: 1}, '123');
      }
    }

    expect(() => {
      ReactTestUtils.renderIntoDocument(React.createElement(Foo));
    }).toErrorDev(
      'Invalid prop `a` supplied to `React.Fragment`. React.Fragment ' +
        'can only have `key` and `children` props.',
    );
  });

  if (!__EXPERIMENTAL__) {
    it('should warn when accessing .type on an element factory', () => {
      function TestComponent() {
        return <div />;
      }

      let TestFactory;

      expect(() => {
        TestFactory = React.createFactory(TestComponent);
      }).toWarnDev(
        'Warning: React.createFactory() is deprecated and will be removed in a ' +
          'future major release. Consider using JSX or use React.createElement() ' +
          'directly instead.',
        {withoutStack: true},
      );

      expect(() => TestFactory.type).toWarnDev(
        'Warning: Factory.type is deprecated. Access the class directly before ' +
          'passing it to createFactory.',
        {withoutStack: true},
      );

      // Warn once, not again
      expect(TestFactory.type).toBe(TestComponent);
    });
  }

  it('does not warn when using DOM node as children', () => {
    class DOMContainer extends React.Component {
      render() {
        return <div />;
      }
      componentDidMount() {
        ReactDOM.findDOMNode(this).appendChild(this.props.children);
      }
    }

    const node = document.createElement('div');
    // This shouldn't cause a stack overflow or any other problems (#3883)
    ReactTestUtils.renderIntoDocument(<DOMContainer>{node}</DOMContainer>);
  });

  it('should not enumerate enumerable numbers (#4776)', () => {
    /*eslint-disable no-extend-native */
    Number.prototype['@@iterator'] = function () {
      throw new Error('number iterator called');
    };
    /*eslint-enable no-extend-native */

    try {
      void (
        <div>
          {5}
          {12}
          {13}
        </div>
      );
    } finally {
      delete Number.prototype['@@iterator'];
    }
  });

  it('does not blow up with inlined children', () => {
    // We don't suggest this since it silences all sorts of warnings, but we
    // shouldn't blow up either.

    const child = {
      $$typeof: (<div />).$$typeof,
      type: 'span',
      key: null,
      ref: null,
      props: {},
      _owner: null,
    };

    void (<div>{[child]}</div>);
  });

  it('does not blow up on key warning with undefined type', () => {
    const Foo = undefined;
    expect(() => {
      void (<Foo>{[<div />]}</Foo>);
    }).toErrorDev(
      'Warning: React.createElement: type is invalid -- expected a string ' +
        '(for built-in components) or a class/function (for composite ' +
        'components) but got: undefined. You likely forgot to export your ' +
        "component from the file it's defined in, or you might have mixed up " +
        'default and named imports.\n\nCheck your code at **.',
      {withoutStack: true},
    );
  });

  it('does not call lazy initializers eagerly', () => {
    let didCall = false;
    const Lazy = React.lazy(() => {
      didCall = true;
      return {then() {}};
    });
    React.createElement(Lazy);
    expect(didCall).toBe(false);
  });
});
