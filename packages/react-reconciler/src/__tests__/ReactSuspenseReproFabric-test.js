/* eslint-disable no-for-of-loops/no-for-of-loops */

global.nativeFabricUIManager = {
  createNode(reactTag, viewName, rootTag, props, internalInstanceHandle) {
    return {
      kind: 'MockNode',
      reactTag,
      viewName,
      rootTag,
      props,
    };
  },
  cloneNodeWithNewProps(node, newPropsDiff) {
    return {
      ...node,
      props: {...node.props, ...newPropsDiff},
    };
  },
  createChildSet() {
    return {
      kind: 'MockChildSet',
      children: [],
    };
  },
  appendChildToSet(childSet, childNode): void {
    childSet.children.push(childNode);
  },
  completeRoot(container, newChildren): void {
    expect(newChildren.kind).toBe('MockChildSet');
    expect(container.kind).toBe('MockRoot');
    container.children = newChildren.children;
  },
};

const ReactFabricMock = require('../ReactFabricMock');
const {
  ReactNativeViewConfigRegistry,
} = require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface');
const React = require('react');
const {act, assertLog, waitForAll} = require('internal-test-utils');
const Scheduler = require('scheduler');
const Suspense = React.Suspense;

const textCache = new Map();

function resolveText(text) {
  const record = textCache.get(text);
  if (record === undefined) {
    const newRecord = {
      status: 'resolved',
      value: text,
    };
    textCache.set(text, newRecord);
  } else if (record.status === 'pending') {
    const thenable = record.value;
    record.status = 'resolved';
    record.value = text;
    thenable.pings.forEach(t => t());
  }
}

function readText(text) {
  const record = textCache.get(text);
  if (record !== undefined) {
    switch (record.status) {
      case 'pending':
        throw record.value;
      case 'rejected':
        throw record.value;
      case 'resolved':
        return record.value;
    }
  } else {
    const thenable = {
      pings: [],
      then(resolve) {
        if (newRecord.status === 'pending') {
          thenable.pings.push(resolve);
        } else {
          Promise.resolve().then(() => resolve(newRecord.value));
        }
      },
    };

    const newRecord = {
      status: 'pending',
      value: thenable,
    };
    textCache.set(text, newRecord);

    throw thenable;
  }
}

function Text({text}) {
  Scheduler.log(text);
  return <text prop={text} />;
}

function AsyncText({text}) {
  readText(text);
  Scheduler.log(text);
  return <text prop={text} />;
}

ReactNativeViewConfigRegistry.register('text', () => ({
  uiViewClassName: 'text',
  bubblingEventTypes: {},
  directEventTypes: {},
  validAttributes: {
    prop: true,
  },
}));

it('basic', async () => {
  const root = ReactFabricMock.createRoot();
  root.render(<Text text="test" />);
  await waitForAll(['test']);

  expect(root.toHTML()).toMatchInlineSnapshot(`
    "<ROOT>
      <text prop="test" />
    </ROOT>"
  `);
});

it('suspends rendering and continues later (react-noop-renderer/fabric)', async () => {
  const root = ReactFabricMock.createRoot();

  let setInnerText;

  function App() {
    const [innerText, setInnerText_] = React.useState('inner');
    setInnerText = setInnerText_;

    return (
      <Suspense fallback={<Text text="fallback" />}>
        <AsyncText text={innerText} />
      </Suspense>
    );
  }

  root.render(<App />);
  await waitForAll(['fallback']);
  expect(root.toHTML()).toMatchInlineSnapshot(`
    "<ROOT>
      <text prop="fallback" />
    </ROOT>"
  `);

  await act(() => {
    resolveText('inner');
  });
  assertLog(['inner']);
  await waitForAll([]);
  expect(root.toHTML()).toMatchInlineSnapshot(`
    "<ROOT>
      <text prop="inner" />
    </ROOT>"
  `);

  React.startTransition(() => {
    setInnerText('inner-updated');
  });
  await waitForAll(['fallback']);
  expect(root.toHTML()).toMatchInlineSnapshot(`
    "<ROOT>
      <text prop="inner" />
      <text prop="fallback" />
    </ROOT>"
  `);
  await act(() => {
    resolveText('inner-updated');
  });
  assertLog(['inner-updated']);
  await waitForAll([]);
  expect(root.toHTML()).toMatchInlineSnapshot(`
    "<ROOT>
      <text prop="inner-updated" />
    </ROOT>"
  `);
});
