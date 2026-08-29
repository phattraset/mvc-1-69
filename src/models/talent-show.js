'use strict';

const STATUS = Object.freeze({
  PENDING: 'PENDING',
  ADVANCED: 'ADVANCED',
  ELIMINATED: 'ELIMINATED'
});

const RESULT = Object.freeze({ PASS: 'PASS', FAIL: 'FAIL' });

class DomainError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}

class TalentShow {
  constructor(seed) {
    this.judges = new Map();
    this.contestants = new Map();
    this.#load(seed);
  }

  #load(seed) {
    if (!seed || !Array.isArray(seed.judges) || !Array.isArray(seed.contestants)) {
      throw new Error('รูปแบบ seed_data.json ไม่ถูกต้อง');
    }

    for (const judge of seed.judges) {
      if (this.judges.has(judge.id)) throw new Error(`รหัสกรรมการซ้ำ: ${judge.id}`);
      this.judges.set(judge.id, {
        id: judge.id,
        name: judge.name,
        goldenBuzzerContestantId: null
      });
    }

    for (const contestant of seed.contestants) {
      if (this.contestants.has(contestant.id)) throw new Error(`รหัสผู้เข้าแข่งขันซ้ำ: ${contestant.id}`);
      this.contestants.set(contestant.id, {
        id: contestant.id,
        name: contestant.name,
        performance: contestant.performance,
        status: STATUS.PENDING,
        decisions: new Map(),
        qualification: null
      });
    }

    for (const decision of seed.decisions || []) {
      const judge = this.#requireJudge(decision.judge_id);
      const contestant = this.#requireContestant(decision.contestant_id);
      this.#requireResult(decision.result);
      if (contestant.decisions.has(judge.id)) {
        throw new Error(`ข้อมูลตั้งต้นมีผลซ้ำ: ${judge.id}/${contestant.id}`);
      }
      contestant.decisions.set(judge.id, decision.result);
    }

    for (const buzzer of seed.golden_buzzers || []) {
      const judge = this.#requireJudge(buzzer.judge_id);
      const contestant = this.#requireContestant(buzzer.contestant_id);
      if (judge.goldenBuzzerContestantId) throw new Error(`ข้อมูลตั้งต้นมี Golden Buzzer ซ้ำ: ${judge.id}`);
      if (contestant.status !== STATUS.PENDING) throw new Error(`ผู้เข้าแข่งขันถูกสรุปผลซ้ำ: ${contestant.id}`);
      if (contestant.decisions.has(judge.id)) throw new Error(`กรรมการให้ผลปกติและ Golden Buzzer ซ้ำ: ${judge.id}/${contestant.id}`);
      judge.goldenBuzzerContestantId = contestant.id;
      contestant.status = STATUS.ADVANCED;
      contestant.qualification = { type: 'GOLDEN_BUZZER', judgeId: judge.id };
    }

    for (const contestant of this.contestants.values()) {
      if (contestant.status === STATUS.PENDING && contestant.decisions.size === this.judges.size) {
        this.#finalizeNormal(contestant);
      }
      if (contestant.decisions.size > this.judges.size) {
        throw new Error(`จำนวนผลเกินจำนวนกรรมการ: ${contestant.id}`);
      }
    }
  }

  submitDecision(judgeId, contestantId, result) {
    const judge = this.#requireJudge(judgeId);
    const contestant = this.#requireContestant(contestantId);
    this.#requireResult(result);
    this.#requirePending(contestant);

    if (contestant.decisions.has(judge.id)) {
      throw new DomainError(
        'DUPLICATE_DECISION',
        `ปฏิเสธ: ${judge.id} เคยให้ผลแก่ ${contestant.id} แล้ว`
      );
    }

    contestant.decisions.set(judge.id, result);
    if (contestant.decisions.size === this.judges.size) this.#finalizeNormal(contestant);

    return {
      message: contestant.status === STATUS.PENDING
        ? `บันทึกผล ${result === RESULT.PASS ? 'ผ่าน' : 'ไม่ผ่าน'} สำเร็จ (${contestant.decisions.size}/${this.judges.size})`
        : `บันทึกผลสำเร็จและสรุปว่า ${this.#statusLabel(contestant.status)}`,
      contestant: this.getContestant(contestant.id)
    };
  }

  useGoldenBuzzer(judgeId, contestantId) {
    const judge = this.#requireJudge(judgeId);
    const contestant = this.#requireContestant(contestantId);
    this.#requirePending(contestant);

    if (judge.goldenBuzzerContestantId) {
      throw new DomainError(
        'GOLDEN_BUZZER_ALREADY_USED',
        `ปฏิเสธ: ${judge.id} ใช้ Golden Buzzer กับ ${judge.goldenBuzzerContestantId} ไปแล้ว`
      );
    }
    if (contestant.decisions.has(judge.id)) {
      throw new DomainError(
        'JUDGE_ALREADY_DECIDED',
        `ปฏิเสธ: ${judge.id} เคยให้ผลปกติแก่ ${contestant.id} แล้ว`
      );
    }

    judge.goldenBuzzerContestantId = contestant.id;
    contestant.status = STATUS.ADVANCED;
    contestant.qualification = { type: 'GOLDEN_BUZZER', judgeId: judge.id };

    return {
      message: `${contestant.id} ผ่านเข้ารอบด้วย Golden Buzzer ของ ${judge.id}`,
      contestant: this.getContestant(contestant.id)
    };
  }

  getContestant(id) {
    return this.#toContestantView(this.#requireContestant(id));
  }

  getState() {
    return {
      judges: Array.from(this.judges.values(), (judge) => ({ ...judge })),
      contestants: Array.from(this.contestants.values(), (contestant) => this.#toContestantView(contestant))
    };
  }

  getSummary() {
    const groups = {
      pending: [],
      advanced: [],
      eliminated: []
    };
    for (const contestant of this.contestants.values()) {
      const view = this.#toContestantView(contestant);
      if (contestant.status === STATUS.PENDING) groups.pending.push(view);
      else if (contestant.status === STATUS.ADVANCED) groups.advanced.push(view);
      else groups.eliminated.push(view);
    }
    return groups;
  }

  #finalizeNormal(contestant) {
    const passCount = Array.from(contestant.decisions.values()).filter((value) => value === RESULT.PASS).length;
    const failCount = contestant.decisions.size - passCount;
    contestant.status = passCount >= 3 ? STATUS.ADVANCED : STATUS.ELIMINATED;
    contestant.qualification = { type: 'NORMAL', passCount, failCount };
  }

  #toContestantView(contestant) {
    const passCount = Array.from(contestant.decisions.values()).filter((value) => value === RESULT.PASS).length;
    return {
      id: contestant.id,
      name: contestant.name,
      performance: contestant.performance,
      status: contestant.status,
      passCount,
      failCount: contestant.decisions.size - passCount,
      decisionCount: contestant.decisions.size,
      decisions: Array.from(contestant.decisions, ([judgeId, result]) => ({ judgeId, result })),
      qualification: contestant.qualification ? { ...contestant.qualification } : null
    };
  }

  #requireJudge(id) {
    const judge = this.judges.get(id);
    if (!judge) throw new DomainError('JUDGE_NOT_FOUND', `ไม่พบกรรมการ ${id || '(ว่าง)'}`);
    return judge;
  }

  #requireContestant(id) {
    const contestant = this.contestants.get(id);
    if (!contestant) throw new DomainError('CONTESTANT_NOT_FOUND', `ไม่พบผู้เข้าแข่งขัน ${id || '(ว่าง)'}`);
    return contestant;
  }

  #requireResult(result) {
    if (result !== RESULT.PASS && result !== RESULT.FAIL) {
      throw new DomainError('INVALID_RESULT', 'ผลปกติต้องเป็น PASS หรือ FAIL เท่านั้น');
    }
  }

  #requirePending(contestant) {
    if (contestant.status !== STATUS.PENDING) {
      throw new DomainError(
        'ALREADY_FINALIZED',
        `ปฏิเสธ: ${contestant.id} สรุปผลเป็น ${this.#statusLabel(contestant.status)} แล้ว`
      );
    }
  }

  #statusLabel(status) {
    return status === STATUS.ADVANCED ? 'ผ่านเข้ารอบ' : status === STATUS.ELIMINATED ? 'ไม่ผ่านเข้ารอบ' : 'รอผล';
  }
}

module.exports = { TalentShow, DomainError, STATUS, RESULT };
