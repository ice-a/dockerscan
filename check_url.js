const dockerServices = require('./public/1.js');
const dns = require('node:dns').promises;

async function checkUrls() {
  for (const mirror of dockerServices) {
    let url = mirror.url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    try {
      const { host } = new URL(url);
      await dns.lookup(host);
      console.log(`✅ ${mirror.url} is valid`);
    } catch (error) {
      console.error(`❌ ${mirror.url} failed: ${error.message}`);
    }
  }
}

checkUrls().then(() => {
  console.log('All URLs checked.');
});
