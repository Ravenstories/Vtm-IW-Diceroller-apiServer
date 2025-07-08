const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
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

  const supabase = getClientWithPassword(password);
  const { error } = await supabase
    .from("game_states")
    .upsert([{ name, data, password }]);

  if (error) {
    console.error("Save error:", error);
    return res.status(500).json({ error });
  }

  res.json({ success: true });
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
