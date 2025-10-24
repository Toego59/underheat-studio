const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const FuzzySet = require('fuzzyset');
const nodemailer = require('nodemailer');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve the HTML interface
app.get('/', (req, res) => {
  // Read the HTML file and send it
  fs.readFile('index.html', 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error loading website');
      return;
    }
    res.send(data);
  });
});

// API endpoints
app.get('/api/addanswer/:Id/:question/:answer/', (req, res) => {
  try{
    fs.readFile("questions_and_answers.json", 'utf8', function(err, data) {
      if (err) {
        // If file doesn't exist, create it with an empty object
        if (err.code === 'ENOENT') {
          data = '{}';
        } else {
          throw err;
        }
      }
      var datajson = JSON.parse(data);
      if (!(typeof datajson[req.params.Id] === 'object' && datajson[req.params.Id] !== null)) {
        datajson[req.params.Id] = {};
      }
      datajson[req.params.Id][req.params.question] = req.params.answer;
      var dataupdated = JSON.stringify(datajson);
      fs.writeFile("questions_and_answers.json", dataupdated, function(err) {
        if (err) return console.log(err);
        res.send("id: " + req.params.Id + "\nadded question: " + req.params.question + "\nwith answer: " + req.params.answer);
      });
    });
  }catch(Err){
    console.log(Err);
    res.status(500).send("Error adding question");
  }
});

app.get('/api/getdata/', (req, res) => {
  try{
    fs.readFile("questions_and_answers.json", 'utf8', function(err, data) {
      if (err) {
        if (err.code === 'ENOENT') {
          // If file doesn't exist, return empty object
          return res.send('{}');
        }
        return console.log(err);
      }
      res.send(data);
    });
  }catch(Err){
    console.log(Err);
    res.status(500).send("Error retrieving data");
  }
});

app.get('/api/search/:id/:question', (req, res) => {
  try{
    fs.readFile("questions_and_answers.json", 'utf8', function(err, data) {
      if (err) {
        if (err.code === 'ENOENT') {
          // If file doesn't exist, return no match
          return res.send("no match");
        }
        return console.log(err);
      }
      a = FuzzySet();
      var questions=JSON.parse(data)[req.params.id];
      if (!questions) {
        return res.send("no match");
      }
      for(var question in questions)a.add(question);
      var searchResult=a.get(req.params.question,"no match",0.33);
      var question, confidence,tempJSON;
      if(searchResult!=="no match"){
        question=searchResult[0][1];
        confidence=searchResult[0][0];
        tempJSON=JSON.parse("{}");
        tempJSON.question=question;
        tempJSON.answer=questions[question];
        tempJSON.confidence=confidence;
      }
      res.send((searchResult=="no match")?searchResult:JSON.stringify(tempJSON));
    });
  }catch(Err){
    console.log(Err);
    res.status(500).send("Error searching");
  }
});

app.get('/api/search/:id', (req, res) => {
  try{
    fs.readFile("questions_and_answers.json", 'utf8', function(err, data) {
      if (err) {
        if (err.code === 'ENOENT') {
          // If file doesn't exist, return empty object
          return res.send('{}');
        }
        return console.log(err);
      }
      var questions=JSON.parse(data)[req.params.id];
      res.send(JSON.stringify(questions || {}));
    });
  }catch(Err){
    console.log(Err);
    res.status(500).send("Error retrieving questions");
  }
});

// Contact form endpoint
app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;

  // Here you would typically:
  // 1. Save to database
  // 2. Send email notification
  // 3. Or process the contact form data

  console.log('Contact form submission:', { name, email, subject, message });

  // For demo purposes, we'll just return a success message
  res.json({ success: true, message: 'Thank you for your message! We will get back to you soon.' });
});

app.get('/api/test', (req, res) => {
  res.send("hello world!");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server started on port ' + port));