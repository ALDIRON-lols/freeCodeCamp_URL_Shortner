require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dns = require('dns');
const url = require('url');
const app = express();

mongoose.connect(process.env.MONGO_URI,  { useNewUrlParser: true, useUnifiedTopology: true });

// Basic Configuration
const port = process.env.PORT || 3000;
const urlSchema = mongoose.Schema({
  long_url: {type: String, required: true},
  short_url: {type: String}
})

var Url = mongoose.model("URL", urlSchema);

app.use(bodyParser.urlencoded({extended: false}));

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function(req, res, next) {
    try {
        const og_url = req.body.url;
        const parsedUrl = new URL(og_url);
        const hostname = parsedUrl.hostname;

        dns.lookup(hostname, function(err, address, family) {
            if (err) {
                res.json({ error: 'invalid url' });
            } else {
                next();
            }
        });
    } catch (error) {
        res.json({ error: 'invalid url' });
    }
}, function(req, res) {
    const s_url = Math.floor(Math.random() * (91 - 1)) + 1;
    const og_url = req.body.url;
    let doc = new Url({ long_url: req.body.url, short_url: s_url });
    doc.save();
    res.json({ original_url: req.body.url, short_url: s_url });
});

app.get('/api/shorturl/:short_url', (req, res)=>{
  Url.findOne({short_url: req.params.short_url}).then((data)=>{
    res.redirect(data.long_url);
  }).catch((err)=>{
    res.json({ error: 'invalid url' });
  })
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
