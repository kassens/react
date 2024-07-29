const ReactNoopPersistent = require('react-noop-renderer/persistent');

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

it('suspends rendering and continues later (react-noop-renderer/persistent)', async () => {
  const root = ReactNoopPersistent.createRoot();

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
  expect(root.getChildren()).toMatchInlineSnapshot(`
    [
      {
        "children": [],
        "hidden": false,
        "prop": "fallback",
        "type": "text",
      },
    ]
  `);

  await act(() => {
    resolveText('inner');
  });
  assertLog(['inner']);
  await waitForAll([]);
  expect(root.getChildren()).toMatchInlineSnapshot(`
    [
      {
        "children": [],
        "hidden": false,
        "prop": "inner",
        "type": "text",
      },
    ]
  `);

  React.startTransition(() => {
    setInnerText('inner-updated');
  });
  await waitForAll(['fallback']);
  expect(root.getChildren()).toMatchInlineSnapshot(`
    [
      {
        "children": [],
        "hidden": false,
        "prop": "inner",
        "type": "text",
      },
    ]
  `);
  await act(() => {
    resolveText('inner-updated');
  });
  assertLog(['inner-updated']);
  await waitForAll([]);
  expect(root.getChildren()).toMatchInlineSnapshot(`
    [
      {
        "children": [],
        "hidden": false,
        "prop": "inner-updated",
        "type": "text",
      },
    ]
  `);
});
