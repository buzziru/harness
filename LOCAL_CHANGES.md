# 로컬 변경 기록

원 저장소(revfactory/harness, 커밋 92d9f1b, v2.1.0)에서 갈라진 로컬 포크의 변경 기록이다. 원본 문단은 고치지 않고 `(로컬 추가)` 표시를 단 항목과 새 참고 문서만 더한다. 원 저장소가 업데이트되면 이 표시를 기준으로 다시 합친다.

로컬 기본 브랜치는 `local/main`이다(마켓플레이스 `harness-buzziru`가 따라간다). 프로젝트별 교훈은 `local/main`에서 짧은 작업 브랜치를 만들어 반영하고 합친다. 프로젝트 이름을 브랜치 이름으로 쓰지 않는다(교훈이 프로젝트를 넘어 쌓인다).

근거가 프로젝트 하나뿐인 항목은 가설이다. 상태는 둘로 나눈다. `문제 재확인(프로젝트 목록)`은 그 항목이 겨냥한 문제가 다른 프로젝트에서도 났다는 뜻이고, `효과 확인(프로젝트 목록)`은 그 위치의 규칙이 있은 뒤 같은 문제가 줄었다는 뜻이다. 원 저장소 PR 후보는 효과 확인이 된 항목만 둔다. portfolio 출처의 번호는 감사 보고서 `docs/lessons/portfolio-audit-20261110.md`의 변경 번호(#)와 절 번호다.

| 항목 | 위치 | 출처 | 상태 |
| --- | --- | --- | --- |
| 판정 방법을 1단계에서 확인, 평가기 멈춤 기준 | `harness` 1단계 7, `references/project-governance.md` 1절 | meet-rag: 생성 평가 지연 6.5작업일, judge 지시 j_v2\~j_v13. portfolio: #10·#11(판정이 빌드뿐이라 테스트·CI를 뒤에 붙임) | 문제 재확인(meet-rag, portfolio) |
| 승인 지점과 자율 범위 설계 | 1단계 7, governance 2절 | meet-rag: ADR-0041, 0077. portfolio: #3(승인 단계를 만들었다 폐지), 5절(하네스 세부까지 사용자 결정) | 문제 재확인(meet-rag, portfolio) |
| 되돌리기 어려운 일 목록과 보호 장치 | 1단계 7, governance 3절 | meet-rag: ADR-0058, 거부 규칙 미확인 사례(2026-11-06). portfolio: #1(공개 저장소·main 자동 배포 규칙이 구축 50분 뒤) | 문제 재확인(meet-rag, portfolio) |
| 변경 이력을 결정 파일로, 삭제 조건 | `harness` 5-4, `evolve` Phase 3·4, governance 4절 | meet-rag: ADR-0014(107건), ADR-0049, 0061. portfolio: #4·#7(결정 파일과 이력 분리를 뒤에 함) | 문제 재확인(meet-rag, portfolio) |
| 사람 검토 지점(검토 안내), 판단은 대화에서 받고 PR은 요약 | governance 5절 | meet-rag: `pr-briefer`, ADR-0041. portfolio: 5절(PR 16개의 판단할 곳이 모두 "없음") | 가설(portfolio에서 반례: 판단할 곳이 늘 없음) |
| `_workspace/` 수명 주기 | `harness` 5-1, governance 6절 | meet-rag: ADR-0062, 종료 때 178개 처리(2026-11-09) | 가설 |
| 종료 단계 | `harness` 8단계, governance 7절 | meet-rag: 2026-11-09 완료 작업 | 가설 |
| PR 코멘트와 대기 목록을 evolve 입력으로 | `evolve` Phase 1의 5·6 | meet-rag: 스킬 F3 | 가설 |
| 반영 전 관문(관찰 상태, 이미 있는 규칙의 위치 고치기, 고치거나 지울 기존 문장), 묶음 반영 | `evolve` Phase 3 관문, 원칙, `harness` 5-4(호출 조건)·7단계 2 | meet-rag: 하네스 chore PR 78/247. portfolio: 2.4(하네스 PR 11/16), #29·#44(규칙을 장치로 강제) | 문제 재확인(meet-rag, portfolio) |
| 운영 틀 질문을 구축 관문으로(1\~5절 답을 결정 기록으로) | `harness` 1단계 7, 2단계 머리, 점검표, governance 2·3·5절 질문 | portfolio: 2.6(B 12건 가운데 8건이 governance 1\~5절의 질문) | 가설 |
| 공유 규칙은 한 곳에 두고 나머지는 경로만 | `harness` 4-5, `references/skill-writing-guide.md` 8절 | portfolio: 2.2(#8·#18·#20·#21·#34·#41, 연결 누락과 옛 참조 정리) | 가설 |
| 메인이 직접 고칠 경계를 크기가 아니라 종류로 | governance 2절 | portfolio: #26·#38, 2.3 | 가설 |
| 저장소 밖 파일·서비스 수정을 보호 대상에 | governance 3절 | portfolio: #42 | 가설 |
| 화면·실행 결과로 판단할 산출물은 결과를 보고 승인 | governance 5절 첫 문단 | portfolio: #39, 5절(화면을 보기 전에 결정을 요구한 곳) | 가설 |
| PR 범위와 새로 나온 일의 기본값 | governance 5절 | portfolio: #8·#27·#36, 2.4 | 가설 |
| 병행 세션, worktree, 외부 worker | `references/parallel-sessions.md` | meet-rag: ADR-0058, 0098, 0105, 0107 | 가설(환경 한정) |
