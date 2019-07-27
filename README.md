# React Context Fetcher

[![npm](https://img.shields.io/npm/v/react-context-fetcher.svg)](https://www.npmjs.com/package/react-context-fetcher)
[![Build Status](https://travis-ci.org/amille44420/react-fetcher.svg?branch=master)](https://travis-ci.org/amille44420/react-fetcher)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=amille44420/react-fetcher)](https://dependabot.com)
[![codecov](https://codecov.io/gh/amille44420/react-fetcher/branch/master/graph/badge.svg)](https://codecov.io/gh/amille44420/react-fetcher)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

Simple and universal data fetching library for React using context to consume data.

```bash
$ npm install --save react-context-fetcher
# or
$ yarn add react-context-fetcher
```

## API

```js
import React from 'react';
import createDataFetcher from 'react-data-fetcher';

// function fetching data
const getData = async () => fetch(/* ... */).then(res => res.json());

// use the factory to create your fetcher
const fetcher = createDataFetcher(getData);

// the fetcher is composed from HOCs and custom hooks
const {
  // HOC working as a data Provider
  withDataFetcher,
  // HOC working as a data consumer
  withData,
  // custom hook working as a data consumer
  useData,
} = fetcher;

const MyComponent = ({ loading, error, data }) => {
  if (loading) {
    return <p>currently fetching data...</p>;
  }

  if (error) {
    return <p>ups something happen: {error}</p>;
  }

  return <p>got data: {data}</p>
};

export default MyFetcher.withDataFetcher(MyComponent);
```

### createDataFetcher(fetcher, options)

Factory to build a `fetcher` object that includes two HOCs and one custom hook (cf. the previous code sample).
The factory may take options.

```js
// factory options
{
   // fetcher name
   name: 'data',
   // we may provide options for the providers
   providerOptions: null,
   // we may provide options for the consumers
   consumerOptions: null,
}
```

The `fetcher`'s name is used when naming the HOCs & hook. If we were to give `book` to this option, the resulting object would be `withBook`, `withBookFetcher` and `useBook`.
The `fetcher` option is the function that will be called whenever we want to fetch data. 

```js
const getData = (variables, props) => { /* ... */ };
```

It will receive both the computed variables and receive props as arguments.

### withDataFetcher(options | wrappedComponent)

It fetch data and manage their lifecycle, the whole state is given through props to `children` but also dispatched through a react context.

```js
// provider options
{
  // variables (function or object)
  variables: null,
  // pure option
  pure: true,
  // should we refetch on props change
  refetchOnPropChanges: false,
  // we may want to process the fetched data
  cleanData: null,
}
```

You may omit options to use this HOC right away on your component. Or you may provide option and retrieve the configured HOC.

```js
export default compose(
  withDataFetcher({
    variables: { x: 42 },
  }),
  /* ... other HOCs */
)(MyComponent);
```

The options `variables` may be an function that will receive props as first argument.

```js
withDataFetcher({
  variables: (props) => { /* ... */ },
})
```


The wrapped component  will receive 3 props : `loading`, `error` and `data`.

### withData(options | wrappedComponent)

`withData` is a very simple HOC that consume the contexte provider by `withDataFetcher` and send it to props. There's a few options for this HOC.

```js
// consumer options
{
  // pure option
  pure: true,
}
```

Like `withDataFetcher` you may omit those options.

```js
// with options
export default withData({ pure: false })(MyComponent);

// without options
export default withData(MyComponent);
```

### useData()

`useData` is a custom hook you can use to consume data in a functional component.

```js
const MyComponent = () => {
  const { loading, error, data } = useData();
  
  /* ... */
};
```
