const express = require('express');
const connection = require('./config/db'); // Veritabanı bağlantısını içe aktarıyoruz

const app = express();
const port = 3000;

// Middleware (JSON verileri işlemek için)
app.use(express.json());

// Ana sayfa rotası
app.get('/', (req, res) => {
    res.send('Node.js Veritabanı Bağlantısı Başarılı!');
});

const cors = require('cors');
app.use(cors());

  connection.query(query, (err, results) => {
        if (err) {
            console.error('Veritabanı sorgusunda bir hata oluştu:', err);
            res.status(500).send('Bir hata oluştu');
            return;
        }

        res.json(results);
    });

// Sunucuyu başlat
app.listen(port, () => {
    console.log(`Sunucu http://localhost:${port} adresinde çalışıyor.`);
});
