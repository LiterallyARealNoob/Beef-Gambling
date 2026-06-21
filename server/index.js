const express = require("express");
const cors = require("cors");
const path = require("path");
const { PORT } = require("./config");
const authRoutes = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "../public")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Beef Gambling server running on port ${PORT}`);
});