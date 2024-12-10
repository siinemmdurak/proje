const mysql = require('mysql');
const express = require('express')
const yoneticiRouter = require('./routers/giris');
const verigirisiRouter = require('./routers/verigirisi');
const yillarRouter = require('./routers/yillar');
const sehirlerRouter = require('./routers/sehirler');
const siginakRouter = require('./routers/siginak');
const app = express();
const cors = require('cors');

app.use(express.urlencoded({ extended: true })); // Form verisi için
app.use(express.json()); // JSON verisi için
 
app.use('/giris', yoneticiRouter);
app.use('/verigirisi', verigirisiRouter);
app.use('/yillar', yillarRouter);
app.use('/api', sehirlerRouter); // Ana prefix: /api
app.use('/api', siginakRouter); // Sığınak rotasını kullan


app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.use(cors());

// Sığınak Doluluk Oranı Route
app.get('/siginak/getData', (req, res) => {
  const query = `
    SELECT 
      sh.sehir_id,
      sh.sehir_adi,
      CONCAT('TR-', LPAD(sh.sehir_id, 2, '0')) AS plaka,
      SUM(s.kapasite) AS toplam_kapasite
    FROM siginak s
    JOIN sehirler sh ON s.sehir_id = sh.sehir_id
    GROUP BY sh.sehir_id, sh.sehir_adi
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Sığınak verisi sorgu hatası:', err.message);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
    res.json(results); // Sonuçları JSON formatında döner
  });
});

// MySQL bağlantısını ayarla
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'db_kamer'
});

// MySQL bağlantısını başlat
db.connect((err) => {
  if (err) {
    console.error('MySQL bağlantı hatası:', err.message);
    return;
  }
  console.log('MySQL bağlantısı başarılı!');
});

// Ana Sayfa Route
app.get('/', (req, res) => {
  res.send('Web sitesi başarıyla çalışıyor!');
});

// Stat-box verilerini sağlayan route
app.get('/yillar/getStats', (req, res) => {
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

  // Tüm sorguları döngüyle çalıştır
  for (const [key, query] of Object.entries(queries)) {
    db.query(query, (err, rows) => {
      if (err) {
        console.error(`${key} sorgu hatası:`, err.message);
        return res.status(500).json({ error: 'Sunucu hatası' });
      }

      results[key] = rows[0]; // En yüksek değeri al
      completedQueries++;

      if (completedQueries === Object.keys(queries).length) {
        res.json(results);
      }
    });
  }
});

// Sunucuyu başlat
app.listen(3000, () => {
  console.log('Sunucu http://localhost:3000 adresinde çalışıyor.');
});
