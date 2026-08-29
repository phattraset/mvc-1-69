'use strict';

const STATUS_META = {
  PENDING: { label: 'รอผล', className: 'pending' },
  ADVANCED: { label: 'ผ่านเข้ารอบ', className: 'advanced' },
  ELIMINATED: { label: 'ไม่ผ่านเข้ารอบ', className: 'eliminated' }
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function layout(content, { notice = '', error = '' } = {}) {
  const alert = error
    ? `<div class="alert error" role="alert">${escapeHtml(error)}</div>`
    : notice ? `<div class="alert success" role="status">${escapeHtml(notice)}</div>` : '';
  return `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ladkrabang's Got Talent</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <header class="hero">
    <div><span class="eyebrow">MVC PRACTICE PROJECT</span><h1>Ladkrabang's Got Talent</h1></div>
    <a href="/" class="home-link">หน้าสรุปผล</a>
  </header>
  <main>${alert}${content}</main>
  <footer>ข้อมูลจะกลับเป็นค่าเริ่มต้นเมื่อปิดโปรแกรม ตาม Requirement R1</footer>
</body>
</html>`;
}

function judgeOptions(judges) {
  return judges.map((judge) => {
    const used = judge.goldenBuzzerContestantId ? ` · ใช้ GB กับ ${judge.goldenBuzzerContestantId}` : '';
    return `<option value="${escapeHtml(judge.id)}">${escapeHtml(judge.id)} — ${escapeHtml(judge.name)}${escapeHtml(used)}</option>`;
  }).join('');
}

function contestantCard(contestant, judges) {
  const meta = STATUS_META[contestant.status];
  const qualification = contestant.qualification?.type === 'GOLDEN_BUZZER'
    ? `<p class="golden-note">★ Golden Buzzer โดย ${escapeHtml(contestant.qualification.judgeId)}</p>`
    : contestant.qualification?.type === 'NORMAL'
      ? `<p class="count">ผลสุดท้าย: ผ่าน ${contestant.passCount} / ไม่ผ่าน ${contestant.failCount}</p>`
      : `<p class="count">ผลปัจจุบัน: ผ่าน ${contestant.passCount} / ไม่ผ่าน ${contestant.failCount} (${contestant.decisionCount}/4)</p>`;
  const actions = contestant.status === 'PENDING' ? `
    <div class="actions">
      <form method="post" action="/contestants/${escapeHtml(contestant.id)}/decisions">
        <label>กรรมการ<select name="judgeId" required>${judgeOptions(judges)}</select></label>
        <div class="button-row">
          <button name="result" value="PASS" class="pass">ผ่าน</button>
          <button name="result" value="FAIL" class="fail">ไม่ผ่าน</button>
        </div>
      </form>
      <form method="post" action="/contestants/${escapeHtml(contestant.id)}/golden-buzzer">
        <label>กรรมการ<select name="judgeId" required>${judgeOptions(judges)}</select></label>
        <button class="golden">★ Golden Buzzer</button>
      </form>
    </div>` : '';
  return `<article class="contestant-card">
    <div class="card-head"><span class="contestant-id">${escapeHtml(contestant.id)}</span><span class="status ${meta.className}">${meta.label}</span></div>
    <h3>${escapeHtml(contestant.name)}</h3>
    <p class="performance">${escapeHtml(contestant.performance)}</p>
    ${qualification}
    <a class="details-link" href="/contestants/${escapeHtml(contestant.id)}">ดูรายละเอียดผล</a>
    ${actions}
  </article>`;
}

function renderDashboard({ judges, contestants, summary }, messages) {
  const stats = `
  <section class="stats" aria-label="สรุปจำนวน">
    <div><strong>${summary.pending.length}</strong><span>รอผล</span></div>
    <div><strong>${summary.advanced.length}</strong><span>ผ่านเข้ารอบ</span></div>
    <div><strong>${summary.eliminated.length}</strong><span>ไม่ผ่านเข้ารอบ</span></div>
  </section>`;
  const judgePanel = `<details class="judge-panel"><summary>สถานะกรรมการและสิทธิ์ Golden Buzzer</summary><ul>${judges.map((judge) =>
    `<li><strong>${escapeHtml(judge.id)}</strong> ${escapeHtml(judge.name)} — ${judge.goldenBuzzerContestantId ? `ใช้แล้วกับ ${escapeHtml(judge.goldenBuzzerContestantId)}` : 'ยังใช้ได้'}</li>`
  ).join('')}</ul></details>`;
  const groups = [
    { title: 'รอผล', items: summary.pending, className: 'pending' },
    { title: 'ผ่านเข้ารอบ', items: summary.advanced, className: 'advanced' },
    { title: 'ไม่ผ่านเข้ารอบ', items: summary.eliminated, className: 'eliminated' }
  ].map((group) => `<section class="contestant-group">
    <div class="section-title"><h2>${group.title}</h2><span>${group.items.length} คน</span></div>
    ${group.items.length
      ? `<div class="grid">${group.items.map((contestant) => contestantCard(contestant, judges)).join('')}</div>`
      : `<p class="empty-group">ยังไม่มีผู้เข้าแข่งขันในกลุ่มนี้</p>`}
  </section>`).join('');
  return layout(`${stats}${judgePanel}<div class="section-title"><h2>สรุปผู้เข้าแข่งขัน</h2><span>${contestants.length} คน</span></div>${groups}`, messages);
}

function renderContestantDetail({ contestant, judges }, messages) {
  const meta = STATUS_META[contestant.status];
  const decisions = contestant.decisions.length
    ? contestant.decisions.map((decision) => {
        const judge = judges.find((item) => item.id === decision.judgeId);
        return `<tr><td>${escapeHtml(decision.judgeId)}</td><td>${escapeHtml(judge?.name || '')}</td><td><span class="result ${decision.result.toLowerCase()}">${decision.result}</span></td></tr>`;
      }).join('')
    : '<tr><td colspan="3" class="empty">ยังไม่มีผลปกติ</td></tr>';
  const extra = contestant.qualification?.type === 'GOLDEN_BUZZER'
    ? `<div class="qualification golden-note">★ ผ่านด้วย Golden Buzzer ของ ${escapeHtml(contestant.qualification.judgeId)}</div>`
    : `<div class="qualification">ผ่าน ${contestant.passCount} · ไม่ผ่าน ${contestant.failCount} · รวม ${contestant.decisionCount}/4</div>`;
  return layout(`<a href="/" class="back">← กลับหน้าหลัก</a><section class="detail-card">
    <div class="card-head"><span class="contestant-id">${escapeHtml(contestant.id)}</span><span class="status ${meta.className}">${meta.label}</span></div>
    <h2>${escapeHtml(contestant.name)}</h2><p class="performance">${escapeHtml(contestant.performance)}</p>${extra}
    <h3>ผลจากกรรมการ</h3><div class="table-wrap"><table><thead><tr><th>รหัส</th><th>กรรมการ</th><th>ผล</th></tr></thead><tbody>${decisions}</tbody></table></div>
  </section>`, messages);
}

function renderNotFound() {
  return layout('<section class="detail-card"><h2>404</h2><p>ไม่พบหน้าที่ต้องการ</p><a href="/">กลับหน้าหลัก</a></section>');
}

module.exports = { renderDashboard, renderContestantDetail, renderNotFound };
