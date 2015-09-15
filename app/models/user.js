var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

// TODO: implement user model here [BCRYPT STUFF]

var User = db.Model.extend({
  tableName: 'users',
  initialize: function() {
    this.on('creating', this.hashPass, this);
  },
  hashPass: function(model) { // see: http://wesleytsai.io/2015/07/28/bookshelf-bcrpyt-password-hashing/
    return new Promise(function(resolve, reject) {
      bcrypt.hash(model.attributes.password, null, null, function(err, hash) {
        if (err) reject(err);
        model.set('password',hash);
        resolve(hash);
      })
    });
  }
});

module.exports = User;