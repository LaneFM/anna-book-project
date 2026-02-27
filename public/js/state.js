export const state = {
    user: null,
    isAdmin: false,
    weekDays: [],
    eventsByDay: {},
    activeDayKey: "",
    activeTab: "home",
    selectedEventId: "",
    authMode: "register"
};

export const getEventsIndex = () => {
    const all = Object.values(state.eventsByDay).flat();
    return Object.fromEntries(all.map((eventItem) => [eventItem.id, eventItem]));
};

export const getVacantPlaces = (eventItem) => Math.max(Number(eventItem.capacity) - eventItem.registered.length, 0);

export const formatDate = (isoDate) => {
    const [year, month, day] = isoDate.split("-");
    return `${day}.${month}.${year}`;
};

export const isCurrentUserRegistered = (eventItem) => {
    if (!state.user) {
        return false;
    }

    return eventItem.registered.some(
        (person) =>
            person.name.toLowerCase() === state.user.username.toLowerCase() &&
            person.surname.toLowerCase() === state.user.surname.toLowerCase()
    );
};

export const getSignedEvents = () => {
    if (!state.user) {
        return [];
    }

    const index = getEventsIndex();
    return Object.values(index).filter((eventItem) =>
        eventItem.registered.some(
            (person) =>
                person.name.toLowerCase() === state.user.username.toLowerCase() &&
                person.surname.toLowerCase() === state.user.surname.toLowerCase()
        )
    );
};
