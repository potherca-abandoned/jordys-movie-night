var express = require('express');
var favicon = require('serve-favicon');
var filesystem = require('fs');
var omdb = require('omdb');
var serveStatic = require('serve-static');
var stormpath = require('express-stormpath');
var tal = require('template-tal');

var app = express();

var oUrls = {
    login: {
        uri: '/users/login'
    },
    logout: {
        uri: '/users/logout'
    },
    forgotPassword:{
        uri: '/users/forgot-password',
        nextUri: '/users/login?status=forgot'
    },
    changePassword:{
        uri: '/users/change-password',
        nextUri: '/users/login?status=reset',
        errorUri: '/users/forgot-password?status=invalid_sptoken'
    },
    register:{
        uri: "/users/register"
    },
    profile:{
        uri: '/users/profile'
    },
    me:{
        uri: '/users/me'
    }
};

/* Register Middleware
 ---------------------------------------------------------------------------- */
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(serveStatic('public/'));
app.use(function (p_oRequest, p_oResponse, p_fNext) {
    /* "A man is not dead while his name is still spoken." */
    p_oResponse.setHeader('X-Clacks-Overhead', 'GNU Terry Pratchett');
    return p_fNext();
});
/* The Stormpath middleware must always be the last initialized middleware */
app.use(stormpath.init(app, {
    website: true,
    web: oUrls,
    expand: {
        /* In addition to managing basic user fields, Stormpath also allows you
           to store up to 10MB of JSON information with each user account!
           @see: http://docs.stormpath.com/nodejs/express/latest/user_data.html
         */
        customData: true
    }
}));

/* Define Route Handlers
 ---------------------------------------------------------------------------- */
app.get('*', function (p_oRequest, p_oResponse) {
    // Grab HTML Template
    filesystem.readFile(__dirname + '/src/templates/main.html', function (p_oError, p_oContent) {
        var sResponse = '', oContext = {};

        if (p_oError) {
            // Could not find (or read) requested template
            console.error(p_oError);
            throw p_oError;
        } else {
            oContext.sRequest = p_oRequest.originalUrl;
            oContext.oUser = p_oRequest.user;
            oContext.bUser = (p_oRequest.user !== undefined);
            oContext.oUrls = oUrls;
            // Feed Data to Template
            sResponse = tal.process(p_oContent.toString(), oContext);
            // Return response
            p_oResponse.send(sResponse);
        }
    });
});

app.get('movies/*', function (p_oRequest, p_oResponse) {
    omdb.get(p_oRequest.originalUrl, function (p_oError, p_oMovies) {
        if (p_oError) {
            console.error(p_oError);
        } else if (p_oMovies.length < 1) {
            console.log('No p_oMovies were found!');
        } else {
            console.log('!');
            p_oMovies.forEach(function (movie) {
                console.log('%s (%d)', movie.title, movie.year);
            });
        }
    });
    p_oResponse.send('Requested ' + p_oRequest.originalUrl);
});

/* Handle Errors
 ---------------------------------------------------------------------------- */
app.use(function (p_oError, p_oRequest, p_oResponse, p_oNext) {
    console.error(p_oError);
    console.error(p_oError.status);
    console.error(p_oError.stack);
    // Can't set headers after they are sent.
    // p_oResponse.status(500).send('Requested: ' + p_oRequest.originalUrl)
    p_oResponse.send('Requested: ' + p_oRequest.originalUrl)
});

/* Fire up the application server
 ---------------------------------------------------------------------------- */
app.on('stormpath.ready', function () {
    console.log('Stormpath Ready');

    var server = app.listen(process.env.PORT || 8080, function () {
        var host = server.address().address || 'localhost';
        var port = server.address().port;

        console.log('Example app listening at http://%s:%s', host, port)
    });
});


/*EOF*/