const express = require("express"),
  router = express.Router(),
  hdb_callout = require("../utility/harperDBCallout"),
  reduceTypeLogs = require("../utility/reduceTypeLogs"),
  isAuthenticated = require("../utility/checkAuthenticate").isAuthenticated,
  CryptoJS = require("crypto-js"),
  favorite = require("../utility/favoritesQuery"),
  guid = require("guid");

const secretkey = "gettingLiveLinkOnly123!!!";

router.post("/save", isAuthenticated, function(req, res) {
  var new_id = guid.create();
  var en_url = encryptLivelink(req, new_id);
  favorite.setLiveLink(req, en_url, new_id).then(result => {
    return res.status(200).send(result);
  });
});

router.put("/update/:id", isAuthenticated, function(req, res) {
  favorite.updateLiveLink(req, req.params.id).then(result => {
    return res.status(200).send(result);
  });
});

router.get("/livelinklist", isAuthenticated, function(req, res) {
  favorite.getLivelink(req).then(recents => {
    return res.status(200).send(recents);
  });
});

router.post("/getlivelink", isAuthenticated, function(req, res) {
  var en_url = encryptLivelink(req);
  return res.status(200).send(en_url);
});

router.put("/unfavorite/:id/:isFavorited", isAuthenticated, function(req, res) {
  var call_object = {
    username: req.user.username,
    password: req.user.password,
    endpoint_url: req.user.endpoint_url,
    endpoint_port: req.user.endpoint_port
  };
  var operation = {
    operation: "update",
    schema: "harperdb_studio",
    table: "livelink",
    records: [
      {
        id: req.params.id,
        isFavorited: req.params.isFavorited
      }
    ]
  };

  hdb_callout
    .callHarperDB(call_object, operation)
    .then(result => res.status(200).send(result))
    .catch(err => res.status(400).send(err)); // inspect err for status code
});

// example of using async/await to replace nested callHarperDB method calls
router.get("/publis/:key", async function(req, res) {
  var decode64 = Buffer.from(req.params.key, "base64").toString("ascii");
  var bytes = CryptoJS.AES.decrypt(decode64, secretkey);
  var decryptedObject = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

  var call_object = {
    username: decryptedObject.un,
    password: decryptedObject.pw,
    endpoint_url: decryptedObject.eurl,
    endpoint_port: decryptedObject.epp
  };

  var operation = {
    operation: "sql",
    sql:
      "SELECT * FROM harperdb_studio.livelink WHERE id ='" +
      decryptedObject.id +
      "' "
  };

  try {
    let sqlLiveLink = await hdb_callout.callHarperDB(call_object, operation);
    if (sqlLiveLink.length > 0) {
      operation = {
        operation: "sql",
        sql: sqlLiveLink[0].sql
      };
      let sqlData = await hdb_callout.callHarperDB(call_object, operation);
      res.render("live_link", {
        graphDetail: JSON.stringify({
          data: sqlData,
          options: sqlLivelink[0].options,
          graphType: sqlLivelink[0].graphType
        }),
        notes: sqlLivelink[0].notes,
        livelinkName: sqlLivelink[0].livelinkName,
        isFavorited: sqlLivelink[0].isFavorited
      });
    } else {
      res.render("live_link", {
        error: "live link is not found"
      });
    }
  } catch (err) {
    // what if we have a network error?
    // **we have to figure out better error handling**
    res.render("live_link", {
      error: err.message
    });
  }
});

router.get("/delete/:id", isAuthenticated, function(req, res) {
  var call_object = {
    username: req.user.username,
    password: req.user.password,
    endpoint_url: req.user.endpoint_url,
    endpoint_port: req.user.endpoint_port
  };
  var operation = {
    operation: "delete",
    schema: "harperdb_studio",
    table: "livelink",
    hash_values: [req.params.id]
  };
  hdb_callout
    .callHarperDB(call_object, operation)
    .then(result => res.status(200).send(result))
    .catch(err => res.status(400).send(err)); // inspect err for status code
});

var encryptLivelink = (req, id) => {
  var obj = {
    un: req.user.username,
    pw: req.user.password,
    eurl: req.user.endpoint_url,
    epp: req.user.endpoint_port,
    id: id
  };

  var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(obj), secretkey);
  var en_url = Buffer.from(ciphertext.toString()).toString("base64");
  return en_url;
};

module.exports = router;
