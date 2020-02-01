import React from 'react';
import renderer from 'react-test-renderer';
import wait from 'waait';
import { createDataFetcher } from '../src/index';

test('test withData lifecycle', async () => {
    // the mock fetcher
    const fetcher = () => 42;

    // create our fetcher to test
    const { withDataFetcher, withData } = createDataFetcher(fetcher);

    // check first if all methods are here
    expect(withData).toBeInstanceOf(Function);
    expect(withDataFetcher).toBeInstanceOf(Function);

    // inner component to run for our tests
    const Inner = () => <p>ok</p>;

    // mock the component
    const MockedInner = jest.fn(Inner);

    // apply our HOC
    const InnerWithData = withData(MockedInner);

    // put a component in between to stop props propagation
    const Blocker = () => <InnerWithData />;

    // apply the HOC
    const App = withDataFetcher(Blocker);

    // create our component
    renderer.create(<App />);

    // first render, kinda empty
    expect(MockedInner.mock.calls[0][0]).toMatchSnapshot();

    // resolve data
    await wait();
    expect(MockedInner.mock.calls[1][0]).toMatchSnapshot();

    // call a refetch
    MockedInner.mock.calls[1][0].refetch();
    await wait();
    expect(MockedInner.mock.calls[2][0]).toMatchSnapshot();
});
