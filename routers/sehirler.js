const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const router = express.Router();

// CORS izinleri
router.use(cors());

// Veritabanı bağlantısı
const db = mysql.createConnection({
    host: 'localhost', // Veritabanı sunucusu
    user: 'root', // MySQL kullanıcı adı
    password: '', // MySQL şifresi
    database: 'db_kamer' // Veritabanı adı
});

// Şehirler ve yıl bilgisine göre veri çekme API'si
router.get('/getCityData', (req, res) => {
    const { year } = req.query;

    console.log('Gelen Parametreler:', { year }); // Gelen parametreleri kontrol etmek için log

    const query = `
        SELECT sehir_id, kadin_cinayet, siddet_vaka, bosanma_oran, ay
        FROM veriler
        WHERE yil = ?
        ORDER BY sehir_id, ay;
    `;

    db.query(query, [year], (err, results) => {
        if (err) {
            console.error('Veritabanı hatası:', err);
            res.status(500).send('Sunucu hatası');
            return;
        }

        if (results.length === 0) {
            res.status(404).json({ message: 'Veri bulunamadı' });
            return;
        }

        // Verileri JSON olarak döndür
        res.json({ cityData: results });
    });
});


module.exports = router;
