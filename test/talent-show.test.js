'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { TalentShow, DomainError, STATUS } = require('../src/models/talent-show');
const { loadSeed } = require('../src/app');

function freshShow() {
  return new TalentShow(loadSeed());
}

test('โหลดสถานะตั้งต้นและ Golden Buzzer ได้ถูกต้อง', () => {
  const show = freshShow();
  assert.equal(show.getContestant('P06').status, STATUS.ADVANCED);
  assert.deepEqual(show.getContestant('P06').qualification, { type: 'GOLDEN_BUZZER', judgeId: 'J04' });
  assert.equal(show.getContestant('P02').decisionCount, 3);
});

test('T1-T6 ทำงานต่อเนื่องบนสถานะเดียวกัน', async (t) => {
  const show = freshShow();

  await t.test('T1 J02 ให้ PASS แก่ P01', () => {
    const output = show.submitDecision('J02', 'P01', 'PASS');
    assert.equal(output.contestant.decisionCount, 2);
    assert.equal(output.contestant.status, STATUS.PENDING);
  });

  await t.test('T2 ปฏิเสธผลซ้ำของ J01/P01', () => {
    assert.throws(
      () => show.submitDecision('J01', 'P01', 'FAIL'),
      (error) => error instanceof DomainError && error.code === 'DUPLICATE_DECISION'
    );
    assert.equal(show.getContestant('P01').decisionCount, 2);
  });

  await t.test('T3 ผลที่ 4 ทำให้ P02 ผ่านด้วยคะแนน 3/1', () => {
    const output = show.submitDecision('J04', 'P02', 'PASS');
    assert.equal(output.contestant.status, STATUS.ADVANCED);
    assert.equal(output.contestant.passCount, 3);
    assert.equal(output.contestant.failCount, 1);
    assert.deepEqual(output.contestant.qualification, { type: 'NORMAL', passCount: 3, failCount: 1 });
  });

  await t.test('T4 J02 ใช้ Golden Buzzer กับ P03', () => {
    const output = show.useGoldenBuzzer('J02', 'P03');
    assert.equal(output.contestant.status, STATUS.ADVANCED);
    assert.deepEqual(output.contestant.qualification, { type: 'GOLDEN_BUZZER', judgeId: 'J02' });
  });

  await t.test('T5 ปฏิเสธ Golden Buzzer ครั้งที่ 2 ของ J04', () => {
    assert.throws(
      () => show.useGoldenBuzzer('J04', 'P04'),
      (error) => error instanceof DomainError && error.code === 'GOLDEN_BUZZER_ALREADY_USED'
    );
    assert.equal(show.getContestant('P04').status, STATUS.PENDING);
  });

  await t.test('T6 ผลที่ 4 ทำให้ P05 ไม่ผ่านด้วยคะแนน 2/2', () => {
    const output = show.submitDecision('J04', 'P05', 'FAIL');
    assert.equal(output.contestant.status, STATUS.ELIMINATED);
    assert.equal(output.contestant.passCount, 2);
    assert.equal(output.contestant.failCount, 2);
  });
});

test('ห้ามให้ผลหรือ Golden Buzzer หลังสรุปผลแล้ว', () => {
  const show = freshShow();
  assert.throws(() => show.submitDecision('J01', 'P06', 'PASS'), (error) => error.code === 'ALREADY_FINALIZED');
  show.useGoldenBuzzer('J02', 'P03');
  assert.throws(() => show.submitDecision('J03', 'P03', 'PASS'), (error) => error.code === 'ALREADY_FINALIZED');
});

test('ห้ามกรรมการใช้ Golden Buzzer กับคนที่ตนให้ผลปกติแล้ว', () => {
  const show = freshShow();
  show.submitDecision('J03', 'P04', 'PASS');
  assert.throws(() => show.useGoldenBuzzer('J03', 'P04'), (error) => error.code === 'JUDGE_ALREADY_DECIDED');
});
