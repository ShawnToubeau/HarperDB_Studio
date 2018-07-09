/* getting tired of rewriting the same comments
 * on unhandled errors. Will comment: '// UH E' 
 * to indicate unhandled error. - Ethan
 * */
const express = require("express"),
  router = express.Router(),
  hdb_callout = require("../utility/harperDBCallout"),
  isAuthenticated = require("../utility/checkAuthenticate").isAuthenticated,
  breadcrumb = require("../utility/breadcrumb"),
  sortSchemas = require("../utility/sortSchemas");

router.get("/", [isAuthenticated, breadcrumb], function(req, res) {
  req.session.preUrl = "/schema";
  var operation = {
    operation: "describe_all"
  };
  var call_object = {
    username: req.user.username,
    password: req.user.password,
    endpoint_url: req.user.endpoint_url,
    endpoint_port: req.user.endpoint_port
  };

  hdb_callout
    .callHarperDB(call_object, operation)
    .then(allSchema =>
      res.render("schema", {
        schemas: sortSchemas(allSchema),
        user: req.user
      })
    )
    .catch(err => err); // UH E
});

router.post("/", isAuthenticated, async function(req, res) {
  var operation = {
    operation: "describe_all"
  };
  if (req.body.addType == "schema") {
    var operationAdd = {
      operation: "create_schema",
      schema: req.body.schemaName
    };
  } else {
    var operationAdd = {
      operation: "create_table",
      schema: req.body.schemaName,
      table: req.body.tableName,
      hash_attribute: req.body.hashAttribute
    };
  }

  var call_object = {
    username: req.user.username,
    password: req.user.password,
    endpoint_url: req.user.endpoint_url,
    endpoint_port: req.user.endpoint_port
  };

  try {
    let message = await hdb_callout.callHarperDB(call_object, operationAdd);
    let allSchema = await hdb_callout.callHarperDB(call_object, operation);

    return res.render("schema", {
      message: JSON.stringify(message),
      schemas: allSchema,
      user: req.user
    });
  } catch (err) {
    return err; // UH E
  }
});

router.get("/:schemaName", isAuthenticated, function(req, res) {
  // could use object destructuring here; probably other places this can be updated too
  // i.e. call_object = { ...req.user }
  var call_object = {
    username: req.user.username,
    password: req.user.password,
    endpoint_url: req.user.endpoint_url,
    endpoint_port: req.user.endpoint_port
  };

  var operation = {
    operation: "describe_schema",
    schema: req.params.schemaName
  };

  hdb_callout
    .callHarperDB(call_object, operation)
    .then(schema =>
      res.render("schema_name", {
        schemaName: req.params.schemaName,
        schema: schema,
        user: req.user
      })
    )
    .catch(err => err); // UH E
});

router.post("/addtable/:schemaName", isAuthenticated, async function(req, res) {
  var operationAdd = {
    operation: "create_table",
    schema: req.params.schemaName,
    table: req.body.tableName,
    hash_attribute: req.body.hashAttribute
  };

  var call_object = {
    username: req.user.username,
    password: req.user.password,
    endpoint_url: req.user.endpoint_url,
    endpoint_port: req.user.endpoint_port
  };

  var operation = {
    operation: "describe_schema",
    schema: req.params.schemaName
  };

  try {
    let message = await hdb_callout.callHarperDB(call_object, operationAdd);
    let schema = await hdb_callout.callHarperDB(call_object, operation);

    return res.render("schema_name", {
      schemaName: req.params.schemaName,
      schema: schema,
      message: JSON.stringify(message),
      user: req.user
    });
  } catch (err) {
    return err; // UH E
  }
});

router.post("/upload_csv/:schemaName", isAuthenticated, async function(
  req,
  res
) {
  var call_object = {
    username: req.user.username,
    password: req.user.password,
    endpoint_url: req.user.endpoint_url,
    endpoint_port: req.user.endpoint_port
  };

  var operation = {
    operation: "describe_schema",
    schema: req.body.schemaName
  };
  var operationCSV = {
    schema: req.body.schemaName,
    table: req.body.tableName
  };

  if (req.body.csvType == "file") {
    operationCSV = {
      operation: "csv_file_load",
      file_path: req.body.csvPath
    };
  } else if (req.body.csvType == "url") {
    operationCSV = {
      operation: "csv_url_load",
      csv_url: req.body.csvUrl
    };
  } else {
    operationCSV = {
      operation: "csv_data_load",
      data: req.body.csvData
    };
  }

  try {
    let message = await hdb_callout.callHarperDB(call_object, operationCSV);
    let schema = await hdb_callout.callHarperDB(call_object, operation);

    return res.render("schema_name", {
      schemaName: req.params.schemaName,
      schema: schema,
      message: JSON.stringify(message),
      user: req.user
    });
  } catch (err) {
    return err; // UH E
  }
});

router.post("/delete", isAuthenticated, function(req, res) {
  var call_object = {
    username: req.user.username,
    password: req.user.password,
    endpoint_url: req.user.endpoint_url,
    endpoint_port: req.user.endpoint_port
  };

  var operationdelete = {
    schema: req.body.schemaName
  };

  if (req.body.deleteType == "schema") {
    operationdelete = {
      operation: "drop_schema"
    };
  } else {
    operationdelete = {
      operation: "drop_table",
      table: req.body.tableName
    };
  }

  hdb_callout
    .callHarperDB(call_object, operationdelete)
    .then(schema => {
      if (req.body.deleteType == "schema") res.redirect("/schema");
      else res.redirect("/schema/" + req.body.schemaName);
    })
    .catch(err => err); // UH E
});

router.post("/records", isAuthenticated, function(req, res) {
  var call_object = {
    username: req.user.username,
    password: req.user.password,
    endpoint_url: req.user.endpoint_url,
    endpoint_port: req.user.endpoint_port
  };
  var tableName = req.body.schemaName + "." + req.body.tableName;
  // var dotIndex = tableName.indexOf('.');
  // var sql = tableName.substr(0, dotIndex + 1) + "\"" + tableName.substr(dotIndex + 1) + "\"";

  var operation = {
    operation: "sql",
    sql: "SELECT COUNT(*) AS num FROM " + tableName
  };

  hdb_callout
    .callHarperDB(call_object, operation)
    .then(message => res.status(200).send(message))
    .catch(err => res.status(400).send(err)); // check error statuscode
});

router.post("/csv", isAuthenticated, async function(req, res) {
  var operation = {
    operation: "describe_all"
  };

  var operationCSV = {
    schema: req.body.schemaName,
    table: req.body.selectTableName
  };

  if (req.body.csvType == "file") {
    operationCSV.operation = "csv_file_load";
    operationCSV.file_path = req.body.csvPath;
  } else if (req.body.csvType == "url") {
    operationCSV.operation = "csv_url_load";
    operationCSV.csv_url = req.body.csvUrl;
  } else {
    operationCSV.operation = "csv_data_load";
    operationCSV.data = req.body.csvData;
  }

  var call_object = {
    username: req.user.username,
    password: req.user.password,
    endpoint_url: req.user.endpoint_url,
    endpoint_port: req.user.endpoint_port
  };

  try {
    let message = await hdb_callout.callHarperDB(call_object, operationCSV);
    let allSchema = await hdb_callout.callHarperDB(call_object, operation);
    return res.render("schema", {
      message: JSON.stringify(message),
      schemas: allSchema,
      user: req.user
    });
  } catch (err) {
    return err; // UH E
  }
});

module.exports = router;
