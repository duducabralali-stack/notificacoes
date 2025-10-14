// ===============================
// 🔥 Servidor de Notificações W1 – Final Render Version
// ===============================
const express = require("express");
const bodyParser = require("body-parser");
const webpush = require("web-push");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static("public"));

// ===============================
// 🛡️ CORS (libera acesso do seu site e painel)
// ===============================
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// ===============================
// 🔐 CHAVES VAPID (SUAS CHAVES FIXAS)
// ===============================
const vapidKeys = {
  publicKey: "BIrg7lacz4LQXJlCh9jIKOmwsPwcbIXbKI9eWrFidezQEnSOMTE9jxpL-cE43dpLTFjP1wMXDJUDxCjy95ZzpNA",
  privateKey: "LsHEzQxFlidjqWFaaq8h_gIeUZ2oK4EXV8uW6m3SgQ0"
};

// Configuração inicial do Web Push
webpush.setVapidDetails(
  "mailto:duducabralali@gmail.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// ===============================
// 💾 Lista de inscrições (memória temporária)
// ===============================
let subscribers = [];

// ===============================
// 📥 Endpoint de inscrição
// ===============================
app.post("/subscribe", (req, res) => {
  const sub = req.body;

  // evita duplicação
  if (!subscribers.find(s => s.endpoint === sub.endpoint)) {
    subscribers.push(sub);
    console.log("✅ Novo inscrito adicionado!");
  } else {
    console.log("ℹ️ Usuário já inscrito anteriormente.");
  }

  res.status(201).json({ message: "Inscrito com sucesso!" });
});

// ===============================
// 📤 Endpoint de envio de notificações
// ===============================
app.post("/send", async (req, res) => {
  const { title, message, icon, url } = req.body;

  const payload = JSON.stringify({
    title: title || "📢 Nova Notificação!",
    message: message || "Você recebeu uma nova mensagem!",
    icon: icon || "https://vip-w1-voy-we-91.com.br/sinais22/logo2voy.png",
    url: url || "https://vip-w1-voy-we-91.com.br/sinais22/"
  });

  if (subscribers.length === 0) {
    console.log("⚠️ Nenhum usuário inscrito no momento.");
    return res.json({ sent: 0, total: 0 });
  }

  console.log(`🚀 Enviando notificação para ${subscribers.length} usuários...`);

  let successCount = 0;

  for (const sub of subscribers) {
    try {
      await webpush.sendNotification(sub, payload);
      successCount++;
    } catch (err) {
      console.error("❌ Erro ao enviar:", err.message);
    }
  }

  console.log(`✅ Notificações enviadas com sucesso: ${successCount}/${subscribers.length}`);
  res.json({ sent: successCount, total: subscribers.length });
});

// ===============================
// 🚀 Inicialização do servidor
// ===============================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("=======================================");
  console.log(`🔥 Servidor de Notificações W1 ativo!`);
  console.log(`🌐 Rodando na porta: ${PORT}`);
  console.log("=======================================");
});
