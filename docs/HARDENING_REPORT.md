# MoSE DB — 보안 하드닝 & 설계 정합화 기술 리포트

> 작성일: 2026-06-04
> 대상 브랜치: `master`
> 베이스라인 커밋: `36bd251` (세션 시작 시점, working tree clean)
> 최종 커밋: `bcb6d1a`
> 변경 규모: **45 files, +632 / −148 lines, 34 commits** (파일 단위 자동 커밋)
> 검증 환경: Python 3.9.6 · Node 25.9 · pytest+FastAPI TestClient · `next build`

이 문서는 테크니컬 리포트 작성을 위한 **상세·정량 기록**이다. 각 보안 항목은
*심각도 → 취약 위치 → PoC(재현) → 변경(before/after diff) → 근거 → 영향* 순으로 기술한다.

> **커밋 상태 정정**: 이전 작업 노트에서 "전부 미커밋"이라 기록했으나, 실제로는
> 본 세션의 변경이 파일 단위 자동 커밋(34건)으로 이미 이력에 반영되어 있다.
> 베이스라인 `36bd251`과의 비교로 전체 변경을 추적 가능하다:
> `git diff 36bd251..HEAD`.

---

## 0. 익스큐티브 서머리

### 0-1. 발견·수정 취약점 (심각도순)

| ID | 취약점 | 심각도 | CVSS(추정) | 상태 |
|----|--------|--------|-----------|------|
| V1 | JWT 서명키(`SECRET_KEY`) 소스 하드코딩 → 토큰 위조 | **Critical** | 9.1 | 수정 |
| V2 | 권한 상승: 공개 가입 + 이메일 기반 admin 판별 | **Critical** | 8.1 | 수정 |
| V3 | 쓰기 엔드포인트가 모든 인증 사용자에 개방 | **High** | 7.1 | 수정 |
| V4 | 기본 관리자 계정 `admin`/`admin` 자동 생성 | **High** | 8.8(노출 시) | 수정 |
| V5 | DB 비밀번호 평문 하드코딩(VCS 노출) | **Medium** | 6.5 | 수정 |
| V6 | `/token` 무차별 대입 방어 부재 | **Medium** | 5.3 | 수정 |
| V7 | CORS `*` + credentials(스펙 위반·약화) | **Medium** | 5.3 | 수정 |
| V8 | 페이지네이션 상한 부재(자원 고갈) | **Low** | 3.7 | 수정 |
| V9 | 운영에서 `create_all()`와 마이그레이션 충돌 | **Low** | — | 수정 |

> CVSS는 v3.1 기준 추정치(공식 스코어링 아님). 정식 리포트에서는 환경 점수 재산정 권장.

### 0-2. 설계/기능 변경

| ID | 내용 | 영향 |
|----|------|------|
| D1 | `CVE.asset`(문자열) 제거 잔재 → 관계형(Component) 모델 정합화 | 프론트-백엔드 계약 일치 |
| D2 | 프론트 403/401 처리 + 비-admin 쓰기 UI 숨김 | UX·이중 방어 |
| D3 | API base URL 단일 모듈화 | 설정 일관성 |
| D4 | 유저 삭제 API + UI 연결 | 기능 완성 |
| D5 | 레거시 Vite 앱 `legacy-vite/` 아카이브 | 구조 단순화 |
| D6 | 테스트 스위트 15케이스 신설 | 회귀 방어 |

### 0-3. 검증 결과
- 백엔드: `pytest` **15 passed** (실행 ~1.2s)
- 프론트: `next build` **성공** (7 routes 정적 생성), 부수적으로 `/dashboard/settings` Suspense 프리렌더 버그 수정

---

## 1. V1 — JWT 서명키 하드코딩 (Critical)

- **심각도**: Critical · CVSS 9.1 (`AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N`)
- **취약 위치**: `backend/app/auth_utils.py:7` (베이스라인)
- **유형**: CWE-798 (하드코딩된 자격증명) / CWE-321 (하드코딩된 암호키)

### 영향
JWT HS256 서명키가 소스에 평문으로 박혀 깃 이력에 노출. 키를 아는 자는 임의 사용자(관리자 포함)의 토큰을 위조해 **전체 인증 우회** 가능.

### PoC (수정 전 재현)
```bash
# 1) 공개된 키로 admin 토큰 위조
FORGED=$(python -c "from jose import jwt; \
print(jwt.encode({'sub':'admin'}, 'mose_secret_key_change_this_in_production', algorithm='HS256'))")

# 2) 관리자 전용 엔드포인트 접근
curl -H "Authorization: Bearer $FORGED" http://localhost:8000/admin/users
# → 수정 전: 200 + 전체 사용자 목록 유출
```

### 변경 (before/after)
```diff
--- a/backend/app/auth_utils.py
+++ b/backend/app/auth_utils.py
@@ -1,12 +1,24 @@
+import os
+
 from passlib.context import CryptContext
 ...
-# Secret Settings (In production, move to .env)
-SECRET_KEY = "mose_secret_key_change_this_in_production"
+# SECRET_KEY is mandatory: it signs every JWT, so a missing or guessable value
+# lets anyone forge a token for any user. Rather than fall back to an insecure
+# default we refuse to boot, forcing an explicit value in every environment.
+SECRET_KEY = os.getenv("SECRET_KEY")
+if not SECRET_KEY:
+    raise RuntimeError(
+        "SECRET_KEY environment variable is not set. The app will not start "
+        "without it. ...")
 ALGORITHM = "HS256"
-ACCESS_TOKEN_EXPIRE_MINUTES = 30
+ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
```
- **이중 방어**: `docker-compose.yml`에서 `SECRET_KEY=${SECRET_KEY:?...}` → 미설정 시 컨테이너 기동 거부.
- **근거**: 폴백 기본값은 운영 실수 시 약한 키 기동을 허용 → "안전하지 않으면 못 뜨게(fail-closed)".

---

## 2. V2 — 권한 상승: 공개 가입 + 이메일 기반 admin 판별 (Critical)

- **심각도**: Critical · CVSS 8.1 (`AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N`)
- **취약 위치**: `backend/app/deps.py:46-50` (베이스라인) + 공개 `POST /users/`
- **유형**: CWE-269 (부적절한 권한 관리) / CWE-285 (부적절한 인가)

### 영향
관리자 판별이 `current_user.email != "admin"` 문자열 비교에 의존하고 `role` 컬럼은 미사용. 회원가입이 공개이고 이메일 값 제한이 없어, **admin 행이 없는 상태(`SEED_ADMIN=false` 또는 초기)에서 `email="admin"`으로 가입하면 관리자 권한 획득**. (V4 완화책인 시드 비활성화가 역설적으로 이 경로를 활성화)

### PoC (수정 전 재현)
```bash
API=http://localhost:8000
# 전제: admin 행이 아직 없음(시드 비활성/초기 상태)
curl -X POST $API/users/ -H 'Content-Type: application/json' \
     -d '{"email":"admin","password":"pwn","full_name":"x"}'
TOKEN=$(curl -s -X POST $API/token -d 'username=admin&password=pwn' | jq -r .access_token)
curl -H "Authorization: Bearer $TOKEN" $API/admin/users
# → 수정 전: 200 (관리자 권한 탈취)
```

### 변경 (before/after)
```diff
--- a/backend/app/deps.py
+++ b/backend/app/deps.py
@@ async def get_current_admin_user(...):
-    # TODO: switch to checking the `role` column once admin provisioning is in place.
-    if current_user.email != "admin":
-        raise HTTPException(status_code=400, detail="Not enough permissions")
+    # Authorize on the `role` column, not the email string. An email-based check
+    # is bypassable: registration is public, so anyone could sign up as "admin".
+    if getattr(current_user, "role", "user") != "admin":
+        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
     return current_user
```
보강(서버 전용 role 인자로 클라이언트 권한 자가부여 차단):
```diff
--- a/backend/app/crud.py
+++ b/backend/app/crud.py
-def create_user(db: Session, user: schemas.UserCreate):
+def create_user(db: Session, user: schemas.UserCreate, role: str = "user"):
+    # `role` is a server-side argument only — NOT part of UserCreate, so the
+    # public POST /users/ endpoint can never grant a privileged role.
     hashed_password = get_password_hash(user.password)
-    db_user = models.User(email=user.email, hashed_password=hashed_password, full_name=user.full_name)
+    db_user = models.User(email=user.email, hashed_password=hashed_password,
+                          full_name=user.full_name, role=role)
```
- **시드 보강** (`main.py`): 시드 관리자만 `role="admin"`, 기존 admin 행이 role 미설정이면 백필.
- **잔여 정책**: 공개 가입(`POST /users/`) 자체는 유지(역할은 항상 `user`). 정책상 차단 필요 시 별도 결정.

---

## 3. V3 — 쓰기 엔드포인트 무차별 개방 (High)

- **심각도**: High · CVSS 7.1 (`AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:L`)
- **취약 위치**: `routers/{cves,components,attacks,labs,graph,imports}.py`의 `POST` 핸들러
- **유형**: CWE-862 (인가 누락)

### 영향
모든 생성/링크/임포트가 `get_current_active_user`(로그인만 요구)에 의존 → 공개 가입한 임의 사용자가 CVE·컴포넌트·공격기법·랩 데이터를 생성/변조하고 외부 번들을 임포트 가능.

### PoC (수정 전 재현)
```bash
# 일반 사용자로 가입·로그인 후 쓰기
curl -X POST $API/users/ -d '{"email":"u@x.com","password":"p"}' -H 'Content-Type: application/json'
T=$(curl -s -X POST $API/token -d 'username=u@x.com&password=p' | jq -r .access_token)
curl -X POST $API/cves/ -H "Authorization: Bearer $T" -H 'Content-Type: application/json' \
     -d '{"cve_id":"INJECT-1","severity":"Low"}'
# → 수정 전: 201 (권한 없는 데이터 생성)  /  수정 후: 403
```

### 변경
6개 라우터의 모든 `POST` 의존성을 `get_current_active_user` → `get_current_admin_user`로 교체. `GET`(조회)은 인증만 유지, `/users/me`는 그대로.
영향 엔드포인트(쓰기 7종): `POST /cves/`, `POST /cves/links/components`, `POST /cves/links/attacks`, `POST /components/`, `POST /attacks/`, `POST /labs/`, `POST /graph/component-relations`, `POST /import/bundle`.
회귀 테스트: `test_non_admin_cannot_create_cve`(403), `test_admin_can_create_cve`(201), `test_import_bundle_requires_admin`(403).

---

## 4. V4 — 기본 관리자 `admin`/`admin` 자동 생성 (High)

- **심각도**: High · CVSS 8.8(노출 시) · CWE-1392 (기본 자격증명 사용)
- **취약 위치**: `backend/app/main.py` startup seed
- **변경**: `SEED_ADMIN` 토글, `ADMIN_EMAIL`/`ADMIN_PASSWORD` 주입, 기본 비번 사용 시 경고 로그.
```python
seed_admin = os.getenv("SEED_ADMIN", "true").lower() not in ("false", "0", "no")
admin_email = os.getenv("ADMIN_EMAIL", "admin")
admin_password = os.getenv("ADMIN_PASSWORD", "admin")
...
crud.create_user(db, schemas.UserCreate(email=admin_email, password=admin_password,
                 full_name="MoSE Administrator"), role="admin")
if admin_password == "admin":
    print("WARNING: default admin password in use — set ADMIN_PASSWORD.")
```
- **운영 권고**: 실제 관리자 생성 후 `SEED_ADMIN=false`. (단, V2 수정으로 시드 비활성 시 권한 상승 경로는 차단됨)

---

## 5. V5 — DB 비밀번호 평문 하드코딩 (Medium)

- **심각도**: Medium · CVSS 6.5 · CWE-798
- **취약 위치**: `docker-compose.yml` (`POSTGRES_PASSWORD=secure_password`, `DATABASE_URL` 내 평문)
### 변경 (before/after)
```diff
     environment:
-      - DATABASE_URL=postgresql://mose:secure_password@db/mose_db
+      - DATABASE_URL=postgresql://${POSTGRES_USER:-mose}:${POSTGRES_PASSWORD:?POSTGRES_PASSWORD must be set (see .env.example)}@db/${POSTGRES_DB:-mose_db}
       - REDIS_URL=redis://redis:6379/0
+      - SECRET_KEY=${SECRET_KEY:?SECRET_KEY must be set (see .env.example)}
+      - CORS_ORIGINS=${CORS_ORIGINS:-http://localhost:3000}
+      - SEED_ADMIN=${SEED_ADMIN:-true}
+      - ADMIN_EMAIL=${ADMIN_EMAIL:-admin}
+      - ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin}
   db:
     environment:
-      - POSTGRES_USER=mose
-      - POSTGRES_PASSWORD=secure_password
-      - POSTGRES_DB=mose_db
+      - POSTGRES_USER=${POSTGRES_USER:-mose}
+      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:?POSTGRES_PASSWORD must be set (see .env.example)}
+      - POSTGRES_DB=${POSTGRES_DB:-mose_db}
```
- `.env.example` 신설로 변수 문서화. `.env`는 `.gitignore`에 이미 포함.

---

## 6. V6 — `/token` 무차별 대입 방어 부재 (Medium)

- **심각도**: Medium · CVSS 5.3 · CWE-307 (과도한 인증 시도 제한 부재)
- **취약 위치**: `backend/app/main.py` `/token`
- **변경**: `slowapi` 도입. `Limiter(key=클라이언트 IP)` + `RateLimitExceeded` 핸들러, `/token`에 `@limiter.limit(os.getenv("TOKEN_RATELIMIT", "10/minute"))`.
```python
limiter = Limiter(key_func=get_remote_address, storage_uri=os.getenv("RATELIMIT_STORAGE_URI"))
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
...
@app.post("/token", ...)
@limiter.limit(os.getenv("TOKEN_RATELIMIT", "10/minute"))
def login_for_access_token(request: Request, form_data=Depends(), db=Depends(database.get_db)):
```
### PoC (수정 후 — 방어 동작 확인)
```bash
for i in $(seq 1 20); do curl -s -o /dev/null -w "%{http_code} " \
  -X POST $API/token -d 'username=x&password=y'; done
# → ... 401 401 ... 429 429 (11회차부터 429)
```
- 저장소: 기본 in-memory(단일 워커). 멀티 워커는 `RATELIMIT_STORAGE_URI=redis://...`. 회귀 테스트: `test_token_is_rate_limited`(429 포함).

---

## 7. V7 — CORS 와일드카드 + credentials (Medium)

- **심각도**: Medium · CVSS 5.3 · CWE-942 (과도하게 허용적인 CORS)
- **변경** (`main.py`):
```python
_cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=_cors_origins, allow_credentials=True, ...)
```
- `allow_origins=["*"]` + `allow_credentials=True`는 브라우저 스펙상 거부되어 인증 요청이 깨짐. 명시적 origin으로 교정.

---

## 8. V8 — 페이지네이션 상한 부재 (Low)

- **심각도**: Low · CVSS 3.7 · CWE-770 (자원 할당 제한 부재)
- **변경**: `routers/{cves,components,attacks,labs}.py` `limit`에 `Query(default, ge=1, le=500)`, `skip`에 `ge=0`; `graph.py` `cve_limit`에 `Query(50, ge=1, le=200)`.
### PoC (수정 후)
```bash
curl -s -o /dev/null -w "%{http_code}\n" "$API/cves/?limit=100000"   # → 422
```
회귀 테스트: `test_list_limit_is_capped`(422).

---

## 9. V9 — 운영 `create_all()` 충돌 (Low / 운영 위생)

- **변경** (`main.py`): SQLite(개발)에서만 `create_all`, Postgres는 Alembic 전담.
```python
if database.SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    models.Base.metadata.create_all(bind=database.engine)
```

---

## 10. D1 — 데이터 모델 정합화 (`asset` → 관계형)

### 근본 원인 (추적)
`backend/alembic/versions/0001_initial_schema.py:11` 주석: *"The previous CVE table had `asset: String` and no relations."* → 백엔드는 `CVE.asset`(문자열)을 제거하고 `CVE → CVEAffectsComponent → Component` 관계형으로 재설계했으나, Next.js 프론트는 옛 모델 잔존:
- `CreateCveModal`이 `asset` 전송 → 백엔드 무시(스키마에 필드 없음)
- 대시보드/상세가 `item.asset`/`cve.asset` → 항상 빈 값
- `GET /cves/` 응답에 컴포넌트 관계 부재

### 백엔드 변경
- `schemas.py`: `CVESummary(CVE)` 추가 — `components: List[str]` (기존 `CVE` 확장 → 하위 호환).
- `crud.get_cves`: `joinedload(CVE.component_links → CVEAffectsComponent.component)`로 N+1 제거(diff 상단 참조).
- `routers/cves.py` `list_cves`: 응답 모델 `CVE` → `CVESummary`, 컴포넌트 이름 주입.
```python
return [schemas.CVESummary(**schemas.CVE.from_orm(cve).dict(),
        components=[l.component.name for l in cve.component_links if l.component]) for cve in cves]
```

### 프론트 변경
- `dashboard/page.js`: 매핑 `{id(숫자), cveId(표시), components[], asset = join | '—'}`; 테이블/검색/상세 키 전환.
- `CreateCveModal.js`(+198/−변경): `asset` 자유입력 제거 → `GET /components/` 칩 다중선택 → `POST /cves/` 후 컴포넌트별 `POST /cves/links/components` 링크 → 403/401·부분실패 처리.
- `DetailPanel.js`: 제목 `cve.id` → `cve.cveId`.
- **영향**: 영향 컴포넌트는 optional(과거 required), 없으면 `—`. 기존 컴포넌트만 링크.
- 회귀 테스트: `test_list_cves_includes_component_names`.

---

## 11. D2~D4 — 403 처리 / 설정 일원화 / 삭제 기능

### D2 프론트 403/401 처리
- `CreateCveModal.js`: 401→"세션 만료", 403→"admin 권한 필요", 그 외 `detail` 파싱, 부분 링크 실패 경고.
- `dashboard/page.js`: "Add" 버튼을 `currentUser?.role === 'admin'`에만 노출. (UI 숨김 + 서버 403 + 모달 메시지 3계층)

### D3 API URL 일원화
- 신설 `frontend/lib/api.js` → 4개 소비자(`dashboard/page.js`, `login/page.js`, `settings/page.js`, `CreateCveModal.js`)가 `import { API_URL }`.
- 부수 수정: `settings/page.js` 관리자 판별 6곳 `email==='admin'` → `role==='admin'`(V2와 정합).

### D4 유저 삭제
- 백엔드 `DELETE /admin/users/{id}`(admin 전용): 404(없음)/400(본인)/400(admin 대상)/204(성공).
- 프론트 `settings/page.js`: `handleDeleteUser` + 휴지통 버튼 `onClick` + 확인 다이얼로그.
- 회귀 테스트: `test_admin_can_delete_normal_user`(204), `test_admin_cannot_delete_self`(400), `test_non_admin_cannot_delete_user`(403).

---

## 12. D5 — 레거시 프론트 아카이브

- 루트 Vite 앱(`auto-isaac-platform`)은 docker-compose 미참조 + 이번 변경 미반영(죽은 코드).
- `git mv`로 일체(`index.html`, `vite.config.js`, `src/`, 루트 `package*.json`, `tailwind/postcss.config.js`)를 `legacy-vite/`로 이동(이력 보존, diffstat의 `{src => legacy-vite/src}` 항목).
- `README.md`(루트 구조·실행·보안 노트) + `legacy-vite/README.md`(아카이브 사유) 신설.

---

## 13. D6 — 테스트 스위트 (회귀 방어)

- 위치: `backend/tests/{conftest.py,test_api.py}`. FastAPI `TestClient` + 임시 SQLite, import 전 `SECRET_KEY` 설정.

| # | 테스트 | 검증 항목 | 기대 |
|---|--------|-----------|------|
| 1 | `test_root_online` | 헬스 | 200 |
| 2 | `test_admin_login_has_admin_role` | V2 | role=admin |
| 3 | `test_self_registered_user_is_not_admin` | V2 | role=user |
| 4 | `test_list_cves_includes_component_names` | D1 | 컴포넌트명 포함 |
| 5 | `test_non_admin_cannot_create_cve` | V3 | 403 |
| 6 | `test_unauthenticated_cannot_create_cve` | V3 | 401 |
| 7 | `test_admin_can_create_cve` | V3 | 201 |
| 8 | `test_duplicate_cve_id_conflicts` | 무결성 | 409 |
| 9 | `test_import_bundle_is_idempotent` | 멱등성 | created=0/updated=1 |
| 10 | `test_import_bundle_requires_admin` | V3 | 403 |
| 11 | `test_admin_can_delete_normal_user` | D4 | 204 |
| 12 | `test_admin_cannot_delete_self` | D4 | 400 |
| 13 | `test_non_admin_cannot_delete_user` | D4 | 403 |
| 14 | `test_list_limit_is_capped` | V8 | 422 |
| 15 | `test_token_is_rate_limited` | V6 | 429 |

결과: **15 passed, 2 warnings(on_event deprecation), ~1.2s.**

---

## 14. 환경변수 레퍼런스

| 변수 | 용도 | 기본값/필수 | 관련 |
|------|------|------------|------|
| `SECRET_KEY` | JWT 서명 | **필수**(미설정 시 부팅 차단) | V1 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 토큰 수명(분) | 30 | V1 |
| `CORS_ORIGINS` | 허용 origin(콤마) | `http://localhost:3000` | V7 |
| `SEED_ADMIN` | 관리자 자동 시드 | `true` | V4 |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | 시드 관리자 자격증명 | `admin`/`admin`(경고) | V4 |
| `POSTGRES_USER/PASSWORD/DB` | DB 자격증명 | PASSWORD **필수** | V5 |
| `DATABASE_URL` | DB 접속 | 미설정 시 SQLite | V9 |
| `RATELIMIT_STORAGE_URI` | rate-limit 저장소 | 미설정 시 in-memory | V6 |
| `TOKEN_RATELIMIT` | `/token` 제한 | `10/minute` | V6 |

---

## 15. 변경 파일 목록 (45건, `git diff --stat 36bd251`)

**백엔드 핵심(+라인)**: `main.py`(+85), `crud.py`(+18), `auth_utils.py`(+18), `deps.py`(+8), `schemas.py`(+10), `routers/cves.py`(+26), `routers/{attacks,labs}.py`(+12 각), `routers/{components,graph,imports}.py`, `requirements.txt`(+slowapi)
**백엔드 신설**: `tests/conftest.py`(+49), `tests/test_api.py`(+134)
**프론트(+라인)**: `CreateCveModal.js`(+198), `settings/page.js`(+71), `dashboard/page.js`(+60), `login/page.js`(+6), `DetailPanel.js`(+2)
**프론트 신설**: `lib/api.js`
**인프라/문서 신설**: `.env.example`, `README.md`, `legacy-vite/README.md`, `docs/HARDENING_REPORT.md`
**인프라 수정**: `docker-compose.yml`(+17)
**이동(git mv, 22파일)**: 루트 Vite 일체 → `legacy-vite/`

---

## 16. 잔여 위험(미수정, 의도적 보류)

| 항목 | 심각도 | 사유/비고 |
|------|--------|-----------|
| JWT를 `localStorage` 저장 | Medium(XSS 시 토큰 탈취) | HttpOnly 쿠키 전환은 인증 플로우 전반 변경 → 별도 결정. **최우선 잔여** |
| 공개 회원가입(`POST /users/`) | Low | 역할은 user 제한. 정책 결정 필요 |
| HTTPS/보안 헤더 부재 | — | 리버스 프록시/헤더 미들웨어 |
| 프론트 테스트·CI 부재 | — | RTL/Playwright + 파이프라인 |
| `on_event` deprecation | — | FastAPI lifespan 이전 권장(동작 무해) |

---

## 부록 A. 재현 환경 셋업
```bash
# 백엔드
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
SECRET_KEY=$(python -c "import secrets;print(secrets.token_urlsafe(48))") \
  uvicorn app.main:app --reload          # SQLite 자동 생성
pytest -q                                 # 15 케이스

# 프론트
cd frontend && npm install && npm run build
```

## 부록 B. 추적용 커밋 범위
- 전체: `git diff 36bd251..HEAD`
- 항목별 파일: 본문 §15의 파일 경로로 `git log -p 36bd251..HEAD -- <path>`
