const express = require('express');
const router = express.Router();
const mysql = require('mysql');

// Veritabanı bağlantısı
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_kamer'
});

db.connect(err => {
    if (err) throw err;
    console.log('MySQL Bağlantısı başarılı');
});

// Yönetici girişini doğrula
router.post('/verigirisi', (req, res) => {
    console.log(req.body); 
    const { kullanici_adi, sifre } = req.body;
    if (!kullanici_adi || !sifre) {
        return res.status(400).send('Kullanıcı adı veya şifre eksik!');
    }
    const sql = `SELECT * FROM yonetici WHERE kullanici_adi = ? AND sifre = ?`;


    db.query(sql, [kullanici_adi, sifre], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            res.redirect('/verigirisi.html'); // Başarılı giriş
        } else {
            res.send('Hatalı kullanıcı adı veya şifre'); // Hatalı giriş
        }
    });
});

module.exports = router;
