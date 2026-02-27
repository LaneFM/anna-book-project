import "dotenv/config";
import express from "express";
import path from "path";
import session from "express-session";
import { fileURLToPath } from "url";
import apiRouter from "./src/routes/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(
    session({
        secret: process.env.SESSION_SECRET || "change_me",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);

app.use("/api", apiRouter);
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});
