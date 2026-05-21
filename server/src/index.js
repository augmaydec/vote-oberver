require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');

const slotsRouter = require('./routes/slots');
const applyRouter = require('./routes/apply');
const adminRouter = require('./routes/admin');
const verifyRouter = require('./routes/verify');
const myRouter = require('./routes/my');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/slots', slotsRouter);
app.use('/api/apply', applyRouter);
app.use('/api/admin', adminRouter);
app.use('/api/verify', verifyRouter);
app.use('/api/my', myRouter);

// Serve React build
const distPath = path.join(__dirname, '../../client/dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
