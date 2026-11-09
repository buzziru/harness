# 로컬 변경 기록

원 저장소(revfactory/harness, 커밋 92d9f1b, v2.1.0)에서 갈라진 로컬 포크의 변경 기록이다. 원본 문단은 고치지 않고 `(로컬 추가)` 표시를 단 항목과 새 참고 문서만 더한다. 원 저장소가 업데이트되면 이 표시를 기준으로 다시 합친다.

근거가 프로젝트 하나뿐이라 모든 항목은 가설이다. 다음 프로젝트에서 쓸모가 확인되면 상태를 `확인`으로 바꾸고, 두 프로젝트 이상에서 확인된 항목을 원 저장소 PR 후보로 둔다.

| 항목 | 위치 | 출처(meet-rag) | 상태 |
| --- | --- | --- | --- |
| 판정 방법을 1단계에서 확인, 평가기 멈춤 기준 | `harness` 1단계 7, `references/project-governance.md` 1절 | 생성 평가 지연 6.5작업일, judge 지시 j_v2\~j_v13 | 가설 |
| 승인 지점과 자율 범위 설계 | 1단계 7, governance 2절 | ADR-0041, 0077 | 가설 |
| 되돌리기 어려운 일 목록과 보호 장치 | 1단계 7, governance 3절 | ADR-0058, 거부 규칙 미확인 사례(2026-11-06) | 가설 |
| 변경 이력을 결정 파일로, 삭제 조건 | `harness` 5-4, `evolve` Phase 3·4, governance 4절 | ADR-0014(107건), ADR-0049, 0061 | 가설 |
| 사람 검토 지점(검토 안내) | governance 5절 | `pr-briefer`, ADR-0041 | 가설 |
| `_workspace/` 수명 주기 | `harness` 5-1, governance 6절 | ADR-0062, 종료 때 178개 처리(2026-11-09) | 가설 |
| 종료 단계 | `harness` 8단계, governance 7절 | 2026-11-09 완료 작업 | 가설 |
| PR 코멘트와 대기 목록을 evolve 입력으로 | `evolve` Phase 1의 5·6 | meet-rag 스킬 F3 | 가설 |
| 반영 전 거르기(관찰 상태), 묶음 반영 | `evolve` Phase 3의 6·7, 원칙 | 하네스 chore PR 78/247 | 가설 |
| 병행 세션, worktree, 외부 worker | `references/parallel-sessions.md` | ADR-0058, 0098, 0105, 0107 | 가설(환경 한정) |
