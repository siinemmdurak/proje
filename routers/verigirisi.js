const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');

// MySQL bağlantısı
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_kamer'
});

// MySQL bağlantısını kontrol et
db.connect((err) => {
    if (err) {
        console.error('Veritabanı bağlantı hatası:', err);
        return;
    }
    console.log('MySQL bağlantısı verigirisi.js içinde başarılı!');
});

// Multer Konfigürasyonu (Dosya Yükleme)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.xlsx');
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && file.mimetype !== 'application/vnd.ms-excel') {
            return cb(new Error('Yalnızca .xls veya .xlsx dosyaları yüklenebilir!'), false);
        }
        cb(null, true);
    }
});

// POST İsteği - Dosya Yükleme ve Veritabanına Ekleme
router.post('/upload', upload.single('file'), (req, res) => {
    const { hedefTablo } = req.body;
    if (!req.file) {
        console.error('Dosya yüklenemedi!');
        return res.status(400).send('Dosya yüklenmedi!');
    }

    // Excel dosyasını oku
    try {
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (!sheetData || sheetData.length === 0) {
            console.error('Excel dosyasından veri alınamadı.');
            fs.unlinkSync(req.file.path); // Boş dosyayı sil
            return res.status(400).send('Excel dosyasından veri alınamadı!');
        }

        let sql, values;
        if (hedefTablo === 'veriler') {
            sql = `INSERT INTO veriler (sehir_id, yil, kadin_cinayet, siddet_vaka, bosanma_oran, ay) VALUES ?`;
            values = sheetData.map(row => [
                row.sehir_id,
                row.yil,
                row.kadin_cinayet,
                row.siddet_vaka,
                row.bosanma_oran,
                row.ay,
            ]);
        } else if (hedefTablo === 'siginak') {
            sql = `INSERT INTO siginak (sehir_id, kapasite) VALUES ?`;
            values = sheetData.map(row => [
                row.sehir_id,
                row.kapasite
            ]);
        } else {
            fs.unlinkSync(req.file.path); // Dosyayı sil
            return res.status(400).send('Geçersiz hedef tablo!');
        }

        // Transaction başlat
        db.beginTransaction((err) => {
            if (err) throw err;

            // Veritabanına ekleme işlemi
            db.query(sql, [values], (err, result) => {
                if (err) {
                    console.error('Veritabanı ekleme hatası:', err);
                    return db.rollback(() => {
                        fs.unlinkSync(req.file.path); // Hatalı dosyayı sil
                        res.status(500).send('Veritabanına veri eklenemedi.');
                    });
                }

                // Dosya bilgilerini `files` tablosuna kaydet
                const fileSql = `INSERT INTO files (file_name, file_path, uploaded_at) VALUES (?, ?, NOW())`;
                db.query(fileSql, [req.file.filename, req.file.path], (fileErr) => {
                    if (fileErr) {
                        console.error('Dosya bilgisi kaydedilemedi:', fileErr);
                        return db.rollback(() => {
                            fs.unlinkSync(req.file.path); // Hatalı dosyayı sil
                            res.status(500).send('Dosya bilgisi kaydedilemedi.');
                        });
                    }

                    // Commit işlemi
                    db.commit((commitErr) => {
                        if (commitErr) {
                            console.error('Transaction commit hatası:', commitErr);
                            return db.rollback(() => {
                                fs.unlinkSync(req.file.path);
                                res.status(500).send('Veritabanı işlemi tamamlanamadı.');
                            });
                        }

                        // Dosya başarıyla işlendi, dosyayı sil
                        fs.unlinkSync(req.file.path);
                        res.status(200).send('Dosya başarıyla yüklendi ve veritabanına kaydedildi!');
                    });
                });
            });
        });
    } catch (error) {
        console.error('Dosya işleme hatası:', error);
        fs.unlinkSync(req.file.path); // Hatalı dosyayı sil
        res.status(500).send('Dosya işlenirken bir hata oluştu.');
    }
});

// GET İsteği - Son 7 Yüklenen Dosyayı Getir
router.get('/last-uploads', (req, res) => {
    const sql = "SELECT file_name, uploaded_at FROM files ORDER BY uploaded_at DESC LIMIT 7";
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Veritabanı sorgu hatası:', err);
            return res.status(500).send('Veritabanına erişilirken bir hata oluştu.');
        }
        res.status(200).json(results || []);
    });
});

module.exports = router;
