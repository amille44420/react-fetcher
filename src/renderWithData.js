import { createElement } from 'react';
import SSRContext from './SSRContext';
import SSRRenderer from './SSRRenderer';

const renderWithData = (tree, render) => {
    const renderer = new SSRRenderer();

    const process = () => {
        // wrap the tree with our provider to dispatch our SSR context
        const element = createElement(SSRContext.Provider, { value: { ssr: true, renderer } }, tree);

        // call the rendering method
        const output = render(element);

        // loop until there's no more promises
        return renderer.hasPromises() ? renderer.consume().then(process) : [output, renderer.state];
    };

    // start the loop
    return process();
};

export default renderWithData;
