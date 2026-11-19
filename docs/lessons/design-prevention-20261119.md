# B-022 설계 단계 예방 장치 반영 (2026-11-19)

입력은 pf_deck `docs/backlog.md` B-022 행(후보 ①\~⑧)이고, 근거는 B-021·B-025·B-026 행이다. 후보마다 `skills/evolve/SKILL.md` Phase 3 관문 (0)(가)(나)(다)(라)를 적용했다. 버전은 2.1.0-local.13이다.

## 후보별 판정

| 후보 | 판정 | 일반화 근거 | 바꾼 곳 경로:줄 | 장치 |
| --- | --- | --- | --- | --- |
| ① 쓰기 범위 대조(담당 없는 규칙·정본·빌드 파일) | 반영 | (가) pf_deck 디자인 트랙 두 실행(2026-11-09 빌드 수정, 2026-11-19 규칙·빌드·매니페스트 수정)과 portfolio 2.3(메인이 직접 고칠 경계)에서 같은 문제가 났다. (라) 하네스 문서가 `경로`로 가리키는 추적 파일로 범위를 정하면 기계로 판정된다. 계약 파일을 쓰는 하네스 모두에 해당한다 | `skills/harness/references/contracts.md:80-82`, `skills/harness/scripts/check-harness.mjs:29-30,313-316,349-366,408-418` | C9(계약에 `main`이 있을 때). 없으면 evolve 정보 줄에 담당 없는 파일 수 |
| ② 에이전트 정의 문장과 계약 `writes` 대조 | 관찰 | (나) 정의에 범위를 다시 적지 않는 규칙(`contracts.md` 2절)과 C4가 이미 있다. 문장 대조는 기계로 판정되지 않아 8-2 기준으로 오탐 위험이 크다. 사례는 하나(design-director)다 | `LOCAL_CHANGES.md:65` | 장치 없음 |
| ③ 일시적 전제에 기댄 규칙에 전제와 다시 볼 조건 | 관찰 | (가) 사례 하나이고, B-022 행도 근거가 약하다고 적었다. (나) 규칙마다 삭제 조건을 적는 문장(`evolve` Phase 3의 7)이 이미 있다. 소유하지 않은 입력에 기대는 프로젝트에 두루 해당할 수 있지만 재발 전에는 더하지 않는다 | `LOCAL_CHANGES.md:66` | 장치 없음 |
| ④ 전례 점검(이전 실행 커밋이 고친 파일) | 관찰 | 트랙과 커밋을 잇는 방법(브랜치 이름, 커밋 메시지)이 프로젝트마다 달라 일반 검사로 옮기지 못한다. 실행 뒤 N1, 설계 때 C9가 같은 빈틈 일부를 잡는다 | `LOCAL_CHANGES.md:67` | 장치 없음 |
| ⑤ gate 결과가 다음 노드 범위를 바꾸면 질문 단계 | 기각 | (나)(다) 이미 있는 장치로 담긴다. 계약 밖 일이 필요하면 `stop.contract`로 멈추고 메인이 노드를 고르거나 사용자에게 묻는다(`contracts.md` 4절 5). 전제가 깨지면 `stop.premise`다. pf_deck은 B-021 ⑤로 자기 오케스트레이터에 단계를 더했다 | 없음 | 없음 |
| ⑥ 계약에 작업 종류별 경로, 경로마다 필수 입력 연결 | 반영 | 사용자가 2026-11-19 설계 대화에서 미룬 일로 둔 항목(규모별 경로 표를 계약 안 부분 그래프로)과 같고, pf_deck B-025에서 실패가 실제로 났다. 규모별 경로를 두는 하네스(`harness` 5-3) 모두에 해당한다 | `skills/harness/references/contracts.md:59-78,95`, `skills/harness/SKILL.md:291,338`, `skills/harness/scripts/check-harness.mjs:27-28,312,319-338` | C7. `paths`가 없으면 evolve 정보 줄 |
| ⑦ 새 필수 입력·스크립트는 그것을 쓰는 경로를 가리켜야 통과 | 반영(노드 부분) | ⑥에 딸린 검사다. 모든 노드가 경로 하나 이상에 들게 하면 새 노드나 필수 입력은 경로를 함께 바꿔야 통과한다. 스크립트는 계약에 사용처를 적는 칸이 없어 일반 검사로 옮기지 않았다 | `skills/harness/references/contracts.md:77`, `skills/harness/scripts/check-harness.mjs:340-347` | C8 |
| ⑧ 넘김 문서의 다음 단계를 노드 id 목록으로 적고 같은 검사기로 검사 | 반영 | 세션을 넘기는 프로젝트(portfolio·pf_deck 넘김 문서, `parallel-sessions.md`)에 두루 해당한다. ⑥의 함수를 그대로 써서 더한 코드가 몇 줄이다. 사례 하나라 (가)에 따라 관찰로 둘 수도 있다(불확실한 점) | `skills/harness/references/contracts.md:84`, `skills/harness/scripts/check-harness.mjs:34,498-502,528-529` | `--stage route --route a,b+c` |

## 검증

- `node --test skills/harness/scripts/check-harness.test.mjs`: 37개 모두 통과했다(새 시험 5개, `check-harness.test.mjs:350-391`). 새 검사마다 통과·실패 사례가 있다. C7은 경로 통과, B-025 꼴 실패, `from: null`·`required: false` 통과, 없는 노드를 본다. 묶음은 parallel이 아니면 실패, parallel이면 통과다. C8·C1은 경로 밖 노드, `paths` 형식, 선언이 없으면 건너뜀을 본다. route, C9(`main` 통과·실패·형식, 없으면 정보 줄)도 있다
- `node skills/harness/scripts/check-harness.mjs --stage evolve C:\workspace\pf_deck`(pf_deck에 경로를 선언하기 전): 종료 0, 정보 줄 셋. `check가 미정인 출력 2개`, `계약에 paths가 없어 경로 검사(C7·C8)를 건너뜀`, `계약에 main이 없어 C9를 건너뜀(담당 없는 파일 19개)`
- `--stage route --route content.read,loop.fix,content.facts C:\workspace\pf_deck`: 종료 1, C7 셋. `content.read`·`content.facts`의 필수 입력을 만드는 `content.author`와 `loop.fix`의 `loop.eval`이 앞에 없다. B-025 실행 때의 끊김이 그대로 나온다

## 불확실한 점

- ⑧의 근거는 B-025 한 번이다. 관문 (가)는 사용자 요청이라도 한 번 나온 사례면 관찰 선택지를 함께 보이라고 한다. 되돌리려면 `--stage route` 분기와 `contracts.md:84` 한 문단을 지운다
- C9의 범위(하네스 문서가 `경로`로 가리키는 추적 파일)는 pf_deck에서만 재 봤다. 읽기만 하는 파일도 담당을 적어야 하므로, `main`을 들인 뒤 오탐이 잦으면 범위를 줄인다
- pf_deck은 메인이 `paths`를 쓰는 중이라, 경로 선언 뒤의 evolve 결과(C7·C8)는 이 보고에 없다
