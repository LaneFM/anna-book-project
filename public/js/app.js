import { api } from "./api.js";
import {
    state,
    getEventsIndex,
    isCurrentUserRegistered
} from "./state.js";
import {
    dom,
    setAuthMessage,
    setAdminMessage,
    openModal,
    closeModal,
    renderDays,
    renderEvents,
    renderProfile,
    renderUserAuthState,
    renderAuthMode,
    renderAdminState,
    renderAdminDays,
    renderAdminEvents,
    renderSelectedEventDetails,
    renderAdminRegistered,
    setTab
} from "./render.js";

const authForm = document.getElementById("authForm");
const authName = document.getElementById("authName");
const authSurname = document.getElementById("authSurname");
const authPassword = document.getElementById("authPassword");
const logoutBtn = document.getElementById("logoutBtn");
const adminPanelLogoutBtn = document.getElementById("adminPanelLogoutBtn");

const adminEventForm = document.getElementById("adminEventForm");
const adminEventName = document.getElementById("adminEventName");
const adminEventDate = document.getElementById("adminEventDate");
const adminEventTime = document.getElementById("adminEventTime");
const adminEventDuration = document.getElementById("adminEventDuration");
const adminEventHost = document.getElementById("adminEventHost");
const adminEventCapacity = document.getElementById("adminEventCapacity");
const adminNewBtn = document.getElementById("adminNewBtn");

const registrationForm = document.getElementById("registrationForm");

const refreshFromBootstrap = async () => {
    const data = await api.bootstrap();
    state.user = data.user;
    state.isAdmin = Boolean(data.user && data.user.role === "admin");
    state.weekDays = data.weekDays;
    state.eventsByDay = data.eventsByDay;

    if (!state.activeDayKey || !state.eventsByDay[state.activeDayKey]) {
        state.activeDayKey = state.weekDays[0]?.key || "";
    }

    renderDays();
    renderEvents();
    renderProfile();
    renderUserAuthState();
    renderAdminState();
    renderAdminDays();
    dom.adminDaySelect.value = state.weekDays[0]?.key || "";
    renderAdminEvents(dom.adminDaySelect.value);
};

const clearAdminEditor = () => {
    adminEventForm.reset();
    dom.adminEventId.value = "";
    dom.adminDeleteBtn.classList.add("is-hidden");
    dom.adminEventDate.value = dom.adminDaySelect.value;
    renderAdminRegistered("");
};

const fillAdminEditor = (eventId) => {
    const eventItem = getEventsIndex()[eventId];
    if (!eventItem) {
        return;
    }

    dom.adminEventId.value = eventItem.id;
    adminEventName.value = eventItem.name;
    adminEventDate.value = eventItem.date;
    adminEventTime.value = eventItem.time;
    adminEventDuration.value = eventItem.duration;
    adminEventHost.value = eventItem.host;
    adminEventCapacity.value = eventItem.capacity;
    dom.adminDeleteBtn.classList.remove("is-hidden");
    renderAdminRegistered(eventItem.id);
};

const openEvent = (eventId) => {
    state.selectedEventId = eventId;
    renderSelectedEventDetails();
    openModal(dom.eventModal);
};

const setupListeners = () => {
    dom.daysSlider.addEventListener("click", (event) => {
        const btn = event.target.closest("[data-day-key]");
        if (!btn) {
            return;
        }

        state.activeDayKey = btn.dataset.dayKey;
        renderDays();
        renderEvents();
    });

    dom.navItems.forEach((item) => {
        item.addEventListener("click", () => {
            setTab(item.dataset.tab);
        });
    });

    dom.authToggleBtn.addEventListener("click", () => {
        state.authMode = state.authMode === "register" ? "login" : "register";
        setAuthMessage("");
        renderAuthMode();
    });

    authForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        try {
            if (state.authMode === "register") {
                const result = await api.register({
                    username: authName.value,
                    surname: authSurname.value,
                    password: authPassword.value
                });
                state.user = result.user;
            } else {
                const result = await api.login({ username: authName.value, password: authPassword.value });
                state.user = result.user;
            }
            state.isAdmin = Boolean(state.user && state.user.role === "admin");

            authForm.reset();
            setAuthMessage("");
            renderUserAuthState();
            renderProfile();
            if (state.activeTab === "profile") {
                setTab("profile");
            }
        } catch (error) {
            setAuthMessage(error.message);
        }
    });

    logoutBtn.addEventListener("click", async () => {
        await api.logout();
        state.user = null;
        state.isAdmin = false;
        state.authMode = "login";
        renderAuthMode();
        renderUserAuthState();
        setTab("profile");
    });

    adminPanelLogoutBtn.addEventListener("click", async () => {
        await api.logout();
        state.user = null;
        state.isAdmin = false;
        state.authMode = "login";
        renderAuthMode();
        renderUserAuthState();
        setTab("profile");
    });

    dom.adminDaySelect.addEventListener("change", () => {
        renderAdminEvents(dom.adminDaySelect.value);
        clearAdminEditor();
    });

    dom.adminEventsList.addEventListener("click", async (event) => {
        const editId = event.target.getAttribute("data-admin-edit");
        const deleteId = event.target.getAttribute("data-admin-delete");

        if (editId) {
            fillAdminEditor(editId);
            return;
        }

        if (deleteId) {
            await api.deleteEvent(deleteId);
            await refreshFromBootstrap();
            renderAdminEvents(dom.adminDaySelect.value);
            clearAdminEditor();
        }
    });

    adminEventForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        try {
            await api.upsertEvent({
                id: dom.adminEventId.value || undefined,
                name: adminEventName.value,
                date: adminEventDate.value,
                time: adminEventTime.value,
                duration: adminEventDuration.value,
                host: adminEventHost.value,
                capacity: Number(adminEventCapacity.value)
            });
            setAdminMessage("");
            await refreshFromBootstrap();
            dom.adminDaySelect.value = adminEventDate.value;
            renderAdminEvents(dom.adminDaySelect.value);
            clearAdminEditor();
        } catch (error) {
            setAdminMessage(error.message);
        }
    });

    adminNewBtn.addEventListener("click", () => {
        clearAdminEditor();
    });

    dom.adminDeleteBtn.addEventListener("click", async () => {
        if (!dom.adminEventId.value) {
            return;
        }

        await api.deleteEvent(dom.adminEventId.value);
        await refreshFromBootstrap();
        renderAdminEvents(dom.adminDaySelect.value);
        clearAdminEditor();
    });

    dom.adminRegisteredList.addEventListener("click", async (event) => {
        const idx = event.target.getAttribute("data-remove-signed");
        if (idx === null || !dom.adminEventId.value) {
            return;
        }

        await api.deleteSignedUser(dom.adminEventId.value, Number(idx));
        await refreshFromBootstrap();
        fillAdminEditor(dom.adminEventId.value);
        renderAdminEvents(dom.adminDaySelect.value);
        renderSelectedEventDetails();
    });

    dom.eventsTrack.addEventListener("click", (event) => {
        const card = event.target.closest(".event-card");
        if (!card) {
            return;
        }

        openEvent(card.dataset.eventId);
    });

    dom.profileEventsList.addEventListener("click", (event) => {
        const button = event.target.closest(".profile-events__button");
        if (!button) {
            return;
        }

        openEvent(button.dataset.eventId);
    });

    dom.eventActionBtn.addEventListener("click", () => {
        if (dom.eventActionBtn.disabled) {
            return;
        }

        const eventItem = getEventsIndex()[state.selectedEventId];
        if (!eventItem) {
            return;
        }

        const signed = isCurrentUserRegistered(eventItem);
        dom.formModalTitle.textContent = signed ? "Unsign from event" : "Register to event";
        dom.formConfirmBtn.textContent = signed ? "Confirm unsign" : "Confirm registration";

        if (state.user) {
            dom.firstNameInput.value = state.user.username;
            dom.lastNameInput.value = state.user.surname;
            dom.firstNameInput.readOnly = true;
            dom.lastNameInput.readOnly = true;
        } else {
            dom.firstNameInput.value = "";
            dom.lastNameInput.value = "";
            dom.firstNameInput.readOnly = false;
            dom.lastNameInput.readOnly = false;
        }

        dom.formModal.dataset.mode = signed ? "unsign" : "register";
        openModal(dom.formModal);
    });

    registrationForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const payload = { name: dom.firstNameInput.value, surname: dom.lastNameInput.value };
        const mode = dom.formModal.dataset.mode;
        try {
            if (mode === "register") {
                await api.registerEvent(state.selectedEventId, payload);
            } else {
                await api.unregisterEvent(state.selectedEventId, payload);
            }

            closeModal(dom.formModal);
            await refreshFromBootstrap();
            renderSelectedEventDetails();
            if (state.isAdmin && dom.adminEventId.value === state.selectedEventId) {
                fillAdminEditor(state.selectedEventId);
            }
        } catch (error) {
            dom.formModalTitle.textContent = error.message;
        }
    });

    document.querySelectorAll("[data-close-modal]").forEach((control) => {
        control.addEventListener("click", () => {
            const key = control.getAttribute("data-close-modal");
            if (key === "event") {
                closeModal(dom.eventModal);
            }
            if (key === "form") {
                closeModal(dom.formModal);
            }
        });
    });
};

const start = async () => {
    state.authMode = "register";
    renderAuthMode();
    setTab("home");
    await refreshFromBootstrap();
    setupListeners();
    clearAdminEditor();

    setInterval(async () => {
        const prevFirstDay = state.weekDays[0]?.key;
        await refreshFromBootstrap();
        if (state.weekDays[0]?.key !== prevFirstDay) {
            renderAdminEvents(dom.adminDaySelect.value || state.weekDays[0]?.key || "");
        }
    }, 60000);
};

start().catch(() => {
    dom.eventsTrack.innerHTML = "<p class=\"registered-list__empty\">Failed to load app data.</p>";
});
