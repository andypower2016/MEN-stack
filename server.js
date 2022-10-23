console.log('Server running %s', __dirname);

// requires
const express = require('express'); // express framework
var bodyParser = require('body-parser'); // for parser json request body
const MongoClient = require('mongodb').MongoClient; // MongoDB
var formidable = require("formidable");
var fs = require("fs");

// Uses
const app = express();
app.use(express.static('public'));
app.use(bodyParser.json());

var port = 8000
var absUploadPath = __dirname + "\\public\\uploads\\"
app.listen(port, () => {
    console.log('listening on %d', port);
});

var homePage = "\\index.html"
app.get('/', function (req, res) {
    console.log('[client request homepage]');
    res.sendFile(__dirname + homePage);
});


app.post('/test_post_from_python', function (req, res) {
    console.log('[client request test_post]');
    console.log(" req body=%s", req.body);   // parsed by body-parser

    //reqJson = JSON.stringify(req.body) // convert json to string
    console.log("reqJson=%s",req.body["content"]);
    encodeObj=req.body["encode"];
    console.log("encode=%s",encodeObj["a"]);

    // server response
    const resJson = {
      message:"Hello ! Test Python",
      nest_data:{
          data1: "data1",
          data2:"data2",
          data3: "data3"
      },
      endingMessage:"N/A"
    }

    const strResJson = JSON.stringify(resJson);
    res.end(strResJson);
    console.log('[server response test_post_from_python done]');
});



app.post('/clicked', function (req, res) {

    console.log('[client request clicked]');
    // db url
    var db_url = req.body["db_url"]
    console.log('db url=%s', db_url);

    // get current time
    let ts = Date.now();
    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();

    const curTime = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds
    const click = {clickTime: curTime};
    console.log(click);

    // Connect DB and export data
    MongoClient.connect(db_url, function (err, db) {
      
      if(err) {
        res.sendStatus(500);
        return console.log(err);
      }

      // DB name 
      var dbObj = db.db("click_test") 

      // insert data to DB collection
      dbObj.collection("clicks").insertOne(click, function(err, res) {  
          if (err) {
            res.sendStatus(500);
            return console.log(err);
          }
          console.log("1 click inserted");
          db.close();    
      });

      // send response
      resJson = JSON.stringify({"info":"insert db done"})
      res.end(resJson)

    });

    console.log('[server response clicked done]');
});


// fileupload
app.post('/fileupload', function (req, res) {
  console.log('[client request fileupload]');

  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    
    var tmpPath = files.filetoupload.filepath;
    var savePath = absUploadPath + files.filetoupload.originalFilename;
    
    console.log('file name=%s', files.filetoupload.originalFilename)
    console.log('tmpPath=%s', tmpPath)
    console.log('savePath=%s', savePath)
  
    // copy the file to a new location
    fs.copyFile(tmpPath, savePath, function (err) {
      
          if (err) {
            res.send('error uploading file')
            throw err;
          }
          
          // you may respond with another html page
          res.write('File uploaded and moved!');
          res.end();
          
          // Delete tmp file
          fs.unlink(tmpPath, function(err) {
              if(err) {
                res.send('error uploading file')  
                return console.log(err); 
              }
              console.log('Tmp file %s deleted successfully', tmpPath);
          }); 
    });
  });

});


function getFileNameFromPath(filepath) {
  var filename = filepath.replace(/^.*[\\\/]/, '')
  return filename;
}

// export db
app.post('/fileexport', function (req, res) {
  
  var fileName = getFileNameFromPath(req.body["filename"]);
  var targetExportFile = absUploadPath + fileName;
  var db_url = req.body["db_url"]
  var insertData

  console.log('[client request fileexport]');
  console.log("  req body=%s", req.body);
  console.log("  target export file=%s", targetExportFile);
  console.log("  db url=%s", db_url);

  if( fileName == "") {
    res.send('File export failed ! Empty filename !');
    res.end();
    return console.log('File export failed ! Empty filename !')
  }
  
  // Connect DB and export data
  MongoClient.connect(db_url, function (err, db) {

    var dbObj = db.db("mymondb")  // DB name 

    if(err) {
      res.sendStatus(500);
      return console.log(err);
    }

    imageData = fs.readFileSync(targetExportFile, 'binary', function (err, data) {
        if(err) {
          console.log(err);
          res.send('File export failed!');
          res.end();
        }
    });

    insertData = {
      "photoname" : fileName,
      "imagedata" : imageData
    }

    // insert data to DB collection
    dbObj.collection("photos").insertOne(insertData, function(err, res) {  
        if (err) {
          res.sendStatus(500);
          return console.log(err);
        }
        console.log("1 photo inserted");
        db.close();    
    });

    // send response
    res.write('File export success!');
    res.end();

  });
  
  
  console.log('[server response fileexport done]');
});