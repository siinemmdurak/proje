const express = require('express');
const mysql = require('mysql2');
const router = express.Router();

// Veritabanı bağlantısı
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_kamer'
});

db.connect((err) => {
    if (err) {
        console.error('Veritabanı bağlantı hatası:', err.message);
        return;
    }
    console.log('Veritabanı bağlantısı başarılı!');
});

// En çok kadın cinayeti olan şehir
router.get('/mostViolentCity', (req, res) => {
    const query = `
        SELECT sehirler.sehir_adi, SUM(veriler.kadin_cinayet) AS toplam_cinayet
        FROM veriler
        JOIN sehirler ON veriler.sehir_id = sehirler.sehir_id
        GROUP BY sehirler.sehir_adi
        ORDER BY toplam_cinayet DESC
        LIMIT 1;
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Sorgu hatası' });
        res.json(results[0]);
    });
});

// En çok şiddet vakası olan şehir
router.get('/mostAbuseCity', (req, res) => {
    const query = `
        SELECT sehirler.sehir_adi, SUM(veriler.siddet_vaka) AS toplam_siddet
        FROM veriler
        JOIN sehirler ON veriler.sehir_id = sehirler.sehir_id
        GROUP BY sehirler.sehir_adi
        ORDER BY toplam_siddet DESC
        LIMIT 1;
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Sorgu hatası' });
        res.json(results[0]);
    });
});

// En çok boşanma oranı olan şehir
router.get('/mostDivorceCity', (req, res) => {
    const query = `
        SELECT sehirler.sehir_adi, SUM(veriler.bosanma_oran) AS toplam_bosanma
        FROM veriler
        JOIN sehirler ON veriler.sehir_id = sehirler.sehir_id
        GROUP BY sehirler.sehir_adi
        ORDER BY toplam_bosanma DESC
        LIMIT 1;
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Sorgu hatası' });
        res.json(results[0]);
    });
});


// Şehir listesini getiren API
router.get('/getCities', (req, res) => {
    const query = `SELECT DISTINCT sehir_id, sehir_adi FROM sehirler;`;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Veritabanı hatası:', err);
            return res.status(500).send('Sunucu hatası');
        }
        res.json(results);
    });
});

// Şehir verilerini yıllara göre getiren API
router.get('/getCityYearlyData', (req, res) => {
    const { cityName } = req.query; // Şehir adı üzerinden filtreleme yapacağız

    if (!cityName) {
        return res.status(400).json({ error: 'cityName parametresi zorunludur.' });
    }

    const query = `
        SELECT veriler.yil, 
               SUM(veriler.kadin_cinayet) AS kadin_cinayeti, 
               SUM(veriler.siddet_vaka) AS siddet_vaka, 
               SUM(veriler.bosanma_oran) AS bosanma_oran
        FROM veriler 
        JOIN sehirler ON veriler.sehir_id = sehirler.sehir_id
        WHERE sehirler.sehir_adi = ?
        GROUP BY veriler.yil
        ORDER BY veriler.yil ASC;
    `;

    db.query(query, [cityName], (err, results) => {
        if (err) {
            console.error('Sorgu hatası:', err.message);
            return res.status(500).json({ error: 'Sunucu hatası' });
        }

        console.log('Sorgu sonucu:', results); // Sorgu sonucunu logla

        if (results.length === 0) {
            return res.json({ success: true, data: [] });
        }

        res.json({ success: true, data: results });
    });
});
module.exports = router;
