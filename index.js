const express = require('express');
const app = express();
const port = 8080;
const axios = require('axios');
const cheerio = require('cheerio');

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



app.get('/feed', async (req, res) => {
  try {
    const response = await axios.get('https://t.me/s/radar_app');
    const html = response.data;
    const $ = cheerio.load(html);

    const posts = [];

    $('.tgme_widget_message').each((index, element) => {
      const post = {
        author: $(element).find('.tgme_widget_message_owner_name').text().trim(),
        timestamp: $(element).find('.time').text().trim(),
        content: $(element).find('.tgme_widget_message_text').text().trim(),
        url: `https://t.me${$(element).find('.tgme_widget_message_date').attr('href')}`,
      };
      posts.push(post);
    });

    res.json(posts);
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});