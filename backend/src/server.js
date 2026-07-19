require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const app = require('./app');
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log('');
  console.log('🔥 FIT FOOD Server Started!');
  console.log('─────────────────────────────────────────');
  console.log(`🌐  Local:    http://localhost:${port}`);
  console.log(`🔑  Login:    http://localhost:${port}/login`);
  console.log(`📊  Dashboard: http://localhost:${port}/dashboard`);
  console.log('─────────────────────────────────────────');
  console.log('');
});
