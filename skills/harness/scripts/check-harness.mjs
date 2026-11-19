#!/usr/bin/env node
// 하네스 절차 관문 검사. 사용: node check-harness.mjs --stage <design|build|evolve> [--base <커밋>] [프로젝트 루트]
// 위반이 있으면 항목마다 "ID: 이유" 한 줄을 내고 종료 코드 1, 없으면 0.
// 검사하는 파일의 형식 정본은 references/project-governance.md 4-1절이다. 이 스크립트는 형식만 본다
// (8-1: 과정 문서 검사는 형식 검사 이상으로 키우지 않는다). 답의 질이나 실제로 물었는지는 보지 않는다.
//
// design (2단계 머리): 1단계 7의 운영 틀을 정했는지
//   D1 .claude/harness.json과 네 키: 검사가 프로젝트마다 다른 경로를 찾을 곳. 없으면 1단계 7을 하지 않은 것
//   D2 frame의 절 여섯: governance 1~5절과 git·PR 흐름 질문 하나에 절 하나
//   D3 절마다 답과 출처 줄: 출처를 형식으로 요구해 묻지 않고 넘어간 답이 보이게
//   D4 사용자가 답할 다섯 절의 출처는 사용자: governance 2절 '사용자에게 묻는다'와 1단계 7
//   D5 보호 장치 대상이 하나 이상이고 대상마다 장치 또는 장치 없음 이유: governance 3절
//   D6 git·PR 흐름을 넣었으면 그 수준의 항목 값, 기본과 다른 값의 이유: git-pr-flow 2·4절
// build (0단계 점검, 6단계): design 전부와
//   B2 오케스트레이터의 규모별 경로 표(머리에 규모, 경로): SKILL.md 5-3
//   B3 오케스트레이터의 승인 지점 표(머리에 사용자에게 묻는다): governance 2절
//   B4 frame의 장치가 가리키는 경로·deny 규칙이 실제로 있다: 글로만 적은 장치를 드러냄
//   B5 git·PR 흐름을 넣었으면 CLAUDE.md에 Git 절: git-pr-flow 3절의 절차가 놓일 곳
//   B6 변경 이력의 머리(표 앞 설명과 표 머리, 폴더면 README.md)에 장치: evolve Phase 4
//   B7 .claude/commands/ 없음, 에이전트마다 model:, SKILL.md 500줄 미만, v1 방식(TeamCreate 등) 없음: 산출물 점검표의 기계 판정 줄
//   C1 harness.json의 contracts와 노드 계약의 필수 칸(references/contracts.md 2절), 출력이 writes 안에 있다
//   C2 노드의 agent 파일, skill 폴더가 있다
//   C3 입력의 from이 있는 노드를 가리키고 그 노드의 출력 경로와 맞는다(6-5 모의 실행의 연결 점검)
//   C4 오케스트레이터가 노드 id를 모두 가리키고, 에이전트 정의가 맡은 노드 id를 가리키며 입력·출력 규칙 절을 따로 두지 않는다
//   C5 parallel로 선언한 두 노드의 writes가 겹치지 않는다
//   C6 사람 게이트(kind: human) 노드가 하나 이상 있다
//   C7 계약의 paths(작업 종류별 노드 순서)마다 필수 입력의 from이 앞 원소의 노드이고, 묶음 노드끼리 parallel이다
//   C8 모든 노드가 경로 하나 이상에 든다. C7·C8은 paths가 있을 때만(없으면 evolve 정보 줄)
//   C9 하네스 문서(.claude/ 아래 md)가 `경로`로 가리키는 추적 파일이 어느 노드의 writes에도, 계약의 main(메인이 고치는 파일)에도 없다.
//      main이 있을 때만(없으면 evolve 정보 줄에 수). .claude/ 아래와 frame·changelog는 evolve가 고치므로 뺀다
// evolve (evolve Phase 4): B2~B7, C1~C9(contracts 키가 없는 이전 하네스는 C를 건너뜀)과
//   E1 기준(HEAD 또는 --base) 뒤에 더한 변경 이력 행(작업 트리 포함)마다 장치: 또는 장치 없음:
//   (정보 줄) check: 미정인 출력 칸 수, paths·main이 없어 건너뛴 검사. 종료 코드에는 넣지 않는다
// route (세션을 넘기기 전, contracts.md 2절 작업 경로): --route a,b+c,d로 준 노드 순서에 C7을 돌린다
// node (노드 실행 뒤, contracts.md 4절): 에이전트 노드 하나가 계약을 지켰는지
//   --mark로 실행 전 상태를 남기고, 실행 뒤 같은 --node로 검사한다. --var 이름=값으로 <이름>을 채운다
//   N1 표시 뒤 바뀐 파일(추적하지 않는 파일 포함, gitignore된 파일 제외)이 모두 writes 안에 있다.
//      parallel 노드의 writes는 그 노드가 본다. 같은 작업 트리라 함께 도는 노드끼리 서로의 writes에 쓴 것은 가르지 못한다(C5는 겹침만 막음)
//   (먼저) 노드의 계약 칸 형식이 틀리면 C1으로 보고하고 멈춘다
//   N2 필수 출력이 표시 뒤 생기거나 바뀌었고, check가 "형식:"이면 그 제목(md)이나 최상위 키(json)가 있다
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const SECTIONS = ['판정 방법', '승인 지점과 자율 범위', '보호 장치', '결정 기록', '사람 검토 지점', 'git·PR 흐름'];
const USER_SECTIONS = SECTIONS.filter((s) => s !== '결정 기록');
const SOURCE = /^- 출처: (사용자 \d{4}-\d{2}-\d{2} "[^"]+"|메인)\s*$/;
const V1 = ['TeamCreate', 'TeamDelete', 'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS'];
const GIT_PR_FLOW = join(dirname(fileURLToPath(import.meta.url)), '..', 'references', 'git-pr-flow.md');

const read = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const isTableSep = (l) => /^\|(\s*:?-{3,}:?\s*\|)+\s*$/.test(l);

// 마크다운 표의 머리 줄(다음 줄이 구분 줄인 줄)
function tableHeaders(text) {
  const lines = text.split('\n');
  return lines.filter((l, i) => l.startsWith('|') && isTableSep(lines[i + 1] ?? ''));
}

// "## 제목" 단위로 나눈 절 본문
function sections(text) {
  const out = {};
  let cur = null;
  for (const line of text.split('\n')) {
    const m = line.match(/^## (.+?)\s*$/);
    if (m) out[(cur = m[1])] = [];
    else if (cur) out[cur].push(line);
  }
  return out;
}

// 보호 장치 절의 "- 대상:" 항목과 그 아래 들여 쓴 줄
function targets(lines) {
  const out = [];
  for (const line of lines) {
    if (/^- 대상: \S/.test(line)) out.push({ name: line.slice(6).trim(), sub: [] });
    else if (/^- /.test(line)) out.push(null);
    else if (/^\s+- /.test(line) && out.at(-1)) out.at(-1).sub.push(line.trim());
  }
  return out.filter(Boolean);
}

// git-pr-flow.md 2절 표의 항목: [{name, level: '가벼운'|'전체'}]
function gitItems() {
  const text = read(GIT_PR_FLOW);
  const sec = text.slice(text.indexOf('## 2.'), text.indexOf('## 3.'));
  return sec.split('\n')
    .map((l) => l.match(/^\| ([^|]+?)\((가벼운|전체)\) \|/))
    .filter(Boolean)
    .map((m) => ({ name: m[1].trim(), level: m[2] }));
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).filter((e) => e.name !== '.git').flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]);
}

function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function loadManifest(root, out) {
  const p = join(root, '.claude', 'harness.json');
  if (!existsSync(p)) return out('D1', '.claude/harness.json이 없다(1단계 7을 하지 않음)'), null;
  let m;
  try { m = JSON.parse(read(p)); } catch (e) { return out('D1', '.claude/harness.json을 JSON으로 읽지 못함: ' + e.message), null; }
  const missing = ['frame', 'orchestrator', 'changelog', 'gitFlow'].filter((k) => typeof m[k] !== 'string' || !m[k]);
  if (missing.length) return out('D1', 'harness.json에 키가 없다: ' + missing.join(', ')), null;
  if (!['none', 'light', 'full'].includes(m.gitFlow)) return out('D1', 'gitFlow는 none | light | full이어야 한다: ' + m.gitFlow), null;
  return m;
}

function checkDesign(root, m, out) {
  const fp = join(root, m.frame);
  if (!existsSync(fp)) return out('D2', 'frame 파일이 없다: ' + m.frame);
  const sec = sections(read(fp));
  for (const s of SECTIONS) {
    const lines = sec[s];
    if (!lines) { out('D2', 'frame에 "## ' + s + '" 절이 없다'); continue; }
    if (!lines.some((l) => /^- 답: \S/.test(l))) out('D3', s + ': "- 답:" 줄이 없다');
    const src = lines.find((l) => l.startsWith('- 출처:'));
    if (!src) out('D3', s + ': "- 출처:" 줄이 없다');
    else if (!SOURCE.test(src)) out('D3', s + ': 출처 형식이 사용자 YYYY-MM-DD "인용" 또는 메인이 아니다');
    else if (USER_SECTIONS.includes(s) && !src.startsWith('- 출처: 사용자')) out('D4', s + ': 출처가 사용자가 아니다(사용자에게 묻는 절)');
  }
  if (sec['보호 장치']) {
    const ts = targets(sec['보호 장치']);
    if (!ts.length) out('D5', '보호 장치 절에 "- 대상:" 항목이 없다');
    for (const t of ts) {
      if (!t.sub.some((l) => /^- (장치|장치 없음): \S/.test(l))) out('D5', '보호 대상 "' + t.name + '"에 장치: 또는 장치 없음: 이유가 없다');
    }
  }
  if (m.gitFlow !== 'none' && sec['git·PR 흐름']) {
    const levels = m.gitFlow === 'full' ? ['가벼운', '전체'] : ['가벼운'];
    const lines = sec['git·PR 흐름'];
    for (const { name } of gitItems().filter((it) => levels.includes(it.level))) {
      const line = lines.find((l) => l.startsWith('- ' + name + ':'));
      if (!line) out('D6', 'git·PR 흐름 절에 "' + name + '" 항목이 없다');
      else {
        const value = line.slice(name.length + 3).trim();
        if (!value.startsWith('기본') && !value.includes('이유:')) out('D6', '"' + name + '"가 기본 프리셋과 다른데 이유: 가 없다');
      }
    }
  }
}

function checkBuild(root, m, out, skipNoContracts = false) {
  if (m) {
    const op = join(root, m.orchestrator);
    if (!existsSync(op)) out('B2', '오케스트레이터 파일이 없다: ' + m.orchestrator);
    else {
      const heads = tableHeaders(read(op));
      if (!heads.some((h) => h.includes('규모') && h.includes('경로'))) out('B2', '오케스트레이터에 규모별 경로 표(머리에 규모, 경로)가 없다');
      if (!heads.some((h) => h.includes('사용자에게 묻는다'))) out('B3', '오케스트레이터에 승인 지점 표(머리에 사용자에게 묻는다)가 없다');
    }
    const fp = join(root, m.frame);
    if (existsSync(fp)) {
      const deny = ['settings.json', 'settings.local.json'].flatMap((f) => {
        const p = join(root, '.claude', f);
        try { return existsSync(p) ? JSON.parse(read(p)).permissions?.deny ?? [] : []; } catch { return []; }
      });
      for (const t of targets(sections(read(fp))['보호 장치'] ?? [])) {
        for (const l of t.sub.filter((s) => s.startsWith('- 장치: '))) {
          const v = l.slice(6).trim();
          if (v.startsWith('deny ')) {
            if (!deny.includes(v.slice(5).trim())) out('B4', '"' + t.name + '"의 deny 규칙이 .claude/settings*.json에 없다: ' + v.slice(5).trim());
          } else if (!existsSync(join(root, v.split(/\s+/)[0]))) out('B4', '"' + t.name + '"의 장치 경로가 없다: ' + v.split(/\s+/)[0]);
        }
      }
    }
    if (m.gitFlow !== 'none') {
      const cp = join(root, 'CLAUDE.md');
      if (!existsSync(cp) || !/^##+\s+Git(\s|$)/m.test(read(cp))) out('B5', 'git·PR 흐름을 넣었는데 CLAUDE.md에 Git 절이 없다');
    }
    const lp = join(root, m.changelog);
    if (!existsSync(lp)) out('B6', '변경 이력이 없다: ' + m.changelog);
    else if (statSync(lp).isDirectory()) {
      const rp = join(lp, 'README.md');
      if (!existsSync(rp) || !read(rp).includes('장치')) out('B6', '변경 이력 폴더의 README.md(형식 설명)에 장치가 없다');
    } else {
      const lines = read(lp).split('\n');
      const sep = lines.findIndex(isTableSep);
      if (sep < 1) out('B6', '변경 이력 파일에 표가 없다');
      else if (!lines.slice(0, sep).join('\n').includes('장치')) out('B6', '변경 이력의 머리(표 앞 설명, 표 머리)에 장치가 없다');
    }
  }
  if (m && (m.contracts || !skipNoContracts)) checkContracts(root, m, out);
  if (existsSync(join(root, '.claude', 'commands'))) out('B7', '.claude/commands/가 있다');
  for (const f of walk(join(root, '.claude', 'agents')).filter((f) => f.endsWith('.md'))) {
    const fm = read(f).match(/^---\n([\s\S]*?)\n---/);
    if (!fm || !/^model:\s*\S/m.test(fm[1])) out('B7', '에이전트에 model:이 없다: ' + f.slice(root.length + 1));
  }
  const skillFiles = walk(join(root, '.claude', 'skills'));
  for (const f of skillFiles.filter((f) => f.endsWith('SKILL.md'))) {
    const n = read(f).replace(/\n$/, '').split('\n').length;
    if (n >= 500) out('B7', 'SKILL.md가 500줄 이상이다(' + n + '줄): ' + f.slice(root.length + 1));
  }
  for (const f of [...walk(join(root, '.claude', 'agents')), ...skillFiles]) {
    const hit = V1.find((w) => read(f).includes(w));
    if (hit) out('B7', 'v1 방식 ' + hit + '이 남았다: ' + f.slice(root.length + 1));
  }
}

// 계약 경로 패턴: ** 와 * 는 glob, <이름>은 경로 한 칸(--var로 채움), NN은 숫자
const isNN = (p, i) => p.startsWith('NN', i) && !/[A-Za-z]/.test(p[i - 1] ?? '') && !/[A-Za-z]/.test(p[i + 2] ?? '');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function toRegex(p, vars = {}) {
  let s = '';
  for (let i = 0; i < p.length;) {
    const j = p[i] === '<' ? p.indexOf('>', i) : -1;
    if (p.startsWith('**/', i)) { s += '(?:.*/)?'; i += 3; }
    else if (p.startsWith('**', i)) { s += '.*'; i += 2; }
    else if (p[i] === '*') { s += '[^/]*'; i++; }
    else if (j > i) { const k = p.slice(i + 1, j); s += vars[k] != null ? esc(vars[k]) : '[^/]+'; i = j + 1; }
    else if (isNN(p, i)) { s += '\\d+'; i += 2; }
    else { s += esc(p[i]); i++; }
  }
  return new RegExp('^' + s + '$');
}
const literalPrefix = (p) => { for (let i = 0; i < p.length; i++) if (p[i] === '*' || p[i] === '<' || isNN(p, i)) return p.slice(0, i); return p; };
const sample = (p) => p.replace(/<[^>]+>/g, 'x').replace(/(?<![A-Za-z])NN(?![A-Za-z])/g, '01').replace(/\*+/g, 'x');
// 노드 id는 [\w.-]로 이어지는 낱말 하나로 찾는다(plan이 planning에 걸리지 않게)
const mentions = (text, id) => new RegExp('(^|[^\\w.-])' + esc(id) + '($|[^\\w.-])').test(text);
const samePath = (a, b) => a.replace(/<[^>]+>/g, '<>') === b.replace(/<[^>]+>/g, '<>');
function overlap(p, q) {
  const a = literalPrefix(p), b = literalPrefix(q);
  if (a === p && b === q) return p === q;
  if (a === p) return toRegex(q).test(p);
  if (b === q) return toRegex(p).test(q);
  return a.startsWith(b) || b.startsWith(a);
}
const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
// 배열 칸에서 객체인 원소만(형식 오류는 checkNodeShape가 C1으로 보고한다)
const objs = (v) => (Array.isArray(v) ? v.filter(isObj) : []);
const strs = (v) => Array.isArray(v) && v.every((x) => typeof x === 'string');

function loadContracts(root, m, out) {
  if (typeof m.contracts !== 'string' || !m.contracts) return out('C1', 'harness.json에 contracts 키가 없다(2단계 2-4를 하지 않음)'), null;
  const p = join(root, m.contracts);
  if (!existsSync(p)) return out('C1', '계약 파일이 없다: ' + m.contracts), null;
  let c;
  try { c = JSON.parse(read(p)); } catch (e) { return out('C1', '계약 파일을 JSON으로 읽지 못함: ' + e.message), null; }
  if (!c.nodes || typeof c.nodes !== 'object' || !Object.keys(c.nodes).length) return out('C1', '계약 파일에 nodes가 없다'), null;
  return c;
}

function checkNodeShape(id, n, out) {
  const bad = (msg) => out('C1', id + ': ' + msg);
  if (!['agent', 'human'].includes(n.kind)) return bad('kind는 agent | human이어야 한다');
  if (!Array.isArray(n.inputs)) bad('inputs 배열이 없다');
  else for (const i of n.inputs) {
    if (!isObj(i) || typeof i.path !== 'string' || !(typeof i.from === 'string' || i.from === null) || typeof i.required !== 'boolean')
      bad('입력마다 path, from(노드 id 또는 null), required(true|false)가 있어야 한다');
  }
  if (!Array.isArray(n.outputs) || !n.outputs.length) bad('outputs가 비었다');
  else for (const o of n.outputs) {
    if (!isObj(o) || typeof o.path !== 'string' || typeof o.check !== 'string' || !o.check.trim()) bad('출력마다 path와 check(미정 | 형식: … | 명령)가 있어야 한다');
  }
  if (n.kind === 'human') return;
  if (typeof n.agent !== 'string' || !n.agent) bad('agent가 없다');
  if (!strs(n.writes) || !n.writes.length) return bad('writes가 비었다');
  if (!strs(n.delegated)) bad('delegated 배열이 없다(비어 있어도 둔다)');
  if (!n.stop || !strs(n.stop.contract) || !strs(n.stop.premise)) bad('stop.contract, stop.premise 배열이 없다(비어 있어도 둔다)');
  if (n.parallel !== undefined && !strs(n.parallel)) bad('parallel은 노드 id 배열이어야 한다');
  for (const o of objs(n.outputs)) {
    if (typeof o.path === 'string' && !n.writes.some((w) => toRegex(w).test(sample(o.path)))) bad('출력이 writes 밖이다: ' + o.path);
  }
}

function checkContracts(root, m, out) {
  const c = loadContracts(root, m, out);
  if (!c) return;
  const nodes = c.nodes;
  for (const [id, n] of Object.entries(nodes)) {
    if (!n || typeof n !== 'object' || Array.isArray(n)) { out('C1', id + ': 노드가 객체가 아니다'); delete nodes[id]; continue; }
    checkNodeShape(id, n, out);
  }
  const op = join(root, m.orchestrator);
  const orch = existsSync(op) ? read(op) : '';
  const seen = new Set();
  for (const [id, n] of Object.entries(nodes)) {
    if (orch && !mentions(orch, id)) out('C4', '오케스트레이터가 노드 ' + id + '를 가리키지 않는다');
    if (n.kind !== 'agent' || typeof n.agent !== 'string') continue;
    const ap = join(root, '.claude', 'agents', n.agent + '.md');
    if (!existsSync(ap)) out('C2', id + ': 에이전트 파일이 없다: .claude/agents/' + n.agent + '.md');
    else {
      const text = read(ap);
      if (!mentions(text, id)) out('C4', '에이전트 ' + n.agent + '가 맡은 노드 ' + id + '를 가리키지 않는다');
      if (/^##+\s*입력·출력 규칙/m.test(text) && !seen.has(n.agent)) out('C4', '에이전트 ' + n.agent + '에 입력·출력 규칙 절이 남았다(계약 파일이 정본)');
      seen.add(n.agent);
    }
    if (n.skill && !existsSync(join(root, '.claude', 'skills', n.skill, 'SKILL.md'))) out('C2', id + ': 스킬이 없다: .claude/skills/' + n.skill);
  }
  for (const [id, n] of Object.entries(nodes)) {
    for (const i of objs(n.inputs)) {
      if (typeof i.from !== 'string') continue;
      const p = nodes[i.from];
      if (!p) out('C3', id + ': 입력의 from이 없는 노드다: ' + i.from);
      else if (!objs(p.outputs).some((o) => typeof o.path === 'string' && samePath(o.path, i.path))) out('C3', id + ': ' + i.from + '의 출력에 입력 경로가 없다: ' + i.path);
    }
    for (const o of strs(n.parallel) ? n.parallel : []) {
      const q = nodes[o];
      if (!q) { out('C5', id + ': parallel이 없는 노드다: ' + o); continue; }
      const hit = (n.writes ?? []).find((w) => (q.writes ?? []).some((v) => overlap(w, v)));
      if (hit) out('C5', id + '와 ' + o + '가 함께 도는데 writes가 겹친다: ' + hit);
    }
  }
  if (!Object.values(nodes).some((n) => n.kind === 'human')) out('C6', '사람 게이트(kind: human) 노드가 없다');
  checkPaths(nodes, c.paths, out);
  if (c.main !== undefined) {
    if (!strs(c.main)) out('C1', 'main은 경로 배열이어야 한다');
    else for (const f of unowned(root, m, nodes, c.main)) out('C9', '담당 노드가 없는 파일이다(writes나 main에 더함): ' + f);
  }
}

const listed = (x) => (isObj(x) && Array.isArray(x.parallel) ? x.parallel : []);

// 경로 하나: 원소(노드 id 또는 함께 도는 묶음)마다 필수 입력의 from이 앞 원소에 있다
function checkRoute(name, route, nodes, out) {
  const before = new Set();
  for (const el of route) {
    const group = Array.isArray(el) ? el : [el];
    group.forEach((id, k) => {
      const n = nodes[id];
      if (!isObj(n)) return out('C7', name + ': 없는 노드다: ' + id);
      for (const o of group.slice(k + 1)) {
        if (!listed(n).includes(o) && !listed(nodes[o]).includes(id)) out('C7', name + ': 묶음의 ' + id + '와 ' + o + '가 parallel이 아니다');
      }
      for (const i of objs(n.inputs)) {
        if (i.required === true && typeof i.from === 'string' && !before.has(i.from)) out('C7', name + ': ' + id + '의 필수 입력을 만드는 ' + i.from + '가 앞에 없다: ' + i.path);
      }
    });
    group.forEach((id) => before.add(id));
  }
}

function checkPaths(nodes, paths, out) {
  if (paths === undefined) return;
  const ok = isObj(paths) && Object.values(paths).every((r) => Array.isArray(r) && r.length && r.every((e) => typeof e === 'string' || (strs(e) && e.length)));
  if (!ok) return out('C1', 'paths는 {경로 이름: [노드 id 또는 [노드 id, …]]}이어야 한다');
  for (const [name, route] of Object.entries(paths)) checkRoute(name, route, nodes, out);
  const used = new Set(Object.values(paths).flat(2));
  for (const id of Object.keys(nodes)) if (!used.has(id)) out('C8', '어느 경로에도 없는 노드다: ' + id);
}

// 하네스 문서가 `경로`로 가리키는 추적 파일 가운데 writes·main 어디에도 없는 것
function unowned(root, m, nodes, main) {
  let tracked;
  try { tracked = git(root, ['-c', 'core.quotepath=false', 'ls-files']).split('\n').filter(Boolean); } catch { return []; }
  const own = [...Object.values(nodes).flatMap((n) => (strs(n.writes) ? n.writes : [])), ...main].map((w) => toRegex(w));
  const skip = (f) => f.startsWith('.claude/') || f === m.frame || f === m.changelog || f.startsWith(m.changelog + '/');
  const set = new Set(tracked);
  const refs = new Set();
  for (const f of tracked.filter((f) => f.startsWith('.claude/') && f.endsWith('.md'))) {
    for (const [, p] of read(join(root, f)).matchAll(/`([^`\s]+)`/g)) {
      const q = p.replace(/:\d[\d,-]*$/, '');
      if (set.has(q) && !skip(q)) refs.add(q);
    }
  }
  return [...refs].filter((f) => !own.some((r) => r.test(f))).sort();
}

export function undecided(root) {
  const out = () => {};
  const p = join(root, '.claude', 'harness.json');
  if (!existsSync(p)) return null;
  let m; try { m = JSON.parse(read(p)); } catch { return null; }
  const nodes = m.contracts && existsSync(join(root, m.contracts)) ? loadContracts(root, m, out)?.nodes : null;
  if (!nodes) return null;
  return Object.values(nodes).filter(isObj).flatMap((n) => objs(n.outputs)).filter((o) => o.check === '미정').length;
}

// 노드 실행 전후 비교: 표시는 .git 안(git rev-parse --git-path)에 둬 작업 트리 변경으로 잡히지 않게 한다
function dirty(root, head) {
  const files = [
    ...git(root, ['-c', 'core.quotepath=false', 'diff', '--name-only', '--relative', head]).split('\n'),
    ...git(root, ['-c', 'core.quotepath=false', 'ls-files', '--others', '--exclude-standard']).split('\n'),
  ].filter(Boolean);
  const hash = (f) => existsSync(join(root, f)) ? git(root, ['hash-object', '--', f]).trim() : null;
  return Object.fromEntries([...new Set(files)].map((f) => [f, hash(f)]));
}
const markPath = (root, id) => resolve(root, git(root, ['rev-parse', '--git-path', 'harness-marks/' + id + '.json']).trim());

// 출력 경로에 맞는 파일과 내용 해시. gitignore된 폴더(_workspace/)의 출력도 보도록 git 목록을 쓰지 않는다
function outputFiles(root, n, vars = {}) {
  const out = {};
  for (const o of objs(n?.outputs)) {
    if (typeof o.path !== 'string') continue;
    // 와일드카드가 없는 경로는 그 파일만 본다. 고정 접두가 폴더를 가리키지 못하면 루트 전체를 훑는다
    const files = literalPrefix(o.path) === o.path ? [join(root, o.path)].filter((f) => existsSync(f) && statSync(f).isFile())
      : walk(join(root, dirname(literalPrefix(o.path) + 'x')));
    const re = toRegex(o.path, vars);
    for (const f of files) {
      const rel = f.slice(root.length + 1).replace(/\\/g, '/');
      if (re.test(rel)) out[rel] = createHash('sha1').update(readFileSync(f)).digest('hex');
    }
  }
  return out;
}

function nodeOf(root, id) {
  try { const m = JSON.parse(read(join(root, '.claude', 'harness.json'))); return JSON.parse(read(join(root, m.contracts))).nodes?.[id]; } catch { return undefined; }
}

// evolve 정보 줄: paths·main이 없어 건너뛴 검사
export function skipped(root) {
  const p = join(root, '.claude', 'harness.json');
  let m, c;
  try { m = JSON.parse(read(p)); c = JSON.parse(read(join(root, m.contracts))); } catch { return []; }
  if (!isObj(c?.nodes)) return [];
  const lines = [];
  if (c.paths === undefined) lines.push('계약에 paths가 없어 경로 검사(C7·C8)를 건너뜀');
  if (c.main === undefined) lines.push('계약에 main이 없어 C9를 건너뜀(담당 없는 파일 ' + unowned(root, m, Object.fromEntries(Object.entries(c.nodes).filter(([, n]) => isObj(n))), []).length + '개)');
  return lines;
}

export function mark(root, id) {
  const head = git(root, ['rev-parse', 'HEAD']).trim();
  const p = markPath(root, id);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify({ head, files: dirty(root, head), outputs: outputFiles(root, nodeOf(root, id)) }));
  return p;
}

function checkNode(root, id, vars, out) {
  const m = loadManifest(root, out);
  if (!m) return;
  const nodes = loadContracts(root, m, out)?.nodes;
  if (!nodes) return;
  const n = nodes[id];
  if (!n || n.kind !== 'agent') return out('N1', '에이전트 노드가 아니다: ' + id);
  // 계약 칸 형식이 틀리면 노드 검사를 하지 않고 build와 같은 C1으로 보고한다
  const shape = [];
  checkNodeShape(id, n, (k, msg) => shape.push(msg));
  if (shape.length) return shape.forEach((msg) => out('C1', msg));
  let before;
  try { before = JSON.parse(read(markPath(root, id))); } catch { return out('N1', '실행 전 표시가 없다(--mark를 먼저 돌림): ' + id); }
  const writes = (n.writes ?? []).map((w) => toRegex(w, vars));
  // 함께 도는 노드(parallel, 어느 쪽에 적었든)의 writes는 그 노드의 검사가 본다
  const peers = new Set([...listed(n), ...Object.keys(nodes).filter((k) => listed(nodes[k]).includes(id))]);
  const others = [...peers].flatMap((o) => nodes[o]?.writes ?? []).map((w) => toRegex(w, vars));
  const now = dirty(root, before.head);
  const changed = [...new Set([...Object.keys(now), ...Object.keys(before.files)])].filter((f) => (now[f] ?? null) !== (before.files[f] ?? null));
  for (const f of changed) {
    if (!writes.some((r) => r.test(f)) && !others.some((r) => r.test(f))) out('N1', 'writes 밖 파일이 바뀌었다: ' + f);
  }
  const outNow = outputFiles(root, n, vars);
  const fresh = Object.keys(outNow).filter((f) => outNow[f] !== (before.outputs ?? {})[f]);
  for (const o of objs(n.outputs).filter((o) => o.required !== false)) {
    const re = toRegex(o.path, vars);
    const found = fresh.filter((f) => re.test(f));
    if (!found.length) { out('N2', '필수 출력이 표시 뒤 생기거나 바뀌지 않았다: ' + o.path); continue; }
    if (!o.check.startsWith('형식:')) continue;
    const names = o.check.slice(3).split(',').map((s) => s.trim()).filter(Boolean);
    for (const f of found) {
      const text = read(join(root, f));
      let has;
      if (f.endsWith('.json')) { let j = null; try { j = JSON.parse(text); } catch {} has = (k) => j !== null && typeof j === 'object' && !Array.isArray(j) && k in j; }
      else has = (k) => new RegExp('^#+\\s+' + esc(k) + '\\s*$', 'm').test(text);
      const miss = names.filter((k) => !has(k));
      if (miss.length) out('N2', f + ': 형식 칸이 없다: ' + miss.join(', '));
    }
  }
}

function checkEvolve(root, m, base, out) {
  if (!m) return;
  const lp = join(root, m.changelog);
  if (!existsSync(lp)) return;
  const ok = (s) => /장치( 없음)?:/.test(s);
  try {
    if (statSync(lp).isDirectory()) {
      const added = [
        ...git(root, ['diff', '--name-only', '--diff-filter=A', base, '--', m.changelog]).split('\n'),
        ...git(root, ['ls-files', '--others', '--exclude-standard', '--', m.changelog]).split('\n'),
      ].filter((f) => f && !f.endsWith('README.md'));
      for (const f of added) if (!ok(read(join(root, f)))) out('E1', '새 변경 이력 파일에 장치: 또는 장치 없음:이 없다: ' + f);
      return;
    }
    const untracked = git(root, ['ls-files', '--others', '--exclude-standard', '--', m.changelog]).trim();
    const added = untracked
      ? read(lp).split('\n')
      : git(root, ['diff', base, '--', m.changelog]).split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1));
    const rows = added.filter((l, i) => l.startsWith('|') && !isTableSep(l) && !isTableSep(added[i + 1] ?? ''));
    for (const r of rows) if (!ok(r)) out('E1', '더한 이력 행에 장치: 또는 장치 없음:이 없다: ' + r.slice(0, 60));
  } catch (e) {
    out('E1', 'git으로 변경분을 읽지 못함(' + base + '): ' + String(e.stderr || e.message).trim().split('\n')[0]);
  }
}

export function check(stage, root, base = 'HEAD', { node, vars = {}, route } = {}) {
  const found = [];
  const out = (id, msg) => found.push(id + ': ' + msg);
  if (stage === 'node') checkNode(root, node, vars, out);
  else if (stage === 'route') {
    const m = loadManifest(root, out);
    const c = m && loadContracts(root, m, out);
    if (c) checkRoute('route', route, c.nodes, out);
  }
  else if (stage === 'evolve') {
    const m = loadManifest(root, out);
    checkEvolve(root, m, base, out);
    checkBuild(root, m, out, true);
  } else {
    const m = loadManifest(root, out);
    if (m) checkDesign(root, m, out);
    if (stage === 'build') checkBuild(root, m, out);
  }
  return found;
}

if (process.argv[1] && resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase()) {
  const args = process.argv.slice(2);
  const opt = (k) => { const i = args.indexOf(k); return i < 0 ? undefined : args.splice(i, 2)[1]; };
  const vars = {};
  for (let i = args.indexOf('--var'); i >= 0; i = args.indexOf('--var')) {
    const [k, ...v] = args.splice(i, 2)[1].split('=');
    vars[k] = v.join('=');
  }
  const flag = (k) => { const i = args.indexOf(k); return i >= 0 && Boolean(args.splice(i, 1)); };
  const stage = opt('--stage');
  const base = opt('--base') ?? 'HEAD';
  const node = opt('--node');
  const doMark = flag('--mark');
  const route = opt('--route')?.split(',').filter(Boolean).map((e) => (e.includes('+') ? e.split('+') : e));
  if (!['design', 'build', 'evolve', 'node', 'route'].includes(stage) || (stage === 'node' && !node) || (stage === 'route' && !route?.length)) {
    console.error('사용: node check-harness.mjs --stage <design|build|evolve> [--base <커밋>] [프로젝트 루트]');
    console.error('      node check-harness.mjs --stage node --node <id> [--mark] [--var 이름=값 ...] [프로젝트 루트]');
    console.error('      node check-harness.mjs --stage route --route <id,id+id,...> [프로젝트 루트]');
    process.exit(2);
  }
  const root = resolve(args[0] ?? '.');
  if (doMark) { console.log('표시: ' + mark(root, node)); process.exit(0); }
  const found = check(stage, root, base, { node, vars, route });
  for (const f of found) console.log(f);
  if (stage === 'evolve') {
    const u = undecided(root);
    if (u != null) console.log('정보: check가 미정인 출력 ' + u + '개');
    for (const l of skipped(root)) console.log('정보: ' + l);
  }
  process.exit(found.length ? 1 : 0);
}
