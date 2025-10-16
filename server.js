const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(express.static('public'));

// 🔐 VAPID KEYS
const vapidKeys = {
  publicKey: 'BJmEhCifBojagCPIMcwHKxd9R8jU-PXQalMEu5YNRFZP8qm6ZyzvulNzf1pZl_EaBZcKFdQ3gWN4vP7kzF4mUng',
  privateKey: 'tiTgalG1uLPq7cU2rMMUXYuIV8crMKuIhC5ixntnQW0'
};
webpush.setVapidDetails('mailto:duducabralali@gmail.com', vapidKeys.publicKey, vapidKeys.privateKey);

// 🧩 Conexão MySQL
const pool = mysql.createPool({
  host: 'localhost',
  user: 'u781856057_salvarpusdhh1',
  password: 'Cabral909011A',
  database: 'u781856057_salvarpusdhh1',
  waitForConnections: true,
  connectionLimit: 10,
});

// 📥 Salvar inscrição
app.post('/subscribe', async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys) return res.status(400).json({ error: 'Assinatura inválida' });

    const [rows] = await pool.query('SELECT id FROM push_subscribers WHERE endpoint = ?', [endpoint]);
    if (rows.length === 0) {
      await pool.query(
        'INSERT INTO push_subscribers (endpoint, p256dh, auth) VALUES (?, ?, ?)',
        [endpoint, keys.p256dh, keys.auth]
      );
      console.log('✅ Novo usuário salvo no MySQL');
    } else {
      console.log('⚠️ Usuário já inscrito');
    }

    res.status(201).json({ message: 'Inscrição salva!' });
  } catch (err) {
    console.error('Erro MySQL:', err);
    res.status(500).json({ error: 'Erro ao salvar inscrição' });
  }
});

// 📤 Enviar notificações
app.post('/send', async (req, res) => {
  try {
    const [subs] = await pool.query('SELECT * FROM push_subscribers');
    if (subs.length === 0) return res.json({ sent: 0, total: 0 });

    const payload = JSON.stringify({
      title: req.body.title || "📢 Nova Notificação!",
      message: req.body.message || "Você recebeu uma nova mensagem!",
      icon: req.body.icon || "https://vip-w1-voy-we-91.com.br/sinais/logo2voy.png",
      url: req.body.url || "https://vip-w1-voy-we-91.com.br/sinais/load.php"
    });

    let sent = 0;
    for (const s of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth }
          },
          payload
        );
        sent++;
      } catch (err) {
        console.error('Erro envio:', err.message);
      }
    }

    console.log(`📨 Enviadas ${sent}/${subs.length} notificações`);
    res.json({ sent, total: subs.length });
  } catch (err) {
    console.error('Erro geral:', err);
    res.status(500).json({ error: 'Falha ao enviar notificações' });
  }
});

// 🚀 Inicialização
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 Servidor ativo na porta ${PORT}`);
});
