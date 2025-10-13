const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

// ===============================
// 🔐 CHAVES VAPID (AS MESMAS QUE ESTÃO NO RENDER)
// ===============================
const vapidKeys = {
  publicKey: 'BIrg7lacz4LQXJlCh9jIKOmwsPwcbIXbKI9eWrFidezQEnSOMTE9jxpL-cE43dpLTFjP1wMXDJUDxCjy95ZzpNA',
  privateKey: 'LsHEzQxFlidjqWFaaq8h_gIeUZ2oK4EXV8uW6m3SgQ0' // sua PRIVATE_KEY do Render
};

webpush.setVapidDetails(
  'mailto:seuemail@exemplo.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// ===============================
// 🧠 Funções auxiliares
// ===============================
const getSubs = () => {
  try {
    return JSON.parse(fs.readFileSync('db.json', 'utf8'));
  } catch {
    return [];
  }
};

const saveSubs = (subs) => {
  fs.writeFileSync('db.json', JSON.stringify(subs, null, 2));
};

// ===============================
// 📥 Endpoint para salvar inscrições
// ===============================
app.post('/subscribe', (req, res) => {
  const subs = getSubs();
  subs.push(req.body);
  saveSubs(subs);
  res.status(201).json({ message: 'Inscrito com sucesso!' });
});

// ===============================
// 📤 Endpoint para ENVIAR notificações
// ===============================
app.post('/send', async (req, res) => {
  const { title, message, icon, url } = req.body;
  const subs = getSubs();

  const payload = JSON.stringify({
    title: title || "📢 Nova Notificação!",
    message: message || "Você recebeu uma nova mensagem!",
    icon: icon || "https://vip-w1-voy-we-91.com.br/sinais22/logo2voy.png",
    url: url || "https://vip-w1-voy-we-91.com.br/sinais22/"
  });

  const results = [];
  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub, payload);
      results.push({ success: true });
    } catch (err) {
      results.push({ success: false, error: err.message });
    }
  }

  res.json({ sent: results.filter(r => r.success).length, total: subs.length });
});

// ===============================
// 🚀 Inicia servidor
// ===============================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor ativo na porta ${PORT}`));
