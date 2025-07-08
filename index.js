const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

function getClientWithPassword(password) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        "x-password": password
      }
    }
  });
}

app.post("/save", async (req, res) => {
  const { name, data, password } = req.body;
  if (!password) return res.status(400).json({ error: "Missing password" });

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/game_states`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates", // This enables upsert
        "x-password": password
      },
      body: JSON.stringify([{ name, data }])
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Save failed:", result);
      return res.status(500).json({ error: result });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
});

app.post("/load", async (req, res) => {
  const { name, password } = req.body;

  if (!password) return res.status(400).json({ error: "Missing password" });

  const supabase = getClientWithPassword(password);
  const { data, error } = await supabase
    .from("game_states")
    .select("data")
    .eq("name", name)
    .single();

  if (error) {
    console.error("Load error:", error);
    return res.status(500).json({ error });
  }

  res.json({ data: data.data });
});

app.listen(process.env.PORT || 3000, () =>
  console.log("✅ Server running on port", process.env.PORT || 3000)
);
