const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const https = require("https");

admin.initializeApp();
const db = admin.firestore();

exports.sendMentionNotifications = onDocumentCreated(
  "chatMessages/{messageId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return null;

    const message = snap.data();
    const { text, nickname: senderName, userId: senderUserId } = message;

    if (!text) return null;

    const mentionRegex = /@(\S+)/g;
    const mentions = new Set();
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.add(match[1].toLowerCase());
    }

    if (mentions.size === 0) return null;

    const tokens = [];

    for (const mention of mentions) {
      const snapshot = await db
        .collection("pushTokens")
        .where("nicknameLower", "==", mention)
        .get();

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId !== senderUserId && data.token) {
          tokens.push(data.token);
        }
      });
    }

    if (tokens.length === 0) return null;

    const preview = text.length > 80 ? text.substring(0, 80) + "…" : text;

    const messages = tokens.map((token) => ({
      to: token,
      title: `${senderName || "Someone"} mentioned you 💬`,
      body: preview,
      sound: "default",
    }));

    const postData = JSON.stringify(messages);

    return new Promise((resolve, reject) => {
      const options = {
        hostname: "exp.host",
        path: "/--/api/v2/push/send",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          console.log("Expo push response:", data);
          resolve(null);
        });
      });

      req.on("error", (err) => {
        console.error("Push notification error:", err);
        reject(err);
      });

      req.write(postData);
      req.end();
    });
  }
);