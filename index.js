import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.post("/save", async (req, res) => {
  const { name, data, password } = req.body;
  const { error } = await supabase
    .from("game_states")
    .upsert([{ name, data, password }]);

  if (error) return res.status(500).json({ error });
  res.json({ success: true });
});

app.post("/load", async (req, res) => {
  const { name, password } = req.body;
  const { data, error } = await supabase
    .from("game_states")
    .select("data")
    .eq("name", name)
    .eq("password", password)
    .single();

  if (error) return res.status(404).json({ error });
  res.json({ data: data.data });
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Server running on port 3000")
);
