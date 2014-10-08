console.log('-------------------------');
console.log('-- Node System Monitor --');
console.log('-------------------------\n');

var exec = require('child_process').exec
  , MongoClient = require('mongodb').MongoClient
  , usage = require('usage')
  , _ = require('lodash');

// connect to database
MongoClient.connect('mongodb://localhost:27017/usage', function(err, db) {

  // collection
  var collection = db.collection('logs');
    
  // function to log process
  var logprocess = function(name, interval) {

    // get PIDs of process
    var child = exec("ps -A | grep '[" + name[0] + "]" + name.substr(1) + "' | awk '{ print $1 }'", function(error, stdout, stderr) {

      // split PIDs into an array, remove empty PIDs
      ids = stdout.split("\n");
      _.remove(ids, function(item) { return item.length == 0; });

      // repeat every n milliseconds
      setInterval(function() {

        // for each PID
        _.forEach(ids, function(pid) { 
          usage.lookup(pid, function(err, result) {
            collection.insert({
              pid: pid,
              name: name,
              memory: result.memory,  // bytes
              cpu: result.cpu,        // percentage
              time: (new Date()).toISOString()
            }, function(err, result) {
              if (err !== null) {
                console.log('Error saving to database!');
                console.log(err);
              }
            });
          });
        });

      }, interval);

    });
  }

  // start logging some processes
  logprocess('ipython', 1000);
  logprocess('matlab', 1000);
  console.log('Running process logs!')

});
