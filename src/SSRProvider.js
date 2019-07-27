import React, { useMemo, useContext } from 'react';
import PropTypes from 'prop-types';
import SSRContext from './SSRContext';
import SSRRenderer from './SSRRenderer';

const SSRProvider = ({ state, children }) => {
  let context = useContext(SSRContext);

  context = useMemo(
    () => ({
      ...context,
      renderer: new SSRRenderer(state),
    }),
    [state, context],
  );

  return <SSRContext.Provider value={context}>{children}</SSRContext.Provider>;
};

SSRProvider.propTypes = {
  state: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  children: PropTypes.node.isRequired,
};

export default SSRProvider;
