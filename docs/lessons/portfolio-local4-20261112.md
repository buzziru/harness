# portfolio 2026-11-12 규칙의 포크 반영 대조 (local.4)

대상은 `harness-buzziru` 포크 `local/main`(`3d6dd5e`, 2.1.0-local.3)이다. 2026-11-12 portfolio에서 생긴 규칙 가운데 다른 프로젝트에도 걸리는 것을 골라 2.1.0-local.4에 넣었다. 결정 번호는 portfolio `docs/decisions/`다. 상태는 `LOCAL_CHANGES.md` 규약대로 portfolio 하나가 근거면 가설이다.

## 1. 후보별 반영

| 후보 | 근거 | 판단 | 위치 |
| --- | --- | --- | --- |
| 결정 질문 형식 | 결정 0082 | 보강 안 함. local.3 governance 2절에 이미 있다. 같은 날 차이 점검 질문 네 개(결정 0085)가 이 형식으로 나갔고 되물음 기록은 찾지 못했다. 하루치라 효과 확인으로 올리지 않고 출처 칸에만 적었다 | `LOCAL_CHANGES.md` 질문 형식 행 |
| 원자료 범위와 상태 괄호 | 결정 0092 | 반영. 원자료 → 사실표 → 산출물 파이프라인은 조사·작성·검증 하네스에 흔하다. C4·스토리 같은 portfolio 이름은 빼고 사실표와 산출물로 썼다 | `team-patterns.md` 1-4 |
| PR 폴더 슬래시 | 결정 0090 1항 | 반영. 브랜치 이름으로 경로를 만드는 일은 PR 전 검토를 두는 프로젝트 공통이다 | `git-pr-flow.md` 3절 브랜치 |
| 브랜치 종류는 트랙 이름 | 결정 0085 1항, 0090 2항 | 기본 프리셋으로 반영(2026-11-12 사용자 지시). 트랙이 하나뿐이거나 없으면 관행 접두어(`feat/` 등). 트랙 이름이 맞는 조건(PR 범위가 트랙 단위)은 portfolio 밖에도 있다 | `git-pr-flow.md` 2절 표 |
| 결정 번호 예약 | 결정 0085 2항 | 고치지 않음. local.3에 이미 있다(`git-pr-flow.md` 3절 병행 PR, `parallel-sessions.md` 병행 세션). portfolio가 이 규칙을 그대로 들였고 그 뒤 0085\~0096 겹침이 없어 출처만 더했다. `_workspace/sessions.md` 경로는 portfolio 값이라 넣지 않았다 | `LOCAL_CHANGES.md` 병행 세션 행 |
| 하위 세션 질문 relay | 넘김 문서, portfolio 오케스트레이터 '병행 세션' | 고치지 않음. local.3 `parallel-sessions.md` 병행 세션에 이미 있다. `orca orchestration ask`는 도구 이름이라 넣지 않았다 | 없음 |
| 창 재사용(`/clear`, `/exit` 뒤 재시작) | portfolio 메모리 `keep-subsession-pane`, 넘김 문서 | 반영. Claude Code 하위 세션 공통이다 | `parallel-sessions.md` 병행 세션 |
| `MSYS_NO_PATHCONV=1`, PowerShell `;` | 넘김 문서, 하위 세션 지시 | 반영. Windows·Git Bash 환경 공통이고 portfolio에 걸린 것이 아니다. 문서가 이미 환경 한정이라 같은 문서에 한 줄로 둔다 | `parallel-sessions.md` 병행 세션 |
| 정기 코드 리뷰와 첫 리뷰 처리 | 결정 0091 3항, portfolio 오케스트레이터 '정기 코드 리뷰'(하위 세션 A `e546817`) | 반영(후속). 계기, 지점 기록 한 곳, 첫 리뷰는 파일 전체를 읽는 분리 리뷰만 일반화했다. 50줄 문턱, 5개, 경로 목록, `docs/backlog.md`는 portfolio 값이라 넣지 않았다 | `git-pr-flow.md` 2절 표(정기 코드 리뷰 행), 3절 정기 코드 리뷰 |
| amend 규칙(새 메시지 옵션이 있을 때만 통과) | 결정 0094(0030 2항을 바꿈, 하위 세션 A `19a9b3c`) | 반영(후속). `GIT_EDITOR=true` 환경에서는 옵션 없는 amend도 옛 메시지를 남기고, 재사용 옵션 나열은 축약·묶음을 놓친다. hook을 둘지는 governance 8절 그대로(명령으로 판정되니 장치), 표의 문구만 맞췄다 | `git-pr-flow.md` 2절 커밋 규칙 행, 3절 커밋, `project-governance.md` 8절 표 |

결정 0091의 1·2항(폴더 규약 문서를 더 두지 않음)과 4항(코드 리뷰 조건 경로)은 portfolio 경로 값이다. 3항(정기 리뷰 계기)과 첫 리뷰 처리만 넣었다.

## 2. 확인하지 못한 것

- 0082 적용 뒤 되물음이 없었다는 것은 portfolio 결정·`_workspace` 문서 grep으로만 봤다. 대화 기록은 보지 않았다.
- `/clear`, `MSYS_NO_PATHCONV=1`, PowerShell `;`는 결정 기록이 없고 넘김 문서와 메모리, 하위 세션 지시에만 있다.
- meet-rag 쪽 근거는 다시 보지 않았다.
