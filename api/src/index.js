import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ mensaje: 'API VetFarm funcionando correctamente' });
});

app.use('/auth', authRoutes);

app.listen(3000, () => {
  console.log('API corriendo en http://localhost:3000');
});
