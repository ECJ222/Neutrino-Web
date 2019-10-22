const App = require('./App');
const express = require('express');
const expressApp = express();
const Sentry = require('@sentry/node');

require('dotenv').config();

const sentryDsn = {
    dev: 'https://af513f82d6cb4b2b8a6812b3dc545c70@sentry.kozhindev.com/25',
    alpha: 'https://afa7b47becd14b2d98954a3d190edf48@sentry.kozhindev.com/26',
    locale: 'https://564449fbc3c1478382e784e77aaf404c@sentry.kozhindev.com/31',
};

//sentry
console.log('---test', process.env, process.env.APP_ENV, sentryDsn[process.env.APP_ENV]);

if (process.env.APP_ENV) {
    Sentry.init({ dsn: sentryDsn[process.env.APP_ENV] });
} else {
    Sentry.init({ dsn: sentryDsn['locale'] });
}

// Create app
const port = process.env.PORT || 5000;
const httpServer = expressApp.listen(port, () => {
    console.log(__dirname); // eslint-disable-line no-console
    console.log('Listening Port ' + port); // eslint-disable-line no-console
});
const mainApp = new App({expressApp, httpServer});

expressApp.use(function(req, res, next) {
    if (req.header('x-forwarded-proto') === 'http') {
        res.redirect(301, 'https://' + req.headers.host + req.url);
        return;
    }
    next();
});

mainApp.start();

expressApp.use(express.static(__dirname + '/../dist'));
expressApp.get('/*', (req, res) => {
    res.sendFile('index.html', { root : __dirname + '/../dist'});
});
