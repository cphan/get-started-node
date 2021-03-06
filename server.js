var express = require("express");
var app = express();
var cfenv = require("cfenv");
var bodyParser = require('body-parser')
var watson = require('watson-developer-cloud');
var prompt = require('prompt-sync')();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

var mydb;

var conversation = watson.conversation({
  username: '0a6a5518-6a26-450f-bfe6-b7bc0a4b7519',
  password: 'v2wShXkq0wi7',
  version: 'v1',
  version_date: '2017-05-26'
});

var params = {
  workspace_id: 'e2389e3c-d0f1-4c1d-a036-dd73b0ac1218'
};

/* Endpoint to greet and add a new visitor to database.
* Send a POST request to localhost:3000/api/visitors with body
* {
* 	"name": "Bob"
* }
*/
app.post("/api/visitors", function (request, response) {
  var userName = request.body.name;
  if(!mydb) {
    console.log("No database.");
    response.send("Hello " + userName + " from Chris!");
    return;
  }
  // insert the username as a document
  mydb.insert({ "name" : userName }, function(err, body, header) {
    if (err) {
      return console.log('[mydb.insert] ', err.message);
    }
    response.send("Hello " + userName + "! I added you to the database.");
  });
});

app.post("/api/cmas", function (request, response2) {
  var userName = request.body.name;

  conversation.message({
    workspace_id: 'e2389e3c-d0f1-4c1d-a036-dd73b0ac1218',
    input: {'text': userName}
  },  function (err, response) {
    if (err) {
      console.error(err); // something went wrong
      return;
    }

    // If an intent was detected, log it out to the console.
    if (response.intents.length > 0) {
      console.log('Detected intent: #' + response.intents[0].intent);
    }

    // If an entity was detected, log it out to the console.
    if (response.entities.length > 0) {
      console.log('Detected entity: #' + response.entities[0].entity);
    }

    // If a dialog was detected, log it out to the console.
    if (response.dialog) {
      console.log('Detected dialog: #' + response.dialog);
    }


    // Display the output from dialog, if any.
    if (response.output.text.length != 0) {
      //console.log(response.output.text.length);
        // console.log(response.output.text[0]);
        for (var i in response.output.text) {
          console.log(response.output.text[i]);
          response2.send("CMAS_Bot: " + response.output.text[i]);
        }
    }

    // console.log(JSON.stringify(response, null, 2));

    // Prompt for the next round of input.
    // var newMessageFromUser = prompt('>> ');
    //
    // conversation.message({
    //   workspace_id: 'e2389e3c-d0f1-4c1d-a036-dd73b0ac1218',
    //   input: { text: newMessageFromUser }
    //   }, processResponse)
  }
);



  // if(!mydb) {
  //   console.log("No database.");
  //   response.send("Hello " + userName + " from Chris!");
  //   return;
  // }
  // // insert the username as a document
  // mydb.insert({ "name" : userName }, function(err, body, header) {
  //   if (err) {
  //     return console.log('[mydb.insert] ', err.message);
  //   }
  //   response.send("Hello " + userName + "! I added you to the database.");
  // });
});

// Process the conversation response.
function processResponse(err, response) {
  if (err) {
    console.error(err); // something went wrong
    return;
  }

  // If an intent was detected, log it out to the console.
  if (response.intents.length > 0) {
    console.log('Detected intent: #' + response.intents[0].intent);
  }

  // If an entity was detected, log it out to the console.
  if (response.entities.length > 0) {
    console.log('Detected entity: #' + response.entities[0].entity);
  }

  // If a dialog was detected, log it out to the console.
  if (response.dialog) {
    console.log('Detected dialog: #' + response.dialog);
  }


  // Display the output from dialog, if any.
  if (response.output.text.length != 0) {
    //console.log(response.output.text.length);
      // console.log(response.output.text[0]);
      for (var i in response.output.text)
        console.log(response.output.text[i]);
  }

  // console.log(JSON.stringify(response, null, 2));

  // Prompt for the next round of input.
  var newMessageFromUser = prompt('>> ');

  conversation.message({
    workspace_id: 'e2389e3c-d0f1-4c1d-a036-dd73b0ac1218',
    input: { text: newMessageFromUser }
    }, processResponse)
}

/**
 * Endpoint to get a JSON array of all the visitors in the database
 * REST API example:
 * <code>
 * GET http://localhost:3000/api/visitors
 * </code>
 *
 * Response:
 * [ "Bob", "Jane" ]
 * @return An array of all the visitor names
 */
app.get("/api/visitors", function (request, response) {
  var names = [];
  if(!mydb) {
    response.json(names);
    return;
  }

  mydb.list({ include_docs: true }, function(err, body) {
    if (!err) {
      body.rows.forEach(function(row) {
        if(row.doc.name)
          names.push(row.doc.name);
      });
      response.json(names);
    }
  });
});

/**
 * Endpoint to get a JSON array of all the visitors in the database
 * REST API example:
 * <code>
 * GET http://localhost:3000/api/inspectest
 * </code>
 *
 * Response:
 * [ "Bob", "Jane" ]
 * @return An array of all the visitor names
 */
app.get("/api/inspectest", function (request, response) {

  var exec = require('child_process').exec;
  exec("/home/ibmadmin/git/inspec_sec/scripts/checkComplianceOnHosts.sh /home/ibmadmin/git/inspec_sec/scripts/host.swis", function (error, stdout, stderr) {
    if (stdout != null && stdout != "") {
      console.log("stdout: " + stdout);
      stdout2 = stdout;
    }
    if (error != null && error != "") {
      console.log("error: " + error);
    }
    if (stderr != null && stderr != "") {
      console.log("stderr: " + stderr);
    }
    // response.write(stdout);
    // response.end();
    var myJSONString = JSON.stringify(stdout);
    response.json(myJSONString);
    //response.json(stdout);
    return;
  });

});

// load local VCAP configuration  and service credentials
var vcapLocal;
try {
  vcapLocal = require('./vcap-local.json');
  console.log("Loaded local VCAP", vcapLocal);
} catch (e) { }

const appEnvOpts = vcapLocal ? { vcap: vcapLocal} : {}

const appEnv = cfenv.getAppEnv(appEnvOpts);

if (appEnv.services['cloudantNoSQLDB']) {
  // Load the Cloudant library.
  var Cloudant = require('cloudant');

  // Initialize database with credentials
  var cloudant = Cloudant(appEnv.services['cloudantNoSQLDB'][0].credentials);

  //database name
  var dbName = 'mydb';

  // Create a new "mydb" database.
  cloudant.db.create(dbName, function(err, data) {
    if(!err) //err if database doesn't already exists
      console.log("Created database: " + dbName);
  });

  // Specify the database we are going to use (mydb)...
  mydb = cloudant.db.use(dbName);
}

//serve static file (index.html, images, css)
app.use(express.static(__dirname + '/views'));



var port = process.env.PORT || 3000
app.listen(port, function() {
    console.log("To view your app, open this link in your browser: http://localhost:" + port);
});
