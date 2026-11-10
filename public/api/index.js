const express = require('express');
const admin = require('firebase-admin');
const path = require('path');

const app = express();
app.use(express.json());

// public/ berada di root project. Di Vercel file ini ada di <root>/api,
// jadi naik satu level. Saat dijalankan lokal hasilnya sama.
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
app.use(express.static(PUBLIC_DIR));

// Inisialisasi Firebase Admin dengan Environment Variable
let db = null;
try {
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin berhasil diinisialisasi.');
  }
  db = admin.firestore();
} catch (error) {
  console.error('Gagal menginisialisasi Firebase Admin:', error.message);
}

function firebaseReady(res) {
  if (db) return true;
  res.status(500).json({
    status: 'error',
    message: 'Firebase belum dikonfigurasi. Set environment variable FIREBASE_SERVICE_ACCOUNT.'
  });
  return false;
}

// API: Ambil Menu Kafe
async function getMenu(req, res) {
  if (!firebaseReady(res)) return;
  try {
    const snapshot = await db.collection('menu').get();
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ status: 'success', data: items });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
}

// API: Simpan Transaksi Baru
async function createTransaction(req, res) {
  if (!firebaseReady(res)) return;
  try {
    const { items, totalAmount, paymentMethod, customerName } = req.body;

    const newTransaction = {
      customerName: customerName || 'Pelanggan',
      items,
      totalAmount,
      paymentMethod,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('transactions').add(newTransaction);
    res.status(201).json({ status: 'success', id: docRef.id, message: 'Transaksi berhasil disimpan!' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
}

// Terdaftar dengan dan tanpa prefix /api, supaya tetap jalan baik di Vercel
// (rewrite meneruskan path asli) maupun saat dijalankan lokal.
app.get('/api/menu', getMenu);
app.post('/api/transactions', createTransaction);
app.get('/menu', getMenu);
app.post('/transactions', createTransaction);

// Halaman utama
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

module.exports = app;
