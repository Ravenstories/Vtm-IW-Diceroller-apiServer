const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// SAVE endpoint
app.post("/save", async (req, res) => {
  const { name, data, password } = req.body;
  if (!name || !password) {
    return res.status(400).json({ error: "Missing name or password" });
  }

  // Check if the name already exists
  const { data: existing, error: fetchError } = await supabase
    .from("game_states")
    .select("password")
    .eq("name", name)
    .maybeSingle();

  if (fetchError) {
    console.error("Fetch error:", fetchError);
    return res.status(500).json({ error: "Failed to verify save state" });
  }

  // Password check
  if (existing && existing.password !== password) {
    return res.status(403).json({ error: "Incorrect password for existing save" });
  }

  // Upsert the data
  const { error } = await supabase
    .from("game_states")
    .upsert([{ name, data, password }]);

  if (error) {
    console.error("Save failed:", error);
    return res.status(500).json({ error: "Failed to save game state" });
  }

  res.json({ success: true });
});

// LOAD endpoint
app.post("/load", async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).json({ error: "Missing name or password" });
  }

  const { data, error } = await supabase
    .from("game_states")
    .select("data, password")
    .eq("name", name)
    .single();

  if (error) {
    console.error("Load failed:", error);
    return res.status(404).json({ error: "Save not found" });
  }

  if (data.password !== password) {
    return res.status(403).json({ error: "Incorrect password" });
  }

  res.json({ data: data.data });
});

app.listen(process.env.PORT || 3000, () =>
  console.log("✅ Server running on port", process.env.PORT || 3000)
);
