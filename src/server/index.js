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

app.post('/api/getPoem', (req, res) => {
  console.log(req.body.poemPrompt);
  // execSync('./generateText hello yellow', (error, stdout, stderr) => {
  //   if (error) {
  //     console.log(`error: ${error.message}`);
  //     return;
  //   }
  //   if (stderr) {
  //     console.log(`stderr: ${stderr}`);
  //     return;
  //   }
  //   console.log(`stdout: ${stdout}`);
  // });
  const child = require('child_process').exec(`./generateText ${req.body.poemPrompt}`);
  child.stdout.pipe(process.stdout);
  child.on('exit', function() {
    try {
      //read poem file
      poem = fs.readFileSync('LanguageModels/genOutput.txt', 'utf8');
      // trim poem to 550 char (max length for api)
      poem = poem.substr(0, 550);

      // tried to replace \n with . but reads as "dot"
      const poemPauses = poem.replace(/=/g, ' ');

      // disabled for now
      // post to voice api
      axios.post('https://streamlabs.com/polly/speak', {
        voice: 'Justin',
        text: poemPauses,
      })
        .then((apiResponse) => {
          // console.log(apiResponse.data.speak_url);
          // send data to frontend
          res.send({ poem, apiResponseUrl: apiResponse.data.speak_url, });
        })
        .catch((error) => {
          console.error(error);
        });

      // res.send({ poem, apiResponseUrl: 'abc123', });

    } catch(e) {
      console.log('Error:', e.stack);
    }
  });
});

app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`));
