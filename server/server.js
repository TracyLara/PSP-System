const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1); // the host sits behind a proxy

const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
app.use(cors({ origin: clientUrl }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/application'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));