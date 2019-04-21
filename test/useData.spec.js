import React from 'react';
import renderer from 'react-test-renderer';
import wait from 'waait';
import createDataFetcher from '../src/index';

test('test useData lifecycle', async () => {
  // the mock fetcher
  const fetcher = () => 42;

  // create our fetcher to test
  const { withDataFetcher, useData } = createDataFetcher(fetcher);

  // check first if all methods are here
  expect(useData).toBeInstanceOf(Function);
  expect(withDataFetcher).toBeInstanceOf(Function);

  // mock the custom hook
  const mockedUseData = jest.fn(useData);

  // inner component to run for our tests
  const Inner = () => {
    // eslint-disable-next-line no-unused-vars
    const data = mockedUseData();

    return <p>ok</p>;
  };

  // apply the HOC
  const App = withDataFetcher(Inner);

  // create our component
  renderer.create(<App />);

  // first render, kinda empty
  expect(mockedUseData.mock.results[0].value).toMatchSnapshot();

  // resolve data
  await wait();
  expect(mockedUseData.mock.results[1].value).toMatchSnapshot();

  // call a refetch
  mockedUseData.mock.results[1].value.refetch();
  await wait();
  expect(mockedUseData.mock.results[2].value).toMatchSnapshot();
});
