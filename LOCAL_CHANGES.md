# 로컬 변경 기록

원 저장소(revfactory/harness, 커밋 92d9f1b, v2.1.0)에서 갈라진 로컬 포크의 변경 기록이다. 원본 문단은 고치지 않고 `(로컬 추가)` 표시를 단 항목과 새 참고 문서만 더한다. 원 저장소가 업데이트되면 이 표시를 기준으로 다시 합친다.

로컬 기본 브랜치는 `local/main`이다(마켓플레이스 `harness-buzziru`가 따라간다). 프로젝트별 교훈은 `local/main`에서 짧은 작업 브랜치를 만들어 반영하고 합친다. 프로젝트 이름을 브랜치 이름으로 쓰지 않는다(교훈이 프로젝트를 넘어 쌓인다).

## 포크 작업 흐름

다른 프로젝트의 세션이 포크에 변경을 반영할 때 이 절을 따른다.

- `local/main`에서 작업 브랜치를 내고, 끝나면 `local/main`에 합쳐 `origin`에 푸시한다. `local/main`에 직접 커밋하지 않는다. 합친 작업 브랜치는 지운다.
- 브랜치 이름은 `local/<종류>/<주제>`다. `local/` 아래에 두어 원 저장소 브랜치(`main`, `fix/*`, `release/*`)와 섞이지 않게 한다. 종류는 셋이다.
  - `lesson`: 프로젝트 교훈을 스킬·참고 문서에 반영(예: `local/lesson/verifier-scope`). 주제는 규칙 이름으로 짓고 프로젝트 이름을 쓰지 않는다
  - `sync`: 원 저장소 갱신을 합침(예: `local/sync/v2.2.0`)
  - `chore`: 버전, 기록, 문서처럼 스킬 동작이 바뀌지 않는 정리(예: `local/chore/branch-naming`)
- 원 저장소에 PR로 올릴 후보는 `upstream/main`에서 원 저장소 관례(`fix/*`, `feat/*`)로 따로 낸다. 효과 확인이 된 항목만 올린다(위 상태 구분).
- 커밋 메시지는 `local: `로 시작하는 한국어 한 줄과 본문이다. 버전을 올리는 변경이면 아래 버전 표기 네 곳을 함께 맞춘다.
- 푸시 뒤 전역 설치를 갱신한다. `claude plugin marketplace update`가 Windows 폴더 잠금(EPERM)으로 실패하면 마켓플레이스 폴더(`~/.claude/plugins/marketplaces/harness-buzziru`)에서 `git pull --ff-only` 뒤 `claude plugin update harness@harness-buzziru`로 한다.

근거가 프로젝트 하나뿐인 항목은 가설이다. 상태는 둘로 나눈다. `문제 재확인(프로젝트 목록)`은 그 항목이 겨냥한 문제가 다른 프로젝트에서도 났다는 뜻이고, `효과 확인(프로젝트 목록)`은 그 위치의 규칙이 있은 뒤 같은 문제가 줄었다는 뜻이다. 원 저장소 PR 후보는 효과 확인이 된 항목만 둔다. portfolio 출처의 번호는 감사 보고서 `docs/lessons/portfolio-audit-20261110.md`의 변경 번호(#)와 절 번호다. `결정 NNNN`은 portfolio 저장소 `docs/decisions/`의 결정 번호다(2026-11-12 정리, 감사 뒤 하네스 변경 37건 대조: `docs/lessons/portfolio-delta-20261112.md`, 변경 목록은 같은 폴더 `-changes.md`. local.4 후보 대조: `docs/lessons/portfolio-local4-20261112.md`).

버전 표기는 `.claude-plugin/plugin.json`, `marketplace.json`, README·README_KO 뱃지를 같은 로컬 버전(`2.1.0-local.N`)으로 맞춘다. 뱃지는 원본 문단이지만 CONTRIBUTING의 버전 정합성 점검을 지키려고 바꾼다. 원 저장소와 다시 합칠 때 뱃지 줄은 원본 값으로 되돌린다.

| 항목 | 위치 | 출처 | 상태 |
| --- | --- | --- | --- |
| 판정 방법을 1단계에서 확인, 평가기 멈춤 기준 | `harness` 1단계 7, `references/project-governance.md` 1절 | meet-rag: 생성 평가 지연 6.5작업일, judge 지시 j_v2\~j_v13. portfolio: #10·#11(판정이 빌드뿐이라 테스트·CI를 뒤에 붙임) | 문제 재확인(meet-rag, portfolio) |
| 승인 지점과 자율 범위 설계 | 1단계 7, governance 2절 | meet-rag: ADR-0041, 0077. portfolio: #3(승인 단계를 만들었다 폐지), 5절(하네스 세부까지 사용자 결정) | 문제 재확인(meet-rag, portfolio) |
| 되돌리기 어려운 일 목록과 보호 장치 | 1단계 7, governance 3절 | meet-rag: ADR-0058, 거부 규칙 미확인 사례(2026-11-06). portfolio: #1(공개 저장소·main 자동 배포 규칙이 구축 50분 뒤) | 문제 재확인(meet-rag, portfolio) |
| 변경 이력을 결정 파일로, 삭제 조건, 답을 받은 자리에서 초안 | `harness` 5-4, `evolve` Phase 3·4, governance 4절 | meet-rag: ADR-0014(107건), ADR-0049, 0061. portfolio: #4·#7(결정 파일과 이력 분리를 뒤에 함), 결정 0054·0060(결정 파일이 PR 검토에서야 빠진 것으로 드러남, 네 번). 2026-11-12 기준 쓰는 위치를 답 직후로 옮긴 뒤 재발 없음(governance 8절에 따라 관찰, 장치 없음) | 문제 재확인(meet-rag, portfolio) |
| 사람 검토 지점(검토 안내), 판단은 대화에서 받고 PR은 요약 | governance 5절 | meet-rag: `pr-briefer`, ADR-0041. portfolio: 5절(PR 16개의 판단할 곳이 모두 "없음"), 결정 0054(판단을 대화에서 받기로 바꾼 뒤 PR에서 판단이 나오지 않음, 효과는 PR 수가 적어 확인 안 됨) | 문제 재확인(meet-rag, portfolio) |
| `_workspace/` 수명 주기 | `harness` 5-1, governance 6절 | meet-rag: ADR-0062, 종료 때 178개 처리(2026-11-09) | 가설 |
| 종료 단계 | `harness` 8단계, governance 7절 | meet-rag: 2026-11-09 완료 작업 | 가설 |
| PR 코멘트와 대기 목록을 evolve 입력으로 | `evolve` Phase 1의 5·6 | meet-rag: 스킬 F3 | 가설 |
| 반영 전 관문(관찰 상태, 이미 있는 규칙의 위치 고치기, 고치거나 지울 기존 문장), 묶음 반영 | `evolve` Phase 3 관문, 원칙, `harness` 5-4(호출 조건)·7단계 2 | meet-rag: 하네스 chore PR 78/247. portfolio: 2.4(하네스 PR 11/16), #29·#44(규칙을 장치로 강제) | 문제 재확인(meet-rag, portfolio) |
| 규칙의 목적으로 판정(예외로 끝내기, 목적 위반과 형식 지적 구분) | `evolve` Phase 3 관문 (0)·원칙, `references/qa-agent-guide.md` 3-5 | portfolio 2026-11-12: 프로필 두 줄 → 전체 줄바꿈 규칙·격자 변경 제안(되돌림, 결정 0113), paired bootstrap 풀이를 '첫 등장' 규칙대로 레일 태그에, meeting-rag 조건 낱말 한 줄로 C4 round3\~7 | 가설 |
| 운영 틀 질문을 구축 관문으로(1\~5절 답을 결정 기록으로) | `harness` 1단계 7, 2단계 머리, 점검표, governance 2·3·5절 질문 | portfolio: 2.6(B 12건 가운데 8건이 governance 1\~5절의 질문) | 가설 |
| 공유 규칙은 한 곳에 두고 나머지는 경로만, 정본이 바뀌면 하네스 파일까지 grep | `harness` 4-5, `references/skill-writing-guide.md` 8절, `evolve` Phase 3의 6 | portfolio: 2.2(#8·#18·#20·#21·#34·#41, 연결 누락과 옛 참조 정리), 감사 뒤 같은 정리 3회(점검 항목에 옛 규칙이 남음) | 가설(portfolio 안 재발 3회) |
| 메인이 직접 고칠 경계를 크기가 아니라 종류로 | governance 2절 | portfolio: #26·#38, 2.3 | 가설 |
| 저장소 밖 파일·서비스 수정을 보호 대상에 | governance 3절 | portfolio: #42 | 가설 |
| 화면·실행 결과로 판단할 산출물은 결과를 보고 승인, 렌더 여부 표시 | governance 5절 첫 문단 | portfolio: #39, 5절(화면을 보기 전에 결정을 요구한 곳), 결정 0050 | 가설 |
| PR 범위와 새로 나온 일의 기본값 | governance 5절 | portfolio: #8·#27·#36, 2.4 | 가설 |
| 병행 세션, worktree, 외부 worker | `references/parallel-sessions.md` | meet-rag: ADR-0058, 0098, 0105, 0107. portfolio: 결정 0075(외부 worker 후보 찾기, 권한 요청), 2026-11-12 하위 세션 운용, 결정 0085(결정 번호를 브랜치 낼 때 공유 기록에 예약, 그 뒤 0085\~0096 겹침 없음), 창 재사용(`/clear`, `/exit` 뒤 재시작)과 Windows 입력(`MSYS_NO_PATHCONV=1`, PowerShell `;`)은 portfolio 메모리·넘김 문서 | 문제 재확인(meet-rag, portfolio, 환경 한정) |
| 질문 형식(무엇·왜·선택지별 차이·추천, 결정은 내용으로) | governance 2절 | portfolio: 결정 0082(결정 번호만 댄 질문에 사용자가 되물음, 사용자 기억과 기록이 다름). 2026-11-12 같은 날 차이 점검 질문 네 개가 이 형식으로 나갔고 되물음 기록 없음(하루치라 효과 확인 아님) | 가설 |
| git·PR 흐름을 선택으로, 정할 항목과 기본 프리셋 | `references/git-pr-flow.md`, `harness` 1단계 7·8단계 | portfolio: 결정 0005·0012·0014·0015·0032·0054·0055·0060, 감사 0절(첫 27시간 PR 16개 중 11개가 하네스·규칙 PR), #1·#6·#27. 결정 0085·0090(트랙 이름 접두어를 기본 프리셋으로, 2026-11-12 사용자 지시, 브랜치 이름의 `/`를 폴더로), 결정 0094(amend는 새 메시지 옵션이 있을 때만, 옵션 없는 amend와 축약이 재사용 옵션 차단을 통과) | 가설 |
| 정기 코드 리뷰(계기, 지점 기록 한 곳, 첫 리뷰는 파일 전체 분리 리뷰) | `references/git-pr-flow.md` 2절 표, 3절 정기 코드 리뷰 | portfolio: 결정 0091 3항(PR 리뷰가 50줄 넘을 때만 열려 작은 변경과 조건 밖 경로가 리뷰 밖), 첫 리뷰에서 diff 기반 스킬이 지점 없음으로 끝남(하위 세션 A, 2026-11-12). 첫 리뷰가 hook 빈틈 셋을 찾음(결정 0094 맥락) | 가설 |
| 사실표가 있는 검증의 원자료 범위, 상태 괄호는 뜻으로 | `references/team-patterns.md` 1-4 | portfolio: 결정 0092(지난 C4 지적 36건 중 원자료로 잡힌 9건, 그중 6건은 사실표 없는 작업, 사실표 숫자 오류 0건) | 가설 |
| 2라운드부터 변경분만 재검증 | `references/team-patterns.md` 1-4 | portfolio: 결정 0032·0060 | 가설 |
| 화면 판정 장치를 구축 때 | `harness` 6-7 | portfolio: 결정 0052(측정·촬영 스크립트를 구축 뒤에 만들어 다섯 번 고침) | 가설 |
| 규칙 수정과 강제 장치의 기준 | governance 8절, `evolve` Phase 3 관문 (라) | portfolio: #29·#44, 2026-11-12 정리(장치는 기계 판정되는 실패에만) | 가설 |

## 사용자 결정

- 2026-11-12 git·PR 흐름 반영: 문서 이름 `git-pr-flow.md`, 용어는 'git·PR 흐름'(이 포크에서 '워크플로'는 Workflow 도구, 1단계 3의 '작업 흐름'은 실행 모드 고르기라 겹치지 않게). 1단계 7에서 넣지 않음, 가벼운 흐름, 전체 흐름 세 단계로 묻는다. 문서는 정할 항목, 선택지, 기본 프리셋으로 쓰고 프리셋에 프로젝트 이름을 붙이지 않는다. 규칙과 강제 장치의 기준은 governance 8절에 두고 evolve 관문에서 경로만 가리킨다. 버전은 json 둘과 README 뱃지 둘을 `2.1.0-local.3`으로 맞추고 CHANGELOG에 새 절을 둔다
