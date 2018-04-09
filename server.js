
const express = require('express');
const app = express();
const mongodb = require('mongodb');
const shortid = require('shortid');
const validUrl = require('valid-url');
const mLab = `mongodb://${process.env.db}:${process.env.dbPass}@ds125479.mlab.com:25479/url_shortener`;
var MongoClient = mongodb.MongoClient;

app.use(express.static('public'))



// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(__dirname + '/views/index.html')
})



app.get('/new/:url(*)', function (req, res, next) {  
  MongoClient.connect(mLab, function (err, db) {
    if (err) {
      console.log("Unable to connect to server", err);
    } else {
      console.log("Connected to server")
      var collection = db.collection('links');
      var params = req.params.url;
      
       //sets current hostname to var local
      var local = req.get('host') + "/";

      var newLink = function (db, callback) {
        collection.findOne({ "url": params }, { short: 1, _id: 0 }, function (err, doc) {
          if (doc != null) {
            res.json({ original_url: params, short_url: local + doc.short });
          } else {
            if (validUrl.isUri(params)) {
              // if URL is valid, do this
              var shortCode = shortid.generate();
              var newUrl = { url: params, short: shortCode };
              collection.insert([newUrl]);
              res.json({ original_url: params, short_url: local + shortCode });
            } else {
            // if URL is invalid, do this
              res.json({ error: "Wrong url format, make sure you have a valid protocol and real site." });
            };
          };
        });
      };

      newLink(db, function () {
        var insertLink = { url: params, short: "test" };
        collection.insert([insertLink]);
        res.send(params);
        db.close();
      });
    };
  });  
});


app.get('/:short', function (req, res, next) {

  MongoClient.connect(mLab, function (err, db) {
    if (err) {
      console.log("Unable to connect to server", err);
    } else {
      console.log("Connected to server")

      var collection = db.collection('links');
      var params = req.params.short;

      var findLink = function (db, callback) {
        collection.findOne({ "short": params }, { url: 1, _id: 0 }, function (err, doc) {
          if (doc != null) {
            res.redirect(doc.url);
          } else {
            res.json({ error: "No corresponding shortlink found in the database." });
          };
        });
      };

      findLink(db, function () {
        db.close();
      });

    };
  });
});


// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`)
})
