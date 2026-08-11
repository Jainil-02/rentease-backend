const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {

    const token = req.cookies.token;

    if(!token) {
        return res.status(401).json({ error: 'No token provided'});
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or Expired token' })
    }
}

function requireAdmin(req, res, next) {
    if(!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

module.exports = {requireAuth, requireAdmin}