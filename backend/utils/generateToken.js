const jwt = require('jsonwebtoken');
const { privateKey } = require('./keys');

const generateAccessToken = (id, tokenVersion) => {
  return jwt.sign({ id, tokenVersion }, privateKey, {
    algorithm: 'RS256',
    expiresIn: '15m', // Short-lived
  });
};

const generateRefreshToken = (id, tokenVersion) => {
  return jwt.sign({ id, tokenVersion }, privateKey, {
    algorithm: 'RS256',
    expiresIn: '7d', // Long-lived
  });
};

module.exports = { generateAccessToken, generateRefreshToken };
