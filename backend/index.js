const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://foresight-app.vercel.app',
  ],
  credentials: true,
}));
app.use(express.json());

app.use('/api/markets',     require('./routes/markets'));
app.use('/api/predictions', require('./routes/predictions'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/leagues',     require('./routes/leagues'));
app.use('/api/auth',        require('./routes/auth'));

app.get('/', (req, res) => res.json({ status: 'ok', app: 'foresight' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Foresight backend corriendo en http://localhost:${PORT}`));
