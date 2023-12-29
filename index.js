const express = require('express');
const app = express();
const port = 8080;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/privacy', (req, res) => {
    res.sendFile(__dirname + '/public/privacy.html');
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});