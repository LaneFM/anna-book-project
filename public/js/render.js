import { state, getEventsIndex, formatDate, getVacantPlaces, isCurrentUserRegistered, getSignedEvents } from "./state.js";

export const dom = {
    homeScreen: document.getElementById("homeScreen"),
    profileScreen: document.getElementById("profileScreen"),
    adminScreen: document.getElementById("adminScreen"),
    daysSlider: document.querySelector(".days-slider"),
    eventsTrack: document.getElementById("eventsTrack"),
    navItems: document.querySelectorAll(".mobile-nav__item"),

    authGuest: document.getElementById("authGuest"),
    authUser: document.getElementById("authUser"),
    authTitle: document.getElementById("authTitle"),
    authSubmitBtn: document.getElementById("authSubmitBtn"),
    authToggleBtn: document.getElementById("authToggleBtn"),
    authSurnameRow: document.getElementById("authSurnameRow"),
    authMessage: document.getElementById("authMessage"),
    profileName: document.getElementById("profileName"),
    profileSurname: document.getElementById("profileSurname"),
    profileEventsList: document.getElementById("profileEventsList"),

    adminUser: document.getElementById("adminUser"),
    adminMessage: document.getElementById("adminMessage"),
    adminDaySelect: document.getElementById("adminDaySelect"),
    adminEventsList: document.getElementById("adminEventsList"),
    adminRegisteredList: document.getElementById("adminRegisteredList"),
    adminEventId: document.getElementById("adminEventId"),
    adminDeleteBtn: document.getElementById("adminDeleteBtn"),
    adminEventDate: document.getElementById("adminEventDate"),

    eventModal: document.getElementById("eventModal"),
    formModal: document.getElementById("formModal"),
    eventDetails: document.getElementById("eventDetails"),
    registeredList: document.getElementById("registeredList"),
    eventActionBtn: document.getElementById("eventActionBtn"),
    formModalTitle: document.getElementById("formModalTitle"),
    formConfirmBtn: document.getElementById("formConfirmBtn"),
    firstNameInput: document.getElementById("firstName"),
    lastNameInput: document.getElementById("lastName")
};

export const setAuthMessage = (text) => {
    dom.authMessage.textContent = text;
};

export const setAdminMessage = (text) => {
    if (dom.adminMessage) {
        dom.adminMessage.textContent = text;
    }
};

export const openModal = (modal) => {
    modal.classList.remove("is-hidden");
    modal.setAttribute("aria-hidden", "false");
};

export const closeModal = (modal) => {
    modal.classList.add("is-hidden");
    modal.setAttribute("aria-hidden", "true");
};

export const renderDays = () => {
    dom.daysSlider.innerHTML = "";

    state.weekDays.forEach((dayInfo) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `day-pill${dayInfo.key === state.activeDayKey ? " is-active" : ""}`;
        button.textContent = dayInfo.label;
        button.dataset.dayKey = dayInfo.key;
        dom.daysSlider.appendChild(button);
    });
};

export const renderEvents = () => {
    const events = state.eventsByDay[state.activeDayKey] || [];

    dom.eventsTrack.innerHTML = "";
    events.forEach((eventItem) => {
        const card = document.createElement("article");
        card.className = "event-card";
        card.dataset.eventId = eventItem.id;
        card.innerHTML = `
            <span class="event-card__time">${eventItem.time}</span>
            <h2 class="event-card__title">${eventItem.name}</h2>
            <p class="event-card__meta">${formatDate(eventItem.date)} • ${eventItem.duration} • Host: ${eventItem.host}</p>
            <p class="event-card__vacant">Vacant places: ${getVacantPlaces(eventItem)}</p>
        `;
        dom.eventsTrack.appendChild(card);
    });
};

export const renderProfile = () => {
    if (!state.user) {
        dom.profileName.textContent = "Name: -";
        dom.profileSurname.textContent = "Surname: -";
        dom.profileEventsList.innerHTML = "";
        return;
    }

    dom.profileName.textContent = `Name: ${state.user.username}`;
    dom.profileSurname.textContent = `Surname: ${state.user.surname}`;

    const signedEvents = getSignedEvents();
    dom.profileEventsList.innerHTML = "";

    if (!signedEvents.length) {
        dom.profileEventsList.innerHTML = "<li class=\"registered-list__empty\">No signed events</li>";
        return;
    }

    signedEvents.forEach((eventItem) => {
        const item = document.createElement("li");
        item.className = "profile-events__item";
        item.innerHTML = `<button type="button" class="profile-events__button" data-event-id="${eventItem.id}">${eventItem.name} • ${formatDate(eventItem.date)} • ${eventItem.time} • Host: ${eventItem.host}</button>`;
        dom.profileEventsList.appendChild(item);
    });
};

export const renderUserAuthState = () => {
    const loggedIn = Boolean(state.user);
    dom.authGuest.classList.toggle("is-hidden", loggedIn);
    dom.authUser.classList.toggle("is-hidden", !loggedIn);
    if (loggedIn) {
        renderProfile();
    }
};

export const renderAuthMode = () => {
    const register = state.authMode === "register";
    dom.authTitle.textContent = register ? "Register" : "Log in";
    dom.authSubmitBtn.textContent = register ? "Register" : "Log in";
    dom.authToggleBtn.textContent = register ? "Already registered? Log in" : "No account? Register";
    dom.authSurnameRow.classList.toggle("is-hidden", !register);
};

export const renderAdminState = () => {
    dom.adminUser.classList.toggle("is-hidden", !state.isAdmin);
};

export const renderAdminDays = () => {
    dom.adminDaySelect.innerHTML = "";
    state.weekDays.forEach((dayInfo) => {
        const option = document.createElement("option");
        option.value = dayInfo.key;
        option.textContent = dayInfo.label;
        dom.adminDaySelect.appendChild(option);
    });
    dom.adminEventDate.min = state.weekDays[0]?.key || "";
    dom.adminEventDate.max = state.weekDays[state.weekDays.length - 1]?.key || "";
};

export const renderAdminEvents = (dayKey) => {
    const events = state.eventsByDay[dayKey] || [];
    dom.adminEventsList.innerHTML = "";

    if (!events.length) {
        dom.adminEventsList.innerHTML = "<li class=\"registered-list__empty\">No events for selected day</li>";
        return;
    }

    events.forEach((eventItem) => {
        const item = document.createElement("li");
        item.className = "admin-event-row";
        item.innerHTML = `
            <p class="admin-event-row__title">${eventItem.time} • ${eventItem.name} • Host: ${eventItem.host}</p>
            <div class="admin-event-row__actions">
                <button type="button" class="admin-btn" data-admin-edit="${eventItem.id}">Edit</button>
                <button type="button" class="admin-btn is-danger" data-admin-delete="${eventItem.id}">Delete</button>
            </div>
        `;
        dom.adminEventsList.appendChild(item);
    });
};

export const renderSelectedEventDetails = () => {
    const index = getEventsIndex();
    const eventItem = index[state.selectedEventId];
    if (!eventItem) {
        return null;
    }

    dom.eventDetails.innerHTML = `
        <div class="event-details__row"><dt>Name</dt><dd>${eventItem.name}</dd></div>
        <div class="event-details__row"><dt>Date</dt><dd>${formatDate(eventItem.date)}</dd></div>
        <div class="event-details__row"><dt>Time</dt><dd>${eventItem.time}</dd></div>
        <div class="event-details__row"><dt>Duration</dt><dd>${eventItem.duration}</dd></div>
        <div class="event-details__row"><dt>Host</dt><dd>${eventItem.host}</dd></div>
        <div class="event-details__row"><dt>Vacant places</dt><dd>${getVacantPlaces(eventItem)}</dd></div>
    `;

    dom.registeredList.innerHTML = "";
    if (!eventItem.registered.length) {
        dom.registeredList.innerHTML = "<li class=\"registered-list__empty\">No registrations yet</li>";
    } else {
        eventItem.registered.forEach((person) => {
            const li = document.createElement("li");
            li.className = "registered-list__item";
            li.textContent = `${person.name} ${person.surname}`;
            dom.registeredList.appendChild(li);
        });
    }

    const signed = isCurrentUserRegistered(eventItem);
    const fullAndNotSigned = getVacantPlaces(eventItem) === 0 && !signed;
    dom.eventActionBtn.textContent = fullAndNotSigned
        ? "No vacant places"
        : signed
            ? "Unsign from event"
            : "Register to event";
    dom.eventActionBtn.disabled = fullAndNotSigned;
    dom.eventActionBtn.classList.toggle("is-danger", signed && !fullAndNotSigned);

    return eventItem;
};

export const renderAdminRegistered = (eventId) => {
    const index = getEventsIndex();
    const eventItem = index[eventId];
    dom.adminRegisteredList.innerHTML = "";

    if (!eventItem) {
        dom.adminRegisteredList.innerHTML = "<li class=\"registered-list__empty\">Select event to manage users</li>";
        return;
    }

    if (!eventItem.registered.length) {
        dom.adminRegisteredList.innerHTML = "<li class=\"registered-list__empty\">No signed users</li>";
        return;
    }

    eventItem.registered.forEach((person, indexItem) => {
        const li = document.createElement("li");
        li.className = "admin-event-row";
        li.innerHTML = `
            <p class="admin-event-row__title">${person.name} ${person.surname}</p>
            <div class="admin-event-row__actions">
                <button type="button" class="admin-btn is-danger" data-remove-signed="${indexItem}">Remove</button>
            </div>
        `;
        dom.adminRegisteredList.appendChild(li);
    });
};

export const setTab = (tab) => {
    state.activeTab = tab;
    dom.navItems.forEach((item) => item.classList.toggle("is-active", item.dataset.tab === tab));
    const showingHome = tab === "home";
    const showingProfile = tab === "profile" && !state.isAdmin;
    const showingAdmin = tab === "profile" && state.isAdmin;
    dom.homeScreen.classList.toggle("is-hidden", !showingHome);
    dom.profileScreen.classList.toggle("is-hidden", !showingProfile);
    dom.adminScreen.classList.toggle("is-hidden", !showingAdmin);
};
