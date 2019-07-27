import React, {
  PureComponent,
  Component,
  createContext,
  memo,
  useContext,
} from 'react';
import { isValidElementType } from 'react-is';
import shallowequal from 'shallowequal';
import SSRContext from './SSRContext';

const fetchDefaultOptions = {
  // fetcher name
  name: 'data',
  // we may provide options for the providers
  providerOptions: null,
  // we may provide options for the consumers
  consumerOptions: null,
};

const providerDefaultOptions = {
  // variables (function or object)
  variables: null,
  // pure option
  pure: true,
  // should we refetch on props change
  refetchOnPropChanges: false,
  // function defining if there's a change on props
  shouldUpdate: shallowequal,
  // we may want to process the fetched data
  cleanData: null,
};

const consumerDefaultOptions = {
  // pure option
  pure: true,
};

const getDisplayName = WrappedComponent =>
  WrappedComponent.displayName || WrappedComponent.name || 'Component';

const createDataFetcher = (fetcher, customFetcherOptions = null) => {
  // create final options
  const options = { ...fetchDefaultOptions, ...customFetcherOptions };

  // capitalize the name to use it as display name
  const displayName =
    options.name.charAt(0).toUpperCase() + options.name.substr(1);

  // create a context for this data fetcher
  const Context = createContext(null);

  // we build a custom hook to consume the context
  const useData = () => {
    return useContext(Context);
  };

  // we build the HOC to fetch data and provide the context
  const withDataFetcher = providerCusomOptions => {
    // initialize the options with the default options
    let providerOptions = {
      ...providerDefaultOptions,
      ...options.providerOptions,
    };

    // here is our factory to build the HOC provider
    const getHOC = WrappedComponent => {
      const ComponentBase = options.pure ? PureComponent : Component;

      class Provider extends ComponentBase {
        static contextType = SSRContext;

        constructor(props) {
          super(props);

          // pending promise to fetch data
          this.fetchPromise = null;
          // previous props & state
          this.prevProps = null;
          // current context
          this.contextValue = null;
          // SSR index
          this.index = null;
        }

        getVariables() {
          return providerOptions.variables instanceof Function
            ? providerOptions.variables(this.props)
            : providerOptions.variables;
        }

        async fetch(variables) {
          const result = { err: null, data: null };

          try {
            // inform we're fetching
            this.updateContext({ loading: true });

            // update the state at first
            const data = await fetcher(variables, this.props);

            const cleanedData = providerOptions.cleanData
              ? providerOptions.cleanData(data, variables, this.props)
              : data;

            // update the state with the data
            this.updateContext({
              loading: false,
              data: cleanedData,
              error: null,
            });
            // do an update just after fetching
            this.forceUpdate();

            // update the result
            result.data = cleanedData;
          } catch (error) {
            // update the state with the error
            this.updateContext({ loading: false, data: null, error });
            // do an update after getting an error
            this.forceUpdate();

            // update the result
            result.error = error;
          } finally {
            this.fetchPromise = null;
          }

          return result;
        }

        refetch = (customVariables = null) => {
          const variables = {
            // first get variables from props
            ...this.getVariables(),
            ...customVariables,
          };

          // fetch again
          this.fetchPromise = this.fetch(variables, true);
          // and force the update
          this.forceUpdate();

          return this.fetchPromise;
        };

        get shouldFetch() {
          if (this.contextValue === null && this.fetchPromise === null) {
            // first fetch
            return true;
          }

          if (this.prevProps === this.props || this.fetchPromise) {
            // props are the same or it's already fetching
            return false;
          }

          // only fetch if we're looking to fetch on prop updates
          return (
            providerOptions.refetchOnPropChanges &&
            !providerOptions.shouldUpdate(this.props, this.prevProps)
          );
        }

        updateContext(newContext) {
          // the context
          this.contextValue = {
            // initial values
            error: null,
            data: null,
            // override with the current context
            ...this.contextValue,
            // override again with the new context above it
            ...newContext,
            // and ensure the right refetch method is given
            refetch: this.refetch,
          };
        }

        render() {
          const { ssr, renderer } = this.context;

          if (renderer) {
            this.index = renderer.register();

            if (renderer.hasState(this.index)) {
              const { result, props } = renderer.getState(this.index);
              this.updateContext({ loading: false, ...result });
              this.prevProps = props;
            }
          }

          if (this.shouldFetch) {
            // compute variables from props
            const variables = { ...this.getVariables() };
            // and fetch
            this.fetchPromise = this.fetch(variables);
            // remember the props we used
            this.prevProps = this.props;

            if (ssr) {
              // register our fetch to be processed on SSR
              renderer.attachPromise(this.fetchPromise, this.props, this.index);
            }
          }

          return (
            <Context.Provider value={this.contextValue}>
              <WrappedComponent {...this.contextValue} {...this.props} />
            </Context.Provider>
          );
        }
      }

      const wrappedDisplayName = getDisplayName(WrappedComponent);

      Provider.displayName = `with${displayName}Fetcher(${wrappedDisplayName})`;

      return Provider;
    };

    if (isValidElementType(providerCusomOptions)) {
      // the argument is a valid react element type, so let's consider there's no options
      return getHOC(providerCusomOptions);
    }

    // we do have custom options, let's merge those
    providerOptions = { ...providerOptions, ...providerCusomOptions };

    // and return the factory
    return getHOC;
  };

  // then the HOC to consume data
  const withData = consumerCustomOptions => {
    // initialize the options with the default options
    let customerOptions = {
      ...consumerDefaultOptions,
      ...options.consumerOptions,
    };

    // here is our factory to build the HOC consumer
    const getHOC = WrappedComponent => {
      let Consumer = props => {
        const contextValue = useData();

        return <WrappedComponent {...contextValue} {...props} />;
      };

      if (customerOptions.pure) {
        Consumer = memo(Consumer);
      }

      const wrappedDisplayName = getDisplayName(WrappedComponent);

      Consumer.displayName = `with${displayName}(${wrappedDisplayName})`;

      return Consumer;
    };

    if (isValidElementType(consumerCustomOptions)) {
      // the argument is a valid react element type, so let's consider there's no options
      return getHOC(consumerCustomOptions);
    }

    // we do have custom options, let's merge those
    customerOptions = { ...customerOptions, ...consumerCustomOptions };

    // and return the factory
    return getHOC;
  };

  return {
    [`use${displayName}`]: useData,
    [`with${displayName}Fetcher`]: withDataFetcher,
    [`with${displayName}`]: withData,
  };
};

export default createDataFetcher;
