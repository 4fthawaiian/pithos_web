var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var app = express();

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.render('pages/index');
});

var exec = require('child_process').exec;
var pithoscmd = '/usr/local/bin/pithosctl';
var volumecmd = 'amixer -D pulse sset Master 5%'; // needs a + or - on the end

app.get('/love', function(req,res) {
  var cmd = pithoscmd+' -l';
  exec(cmd, function(error, stdout, stderr) {
    // command output is in stdout
    res.send(stdout);
  });
});

app.get('/pause', function(req,res) {
  var cmd = pithoscmd+' -p';
  exec(cmd, function(error, stdout, stderr) {
    // command output is in stdout
    res.send(stdout);
  });
});

app.get('/next', function(req,res) {
  var cmd = pithoscmd+' -n';
  exec(cmd, function(error, stdout, stderr) {
    // command output is in stdout
    res.send(stdout);
  });
});

app.get('/current', function(req,res) {
  var cmd = 'dbus-send --print-reply --dest=net.kevinmehall.Pithos /net/kevinmehall/Pithos net.kevinmehall.Pithos.GetCurrentSong |grep string |grep variant';
  exec(cmd, function(error, stdout, stderr) {
    // command output is in stdout
    // variant             string "Greenlight (Single)"
    // variant             string "Greenlight (Feat. Flo Rida & LunchMoney Lewis)"
    // variant             string "Pitbull"
    // variant             string "http://www.pandora.com/pitbull/greenlight-single/greenlight-feat-flo-rida-lunchmoney-lewis?dc=175&ad=0:40:1:63103::0:0:0:1:609:017:MO:29510:2:0:0:0:416:0"
    // we only want lines 1-2
    // can we get the cover image? class="img_cvr"
    var lines = stdout.split("\n");
    var title = lines[1].split("string")[1];
    var artist = lines[2].split("string")[1];
    var info_url = lines[3].split("string")[1].trim().replace(/"/g,'');
    var response_object = {
      artist: artist.trim().replace(/"/g,''),
      title: title.trim().replace(/"/g,''),
      link: info_url
    }
    console.log("response: %o",response_object);
    get_cover(info_url,function(out) {
      response_object["image"] = out;
      res.json(response_object);
    });
  });
});

app.get('/volume/:direction', function(req,res) {
  var dir_val = "+";
  switch(req.params.direction) {
    case "up":
      dir_val = "+";
    break;
    case "down":
      dir_val = "-";
    break;
  }
  var cmd = volumecmd+dir_val;
  var getvolcmd = 'amixer -D pulse sget Master |grep "%" |head -1';
  exec(cmd, function(error, stdout, stderr) {
    exec(getvolcmd, function(errorr, stdoutt, stderrr) {
      res.send(stdoutt);
    });
  });
});

var get_cover = function(url,cb) {
  request(url, function(error, response, html){
    if(!error){
      console.log('getting cover');
      var $ = cheerio.load(html);
      var cover_img = $('.img_cvr');
      cover_img = cover_img[0]['attribs']['src'];
      cb(cover_img);
    } else {
      console.log('u wot m8: %o',error);
      cb("fuck: %o",error);
    }
  })
}
app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
