import express from "express";
import { requireAdmin } from "../middleware/auth.js";
import {
    loadUsers,
    saveUsers,
    registerUser,
    loginUser
} from "../services/usersService.js";
import {
    loadOrCreateSchedule,
    saveSchedule,
    getEventIndex
} from "../services/scheduleService.js";

const router = express.Router();

const sanitizeUser = (user) =>
    user ? { username: user.username, surname: user.surname, role: user.role || "user" } : null;

router.get("/bootstrap", (req, res) => {
    const schedule = loadOrCreateSchedule();
    res.json({
        user: sanitizeUser(req.session.user),
        isAdmin: req.session.user?.role === "admin",
        weekDays: schedule.days,
        eventsByDay: schedule.events
    });
});

router.post("/auth/register", (req, res) => {
    try {
        const users = loadUsers();
        const user = registerUser(users, req.body || {});
        saveUsers(users);
        req.session.user = user;
        res.json({ user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post("/auth/login", (req, res) => {
    try {
        const users = loadUsers();
        const user = loginUser(users, req.body || {});
        req.session.user = user;
        res.json({ user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post("/auth/logout", (req, res) => {
    req.session.user = null;
    res.json({ ok: true });
});

router.post("/events/:eventId/register", (req, res) => {
    const schedule = loadOrCreateSchedule();
    const index = getEventIndex(schedule);
    const event = index[req.params.eventId];

    if (!event) {
        res.status(404).json({ error: "Event not found" });
        return;
    }

    const name = req.session.user?.username || req.body?.name?.trim();
    const surname = req.session.user?.surname || req.body?.surname?.trim();

    if (!name || !surname) {
        res.status(400).json({ error: "Name and surname required" });
        return;
    }

    const alreadyRegistered = event.registered.some(
        (person) => person.name.toLowerCase() === name.toLowerCase() && person.surname.toLowerCase() === surname.toLowerCase()
    );
    const vacantPlaces = Math.max(Number(event.capacity) - event.registered.length, 0);
    if (!alreadyRegistered && vacantPlaces === 0) {
        res.status(409).json({ error: "No vacant places" });
        return;
    }

    event.registered = event.registered.filter(
        (person) => !(person.name.toLowerCase() === name.toLowerCase() && person.surname.toLowerCase() === surname.toLowerCase())
    );
    event.registered.push({ name, surname });

    saveSchedule(schedule);
    res.json({ ok: true, event });
});

router.post("/events/:eventId/unregister", (req, res) => {
    const schedule = loadOrCreateSchedule();
    const index = getEventIndex(schedule);
    const event = index[req.params.eventId];

    if (!event) {
        res.status(404).json({ error: "Event not found" });
        return;
    }

    const name = req.session.user?.username || req.body?.name?.trim();
    const surname = req.session.user?.surname || req.body?.surname?.trim();

    if (!name || !surname) {
        res.status(400).json({ error: "Name and surname required" });
        return;
    }

    event.registered = event.registered.filter(
        (person) => !(person.name.toLowerCase() === name.toLowerCase() && person.surname.toLowerCase() === surname.toLowerCase())
    );

    saveSchedule(schedule);
    res.json({ ok: true, event });
});

router.get("/admin/schedule", requireAdmin, (_req, res) => {
    const schedule = loadOrCreateSchedule();
    res.json(schedule);
});

router.post("/admin/events", requireAdmin, (req, res) => {
    const payload = req.body || {};
    const { id, name, date, time, duration, host, capacity } = payload;

    if (!name || !date || !time || !duration || !host || !capacity) {
        res.status(400).json({ error: "Missing fields" });
        return;
    }

    const schedule = loadOrCreateSchedule();
    if (!schedule.events[date]) {
        res.status(400).json({ error: "Date must be inside 7-day schedule" });
        return;
    }

    const index = getEventIndex(schedule);
    let registered = [];

    if (id && index[id]) {
        registered = index[id].registered;
        const prevDate = index[id].date;
        schedule.events[prevDate] = schedule.events[prevDate].filter((item) => item.id !== id);
    }

    const eventId = id || `${date}-custom-${Date.now()}`;
    const event = {
        id: eventId,
        name,
        date,
        time,
        duration,
        host,
        capacity: Number(capacity),
        registered
    };

    schedule.events[date].push(event);
    saveSchedule(schedule);
    res.json({ ok: true, event });
});

router.delete("/admin/events/:eventId", requireAdmin, (req, res) => {
    const schedule = loadOrCreateSchedule();
    const index = getEventIndex(schedule);
    const event = index[req.params.eventId];

    if (!event) {
        res.status(404).json({ error: "Event not found" });
        return;
    }

    schedule.events[event.date] = schedule.events[event.date].filter((item) => item.id !== event.id);
    saveSchedule(schedule);
    res.json({ ok: true });
});

router.delete("/admin/events/:eventId/registrations/:regIndex", requireAdmin, (req, res) => {
    const schedule = loadOrCreateSchedule();
    const index = getEventIndex(schedule);
    const event = index[req.params.eventId];

    if (!event) {
        res.status(404).json({ error: "Event not found" });
        return;
    }

    const regIndex = Number(req.params.regIndex);
    if (Number.isNaN(regIndex) || regIndex < 0 || regIndex >= event.registered.length) {
        res.status(400).json({ error: "Bad registration index" });
        return;
    }

    event.registered.splice(regIndex, 1);
    saveSchedule(schedule);
    res.json({ ok: true, event });
});

export default router;
