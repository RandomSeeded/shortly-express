var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

// TODO: implement user model here [BCRYPT STUFF]

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  initialize: function() {
    this.on('creating', function() {
      console.log('creating user');
    });
  }
});

module.exports = User;