const express = require('express');
const fs = require('fs');
const os = require('os');
const axios = require('axios');
const bodyParser =require('body-parser');
const nocache = require('nocache');
const serveStatic = require('serve-static');
// const { exec } = require('child_process');
// const execSync = require('exec-sync');

const app = express();
let poem;

app.use(express.static('dist'));
app.use(serveStatic('public', {acceptRanges: false}));
app.use(bodyParser.json());
app.use(nocache());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "localhost"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post('/api/getPoem', (req, res) => {
  console.log(req.body.poemPrompt);
  // res.send({ poem: 'sad', apiResponseUrl: 'abc123', });

  const child = require('child_process').exec(`./generateText ${req.body.poemPrompt}`);
  child.stdout.pipe(process.stdout);
  child.on('exit', function() {
    try {
      // //read poem file
      poem = fs.readFileSync('LanguageModels/genOutput.txt', 'utf8');
      // trim poem to 550 char (max length for api)
      poem = poem.substr(0, 550);

      // tried to replace \n with . but reads as "dot"
      // const poemPauses = poem.replace(/=/g, ' ');
      console.log(poem);

      // disabled for now
      // post to voice api
      axios.post('https://streamlabs.com/polly/speak', {
        voice: 'Justin',
        text: poem,
      })
        .then((apiResponse) => {
          // console.log(apiResponse.data.speak_url);
          // send data to frontend
          res.send({ poem, apiResponseUrl: apiResponse.data.speak_url, });
          console.log('api responded');
        })
        .catch((error) => {
          console.error(error);
        });

    } catch(e) {
      console.log('Error:', e.stack);
    }
  });
});

const server = app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`));
server.timeout = 99999999999;
