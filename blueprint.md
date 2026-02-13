# 이력서 검토 서비스 - 청사진

## 1. 개요

이 서비스는 사용자가 자신의 이력서 파일(PDF, DOCX, HWP)을 웹사이트를 통해 업로드하면, 지정된 관리자 이메일로 해당 이력서가 첨부된 알림을 보내주는 간단한 웹 애플리케이션입니다. 모든 과정은 Cloudflare의 무료 서비스를 최대한 활용하여 구축됩니다.

## 2. 기술 스택 및 아키텍처

- **프론트엔드:**
  - **HTML5:** 기본 웹 페이지 구조
  - **CSS3:** 디자인 및 스타일링
  - **JavaScript (ESM):** 사용자 상호작용 및 API 요청 처리
  - **호스팅:** Cloudflare Pages

- **백엔드 (서버리스):**
  - **Cloudflare Functions:** 사용자가 제출한 이력서 폼 데이터를 받아 이메일을 전송하는 역할
  - **이메일 전송:** SendGrid API (Cloudflare Function 내에서 호출, 무료 플랜 사용)

- **워크플로우:**
  1. 사용자가 웹 페이지에서 이력서 파일과 자신의 이메일 주소를 입력하고 '제출' 버튼을 클릭합니다.
  2. 프론트엔드 JavaScript가 `multipart/form-data` 형식으로 Cloudflare Function의 엔드포인트 (`/upload`)에 `POST` 요청을 보냅니다.
  3. Cloudflare Function이 요청을 받아 파일과 이메일 데이터를 파싱합니다.
  4. 함수는 SendGrid와 같은 이메일 API를 사용하여 관리자에게 이력서 파일이 첨부된 알림 이메일을 발송합니다.
  5. 함수는 처리 결과를 프론트엔드에 반환하고, 사용자는 성공 또는 실패 메시지를 보게 됩니다.

## 3. 현재 작업 계획: Firebase에서 Cloudflare로 마이그레이션

**목표:** 기존 Firebase Functions 기반 아키텍처를 Cloudflare Functions를 사용하도록 변경하여 비용 없이 이메일 알림 기능을 구현합니다.

**단계별 실행 계획:**
1.  **`main.js` 수정:**
    -   Firebase Function URL을 호출하던 `fetch` 요청의 엔드포인트를 Cloudflare Function의 상대 경로인 `/upload`로 변경합니다.

2.  **Cloudflare Function 생성:**
    -   프로젝트 루트에 `functions` 디렉토리를 생성합니다.
    -   `functions` 디렉토리 내에 `upload.js` 파일을 생성합니다. 이 파일은 다음 로직을 포함합니다.
        -   `POST` 요청 처리
        -   `multipart/form-data` 파싱
        -   SendGrid API를 호출하여 이메일을 보내는 로직 (사용자가 API 키를 입력해야 할 부분은 주석으로 명확히 안내)

3.  **안내 및 마무리:**
    -   수정된 파일들을 사용자에게 확인시킵니다.
    -   사용자가 SendGrid에 가입하고 무료 API 키를 받아 `upload.js` 파일 내의 지정된 위치에 추가해야 함을 안내합니다.
    -   프로젝트를 Cloudflare Pages에 배포하면 모든 기능이 정상 작동함을 설명합니다.
