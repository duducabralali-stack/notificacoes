// ===============================
// 📡 SERVIDOR DE NOTIFICAÇÕES W1
// Integrado com Hostinger via PHP
// ===============================

import express from "express";
import bodyParser from "body-parser";
import webpush from "web-push";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ===============================
// 🔐 CONFIGURAÇÃO DAS CHAVES VAPID
// ===============================
const publicVapidKey =
  "BNPa0ciQJ89H6qF1Vegl3IElXMkig-q66rE7PXZP40SZ35Vsdfr0uhVoLro-JXHeNV7cmHiVbxOqlFGhfs8EFu0";
const privateVapidKey = "VoeGpa_Fugwc88JD8ZCd3qoJjIEYzX2zwWdtlutN_6k";

webpush.setVapidDetails(
  "mailto:contato@sinaisw1.com",
  publicVapidKey,
  privateVapidKey
);

// ===============================
// 📥 ROTA PARA RECEBER INSCRIÇÕES
// ===============================
app.post("/subscribe", async (req, res) => {
  const sub = req.body;
  console.log("📨 Nova inscrição recebida do navegador.");

  try {
    // Envia a inscrição para o PHP no Hostinger
    const response = await fetch("https://vip-w1-voy-we-91.com/sinais/salvar_sub.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub),
    });

    if (!response.ok) throw new Error("Erro ao salvar no PHP Hostinger");

    console.log("✅ Inscrição salva no MySQL via PHP com sucesso!");
    res.status(201).json({ message: "Usuário salvo com sucesso!" });
  } catch (err) {
    console.error("❌ Erro ao enviar inscrição:", err);
    res.status(500).json({ message: "Falha ao enviar inscrição ao PHP" });
  }
});

// ===============================
// 🚀 ROTA PARA ENVIAR NOTIFICAÇÕES
// ===============================
app.post("/send", async (req, res) => {
  const { title, message, icon, url } = req.body;
  console.log("🚀 Enviando notificação...");

  try {
    // Busca todas as inscrições no MySQL via PHP
    const response = await fetch("https://vip-w1-voy-we-91.com/sinais/listar_subs.php");
    const subs = await response.json();

    if (!Array.isArray(subs)) throw new Error("Resposta inesperada do listar_subs.php");

    let enviados = 0;

    for (const sub of subs) {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(
          pushConfig,
          JSON.stringify({ title, message, icon, url })
        );
        enviados++;
      } catch (err) {
        console.warn("⚠️ Falha ao enviar para um usuário:", err.statusCode);
      }
    }

    console.log(`✅ Notificações enviadas com sucesso: ${enviados}/${subs.length}`);
    res.json({ success: true, enviados });
  } catch (err) {
    console.error("💥 Erro geral ao enviar notificações:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===============================
// 🌍 INICIALIZAÇÃO DO SERVIDOR
// ===============================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🔥 Servidor ativo na porta", PORT);
  console.log("👉 https://notificacoes-imzt.onrender.com");
});



