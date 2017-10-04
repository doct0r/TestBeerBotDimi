

'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');
const cfenv = require('cfenv');
const Conversation = require('watson-developer-cloud/conversation/v1'); // watson sdk
const VisualRecognition = require('watson-developer-cloud/conversation/v1'); // watson sdk

let app = express();
let appEnv = cfenv.getAppEnv();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));



appEnv.verify_token = "this_is_a_validation_token";
appEnv.fb_page_access_token = "EAARjIUjZCfvsBAObLsDtn7bBMh9ZCYeyeKZCe5q8rlOhAdIcuERR55j2TqhZAwaZB0e4U0oB9xbSlqxfbw7vfD1lOzZB0DpyMzZAUvLOxJDZCZBJuMJGRLFAP04Nk98GjTtUCxuzkXtQ209pK3tCwuF5izzdVxUIqUX0JqcMMb6CVgQZDZD",
appEnv.CONVERSATION_USERNAME = "f4f8e5b5-8e60-479f-b823-3ba74f091c37";
appEnv.CONVERSATION_PASSWORD = "G0lH0vp3F80n";
appEnv.WORKSPACE_ID = "db68b2e9-ff81-42d8-a53d-533910cc6ba6";
appEnv.VISUAL_RECOGNITION_API_KEY = "9e9a1b732a057f27b92bf851c84f400017d381e0"

console.log(appEnv);

var conversation = new Conversation({
  // If unspecified here, the CONVERSATION_USERNAME and CONVERSATION_PASSWORD env properties will be checked
  // After that, the SDK will fall back to the bluemix-provided VCAP_SERVICES environment property
  'username': appEnv.CONVERSATION_USERNAME,
  'password': appEnv.CONVERSATION_PASSWORD,
  'version_date': Conversation.VERSION_DATE_2017_04_21
});

// // Create the service wrapper
// // If no API Key is provided here, the watson-developer-cloud@2.x.x library will check for an VISUAL_RECOGNITION_API_KEY
// // environment property and then fall back to the VCAP_SERVICES property provided by Bluemix.
// var visualRecognition = new watson.VisualRecognitionV3({
//   api_key: appEnv.VISUAL_RECOGNITION_API_KEY,
//   version_date: '2015-05-19'
// });

app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === appEnv.verify_token) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});

app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});

// Incoming events handling
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:",
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {
    // If we receive a text message, check to see if it matches a keyword
    // and send back the template example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'generic':
        sendGenericMessage(senderID);
        break;

      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    //var info = chalk.green;
    var image_url = encodeURIComponent(message.attachments[0].payload.url);
    var url = 'https://gateway-a.watsonplatform.net/visual-recognition/api/v3/classify?api_key='+API_KEY+'&url='+image_url+'&version=2016-05-19&classifier_ids=Beers_723811947,default&threshold=0.50'
    console.log(info("Calling url: ") + url);
    request(url, function (error, response, body) {
      //console.log('error:', error); // Print the error if one occurred
      //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
      //console.log('body:' + body.images); // Print the HTML for the Google homepage.
      console.log(body);
      body = JSON.parse(body);
      console.log(body.images[0].classifiers[0].classes[0].class);
      if (body.images[0].classifiers[0].name === "Beers") {
        var brand = body.images[0].classifiers[0].classes[0].class;
        //if (body.images[0].classifiers[0].classes[0].class === "Beach") {
        if (brand === "HNK") {
          sendGenericMessage(senderID);
        }
        else if (brand === "Tiger") {
          sendTextMessage(senderID, "It's a Tiger!");
        }
        else if (brand === "Verde") {
          sendTextMessage(senderID, "It's a Desperados Verde!");
        }
        else if (brand === "Mojito") {
          sendTextMessage(senderID, "It's a Desperados Mojito!");
        }
        else if (brand === "Lagunitas") {
          sendTextMessage(senderID, "It's a Lagunitas!");
        }
      }
      else {
        sendTextMessage(senderID, "I don't know this beer");
      }

    });
  }
}



function sendTextMessage(recipientId, messageText) {
  var payload = {
    workspace_id: appEnv.WORKSPACE_ID,
    context: {},
    input: {
      text : messageText
    }
  };

  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  // Send the input to the conversation service
  conversation.message(payload, function(err, data) {
    if (err) {
      messageData.message.text = "error";
        callSendAPI(messageData);
    } else {
      console.log(data.output.text);

      for(var i in data.output.text) {
        messageData.message.text = data.output.text[i];
        callSendAPI(messageData);
      }
    }
  });
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: appEnv.fb_page_access_token },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s",
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });
}

app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
