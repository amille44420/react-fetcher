import React from 'react';
import renderer from 'react-test-renderer';
import wait from 'waait';
import { createDataFetcher } from '../src/index';

test('test withDataFetcher lifecyle', async () => {
    // the variable in which we'll store the resolve/reject methods
    let fetch = null;

    // the mock fetcher
    const fetcher = jest.fn(
        () =>
            new Promise((resolve, reject) => {
                fetch = { resolve, reject };
            })
    );

    // create our fetcher to test
    const { withDataFetcher } = createDataFetcher(fetcher);

    // check first if all methods are here
    expect(withDataFetcher).toBeInstanceOf(Function);

    // inner component to run for our tests
    const Inner = () => <p>ok</p>;

    // mock the component
    const MockedInner = jest.fn(Inner);

    // apply the HOC
    const App = withDataFetcher(MockedInner);

    // create our component
    renderer.create(<App />);

    // first render, kinda empty
    expect(MockedInner.mock.calls[0][0]).toMatchSnapshot();
    expect(fetcher.mock.calls[0][0]).toMatchObject({});

    // resolve data
    fetch.resolve(42);
    await wait();
    expect(MockedInner.mock.calls[1][0]).toMatchSnapshot();

    // call a refetch
    MockedInner.mock.calls[1][0].refetch();
    await wait();
    expect(MockedInner.mock.calls[2][0]).toMatchSnapshot();
    expect(fetcher.mock.calls[1][0]).toMatchObject({});

    // reject data
    fetch.reject('error');
    await wait();
    expect(MockedInner.mock.calls[3][0]).toMatchSnapshot();

    // call a refetch with arguments
    MockedInner.mock.calls[3][0].refetch({ x: 21 });
    await wait();
    expect(MockedInner.mock.calls[4][0]).toMatchSnapshot();
    expect(fetcher.mock.calls[2][0]).toMatchObject({ x: 21 });

    // resolve new data
    fetch.resolve(21);
    await wait();
    expect(MockedInner.mock.calls[5][0]).toMatchSnapshot();
});
