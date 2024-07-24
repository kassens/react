const React = require('react');
const ReactDOMClient = require('react-dom/client');
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
  return text;
}

function AsyncText({text}) {
  readText(text);
  Scheduler.log(text);
  return text;
}

it('suspends rendering and continues later (ReactDOM)', async () => {
  const container = document.createElement('div');
  const root = ReactDOMClient.createRoot(container);

  let setOuterText;
  let setInnerText;

  function App() {
    const [outerText, setOuterText_] = React.useState('outer');
    const [innerText, setInnerText_] = React.useState('inner');
    setOuterText = setOuterText_;
    setInnerText = setInnerText_;

    return (
      <>
        <Text text={outerText} />
        <Suspense fallback={<Text text="fallback" />}>
          <AsyncText text={innerText} />
        </Suspense>
      </>
    );
  }

  root.render(<App />);

  await waitForAll(['outer', 'fallback']);

  expect(container.innerHTML).toMatchInlineSnapshot(`"outerfallback"`);

  await act(() => {
    resolveText('inner');
  });

  assertLog(['inner']);
  await waitForAll([]);

  expect(container.innerHTML).toMatchInlineSnapshot(`"outerinner"`);

  setOuterText('outer-updated');

  await waitForAll(['outer-updated', 'inner']);
  expect(container.innerHTML).toMatchInlineSnapshot(`"outer-updatedinner"`);

  React.startTransition(() => {
    setInnerText('inner-updated');
  });

  await waitForAll(['outer-updated', 'fallback']);
  expect(container.innerHTML).toMatchInlineSnapshot(`"outer-updatedinner"`);

  await act(() => {
    resolveText('inner-updated');
  });
  assertLog(['outer-updated', 'inner-updated']);

  await waitForAll([]);

  expect(container.innerHTML).toMatchInlineSnapshot(
    `"outer-updatedinner-updated"`,
  );
});
