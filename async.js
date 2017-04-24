async.series([
    function(callback) {
        // do some stuff ...
        callback(null, 'one');
    },
    function(callback) {
        // do some more stuff ...
        callback(null, 'two');
    }
],
// optional callback
function(err, results) {
    // results is now equal to ['one', 'two']
});

async.series({
    one: function(callback) {
        setTimeout(function() {
            callback(null, 1);
        }, 200);
    },
    two: function(callback){
        setTimeout(function() {
            callback(null, 2);
        }, 100);
    }
}, function(err, results) {
    // results is now equal to: {one: 1, two: 2}
});


async.series([
  function(callback) {
    request(message.attachments[0].payload.url).pipe(fs.createWriteStream('input.jpg'));
    callback();
  },
  function(callback) {
    var params = {
      images_file: fs.createReadStream("input.jpg")
    };

    visual_recognition.classify(params, function(err, res) {
      if (err)
        console.log(err);
      else
        console.log(JSON.stringify(res, null, 2));
        //console.log("This is the print of it" + message.attachments[0].payload.url);
        callback(null, res);
    });
  }
],
// optional callback
function(err, results) {
    console.log(results);
    sendTextMessage(senderID, "Message with attachment received");
    // results is now equal to ['one', 'two']
});
