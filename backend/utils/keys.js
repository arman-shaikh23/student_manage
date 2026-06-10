const fs = require('fs');
const path = require('path');

let privateKey = '';
let publicKey = '';

try {
  const keysPath = path.join(__dirname, '../keys.json');
  if (fs.existsSync(keysPath)) {
    const keys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
    privateKey = keys.privateKey;
    publicKey = keys.publicKey;
  } else {
    throw new Error('keys.json not found');
  }
} catch (error) {
  // Fallback to env variables if keys.json doesn't exist
  privateKey = process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.replace(/\\n/g, '\n') : '';
  publicKey = process.env.PUBLIC_KEY ? process.env.PUBLIC_KEY.replace(/\\n/g, '\n') : '';
}

module.exports = { privateKey, publicKey };
