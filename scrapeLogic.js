const puppeteer = require('puppeteer');
const userAgents = require('user-agents');

const scrapeLogic = async (res) => {
  const browser = await puppeteer.launch({
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });
  try {
    const url = `https://www.amazon.in/dp/${asin}`;
    const page = await browser.newPage();
    // Set a random User-Agent for each request
    const userAgent = new userAgents().toString();
    await page.setUserAgent(userAgent);
    // Set common headers
    await page.setExtraHTTPHeaders({
      'accept-language': 'en-US,en;q=0.9',
    });

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    console.timeEnd('Page Load Time');

    const content = await page.content();
    console.log('Content loaded successfully');
    const $ = cheerio.load(content);

    const desc_points = [];
    $('#feature-bullets ul li').each((i, el) => {
      desc_points.push($(el).text().trim());
    });
    const name = $('#productTitle').text().trim();
    // console.log('Name:', name);
    const image = $('#imgTagWrapperId').find('img').attr('src');
    // console.log('Image:', image);
    const ratingText = $('#acrPopover').attr('title');
    // console.log('Rating Text:', ratingText);
    const reviews = $('#acrCustomerReviewText').first().text().trim();
    // console.log('Reviews:', reviews);
    const deliveryMsg = $('#deliveryBlockMessage').text().replace('Details', '').trim();
    // console.log('Delivery Message:', deliveryMsg);
    const price = $('.priceToPay .a-price-whole').text();
    // console.log('Price:', price);
    const deal = $('#dealBadgeSupportingText').text().trim() !== '' ? true : false;
    // console.log('Deal:', deal);
    const discountPrice = $('.a-text-price span.a-offscreen').first().text();
    // console.log('Discount Price:', discountPrice);
    const sales = $('#social-proofing-faceout-title-tk_bought').text().trim();
    // console.log('Sales:', sales);

    if (!ratingText) {
      throw new Error('Rating text not found');
    }

    const rating = parseFloat(ratingText.slice(0, 3));
    // console.log('Rating:', rating);

    const result = {
      name,
      image,
      rating,
      reviews,
      deliveryMsg,
      price,
      deal,
      discountPrice,
      sales,
      description: desc_points,
    };
    res.json(result);
  

  } catch (e) {
    console.error(e);
    res.send(`Something went wrong while running Puppeteer: ${e}`);
  } finally {
    await browser.close();
  }
};

module.exports = { scrapeLogic };
