'use strict';

const { DomainError } = require('../models/talent-show');
const { renderDashboard, renderContestantDetail, renderNotFound } = require('../views/dashboard');

class TalentController {
  constructor(model) {
    this.model = model;
  }

  async handle(req, res) {
    const url = new URL(req.url, 'http://localhost');
    try {
      if (req.method === 'GET' && url.pathname === '/') return this.dashboard(res, url);
      if (req.method === 'GET' && url.pathname === '/api/state') return this.state(res);
      if (req.method === 'GET' && url.pathname === '/style.css') return this.styles(res);

      const detailMatch = url.pathname.match(/^\/contestants\/(P\d+)$/);
      if (req.method === 'GET' && detailMatch) return this.detail(res, detailMatch[1], url);

      const decisionMatch = url.pathname.match(/^\/contestants\/(P\d+)\/decisions$/);
      if (req.method === 'POST' && decisionMatch) {
        const body = await this.#readForm(req);
        const result = this.model.submitDecision(body.get('judgeId'), decisionMatch[1], body.get('result'));
        return this.#redirect(res, '/', 'notice', result.message);
      }

      const buzzerMatch = url.pathname.match(/^\/contestants\/(P\d+)\/golden-buzzer$/);
      if (req.method === 'POST' && buzzerMatch) {
        const body = await this.#readForm(req);
        const result = this.model.useGoldenBuzzer(body.get('judgeId'), buzzerMatch[1]);
        return this.#redirect(res, '/', 'notice', result.message);
      }

      return this.#html(res, 404, renderNotFound());
    } catch (error) {
      if (error instanceof DomainError) {
        return this.#redirect(res, '/', 'error', error.message);
      }
      console.error(error);
      return this.#html(res, 500, '<h1>เกิดข้อผิดพลาดภายในระบบ</h1>');
    }
  }

  dashboard(res, url) {
    const state = this.model.getState();
    return this.#html(res, 200, renderDashboard({ ...state, summary: this.model.getSummary() }, {
      notice: url.searchParams.get('notice') || '',
      error: url.searchParams.get('error') || ''
    }));
  }

  detail(res, id, url) {
    const state = this.model.getState();
    const contestant = this.model.getContestant(id);
    return this.#html(res, 200, renderContestantDetail({ contestant, judges: state.judges }, {
      notice: url.searchParams.get('notice') || '',
      error: url.searchParams.get('error') || ''
    }));
  }

  state(res) {
    const payload = JSON.stringify({ ...this.model.getState(), summary: this.model.getSummary() }, null, 2);
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(payload) });
    res.end(payload);
  }

  styles(res) {
    const css = require('fs').readFileSync(require('path').join(__dirname, '..', 'public', 'style.css'));
    res.writeHead(200, { 'content-type': 'text/css; charset=utf-8', 'content-length': css.length, 'cache-control': 'no-cache' });
    res.end(css);
  }

  #html(res, statusCode, html) {
    res.writeHead(statusCode, { 'content-type': 'text/html; charset=utf-8', 'content-length': Buffer.byteLength(html) });
    res.end(html);
  }

  #redirect(res, path, key, message) {
    res.writeHead(303, { location: `${path}?${key}=${encodeURIComponent(message)}` });
    res.end();
  }

  async #readForm(req) {
    const chunks = [];
    let total = 0;
    for await (const chunk of req) {
      total += chunk.length;
      if (total > 10_000) throw new DomainError('FORM_TOO_LARGE', 'ข้อมูลแบบฟอร์มมีขนาดใหญ่เกินไป');
      chunks.push(chunk);
    }
    return new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
  }
}

module.exports = { TalentController };
