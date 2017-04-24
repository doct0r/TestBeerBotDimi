var parameters = {
  classifier_ids: "Heineken_352785902"
}

//request(message.attachments[0].payload.url).pipe(fs.createWriteStream('input.jpg'));
var visual_recognition = watson.visual_recognition({
  api_key: API_KEY,
  version: 'v3',
  version_date: '2016-05-20',
  parameters: [parameters]
});

var params = {
  images_file: fs.createReadStream("input.jpg")
};

visual_recognition.classify(params, function(err, res) {
  if (err)
    console.log(err);
  else
    console.log(JSON.stringify(res, null, 2));
    //console.log("This is the print of it" + message.attachments[0].payload.url);
    sendTextMessage(senderID, "Message with attachment received");
});
