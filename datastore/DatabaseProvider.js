var mongo = require('mongodb');
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
// BSON = require('lib/mongodb').BSONPure;
var BSON = require('mongodb').BSONNative;


DatabaseProvider = function(host,port) {
    var db = new mongo.Db('node-mongo-chat', new Server(host, port, {auto_reconnect: true}),{safe:false});
    db.addListener('error', function(error) {
      console.log('Error connecting to mongo -- perhaps it isn\'t running?' + error);
    });
    db.open(function() {
          console.log('Connected to mongo');
    });

    return db;
};

exports.DatabaseProvider = DatabaseProvider;