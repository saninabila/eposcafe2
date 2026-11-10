require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');

const app = express();
app.use(express.json());

// Inisialisasi Firebase Admin SDK dari Environment Variable
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Gagal menginisialisasi Firebase Admin:', error.message);
  }
}

const db = admin.firestore();

// API: Ambil semua menu
app.get('/api/menu', async (req, res) => {
  try {
    const snapshot = await db.collection('menu').get();
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Tambah menu baru
app.post('/api/menu', async (req, res) => {
  try {
    const { name, price, category } = req.body;
    const docRef = await db.collection('menu').add({
      name,
      price: Number(price),
      category: category || 'Umum',
      createdAt: new Date().toISOString()
    });
    res.status(201).json({ id: docRef.id, name, price, category });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Simpan transaksi pesanan
app.post('/api/orders', async (req, res) => {
  try {
    const { items, totalAmount, paymentMethod } = req.body;
    const orderData = {
      items,
      totalAmount,
      paymentMethod,
      createdAt: new Date().toISOString()
    };
    const docRef = await db.collection('orders').add(orderData);
    res.status(201).json({ id: docRef.id, status: 'Success' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Jalankan server lokal (opsional untuk dev)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
  });
}

module.exports = app;
