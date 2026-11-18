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
// evolve (evolve Phase 4): B2~B7과
//   E1 기준(HEAD 또는 --base) 뒤에 더한 변경 이력 행(작업 트리 포함)마다 장치: 또는 장치 없음:
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

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
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
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

function checkBuild(root, m, out) {
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

export function check(stage, root, base = 'HEAD') {
  const found = [];
  const out = (id, msg) => found.push(id + ': ' + msg);
  if (stage === 'evolve') {
    const m = loadManifest(root, out);
    checkEvolve(root, m, base, out);
    checkBuild(root, m, out);
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
  const stage = opt('--stage');
  const base = opt('--base') ?? 'HEAD';
  if (!['design', 'build', 'evolve'].includes(stage)) {
    console.error('사용: node check-harness.mjs --stage <design|build|evolve> [--base <커밋>] [프로젝트 루트]');
    process.exit(2);
  }
  const found = check(stage, resolve(args[0] ?? '.'), base);
  for (const f of found) console.log(f);
  process.exit(found.length ? 1 : 0);
}
