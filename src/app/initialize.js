import React from 'react';  // eslint-disable-line
import ReactDOM from 'react-dom';
import { Provider } from 'mobx-react';

import Main from './components/Main';
import store from './store';

ReactDOM.render(
    <Provider store={store}>
        <Main/>
    </Provider>,
    document.getElementById('app')
);
