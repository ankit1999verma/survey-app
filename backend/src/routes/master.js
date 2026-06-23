const express = require('express');
const router = express.Router();
const { State, District, Block, GramPanchayat } = require('../models');

// ==== STATES ====
router.get('/states', async (req, res) => {
  try {
    const states = await State.findAll({ order: [['name', 'ASC']] });
    res.json(states);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/states', async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const state = await State.create({ name, code });
    res.status(201).json(state);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==== DISTRICTS ====
router.get('/districts', async (req, res) => {
  try {
    const { stateId } = req.query;
    const where = stateId ? { stateId } : {};
    const districts = await District.findAll({ where, order: [['name', 'ASC']], include: [State] });
    res.json(districts);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/districts', async (req, res) => {
  try {
    const { name, code, stateId } = req.body;
    if (!name || !stateId) return res.status(400).json({ error: 'Name and stateId are required' });
    const district = await District.create({ name, code, stateId });
    res.status(201).json(district);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==== BLOCKS ====
router.get('/blocks', async (req, res) => {
  try {
    const { districtId } = req.query;
    const where = districtId ? { districtId } : {};
    const blocks = await Block.findAll({ where, order: [['name', 'ASC']], include: [District] });
    res.json(blocks);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/blocks', async (req, res) => {
  try {
    const { name, code, districtId } = req.body;
    if (!name || !districtId) return res.status(400).json({ error: 'Name and districtId are required' });
    const block = await Block.create({ name, code, districtId });
    res.status(201).json(block);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==== GRAM PANCHAYATS ====
router.get('/grampanchayats', async (req, res) => {
  try {
    const { blockId } = req.query;
    const where = blockId ? { blockId } : {};
    const gps = await GramPanchayat.findAll({ where, order: [['name', 'ASC']], include: [Block] });
    res.json(gps);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/grampanchayats', async (req, res) => {
  try {
    const { name, code, blockId } = req.body;
    if (!name || !blockId) return res.status(400).json({ error: 'Name and blockId are required' });
    const gp = await GramPanchayat.create({ name, code, blockId });
    res.status(201).json(gp);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Sync master data endpoint for mobile app
router.get('/sync', async (req, res) => {
  try {
    const states = await State.findAll();
    const districts = await District.findAll();
    const blocks = await Block.findAll();
    const gramPanchayats = await GramPanchayat.findAll();
    
    res.json({
      states,
      districts,
      blocks,
      gramPanchayats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
