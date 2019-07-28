import React from 'react';
import { renderToString } from 'react-dom/server';
import renderer from 'react-test-renderer';
import { createDataFetcher, renderWithData, SSRProvider } from '../src/index';

test('test renderWithData', async () => {
  // prepare a variable in which we'll store the resolver
  let resolvePromise = null;

  // fetcher function persisting the resolve method
  const fetcher = jest.fn(
    () =>
      new Promise(resolve => {
        resolvePromise = resolve;
      }),
  );

  // create our fetcher to test
  const { withDataFetcher, useData } = createDataFetcher(fetcher);

  // inner component to run for our tests
  const Inner = () => {
    const { loading, data } = useData();

    return !loading && <p>{data}</p>;
  };

  // apply the HOC
  const App = withDataFetcher(Inner);

  // render our tree
  const renderPromise = renderWithData(<App />, renderToString);

  // we expect html to be a promise
  expect(renderPromise).toBeInstanceOf(Promise);
  // we also expected resolvePromise to be a function (resolve method)
  expect(resolvePromise).toBeInstanceOf(Function);

  // resolve our promise
  resolvePromise(42);
  const [html, state] = await renderPromise;
  expect(fetcher.mock.calls.length).toBe(1);
  expect(html).toMatchSnapshot();
  expect(state).toMatchSnapshot();

  // try to render it again while injecting the state
  const injectedRenderer = renderer.create(
    <SSRProvider state={state}>
      <App />
    </SSRProvider>,
  );

  // we shouldn't have any call on our fetcher
  expect(fetcher.mock.calls.length).toBe(1);
  expect(injectedRenderer.toJSON()).toMatchSnapshot();
});

test('test renderWithData with nested fetchers', async () => {
  // create our first fetcher
  const firstFetcher = jest.fn(() => 42);
  const { withFirstFetcher, useFirst } = createDataFetcher(firstFetcher, {
    name: 'first',
  });
  // create our second fetcher
  const secondFetcher = jest.fn((variables, { value = 0 }) => value + 1);
  const { withSecondFetcher, useSecond } = createDataFetcher(secondFetcher, {
    name: 'second',
  });

  // create components
  let SecondLayout = ({ value }) => {
    const { loading, data } = useSecond();

    return (
      !loading && (
        <p>
          first {value} then {data}
        </p>
      )
    );
  };

  SecondLayout = withSecondFetcher({ refetchOnPropChanges: true })(
    SecondLayout,
  );

  let FirstLayout = () => {
    const { loading, data } = useFirst();

    return <SecondLayout value={loading ? data : 0} />;
  };

  FirstLayout = withFirstFetcher(FirstLayout);

  // render it
  const [html, state] = await renderWithData(<FirstLayout />, renderToString);

  // ensure we didn't call the fetchers less or more than expected
  expect(firstFetcher.mock.calls.length).toBe(1);
  expect(secondFetcher.mock.calls.length).toBe(2);

  // check the output
  expect(html).toMatchSnapshot();
  expect(state).toMatchSnapshot();

  // try to render it again while injecting the state
  const injectedRenderer = renderer.create(
    <SSRProvider state={state}>
      <FirstLayout />
    </SSRProvider>,
  );
  // we shouldn't have any call on our fetcher
  expect(firstFetcher.mock.calls.length).toBe(1);
  expect(secondFetcher.mock.calls.length).toBe(2);
  expect(injectedRenderer.toJSON()).toMatchSnapshot();
});
