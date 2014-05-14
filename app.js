/* frameworks import stuff */
var env = process.env.NODE_ENV ? process.env.NODE_ENV : 'development'; // express releated for production/development/test enviroments
var express = require('express');
var fs = require('fs'); 
var SETTINGS = fs.readFileSync('./config/settings.json'); // import the settings file to configure environment

/* My Works on chatSockets */
var chatSocket = require('./modals/ChatSocket');
var UserProvider = require('./modals/UserProvider').UserProvider;
var ChannelProvider = require('./modals/ChannelProvider').ChannelProvider;
var DatabaseProvider = require('./datastore/DatabaseProvider').DatabaseProvider;
var indexFile = fs.readFileSync('./testing/index.html'); //read the html page to be served (chat interface)

if(env == 'development'){
	console.log('Node and Express server in development Environment\r\n');
	SETTINGS = JSON.parse(SETTINGS).development;
}else if(env == 'production'){
	console.log('Node and Express server in production Environment\r\n');
	SETTINGS = JSON.parse(SETTINGS).production;
}else if(env == 'test'){
	console.log('Node and Express server in test Environment\r\n');
	SETTINGS = JSON.parse(SETTINGS).test;
}
console.log('Using DB Settings \n Adapter : '+ SETTINGS.database.adapter +'\n Host    : '+ SETTINGS.database.host + '\n Port    : '+SETTINGS.database.port +'\r\n');
console.log('Using Express Server Settings \n Host    : ' + SETTINGS.express.host + '\n Port    : '+SETTINGS.express.port+'\r\n');
console.log('Using Chat Server Settings \n Host    : ' + SETTINGS.chat.host + '\n Port    : '+SETTINGS.chat.port+'\r\n');

var databaseProvider = new DatabaseProvider(SETTINGS.database.host,SETTINGS.database.port);
var userProvider = new UserProvider(databaseProvider);
var channelProvider = new ChannelProvider(databaseProvider);


/**
 * Create the Express server for handling requests
 *
 **/

var app = express();

/**
 * Express server routes:
 * 1) get the main/index page
 * 2) get all users
 * 3) create a new user
 * 4) delete a user
 *
 **/
 

app.get('/', function(req, res) {
	res.end('');
});


/* USERS */
app.get('/user/', function(req, res) {
   console.log('This is the bloddy Request --- '+ req.body);
   userProvider.findAll(function(error, results) {
   	   console.log(results);
       res.send({error:error, users:results});
    });
}); 

app.post('/user/new', function(req, res) {
	console.log('This is the bloddy Request --- '+ req.body.sessionid);
    userProvider.save({
        handle: req.body.handle,
        sessionid: req.body.sessionid
    }, function(error, docs) {
        res.send({error:error, user:docs});
    });

});

app.get('/user/delete', function(req, res) {
    if (typeof req.body.sessionid !== 'undefined' || req.body.sessionid !== null) {

        userProvider.remove(
            req.body.sessionid
            , function(error, docs) {
                res.send({error:error, user:docs});
            }
        );
    } else {
        userProvider.getByHandle(
            req.body.handle
            , function(error, docs) {
                userProvider.remove(
                    docs.sessionid
                    , function(error, docs) {
                        res.send({error:error, user:docs});
                    }
                );
                
            }
        );
    }
});

/* CHANNELS */
app.get('/channel/', function(req, res) {
   channelProvider.findAll(function(error, results) {
       res.send({error:error, channels:results});
    });
});

app.post('/channel/new', function(req, res) {
    // important, since we are storing users belonging to a channel as an array we must initialise
    // the field as an array! Else we can push to it
    var users = [];
    users.push(req.body.sessionid);
    channelProvider.save({
        channel: req.body.channel,
        users: users
    }, function(error, docs) {
        res.send({error:error, channel:docs});
    });
});

app.post('/channel/join', function(req, res) {
    channelProvider.joinChannel({
        channel: req.body.channel,
        user: req.body.sessionid
    }, function(error, docs) {
        res.send({error:error, channel:docs});
    });
});


/**
 * Fire up the http server
 */
 
app.listen(SETTINGS.express.port);

/**
 * Fire up the socket server
 */

chatSocket.start(userProvider, channelProvider,SETTINGS.chat.port);