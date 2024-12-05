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

// Yıla göre veri çekme API'si (Grafik için)
router.get('/getYearData', (req, res) => {
    const { year } = req.query;

    if (!year) {
        res.status(400).json({ message: 'Yıl parametresi eksik.' });
        return;
    }

    console.log('Gelen Yıl Parametresi:', year);

    const query = `
        SELECT ay, SUM(kadin_cinayet) AS kadin_cinayet, 
                   SUM(siddet_vaka) AS siddet_vaka, 
                   AVG(bosanma_oran) AS bosanma_oran
        FROM veriler
        WHERE yil = ?
        GROUP BY ay
        ORDER BY ay ASC;
    `;

    db.query(query, [year], (err, results) => {
        if (err) {
            console.error('Veritabanı hatası:', err);
            res.status(500).json({ message: 'Sunucu hatası.' });
            return;
        }

        if (results.length === 0) {
            res.status(404).json({ message: 'Seçilen yıl için veri bulunamadı.' });
            return;
        }

        res.json({ yearData: results });
    });
});

// Stat-box verileri için API
router.get('/getStats', (req, res) => {
    const queries = {
        kadin_cinayeti: `
            SELECT yil, ay, MAX(kadin_cinayet) AS max_value
            FROM veriler
            GROUP BY yil, ay
            ORDER BY max_value DESC
            LIMIT 1;
        `,
        siddet_vaka: `
            SELECT yil, ay, MAX(siddet_vaka) AS max_value
            FROM veriler
            GROUP BY yil, ay
            ORDER BY max_value DESC
            LIMIT 1;
        `,
        bosanma_oran: `
            SELECT yil, ay, MAX(bosanma_oran) AS max_value
            FROM veriler
            GROUP BY yil, ay
            ORDER BY max_value DESC
            LIMIT 1;
        `
    };

    const results = {};
    let completedQueries = 0;

    for (const [key, query] of Object.entries(queries)) {
        db.query(query, (err, rows) => {
            if (err) {
                console.error(`${key} sorgu hatası:`, err);
                res.status(500).send('Sunucu hatası');
                return;
            }

            results[key] = rows[0];
            completedQueries++;

            if (completedQueries === Object.keys(queries).length) {
                res.json(results);
            }
        });
    }
});

module.exports = router;
