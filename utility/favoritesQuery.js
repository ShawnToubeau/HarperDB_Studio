const hdb_callout = require("./harperDBCallout");
const guid = require("guid");

const setFavorites = function(req, res, favoriteObj) {
  return new Promise(function(resolve) {
    const call_object = {
      username: req.user.username,
      password: req.user.password,
      endpoint_url: req.user.endpoint_url,
      endpoint_port: req.user.endpoint_port
    };

    const record = {
      sql: favoriteObj.sql,
      name: favoriteObj.name,
      note: favoriteObj.note,
      username: req.user.username,
      date: new Date(),
      id: guid.create()
    };

    const operation = {
      operation: "insert",
      schema: "harperdb_studio",
      table: "query",
      records: [record]
    };
    hdb_callout.callHarperDB(call_object, operation, function(err, result) {
      if (err || result.error) {
        createTable(req, res, "query").then(() => {
          hdb_callout.callHarperDB(call_object, operation, function(
            err2,
            result2
          ) {
            resolve(result2);
          });
        });
      }
      resolve(result);
    });
  });
};

const setLiveLink = function(req, res, en_url, id) {
  return new Promise(function(resolve) {
    const call_object = {
      username: req.user.username,
      password: req.user.password,
      endpoint_url: req.user.endpoint_url,
      endpoint_port: req.user.endpoint_port
    };

    const record = {
      en_url: en_url,
      date: new Date(),
      id: id.value,
      username: req.user.username,
      livelinkName: req.body.livelinkName,
      sql: req.body.sql,
      options: req.body.options,
      livelinkName: req.body.livelinkName,
      notes: req.body.notes,
      graphType: req.body.graphType,
      isFavorited: req.body.isFavorited
    };

    const operation = {
      operation: "insert",
      schema: "harperdb_studio",
      table: "livelink",
      records: [record]
    };
    hdb_callout.callHarperDB(call_object, operation, function(err, result) {
      if (err || result.error) {
        createTable(req, res, "livelink").then(() => {
          hdb_callout.callHarperDB(call_object, operation, function(
            err2,
            result2
          ) {
            resolve(result2);
          });
        });
      } else resolve(result);
    });
  });
};

const updateLiveLink = function(req, id) {
  return new Promise(function(resolve) {
    const call_object = {
      username: req.user.username,
      password: req.user.password,
      endpoint_url: req.user.endpoint_url,
      endpoint_port: req.user.endpoint_port
    };

    const record = {
      id: id,
      date: new Date(),
      username: req.user.username,
      livelinkName: req.body.livelinkName,
      sql: req.body.sql,
      options: req.body.options,
      livelinkName: req.body.livelinkName,
      notes: req.body.notes,
      graphType: req.body.graphType,
      isFavorited: true
    };

    const operation = {
      operation: "update",
      schema: "harperdb_studio",
      table: "livelink",
      records: [record]
    };
    hdb_callout.callHarperDB(call_object, operation, function(err, result) {
      resolve(result);
    });
  });
};

const getFavorites = function(req, res) {
  return new Promise(function(resolve) {
    const call_object = {
      username: req.user.username,
      password: req.user.password,
      endpoint_url: req.user.endpoint_url,
      endpoint_port: req.user.endpoint_port
    };

    const operation = {
      operation: "sql",
      sql:
        "SELECT * FROM harperdb_studio.query WHERE username = '" +
        req.user.username +
        "' ORDER BY date DESC  LIMIT 10"
    };

    hdb_callout.callHarperDB(call_object, operation, function(err, result) {
      if (err || result.error) {
        createTable(req, res, "query").then(() => {
          hdb_callout.callHarperDB(call_object, operation, function(
            err2,
            result2
          ) {
            resolve(result2);
          });
        });
      } else {
        resolve(result);
      }
    });
  });
};

const getLivelink = function(req, res) {
  return new Promise(function(resolve) {
    const call_object = {
      username: req.user.username,
      password: req.user.password,
      endpoint_url: req.user.endpoint_url,
      endpoint_port: req.user.endpoint_port
    };

    const operation = {
      operation: "sql",
      sql:
        "SELECT * FROM harperdb_studio.livelink WHERE username = '" +
        req.user.username +
        "' ORDER BY date DESC  LIMIT 10"
    };

    hdb_callout.callHarperDB(call_object, operation, function(err, result) {
      if (err || result.error) {
        console.log(err);

        createTable(req, res, "livelink").then(() => {
          hdb_callout.callHarperDB(call_object, operation, function(
            err2,
            result2
          ) {
            resolve(result2);
          });
        });
      } else {
        resolve(result);
      }
    });
  });
};

const getLivelinkById = function(req, id) {
  return new Promise(function(resolve) {
    const call_object = {
      username: req.user.username,
      password: req.user.password,
      endpoint_url: req.user.endpoint_url,
      endpoint_port: req.user.endpoint_port
    };

    const operation = {
      operation: "sql",
      sql: "SELECT * FROM harperdb_studio.livelink WHERE id = '" + id + "'"
    };
    hdb_callout.callHarperDB(call_object, operation, function(err, result) {
      if (err || result.error) resolve(result);
      else if (result.length > 0) resolve(result[0]);
      else resolve(result);
    });
  });
};

const createTable = function(req, res, tableType) {
  return new Promise(function(resolve) {
    const call_object = {
      username: req.user.username,
      password: req.user.password,
      endpoint_url: req.user.endpoint_url,
      endpoint_port: req.user.endpoint_port
    };

    const operation = {
      operation: "create_table",
      schema: "harperdb_studio",
      table: tableType,
      hash_attribute: "id"
    };
    createFavoriteSearchSchema(req, res).then(() => {
      hdb_callout.callHarperDB(call_object, operation, function(err, result) {
        if (err || result.error) {
          resolve(result);
        }
        resolve(result);
      });
    });
  });
};

const createFavoriteSearchSchema = function(req) {
  return new Promise(function(resolve) {
    const call_object = {
      username: req.user.username,
      password: req.user.password,
      endpoint_url: req.user.endpoint_url,
      endpoint_port: req.user.endpoint_port
    };

    const operation = {
      operation: "create_schema",
      schema: "harperdb_studio"
    };

    hdb_callout.callHarperDB(call_object, operation, function(err, result) {
      if (err || result.error) {
        resolve(err);
      }
      resolve(result);
    });
  });
};

module.exports = {
  setFavorites: setFavorites,
  createFavoriteSearchSchema: createFavoriteSearchSchema,
  createUserFavoriteTable: createTable,
  getFavorites: getFavorites,
  setLiveLink: setLiveLink,
  getLivelink: getLivelink,
  getLivelinkById: getLivelinkById,
  updateLiveLink: updateLiveLink
};
