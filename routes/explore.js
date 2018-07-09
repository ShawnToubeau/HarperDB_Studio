const express = require("express"),
  router = express.Router(),
  hdb_callout = require("./../utility/harperDBCallout"),
  reduceDescribeAllObject = require("./../utility/reduceDescribeAllObject"),
  isAuthenticated = require("../utility/checkAuthenticate").isAuthenticated,
  favorite = require("../utility/favoritesQuery"),
  mapDynamicToStableObject = require("../utility/mapDynamicToStableObject"),
  breadcrumb = require("../utility/breadcrumb"),
  sortSchemas = require("../utility/sortSchemas");

router.get("/", [isAuthenticated, breadcrumb], function(req, res) {
  favorite.getLivelink(req).then(recents => {
    res.render("explore", {
      recents: recents,
      user: req.user
    });
  });
});

router.get("/sql_search", isAuthenticated, function(req, res) {
  var call_object = {
    username: req.user.username,
    password: req.user.password,
    endpoint_url: req.user.endpoint_url,
    endpoint_port: req.user.endpoint_port
  };

  var operation = {
    operation: "describe_all"
  };

  hdb_callout
    .callHarperDB(call_object, operation)
    .then(result => {
      if (result.error) throw new Error(result.error); // unhandeled HDB error
      var keywords = reduceDescribeAllObject(result);
      res.render("sql_search", {
        keywords: JSON.stringify(keywords),
        schemas: sortSchemas(result),
        user: req.user,
        breadcrumb: {
          name: req.session.cur_url_name,
          path: req.session.cur_url_path
        }
      });
    })
    .catch(err => err); // unhandeled error; consider two cases 1: when HDB returns an error, 2: network error
});

router.get("/sql_search_edit/:livelinkId", isAuthenticated, function(req, res) {
  var call_object = {
    username: req.user.username,
    password: req.user.password,
    endpoint_url: req.user.endpoint_url,
    endpoint_port: req.user.endpoint_port
  };

  var operation = {
    operation: "describe_all"
  };

  favorite
    .getLivelinkById(req, req.params.livelinkId)
    .then(resObj => {
      // I do not like nested async calls like this. consider using async/await instead.
      hdb_callout
        .callHarperDB(call_object, operation)
        .then(result => {
          if (result.error) throw new Error(result.error); // unhandeled HDB error
          var keywords = reduceDescribeAllObject(result);
          res.render("sql_search", {
            keywords: JSON.stringify(keywords),
            schemas: sortSchemas(result),
            user: req.user,
            breadcrumb: {
              name: req.session.cur_url_name,
              path: req.session.cur_url_path
            },
            livelinkObject: JSON.stringify(resObj)
          });
        })
        .catch(err => err); // unhandeled error; consider case on L:68
    })
    .catch(err => res.status(400).send(err)); // inspect error for more accurate statusCode; consider handling the .callHarperDB catch case here as well
});

router.get("/sql_search/:sqllink", isAuthenticated, function(req, res) {
  var call_object = {
    username: req.user.username,
    password: req.user.password,
    endpoint_url: req.user.endpoint_url,
    endpoint_port: req.user.endpoint_port
  };

  var operation = {
    operation: "describe_all"
  };

  hdb_callout
    .callHarperDB(call_object, operation)
    .then(result => {
      if (result.error) throw new Error(result.error); // unhandeled error
      var keywords = reduceDescribeAllObject(result);
      res.render("sql_search", {
        keywords: JSON.stringify(keywords),
        schemas: sortSchemas(result),
        sqlLink: Buffer.from(req.params.sqllink, "base64").toString(),
        user: req.user
      });
    })
    .catch(err => err); // unhandeled error
});

router.get("/filter_search", isAuthenticated, function(req, res) {
  var call_object = {
    username: req.user.username,
    password: req.user.password,
    endpoint_url: req.user.endpoint_url,
    endpoint_port: req.user.endpoint_port
  };

  var operation = {
    operation: "describe_all"
  };

  hdb_callout
    .callHarperDB(call_object, operation)
    .then(result => {
      if (result.error) throw new Error();
      return res.render("filter_search", {
        schemas: JSON.stringify(sortSchemas(result)),
        user: req.user
      });
    })
    .catch(err => err); // unhandeled error
});

router.post("/filter_search", isAuthenticated, function(req, res) {
  var connection = {
    username: req.user.username,
    password: req.user.password,
    endpoint_url: req.user.endpoint_url,
    endpoint_port: req.user.endpoint_port
  };

  var operation = {
    operation: "sql",
    sql: req.body.sql
  };

  hdb_callout
    .callHarperDB(connection, operation)
    .then(result =>
      res.status(200).send({
        result: mapDynamicToStableObject(result),
        sql: req.body.sql
      })
    )
    .catch(err => res.status(400).send(err)); // inspect err for status code
});

router.post("/setfavorite", isAuthenticated, function(req, res) {
  var connection = {
    username: req.user.username,
    password: req.user.password,
    endpoint_url: req.user.endpoint_url,
    endpoint_port: req.user.endpoint_port
  };
  var favoriteObj = {
    sql: req.body.sql,
    name: req.body.name,
    note: req.body.note
  };

  favorite.setFavorites(req, res, favoriteObj).then(result => {
    return res.status(200).send(result);
  });
});
module.exports = router;
