import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {store} from 'components';

import './style/index.scss';

(init => {
    const sentryDsn = {
        dev: 'https://7588107dfdb24bdfba2cb864fdaa5dc2@sentry.kozhindev.com/28',
        alpha: 'https://ecbff1e8fb6c46f6a083288b455a9d87@sentry.kozhindev.com/29',
        locale: 'https://bff24cc83e57411d9ce98c7cd9d7d119@sentry.kozhindev.com/32',
    };

    if (window.Raven) {
        window.Raven.config(process.env.APP_ENV ? sentryDsn[process.env.APP_ENV] : sentryDsn['locale']).install();
        window.Raven.context(init);
    } else {
        init();
    }

})(() => {
    const Application = require('./Application').default;
    ReactDOM.render(
        <Provider store={store.store}>
            <Application/>
        </Provider>,
        document.getElementById('root'),
    );
});
