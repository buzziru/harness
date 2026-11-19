// check-harness.mjs 단위 시험. 픽스처는 os.tmpdir()에 만들고 끝나면 지운다.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { check, mark, undecided, skipped } from './check-harness.mjs';

const tmp = mkdtempSync(join(tmpdir(), 'check-harness-'));
after(() => rmSync(tmp, { recursive: true, force: true }));

const FRAME = [
  '# 운영 틀',
  '## 판정 방법', '- 답: npm test', '- 출처: 사용자 2026-11-18 "테스트로 판정"',
  '## 승인 지점과 자율 범위', '- 답: 공개 전에 묻는다', '- 출처: 사용자 2026-11-18 "배포 전엔 물어"',
  '## 보호 장치', '- 답: main 푸시를 막는다', '- 출처: 사용자 2026-11-18 "main은 배포"',
  '- 대상: main 직접 푸시', '  - 장치: .claude/hooks/guard.mjs 푸시 차단',
  '- 대상: 비밀 값 출력', '  - 장치: deny Read(.env)',
  '- 대상: 외부 전송', '  - 장치 없음: 외부 전송 경로가 없다',
  '## 결정 기록', '- 답: docs/decisions/', '- 출처: 메인',
  '## 사람 검토 지점', '- 답: PR 검토 안내', '- 출처: 사용자 2026-11-18 "PR에서 볼게"',
  '## git·PR 흐름', '- 답: 가벼운 흐름', '- 출처: 사용자 2026-11-18 "가볍게"',
  '- 통합 방식: 기본', '- 브랜치 이름: 주제만 이유: 브랜치가 적다', '- 하네스 변경 분리: 기본',
  '- 보호 확인: 기본', '- 커밋 규칙: 기본',
].join('\n');

const ORCH = [
  '---', 'name: orch', 'description: x', '---',
  '| 규모 | 경로 |', '| --- | --- |', '| 문구 | 생성, 검증 |', '',
  '| 사용자에게 묻는다 | 메인이 정한다 |', '| --- | --- |', '| 배포 | 경로 이름 |', '',
  '노드: plan → write → review',
].join('\n');

const CONTRACTS = {
  nodes: {
    plan: { kind: 'human', inputs: [], outputs: [{ path: 'docs/plan.md', check: '미정' }] },
    write: {
      kind: 'agent', agent: 'a',
      inputs: [{ path: 'docs/plan.md', from: 'plan', required: true }],
      outputs: [{ path: 'out/<slug>.md', check: '형식: 요약' }],
      writes: ['out/**'], delegated: [], stop: { contract: [], premise: [] },
    },
    review: {
      kind: 'agent', agent: 'a',
      inputs: [{ path: 'out/<name>.md', from: 'write', required: true }],
      outputs: [{ path: '_workspace/NN_review.md', check: '미정' }],
      writes: ['_workspace/**'], delegated: ['지적 묶기'], stop: { contract: [], premise: ['계획 전제와 어긋남'] },
    },
  },
};
const contractsWith = (fn) => { const c = structuredClone(CONTRACTS); fn(c.nodes); return { '.claude/contracts.json': JSON.stringify(c) }; };
const manifest = (over = {}) => JSON.stringify({ frame: 'docs/harness/frame.md', orchestrator: '.claude/skills/orch/SKILL.md', changelog: 'docs/harness/CHANGELOG.md', gitFlow: 'light', contracts: '.claude/contracts.json', ...over });

const CHANGELOG = ['# 변경 이력', '사유 칸에 장치: 또는 장치 없음: 을 적는다.', '',
  '| 날짜 | 변경 | 사유 |', '| --- | --- | --- |', '| 2026-11-18 | 처음 구성 | 장치 없음: 첫 구성 |', ''].join('\n');

let n = 0;
function project(over = {}, more = {}) {
  over = { ...over, ...more };
  const root = join(tmp, 'p' + n++);
  const files = {
    '.claude/harness.json': manifest(),
    '.claude/contracts.json': JSON.stringify(CONTRACTS),
    'docs/harness/frame.md': FRAME,
    '.claude/skills/orch/SKILL.md': ORCH,
    '.claude/agents/a.md': '---\nname: a\nmodel: sonnet\n---\n계약: write, review',
    '.claude/hooks/guard.mjs': '',
    '.claude/settings.json': JSON.stringify({ permissions: { deny: ['Read(.env)'] } }),
    'CLAUDE.md': '# 프로젝트\n\n## Git\n\n- PR로 합친다',
    'docs/harness/CHANGELOG.md': CHANGELOG,
    ...over,
  };
  for (const [p, c] of Object.entries(files)) {
    if (c === null) continue;
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), c);
  }
  return root;
}
const ids = (found) => found.map((f) => f.split(':')[0]);
const frameWith = (from, to) => ({ 'docs/harness/frame.md': FRAME.replace(from, to) });

test('통과 사례: design·build 위반 없음', () => {
  const root = project();
  assert.deepEqual(check('design', root), []);
  assert.deepEqual(check('build', root), []);
});

test('D1: harness.json 없음, 키 빠짐, gitFlow 값', () => {
  assert.deepEqual(ids(check('design', project({ '.claude/harness.json': null }))), ['D1']);
  assert.deepEqual(ids(check('design', project({ '.claude/harness.json': '{"frame":"x"}' }))), ['D1']);
  assert.deepEqual(ids(check('design', project({ '.claude/harness.json': JSON.stringify({ frame: 'a', orchestrator: 'b', changelog: 'c', gitFlow: 'some' }) }))), ['D1']);
});

test('D2: frame 없음, 절 빠짐', () => {
  assert.deepEqual(ids(check('design', project({ 'docs/harness/frame.md': null }))), ['D2']);
  assert.deepEqual(ids(check('design', project(frameWith('## 사람 검토 지점', '## 사람 검토')))), ['D2']);
});

test('D3: 답 줄 없음, 출처 형식', () => {
  assert.deepEqual(ids(check('design', project(frameWith('- 답: npm test', '')))), ['D3']);
  assert.deepEqual(ids(check('design', project(frameWith('- 출처: 메인', '- 출처: 메인이 정함')))), ['D3']);
  assert.deepEqual(ids(check('design', project(frameWith('사용자 2026-11-18 "테스트로 판정"', '사용자 어제')))), ['D3']);
});

test('D4: 사용자에게 묻는 절의 출처가 메인', () => {
  assert.deepEqual(ids(check('design', project(frameWith('- 출처: 사용자 2026-11-18 "테스트로 판정"', '- 출처: 메인')))), ['D4']);
});

test('D5: 대상 없음, 장치 줄 없음', () => {
  const noTargets = FRAME.split('\n').filter((l) => !/^\s*- (대상|장치|장치 없음):/.test(l)).join('\n');
  assert.deepEqual(ids(check('design', project({ 'docs/harness/frame.md': noTargets }))), ['D5']);
  assert.deepEqual(ids(check('design', project(frameWith('  - 장치 없음: 외부 전송 경로가 없다', '  - 메모')))), ['D5']);
});

test('D6: 항목 빠짐, 이유 없는 다른 값, full이면 전체 항목까지, none이면 검사 안 함', () => {
  assert.deepEqual(ids(check('design', project(frameWith('- 커밋 규칙: 기본', '')))), ['D6']);
  assert.deepEqual(ids(check('design', project(frameWith(' 이유: 브랜치가 적다', '')))), ['D6']);
  const full = manifest({ gitFlow: 'full' });
  assert.ok(ids(check('design', project({ '.claude/harness.json': full }))).every((id) => id === 'D6'));
  assert.ok(check('design', project({ '.claude/harness.json': full })).length > 1);
  const none = manifest({ gitFlow: 'none' });
  assert.deepEqual(check('build', project({ '.claude/harness.json': none, ...frameWith('- 커밋 규칙: 기본', ''), 'CLAUDE.md': '# x' })), []);
});

test('B1: build는 design 검사를 포함한다', () => {
  assert.deepEqual(ids(check('build', project(frameWith('- 답: npm test', '')))), ['D3']);
});

test('B2·B3: 오케스트레이터 표', () => {
  assert.deepEqual(ids(check('build', project({ '.claude/skills/orch/SKILL.md': ORCH.replace('| 규모 | 경로 |', '| 크기 | 단계 |') }))), ['B2']);
  assert.deepEqual(ids(check('build', project({ '.claude/skills/orch/SKILL.md': ORCH.replace('사용자에게 묻는다', '묻는 일') }))), ['B3']);
});

test('B4: 장치 경로·deny 규칙이 없음', () => {
  assert.deepEqual(ids(check('build', project({ '.claude/hooks/guard.mjs': null }))), ['B4']);
  assert.deepEqual(ids(check('build', project({ '.claude/settings.json': '{}' }))), ['B4']);
});

test('B5: CLAUDE.md Git 절', () => {
  assert.deepEqual(ids(check('build', project({ 'CLAUDE.md': '# 프로젝트' }))), ['B5']);
});

test('B6: 변경 이력 머리에 장치', () => {
  assert.deepEqual(ids(check('build', project({ 'docs/harness/CHANGELOG.md': '| 날짜 | 변경 |\n| --- | --- |\n| a | b |' }))), ['B6']);
});

test('B7: commands, model:, 500줄, v1', () => {
  assert.deepEqual(ids(check('build', project({ '.claude/commands/x.md': 'x' }))), ['B7']);
  assert.deepEqual(ids(check('build', project({ '.claude/agents/b.md': '---\nname: b\n---\n' }))), ['B7']);
  assert.deepEqual(ids(check('build', project({ '.claude/skills/big/SKILL.md': 'x\n'.repeat(500) }))), ['B7']);
  assert.deepEqual(ids(check('build', project({ '.claude/agents/c.md': '---\nname: c\nmodel: opus\n---\nTeamCreate로 만든다' }))), ['B7']);
});

function gitProject(over) {
  const root = project(over);
  const g = (...a) => execFileSync('git', ['-C', root, ...a], { stdio: 'pipe' });
  g('init', '-q');
  g('add', '-A');
  g('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'init');
  return root;
}

test('E1: 표 이력에 더한 행', () => {
  const root = gitProject();
  assert.deepEqual(check('evolve', root), []);
  const p = join(root, 'docs/harness/CHANGELOG.md');
  writeFileSync(p, readFileSync(p, 'utf8') + '| 2026-11-19 | 규칙 더함 | 장치: tests/x.test.mjs |\n');
  assert.deepEqual(check('evolve', root), []);
  writeFileSync(p, readFileSync(p, 'utf8') + '| 2026-11-19 | 규칙 더함 | 피드백 |\n');
  assert.deepEqual(ids(check('evolve', root)), ['E1']);
});

test('E1: ADR 폴더의 새 파일(추적 안 된 파일 포함), 잘못된 기준', () => {
  const adr = { 'docs/harness/CHANGELOG.md': null, 'docs/harness/adr/README.md': '형식: 상태, 맥락, 결정, 장치:', 'docs/harness/adr/0001.md': '# 0001\n장치 없음: 첫 구성' };
  const json = manifest({ changelog: 'docs/harness/adr' });
  const root = gitProject({ ...adr, '.claude/harness.json': json });
  assert.deepEqual(check('evolve', root), []);
  writeFileSync(join(root, 'docs/harness/adr/0002.md'), '# 0002\n장치: tests/y.test.mjs');
  assert.deepEqual(check('evolve', root), []);
  writeFileSync(join(root, 'docs/harness/adr/0003.md'), '# 0003\n규칙만 더함');
  assert.deepEqual(ids(check('evolve', root)), ['E1']);
  assert.deepEqual(ids(check('evolve', root, 'no-such-ref')), ['E1']);
});

test('E2: evolve는 B 검사를 포함하고 D 검사는 하지 않는다', () => {
  const root = gitProject({ '.claude/commands/x.md': 'x', ...frameWith('- 답: npm test', '') });
  assert.deepEqual(ids(check('evolve', root)), ['B7']);
});

test('C1: contracts 키·파일, 노드 칸, 출력이 writes 밖', () => {
  assert.deepEqual(ids(check('build', project({ '.claude/harness.json': manifest({ contracts: undefined }) }))), ['C1']);
  assert.deepEqual(ids(check('build', project({ '.claude/contracts.json': null }))), ['C1']);
  assert.deepEqual(ids(check('build', project(contractsWith((n) => { n.write.kind = 'bot'; })))), ['C1']);
  assert.deepEqual(ids(check('build', project(contractsWith((n) => { delete n.write.stop; })))), ['C1']);
  assert.deepEqual(ids(check('build', project(contractsWith((n) => { n.review.inputs[0].required = 'yes'; })))), ['C1']);
  assert.deepEqual(ids(check('build', project(contractsWith((n) => { n.write.outputs[0].check = ''; })))), ['C1']);
  assert.deepEqual(ids(check('build', project(contractsWith((n) => { n.write.writes = ['src/**']; })))), ['C1']);
  assert.deepEqual(check('design', project({ '.claude/contracts.json': null })), []);
});

test('C2: 에이전트·스킬 파일', () => {
  assert.deepEqual(ids(check('build', project(contractsWith((n) => { n.write.agent = 'ghost'; })))), ['C2']);
  assert.deepEqual(ids(check('build', project(contractsWith((n) => { n.write.skill = 'ghost'; })))), ['C2']);
});

test('C3: from이 없는 노드, 출력과 어긋난 경로', () => {
  assert.deepEqual(ids(check('build', project(contractsWith((n) => { n.review.inputs[0].from = 'ghost'; })))), ['C3']);
  assert.deepEqual(ids(check('build', project(contractsWith((n) => { n.review.inputs[0].path = 'out/<slug>.txt'; })))), ['C3']);
});

test('C4: 오케스트레이터·에이전트가 노드를 가리킴, 입력·출력 규칙 절', () => {
  assert.deepEqual(ids(check('build', project({ '.claude/skills/orch/SKILL.md': ORCH.replace(' → review', '') }))), ['C4']);
  assert.deepEqual(ids(check('build', project({ '.claude/agents/a.md': '---\nname: a\nmodel: sonnet\n---\n계약: write, review\n## 입력·출력 규칙\n- 입력: x' }))), ['C4']);
  assert.deepEqual(ids(check('build', project({ '.claude/agents/a.md': '---\nname: a\nmodel: sonnet\n---\n계약: write' }))), ['C4']);
});

test('C5: parallel 노드의 writes 겹침', () => {
  assert.deepEqual(check('build', project(contractsWith((n) => { n.write.parallel = ['review']; }))), []);
  assert.deepEqual(ids(check('build', project(contractsWith((n) => { n.write.parallel = ['review']; n.review.writes.push('out/<x>.md'); })))), ['C5']);
  assert.deepEqual(ids(check('build', project(contractsWith((n) => { n.write.parallel = ['ghost']; })))), ['C5']);
});

test('C6: 사람 게이트 노드', () => {
  assert.deepEqual(ids(check('build', project(contractsWith((n) => {
    n.plan.kind = 'agent'; n.plan.agent = 'a'; n.plan.writes = ['docs/**']; n.plan.delegated = []; n.plan.stop = { contract: [], premise: [] };
  }), { '.claude/agents/a.md': '---\nname: a\nmodel: sonnet\n---\n계약: plan, write, review' }))), ['C6']);
});

test('정보: 미정 출력 수', () => {
  assert.equal(undecided(project()), 2);
  assert.equal(undecided(project({ '.claude/contracts.json': null })), null);
});

test('N1·N2: 실행 전 표시 뒤 writes 밖 변경, 필수 출력, 형식 칸', () => {
  const root = gitProject({ 'notes.md': '원래' });
  writeFileSync(join(root, 'notes.md'), '표시 전에 고침');
  const node = (vars) => ids(check('node', root, 'HEAD', { node: 'write', vars }));
  assert.deepEqual(node(), ['N1']);
  mark(root, 'write');
  assert.deepEqual(node(), ['N2']);
  mkdirSync(join(root, 'out'), { recursive: true });
  writeFileSync(join(root, 'out/plant.md'), '# 제목\n본문');
  assert.deepEqual(node(), ['N2']);
  writeFileSync(join(root, 'out/plant.md'), '## 요약\n본문');
  assert.deepEqual(node(), []);
  assert.deepEqual(node({ slug: 'face' }), ['N2']);
  writeFileSync(join(root, 'notes.md'), '실행 중에 또 고침');
  assert.deepEqual(node(), ['N1']);
  assert.deepEqual(ids(check('node', root, 'HEAD', { node: 'plan' })), ['N1']);
});

test('검토 반영: 비ASCII 이름, 표시 뒤 되돌림, parallel, 옛 결과물, 대문자 NN', () => {
  const root = gitProject({ 'keep.md': '원래', '한글.md': '원래' });
  writeFileSync(join(root, 'keep.md'), '표시 전에 고침');
  writeFileSync(join(root, '한글.md'), '표시 전에 고침');
  mkdirSync(join(root, 'out'), { recursive: true });
  writeFileSync(join(root, 'out/old.md'), '## 요약\n지난 실행');
  mark(root, 'write');
  const node = (vars) => check('node', root, 'HEAD', { node: 'write', vars });
  assert.deepEqual(ids(node()), ['N2']);
  writeFileSync(join(root, 'out/보고.md'), '## 요약\n본문');
  assert.deepEqual(node(), []);
  execFileSync('git', ['-C', root, 'checkout', '--', 'keep.md']);
  writeFileSync(join(root, '한글.md'), '실행 중에 또 고침');
  assert.deepEqual(node().sort(), ['N1: writes 밖 파일이 바뀌었다: keep.md', 'N1: writes 밖 파일이 바뀌었다: 한글.md']);
});

test('검토 반영: parallel 노드의 산출물은 N1에서 뺀다', () => {
  const root = gitProject(contractsWith((n) => { n.write.parallel = ['review']; }));
  mark(root, 'write');
  mkdirSync(join(root, 'out'), { recursive: true });
  mkdirSync(join(root, '_workspace'), { recursive: true });
  writeFileSync(join(root, 'out/a.md'), '## 요약');
  writeFileSync(join(root, '_workspace/01_review.md'), 'x');
  assert.deepEqual(check('node', root, 'HEAD', { node: 'write' }), []);
});

test('검토 반영: evolve는 contracts 키가 없는 이전 하네스에서 C를 건너뛴다', () => {
  const root = gitProject({ '.claude/harness.json': manifest({ contracts: undefined }) });
  assert.deepEqual(check('evolve', root), []);
  assert.deepEqual(ids(check('build', root)), ['C1']);
});

test('검토 반영: 객체가 아닌 노드·json 출력, 대문자 낱말 속 NN, 노드 id 부분 일치', () => {
  assert.deepEqual(ids(check('build', project(contractsWith((n) => { n.x = null; })))), ['C1']);
  assert.deepEqual(ids(check('build', project({ '.claude/skills/orch/SKILL.md': ORCH.replace('plan →', 'planning →') }))), ['C4']);
  const root = gitProject(contractsWith((n) => { n.write.outputs.push({ path: 'out/meta.json', check: '형식: a' }); n.write.writes.push('docs/PLANNING.md'); }));
  mark(root, 'write');
  mkdirSync(join(root, 'out'), { recursive: true });
  writeFileSync(join(root, 'out/a.md'), '## 요약');
  writeFileSync(join(root, 'out/meta.json'), 'null');
  mkdirSync(join(root, 'docs'), { recursive: true });
  writeFileSync(join(root, 'docs/PLANNING.md'), 'x');
  assert.deepEqual(ids(check('node', root, 'HEAD', { node: 'write' })), ['N2']);
});

test('2라운드 반영: gitignore된 폴더의 출력, 한쪽에만 적은 parallel', () => {
  const root = gitProject({ '.gitignore': '_workspace/\n', ...contractsWith((n) => { n.write.parallel = ['review']; }) });
  mark(root, 'review');
  mark(root, 'write');
  mkdirSync(join(root, '_workspace'), { recursive: true });
  writeFileSync(join(root, '_workspace/01_review.md'), 'x');
  mkdirSync(join(root, 'out'), { recursive: true });
  writeFileSync(join(root, 'out/a.md'), '## 요약');
  assert.deepEqual(check('node', root, 'HEAD', { node: 'review' }), []);
  assert.deepEqual(check('node', root, 'HEAD', { node: 'write' }), []);
});

test('3라운드 반영: 객체가 아닌 노드가 있어도 node 단계가 멈추지 않는다, parallel 형식', () => {
  const root = gitProject(contractsWith((n) => { n.x = null; }));
  mark(root, 'write');
  mkdirSync(join(root, 'out'), { recursive: true });
  writeFileSync(join(root, 'out/a.md'), '## 요약');
  assert.deepEqual(check('node', root, 'HEAD', { node: 'write' }), []);
  assert.deepEqual(ids(check('build', project(contractsWith((n) => { n.write.parallel = 'review'; })))), ['C1']);
});

test('노드 검사 범위: 루트의 고정 경로 출력, node 단계의 계약 형식 오류', () => {
  const root = gitProject(contractsWith((n) => { n.write.outputs.push({ path: 'report.md', check: '미정' }); n.write.writes.push('report.md'); }));
  mark(root, 'write');
  mkdirSync(join(root, 'out'), { recursive: true });
  writeFileSync(join(root, 'out/a.md'), '## 요약');
  assert.deepEqual(ids(check('node', root, 'HEAD', { node: 'write' })), ['N2']);
  writeFileSync(join(root, 'report.md'), 'x');
  assert.deepEqual(check('node', root, 'HEAD', { node: 'write' }), []);
  const bad = gitProject(contractsWith((n) => { n.write.writes = 'out/**'; }));
  mark(bad, 'write');
  assert.deepEqual(ids(check('node', bad, 'HEAD', { node: 'write' })), ['C1']);
});

test('형식 오류 원소: outputs가 객체, outputs·inputs에 null', () => {
  for (const fn of [(n) => { n.write.outputs = { path: 'out/a.md', check: '미정' }; }, (n) => { n.write.outputs = [null]; }, (n) => { n.review.inputs = [null]; }]) {
    assert.ok(ids(check('build', project(contractsWith(fn)))).includes('C1'));
    const root = gitProject(contractsWith(fn));
    mark(root, 'write');
    mark(root, 'review');
    assert.doesNotThrow(() => check('node', root, 'HEAD', { node: 'write' }));
    assert.doesNotThrow(() => check('node', root, 'HEAD', { node: 'review' }));
    assert.doesNotThrow(() => undecided(root));
  }
  const root = gitProject(contractsWith((n) => { n.write.outputs = [null]; }));
  mark(root, 'write');
  assert.deepEqual(ids(check('node', root, 'HEAD', { node: 'write' })), ['C1']);
});

const withPaths = (paths, fn = () => {}) => { const c = structuredClone(CONTRACTS); c.paths = paths; fn(c); return { '.claude/contracts.json': JSON.stringify(c) }; };

test('C7: 경로의 필수 입력은 앞 노드나 from: null에서 온다', () => {
  assert.deepEqual(check('build', project(withPaths({ new: ['plan', 'write', 'review'], again: ['plan', 'write', 'review', 'write', 'review'] }))), []);
  // 다시 쓰기 경로가 write 없이 review부터 시작한다(B-025 꼴)
  assert.deepEqual(ids(check('build', project(withPaths({ new: ['plan', 'write', 'review'], rewrite: ['review'] })))), ['C7']);
  // from: null인 필수 입력과 required: false 입력은 경로와 무관하게 통과
  assert.deepEqual(check('build', project(withPaths({ new: ['plan', 'write', 'review'], rewrite: ['review'] }, (c) => { c.nodes.review.inputs[0].from = null; }))), []);
  assert.deepEqual(check('build', project(withPaths({ new: ['plan', 'write', 'review'], rewrite: ['review'] }, (c) => { c.nodes.review.inputs[0].required = false; }))), []);
  assert.deepEqual(ids(check('build', project(withPaths({ new: ['plan', 'write', 'ghost', 'review'] })))), ['C7']);
});

test('C7: 묶음은 parallel이어야 하고 묶음 안 노드는 앞 노드로 치지 않는다', () => {
  assert.deepEqual(ids(check('build', project(withPaths({ new: ['plan', ['write', 'review']] })))), ['C7', 'C7']);
  const par = (c) => { c.nodes.review.parallel = ['write']; c.nodes.review.inputs[0].from = null; };
  assert.deepEqual(check('build', project(withPaths({ new: ['plan', ['write', 'review']] }, par))), []);
});

test('C8·C1: 경로 밖 노드, paths 형식, paths가 없으면 건너뜀', () => {
  assert.deepEqual(ids(check('build', project(withPaths({ new: ['plan', 'write'] })))), ['C8']);
  assert.deepEqual(ids(check('build', project(withPaths({ new: [] })))), ['C1']);
  assert.deepEqual(ids(check('build', project(withPaths(['plan'])))), ['C1']);
  assert.deepEqual(check('build', project()), []);
});

test('route: 넘김 문서의 다음 단계 목록에 C7', () => {
  const root = project();
  assert.deepEqual(check('route', root, 'HEAD', { route: ['plan', 'write', 'review'] }), []);
  assert.deepEqual(ids(check('route', root, 'HEAD', { route: ['review', 'write'] })), ['C7', 'C7']);
});

test('C9: 하네스 문서가 가리키는 추적 파일의 담당, main이 없으면 건너뜀', () => {
  const doc = { '.claude/skills/orch/SKILL.md': ORCH + '\n규칙은 `docs/rules.md:3`, 빌드는 `scripts/build.mjs`, 결과는 `out/a.md`', 'docs/rules.md': 'x', 'scripts/build.mjs': '', 'out/a.md': '' };
  const withMain = (main) => withPaths({ new: ['plan', 'write', 'review'] }, (c) => { c.main = main; });
  assert.deepEqual(check('evolve', gitProject({ ...doc, ...withMain(['docs/rules.md', 'scripts/**']) })), []);
  assert.deepEqual(check('evolve', gitProject({ ...doc, ...withMain(['docs/rules.md']) })), ['C9: 담당 노드가 없는 파일이다(writes나 main에 더함): scripts/build.mjs']);
  assert.deepEqual(ids(check('build', project({ ...doc, ...withMain('docs/**') }))), ['C1']);
  const old = gitProject(doc);
  assert.deepEqual(check('evolve', old), []);
  assert.deepEqual(skipped(old), ['계약에 paths가 없어 경로 검사(C7·C8)를 건너뜀', '계약에 main이 없어 C9를 건너뜀(담당 없는 파일 2개)']);
});
