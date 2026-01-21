import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

/* 🔴 CHANGE THIS IF CLOUDFLARE URL CHANGES */
const OLLAMA_URL = "https://Victor-administrative-lamps-blues.trycloudflare.com";

app.use(express.urlencoded({ extended: false }));

/* Health check */
app.get("/", (req, res) => {
  res.type("text").send("Nokia AI backend running");
});

/* Nokia AI main page */
app.get("/ai", (req, res) => {
  res.type("html").send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Nokia AI</title>
</head>
<body>

<h3>Nokia AI</h3>

<form method="GET" action="/ask">
  <input type="text" name="q" size="20" autocomplete="off">
  <br><br>
  <button type="submit">Ask</button>
</form>

<p>
Tips:<br>
- Ask clear questions<br>
- Answers may take time<br>
- Type "continue" if reply stops
</p>

</body>
</html>
  `);
});

/* Handle BOTH GET and POST (Nokia fix) */
app.all("/ask", async (req, res) => {
  res.type("html");

  const q =
    (req.method === "POST"
      ? req.body.q
      : req.query.q || "").trim();

  if (!q) {
    res.send("No question provided.<br><a href='/ai'>Back</a>");
    return;
  }

  let answer = "AI did not respond.";

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral",
        stream: false,
        prompt:
          "You are a careful, reliable assistant. " +
          "Reply in proper, clear English. " +
          "Explain things thoroughly and logically. " +
          "Do not use emojis or Unicode symbols. " +
          "ASCII punctuation only. " +
          "If the reply would exceed about 225 words, stop at a natural point and ask the user to type 'continue'.\n\n" +
          q
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.response) {
        answer = data.response;
      }
    } else {
      answer = "AI error.";
    }
  } catch (e) {
    answer = "AI not reachable.";
  }

  /* Nokia-safe ASCII only */
  answer = answer.replace(/[^\x00-\x7F]/g, "");

  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Nokia AI</title>
</head>
<body>

<p><b>You:</b><br>${escapeHtml(q)}</p>

<p><b>AI:</b><br>
<pre>${escapeHtml(answer)}</pre>
</p>

<hr>

<form method="GET" action="/ask">
  <input type="text" name="q" size="20" autocomplete="off">
  <br><br>
  <button type="submit">Ask</button>
</form>

<p><a href="/ai">New chat</a></p>

</body>
</html>
  `);
});

/* Escape HTML safely */
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

app.listen(PORT, () => {
  console.log("Nokia AI backend running");
});