const request = async (url, options = {}) => {
    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        credentials: "same-origin",
        ...options
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || "Request failed");
    }

    return data;
};

export const api = {
    bootstrap: () => request("/api/bootstrap"),

    register: (payload) => request("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),
    login: (payload) => request("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
    logout: () => request("/api/auth/logout", { method: "POST" }),

    adminSchedule: () => request("/api/admin/schedule"),

    registerEvent: (eventId, payload) =>
        request(`/api/events/${eventId}/register`, { method: "POST", body: JSON.stringify(payload || {}) }),
    unregisterEvent: (eventId, payload) =>
        request(`/api/events/${eventId}/unregister`, { method: "POST", body: JSON.stringify(payload || {}) }),

    upsertEvent: (payload) => request("/api/admin/events", { method: "POST", body: JSON.stringify(payload) }),
    deleteEvent: (eventId) => request(`/api/admin/events/${eventId}`, { method: "DELETE" }),
    deleteSignedUser: (eventId, regIndex) => request(`/api/admin/events/${eventId}/registrations/${regIndex}`, { method: "DELETE" })
};
