const express = require("express");
// const { scrapeLogic } = require("./scrapeLogic");
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const userAgents = require('user-agents');
const cors = require('cors');
const cheerio = require('cheerio');

const app = express();

app.use(cors({origin: '*',}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// let browser;

// (async () => {
//   browser = await puppeteer.launch();
// })();


app.get("/api/", async (req, res) => {
  console.log("Req Hit !");
  try {
    const browser = await puppeteer.launch();
    const asin = req.query.asin;
    const url = `https://www.amazon.in/dp/${asin}`;

    const page = await browser.newPage();

    // Set common headers
    await page.setExtraHTTPHeaders({
      'accept-language': 'en-US,en;q=0.9',
    });
  
    // Disable loading of images, stylesheets, and other resources
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font', 'script'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Set a random User-Agent for each request
    const userAgent = new userAgents().toString();
    await page.setUserAgent(userAgent);

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const content = await page.content();
    console.log('Content loaded successfully');
    const $ = cheerio.load(content);

    res.send($.html());

    // const desc_points = [];
    // $('#feature-bullets ul li').each((i, el) => {
    //   desc_points.push($(el).text().trim());
    // });
    // const name = $('#productTitle').text().trim();
    // const image = $('#imgTagWrapperId').find('img').attr('src');
    // const ratingText = $('#acrPopover').attr('title');
    // const reviews = $('#acrCustomerReviewText').first().text().trim();
    // const deliveryMsg = $('#deliveryBlockMessage').text().replace('Details', '').trim();
    // const price = $('.priceToPay .a-price-whole').text();
    // const deal = $('#dealBadgeSupportingText').text().trim() !== '' ? true : false;
    // const discountPrice = $('.a-text-price span.a-offscreen').first().text();
    // const sales = $('#social-proofing-faceout-title-tk_bought').text().trim();

    // const rating = parseFloat(ratingText.slice(0, 3));

    // const result = {
    //   name,
    //   image,
    //   rating,
    //   reviews,
    //   deliveryMsg,
    //   price,
    //   deal,
    //   discountPrice,
    //   sales,
    //   description: desc_points,
    // };
    // res.json(result);
  } catch (error) {
    console.error('Error scraping the Amazon product page:', error.message);
    res.status(500).json({ error: 'Failed to scrape the Amazon product page' });
  }
  
});

app.get('/search/', async (req, res) => {
  console.log("Req Hit !");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Set common headers
  await page.setExtraHTTPHeaders({
    'accept-language': 'en-US,en;q=0.9',
  });

  // Disable loading of images, stylesheets, and other resources
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (['image', 'stylesheet', 'font', 'script'].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });
  const query = req.query.q;
  const pagenum = req.query.page || 1;
  const url = `https://www.amazon.in/s?k=${query}&page=${pagenum}`;
  try{
    // Set a random User-Agent for each request
    const userAgent = new userAgents().toString();
    await page.setUserAgent(userAgent);
    await page.goto(url);
    await page.waitForSelector('.s-main-slot');
    const content = await page.content();
    const $ = cheerio.load(content);
    const results = [];
    $('.s-main-slot .s-result-item').each((index, element) => {
      const asin = $(element).attr('data-asin');
      if (asin) {
          const name = $(element).find('h2 .a-text-normal').text().trim();
          const image = $(element).find('.s-image').attr('src');
          const price = $(element).find('.a-price-whole').text().trim() || 'N/A';
          const discountPrice = $(element).find('.a-text-price .a-offscreen').text().trim() || 'N/A';
          const rating = $(element).find('.a-icon-alt').text().trim().split(' ')[0] || 4;
          const reviews = $(element).find('a.s-link-style .a-size-base').first().text().trim() || 'N/A';
          const deliveryText = $(element).find('.a-color-base.a-text-bold').first().text().trim() || 'N/A';
          const numberOfSales = $(element).find('.s-size-base ').text().trim().split(' ')[0] || 'N/A';
          results.push({ asin, name, image, price,rating,discountPrice,reviews,deliveryText,numberOfSales });
      }
    });
    res.json(results);
    
  }catch(error){
    console.log(error);
  }

});

app.get("/", (req, res) => {
  res.send("Render Puppeteer server is up and running!");
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
