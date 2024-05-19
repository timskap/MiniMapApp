const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const port = 8080;

app.set('view engine', 'ejs');
app.set('views', './views'); // This is where your EJS templates will be stored

app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.render('index', { currentPage: 'home', pageTitle: 'Home' });
});

app.get('/privacy', (req, res) => {
  res.render('privacy', { currentPage: 'privacy', pageTitle: 'Privacy Policy' });
});

app.get('/contest', (req, res) => {
  res.render('contest', { currentPage: 'contest', pageTitle: 'Contest' });
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

    $('.tgme_widget_message_wrap').each((index, element) => {
      const $messageWrap = $(element);
      const $message = $messageWrap.find('.tgme_widget_message');
  
      const post = {
        author: $message.find('.tgme_widget_message_owner_name').text().trim(),
        timestamp: $(element).find('.time').text().trim(),
        content: $message.find('.tgme_widget_message_text').html() || null,
        url: `https://t.me${$message.find('.tgme_widget_message_date').attr('href')}`,
      };

      // Handle single image
      const singleImageUrl = $message.find('.tgme_widget_message_photo_wrap').css('background-image');
      if (singleImageUrl) {
        post.image = singleImageUrl.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
      }

      // Handle gallery
      const galleryImages = [];
      $message.find('.tgme_widget_message_photo_wrap.grouped_media_wrap').each((_, galleryImage) => {
        const imageUrl = $(galleryImage).css('background-image');
        if (imageUrl) {
          galleryImages.push(imageUrl.replace(/^url\(["']?/, '').replace(/["']?\)$/, ''));
        }
      });
      if (galleryImages.length > 0) {
        post.gallery = galleryImages;
      }

      const videoThumbnailUrl = $message.find('.tgme_widget_message_video_thumb').css('background-image');
      if (videoThumbnailUrl) {
        const regex = /url\('(.+)'\)/;
        const match = regex.exec(videoThumbnailUrl);
        if (match) {
          post.videoBackground = match[1];
        }
      }
      const videoUrl = $message.find('video').attr('src');
      if (videoUrl) {
        post.video = videoUrl;
      }

      posts.push(post);
    });

    const latestPosts = posts.slice(-10).reverse();

    res.json(latestPosts);
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});