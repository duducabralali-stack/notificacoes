const express = require("express");
const bodyParser = require("body-parser");
const webpush = require("web-push");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// ===============================
// 🔐 CHAVES VAPID (Render.com)
// ===============================
const vapidKeys = {
  publicKey: "BIrg7lacz4LQXJlCh9jIKOmwsPwcbIXbKI9eWrFidezQEnSOMTE9jxpL-cE43dpLTFjP1wMXDJUDxCjy95ZzpNA",
  privateKey: "LsHEzQxFlidjqWFaaq8h_gIeUZ2oK4EXV8uW6m3SgQ0"
};

webpush.setVapidDetails(
  "mailto:duducabralali@gmail.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// ===============================
// 📦 DB simples local
// ===============================
const dbFile = "./db.json";
const getSubs = () => {
  try {
    return JSON.parse(fs.readFileSync(dbFile, "utf8"));
  } catch {
    return [];
  }
};
const saveSubs = (subs) => fs.writeFileSync(dbFile, JSON.stringify(subs, null, 2));

// ===============================
// 📥 Endpoint de inscrição
// ===============================
app.post("/subscribe", (req, res) => {
  const subs = getSubs();
  const body = req.body;

  if (!body || !body.endpoint) {
    return res.status(400).json({ error: "Inscrição inválida" });
  }

  if (!subs.find((s) => s.endpoint === body.endpoint)) {
    subs.push(body);
    saveSubs(subs);
    console.log("✅ Novo usuário inscrito:", body.endpoint.substring(0, 40) + "...");
  }

  res.status(201).json({ message: "Inscrito com sucesso!" });
});

// ===============================
// 📤 Enviar notificação
// ===============================
app.post("/send", async (req, res) => {
  const subs = getSubs();
  if (subs.length === 0) {
    console.log("⚠ Nenhum usuário inscrito no momento.");
    return res.json({ sent: 0, total: 0 });
  }

  const payload = JSON.stringify({
    title: req.body.title || "📢 Nova Notificação!",
    message: req.body.message || "Você recebeu uma nova mensagem!",
    icon: req.body.icon || "https://vip-w1-voy-we-91.com.br/sinais22/logo2voy.png",
    url: req.body.url || "https://vip-w1-voy-we-91.com.br/sinais22/"
  });

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub, payload, {
        TTL: 60,
        vapidDetails: {
          subject: "mailto:duducabralali@gmail.com",
          publicKey: vapidKeys.publicKey,
          privateKey: vapidKeys.privateKey
        }
      });
      sent++;
    } catch (err) {
      console.error("❌ Erro envio:", err.statusCode || err.message);
      if (err.statusCode === 404 || err.statusCode === 410) {
        console.log("🗑️ Assinatura inválida, removendo...");
      }
    }
  }

  console.log(`📨 Enviadas ${sent}/${subs.length} notificações`);
  res.json({ sent, total: subs.length });
});

// ===============================
// 🚀 Inicialização automática
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🔥 Servidor de Notificações W1 ativo!");
  console.log(`🌐 Rodando automaticamente na porta: ${PORT}`);
});
