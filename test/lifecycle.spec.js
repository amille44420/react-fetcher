import React from 'react';
import renderer from 'react-test-renderer';
import wait from 'waait';
import createDataFetcher from '../src/index';

it('renders without crashing', async () => {
  // the variable in which we'll store the resolve/reject methods
  let fetch = null;

  // the mock fetcher
  const fetcher = jest.fn(
    () =>
      new Promise((resolve, reject) => {
        fetch = { resolve, reject };
      }),
  );

  // create our fetcher to test
  const { useData, withData, withDataFetcher } = createDataFetcher(fetcher);

  // check first if all methods are here
  expect(useData).toBeInstanceOf(Function);
  expect(withData).toBeInstanceOf(Function);
  expect(withDataFetcher).toBeInstanceOf(Function);

  // inner component to run for our tests
  const Inner = () => <p>ok</p>;

  // apply the HOC
  const App = withDataFetcher(Inner);

  // create our component
  const component = renderer.create(<App />);

  const getInnerElement = () => component.toTree().rendered;

  // first render, kinda empty
  expect(getInnerElement().props).toMatchSnapshot();
  expect(fetcher.mock.calls[0][0]).toMatchObject({});

  // resolve data
  fetch.resolve(42);
  await wait();
  expect(getInnerElement().props).toMatchSnapshot();

  // call a refetch
  getInnerElement().props.refetch();
  await wait();
  expect(getInnerElement().props).toMatchSnapshot();
  expect(fetcher.mock.calls[1][0]).toMatchObject({});

  // reject data
  fetch.reject('error');
  await wait();
  expect(getInnerElement().props).toMatchSnapshot();

  // call a refetch with arguments
  getInnerElement().props.refetch({ x: 21 });
  await wait();
  expect(getInnerElement().props).toMatchSnapshot();
  expect(fetcher.mock.calls[2][0]).toMatchObject({ x: 21 });

  // resolve new data
  fetch.resolve(21);
  await wait();
  expect(getInnerElement().props).toMatchSnapshot();
});
