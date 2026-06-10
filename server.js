const app = require('./backend/server.js');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (started from root workaround)`);
});
