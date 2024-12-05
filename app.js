const mysql = require('mysql');
const express = require('express')
const yoneticiRouter = require('./routers/giris');
const verigirisiRouter = require('./routers/verigirisi');
const yillarRouter = require('./routers/yillar');
const app = express();
const cors = require('cors');

app.use(express.urlencoded({ extended: true })); // Form verisi için
app.use(express.json()); // JSON verisi için
 
app.use('/giris', yoneticiRouter);
app.use('/verigirisi', verigirisiRouter);
app.use('/yillar', yillarRouter);


app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.use(cors());


// MySQL bağlantısını ayarla
const db = mysql.createConnection({
  host: 'localhost',       // Veritabanı sunucusu
  user: 'root',            // MySQL kullanıcı adı (varsayılan: root)
  password: '',            // MySQL şifresi (boşsa '')
  database: 'db_kamer'      // Bağlanılacak veritabanı adı
});

// MySQL bağlantısını başlat
db.connect((err) => {
  if (err) {
    console.error('MySQL bağlantı hatası:', err);
    return;
  }
  console.log('MySQL bağlantısı başarılı!');
});

// Yıllar için ek rota (stat-box verilerini sağlamak için)
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

// Bir rota tanımla
app.get('/', (req, res) => {
  res.send('Web sitesi başarıyla çalışıyor!');
});


// Sunucuyu başlat
app.listen(3000, () => {
  console.log('Sunucu http://localhost:3000 adresinde çalışıyor.');
});
