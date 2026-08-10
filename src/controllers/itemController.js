const itemService = require('../services/itemService')

async function createItem(req, res, next) {
    try {
        const owner_id = req.user.userId
        const {title, description, category, price, rental_unit, images} = req.body

        if(!owner_id || !title || !description || !category || !price || !rental_unit || !images || !Array.isArray(images) || images.length === 0){
            return res.status(400).json({error: 'All fields are required'})
        }
        const item = await itemService.addItem({owner_id, title, description, category, price, rental_unit, images});
        res.status(201).json({ item });
    } catch (err) {
        res.status(400).json({error: err.message})
    }
}

async function listItems(req, res){
    try{
        const { category, search, page, limit } = req.query;
        const items = await itemService.getPublicItems({
            category, 
            search,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 12,
        });
        res.json({items});
    } catch (error){
        res.status(400).json({ error: error.message})
    }
}

async function getItemById(req, res){
    try{
        const { id } = req.params;
        const item = await itemService.getPublicItemById(id);
        res.json({item});
    } catch (error){
        res.status(404).json({ error: error.message})
    }
}

module.exports = { createItem, listItems, getItemById }