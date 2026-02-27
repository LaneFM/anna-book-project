import fs from "fs";

export const readJson = (filePath, fallback) => {
    try {
        const raw = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
};

export const writeJson = (filePath, value) => {
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf-8");
};
