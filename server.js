// ===============================
// 🚀 SERVIDOR DE NOTIFICAÇÕES W1
// ===============================

const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const fs = require('fs');
const cors = require('cors');

const app = express();

// =====================================
// 🌍 Configurações globais e middlewares
// =====================================
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(express.static('public'));

// ===============================
// 🔐 CHAVES VAPID
// ===============================
const vapidKeys = {
  publicKey: 'BJmEhCifBojagCPIMcwHKxd9R8jU-PXQalMEu5YNRFZP8qm6ZyzvulNzf1pZl_EaBZcKFdQ3gWN4vP7kzF4mUng',
  privateKey: 'tiTgalG1uLPq7cU2rMMUXYuIV8crMKuIhC5ixntnQW0'
};

webpush.setVapidDetails(
  'mailto:duducabralali@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// ===============================
// 📁 Funções utilitárias (DB JSON)
// ===============================
const dbFile = './db.json';

function getSubs() {
  try {
    return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  } catch {
    return [];
  }
}

function saveSubs(subs) {
  fs.writeFileSync(dbFile, JSON.stringify(subs, null, 2));
}

// ===============================
// 📥 Salvar inscrição
// ===============================
app.post('/subscribe', (req, res) => {
  const subs = getSubs();
  const body = req.body;

  if (!body || !body.endpoint) {
    return res.status(400).json({ error: 'Assinatura inválida' });
  }

  // Evita duplicatas
  if (!subs.find((s) => s.endpoint === body.endpoint)) {
    subs.push(body);
    saveSubs(subs);
    console.log('✅ Novo usuário inscrito:', body.endpoint.substring(0, 60) + '...');
  }

  res.status(201).json({ message: 'Inscrito com sucesso!' });
});

// ===============================
// 📤 Enviar notificações (com limpeza automática)
// ===============================
app.post('/send', async (req, res) => {
  let subs = getSubs();

  if (subs.length === 0) {
    console.log('⚠ Nenhum usuário inscrito no momento.');
    return res.json({ sent: 0, total: 0 });
  }

  const payload = JSON.stringify({
    title: req.body.title || '📢 Nova Notificação!',
    message: req.body.message || 'Você recebeu uma nova mensagem!',
    icon: req.body.icon || 'https://vip-w1-voy-we-91.com.br/sinais22/logo2voy.png',
    url: req.body.url || 'https://vip-w1-voy-we-91.com.br/sinais22/'
  });

  let sent = 0;
  const validSubs = [];

  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub, payload);
      sent++;
      validSubs.push(sub); // mantém o válido
    } catch (err) {
      const code = err.statusCode || 0;
      console.error(`⚠ Erro envio (${code}):`, err.message);

      // Remove assinaturas expiradas ou inválidas
      if (code !== 404 && code !== 410) {
        validSubs.push(sub);
      } else {
        console.log(`🧹 Removendo inscrição inválida: ${sub.endpoint.substring(0, 60)}...`);
      }
    }
  }

  saveSubs(validSubs);

  console.log(`📨 Enviadas ${sent}/${subs.length} notificações (limpas ${subs.length - validSubs.length})`);
  res.json({ sent, total: subs.length });
});

// ===============================
// 🚀 Inicialização automática
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🔥 Servidor de Notificações W1 ativo!');
  console.log(`🌐 Rodando automaticamente na porta: ${PORT}`);
});
