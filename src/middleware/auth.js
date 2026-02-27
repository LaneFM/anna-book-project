export const requireUser = (req, res, next) => {
    if (!req.session.user) {
        res.status(401).json({ error: "User auth required" });
        return;
    }

    next();
};

export const requireAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== "admin") {
        res.status(403).json({ error: "Admin auth required" });
        return;
    }

    next();
};
