import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { readJson, writeJson } from "./storage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersPath = path.join(__dirname, "..", "..", "data", "users.json");

const hashPassword = (password) =>
    crypto.createHash("sha256").update(password).digest("hex");

export const loadUsers = () => {
    const raw = readJson(usersPath, { users: [] });
    const users = Array.isArray(raw.users) ? raw.users : [];

    let changed = false;
    const normalized = users.map((user) => {
        if (user.passwordHash) {
            return {
                ...user,
                role: user.role || "user"
            };
        }

        changed = true;
        return {
            username: user.username,
            surname: user.surname,
            passwordHash: hashPassword(user.password || ""),
            role: user.role || "user"
        };
    });

    if (changed) {
        writeJson(usersPath, { users: normalized });
    }

    return normalized;
};

export const saveUsers = (users) => {
    writeJson(usersPath, { users });
};

export const registerUser = (users, payload) => {
    const username = payload.username?.trim();
    const surname = payload.surname?.trim();
    const password = payload.password?.trim();

    if (!username || !surname || !password) {
        throw new Error("Fill all fields");
    }

    const exists = users.some((user) => user.username.toLowerCase() === username.toLowerCase());
    if (exists) {
        throw new Error("Username already exists");
    }

    const newUser = { username, surname, passwordHash: hashPassword(password), role: "user" };
    users.push(newUser);
    return { username: newUser.username, surname: newUser.surname, role: newUser.role };
};

export const loginUser = (users, payload) => {
    const username = payload.username?.trim();
    const password = payload.password?.trim();

    if (!username || !password) {
        throw new Error("Fill all fields");
    }

    const match = users.find((user) => user.username.toLowerCase() === username.toLowerCase());
    if (!match || match.passwordHash !== hashPassword(password)) {
        throw new Error("Wrong username or password");
    }

    return { username: match.username, surname: match.surname, role: match.role || "user" };
};
