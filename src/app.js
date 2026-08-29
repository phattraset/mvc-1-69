'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { TalentShow } = require('./models/talent-show');
const { TalentController } = require('./controllers/talent-controller');

function loadSeed(seedPath = path.join(__dirname, '..', 'data', 'seed_data.json')) {
  return JSON.parse(fs.readFileSync(seedPath, 'utf8'));
}

function createApp(seed = loadSeed()) {
  const model = new TalentShow(seed);
  const controller = new TalentController(model);
  const server = http.createServer((req, res) => controller.handle(req, res));
  return { server, model, controller };
}

module.exports = { createApp, loadSeed };
