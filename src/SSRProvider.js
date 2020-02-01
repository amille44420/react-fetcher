import PropTypes from 'prop-types';
import React, { useMemo, useContext } from 'react';
import SSRContext from './SSRContext';
import SSRRenderer from './SSRRenderer';

const SSRProvider = ({ state, children }) => {
    let context = useContext(SSRContext);

    context = useMemo(
        () => ({
            ...context,
            renderer: new SSRRenderer(state),
        }),
        [state, context]
    );

    return <SSRContext.Provider value={context}>{children}</SSRContext.Provider>;
};

SSRProvider.propTypes = {
    children: PropTypes.node.isRequired,
    state: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
};

export default SSRProvider;
