const authService = require('../services/authService');

async function register(req, res) {
    try {
        const {name, email, password} = req.body;
        if(!name || !email || !password){
            return res.status(400).json({error: 'Name, Email & Password are required'});
        }

        const user = await authService.registerUser({ name, email, password});
        res.status(201).json({ user });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

async function login(req, res){
    try {
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).json({error: 'Email & Password are required'});
        }
        const result = await authService.loginUser({ email, password });
        res.json(result);
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
}

module.exports = {register, login}