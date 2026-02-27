import path from "path";
import { fileURLToPath } from "url";
import { readJson, writeJson } from "./storage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedPath = path.join(__dirname, "..", "..", "data", "events.seed.json");
const schedulePath = path.join(__dirname, "..", "..", "data", "schedule.json");

const hostPool = [
    "Anna Pavlova",
    "Mark Johnson",
    "Sofia Lee",
    "Daniel Brown",
    "Eva Turner",
    "Noah Martin",
    "Olivia Clark",
    "Liam Walker"
];

const toIso = (dateObj) => {
    const local = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
};

const startOfToday = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const dayNumber = (dateObj) => Math.floor(dateObj.getTime() / 86400000);

const buildTemplates = () => {
    const raw = readJson(seedPath, {});
    return Object.values(raw)
        .flat()
        .map((item, index) => ({
            templateId: item.id || `template-${index}`,
            name: item.name,
            time: item.time,
            duration: item.duration,
            capacity: Number(item.capacity) || 10
        }));
};

const buildIndex = (eventsByDay) => {
    const all = Object.values(eventsByDay).flat();
    return Object.fromEntries(all.map((eventItem) => [eventItem.id, eventItem]));
};

const generateWeek = (templates, prevIndex) => {
    const today = startOfToday();
    const anchor = toIso(today);
    const days = [];
    const events = {};

    for (let i = 0; i < 7; i += 1) {
        const dateObj = new Date(today);
        dateObj.setDate(today.getDate() + i);

        const dateIso = toIso(dateObj);
        const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(dateObj);
        const label = `${weekday} ${String(dateObj.getDate()).padStart(2, "0")}.${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
        days.push({ key: dateIso, label });

        const start = (dayNumber(dateObj) * 3) % templates.length;
        const dayEvents = [];

        for (let j = 0; j < 4; j += 1) {
            const template = templates[(start + j) % templates.length];
            const id = `${dateIso}-${template.templateId}`;
            const host = hostPool[(dayNumber(dateObj) + j) % hostPool.length];
            const registered = prevIndex[id]?.registered || [];

            dayEvents.push({
                id,
                name: template.name,
                date: dateIso,
                time: template.time,
                duration: template.duration,
                capacity: template.capacity,
                host,
                registered
            });
        }

        events[dateIso] = dayEvents;
    }

    return { anchor, days, events };
};

export const loadOrCreateSchedule = () => {
    const templates = buildTemplates();
    const saved = readJson(schedulePath, null);
    const todayIso = toIso(startOfToday());

    if (saved && saved.anchor === todayIso && Array.isArray(saved.days) && saved.events) {
        return saved;
    }

    const prevIndex = saved?.events ? buildIndex(saved.events) : {};
    const fresh = generateWeek(templates, prevIndex);
    writeJson(schedulePath, fresh);
    return fresh;
};

export const saveSchedule = (schedule) => {
    writeJson(schedulePath, schedule);
};

export const getEventIndex = (schedule) => buildIndex(schedule.events);
