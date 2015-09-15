var express = require('express');
var session = require('express-session');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var User = require('./app/models/user');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({secret:'oogabooga'}));
app.use(express.static(__dirname + '/public'));

app.get('/', 
function(req, res) {
  checkUser(req, function(userLoggedIn) {
    if (userLoggedIn) { res.render('index'); }
    else { res.redirect('/login'); }
  });
});

function checkUser(req, callback) {
  new User({session_id: req.sessionID})
  .fetch()
  .then(function(model) {
    if (model) {
      callback(model); 
    } else {
       callback(null);
    }
  })
  .catch(function() {
    callback(null);
  });
}

app.get('/create', 
function(req, res) {
  checkUser(req, function(userLoggedIn) {
    if (userLoggedIn) { res.render('index'); }
    else { res.redirect('/login'); }
  });
});

app.get('/links', 
function(req, res) {
  checkUser(req, function(userLoggedIn) {
    if (userLoggedIn) {
      Links.reset().query({where: {user_id: userLoggedIn.get('id')}
      }).fetch().then(function(links) {
        res.send(200, links.models);
      })
      .catch(function(err) {
        console.log('links get err',err);
      });
    }
    else { res.redirect('/login'); }
  });  
});

app.get('/login', function(req, res) {
  res.render('login');
});

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.get('/logout', function(request, response){
    request.session.destroy(function(){
        response.redirect('/');
    });
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;
  checkUser(req, function(userLoggedIn) {
    if (userLoggedIn) {
      if (!util.isValidUrl(uri)) {
        console.log('Not a valid url: ', uri);
        return res.send(404);
      }
      var user_id = userLoggedIn.get('id')
      new Link({ url: uri, user_id: user_id}).fetch().then(function(found) {
        if (found) {
          res.send(200, found.attributes);
        } else {
          util.getUrlTitle(uri, function(err, title) {
            if (err) {
              console.log('Error reading URL heading: ', err);
              return res.send(404);
            }

            Links.create({
              url: uri,
              title: title,
              base_url: req.headers.origin,
              user_id: user_id
            })
            .then(function(newLink) {
              res.send(200, newLink);
            });
          });
        }
      });
    }
    else { res.redirect('/login'); }
  });
});

app.post('/signup', function(req, res) {
    var username = req.body.username
    var password = req.body.password
    var session_id = req.sessionID

    Users.create({
      username: username,
      password: password,
      session_id: session_id
    })
    .then(function(newUser) {
      res.redirect('/');
    })
    .catch(function(err) {
      console.log('e',err);
    });
  }
)

app.post('/login', 
  function(req, res) {
    var username = req.body.username
    var password = req.body.password
     
    new User( {username : username} ).fetch().then(function(found) {
      if (found) {
        bcrypt.compare(password, found.get('password'), function(err, result) {
          console.log('bcrypt result',result);
          if (err) { console.log(err); }
          if (result === false) {
            res.redirect('/login');
          } else {
            found.set('session_id', req.sessionID).save();
            res.redirect('/')
          }
        })  
      }
      else {
        res.redirect('/login');
      }
    })
  }
)

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits')+1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
