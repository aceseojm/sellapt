# 메디스파크 DB 수집 앱스크립트 구현 명세서

## 1. 목적

이 문서는 메디스파크 랜딩페이지에서 수집한 상담 신청 정보를 `Google Apps Script`로 받아 `Google Sheets`에 저장하기 위한 실무 구현 명세서다.

이 구현의 목표는 아래와 같다.

- 랜딩페이지 상담 폼 데이터를 안정적으로 수집
- 고객 이름, 연락처, 개발자 정보를 누락 없이 저장
- 최소한의 입력만 받아 전환율 저하를 방지
- 향후 광고 성과 추적과 상담 이력 관리가 가능하도록 확장성 확보

## 2. 기본 운영 정보

- 랜딩페이지명: `메디스파크 랜딩페이지`
- 대표번호: `010-6689-2348`
- 개발자: `서정민`
- 저장 방식: `Landing Page Form -> Google Apps Script Web App -> Google Sheets`

## 3. 수집 대상 데이터

### 사용자 입력 항목

- `name`: 이름
- `phone`: 연락처

### 시스템 고정값

- `developer`: `서정민`

### 권장 자동 수집 항목

- `createdAt`: 접수일시
- `pageName`: 메디스파크 랜딩페이지
- `source`: 유입 소스
- `campaign`: 광고 캠페인명
- `device`: mobile 또는 desktop

## 4. 최소 구현 스펙

이번 요청 기준 최소 저장 항목은 아래 3개다.

- 이름
- 연락처
- 개발자 정보

최소 구현만 해도 되지만, 실제 운영에서는 아래처럼 확장 저장하는 것이 좋다.

- 접수일시
- 이름
- 연락처
- 개발자
- 페이지명
- 유입소스
- 캠페인
- 디바이스

## 5. 구글시트 구조

### 시트 이름

추천 시트명

- `leads`

또는 프로젝트 식별이 필요하면

- `medispark_leads`

### 최소 컬럼 구조

| 컬럼명 | 설명 | 예시 |
|---|---|---|
| `created_at` | 접수일시 | `2026-06-27 14:21:10` |
| `name` | 고객명 | `홍길동` |
| `phone` | 연락처 | `01012345678` |
| `developer` | 개발자명 | `서정민` |

### 권장 확장 컬럼 구조

| 컬럼명 | 설명 | 예시 |
|---|---|---|
| `created_at` | 접수일시 | `2026-06-27 14:21:10` |
| `name` | 고객명 | `홍길동` |
| `phone` | 연락처 | `01012345678` |
| `developer` | 개발자명 | `서정민` |
| `page_name` | 페이지명 | `메디스파크 랜딩페이지` |
| `source` | 유입소스 | `meta` |
| `campaign` | 광고 캠페인명 | `braincity_m1` |
| `device` | 디바이스 | `mobile` |
| `memo` | 비고 | `빠른상담요청` |

## 6. 폼 데이터 전송 방식

### 전송 방식

- HTTP `POST`
- 전송 대상: `Google Apps Script Web App URL`
- 데이터 형식: `JSON`

### 프론트엔드에서 전송할 기본 데이터

```json
{
  "name": "홍길동",
  "phone": "01012345678",
  "developer": "서정민"
}
```

### 권장 확장 전송 데이터

```json
{
  "name": "홍길동",
  "phone": "01012345678",
  "developer": "서정민",
  "pageName": "메디스파크 랜딩페이지",
  "source": "meta",
  "campaign": "braincity_m1",
  "device": "mobile"
}
```

## 7. 폼 필드 정책

### 사용자에게 보여줄 입력 항목

- 성함
- 연락처

### 사용자에게 숨기고 시스템으로만 보내는 값

- developer: `서정민`
- pageName: `메디스파크 랜딩페이지`

### 연락처 정규화 규칙

- 하이픈 제거 후 저장 권장
- 예: `010-1234-5678` -> `01012345678`

## 8. 프론트엔드 동작 흐름

1. 사용자가 `상담 연결받기` 버튼 클릭
2. 이름과 연락처 입력
3. 프론트엔드에서 필수값 검증
4. 연락처 하이픈 제거 및 정리
5. 고정값 `developer=서정민` 포함
6. Apps Script Web App URL로 POST 전송
7. 성공 시 완료 메시지 노출
8. 필요 시 `전화 바로걸기 010-6689-2348` 버튼 추가 노출

## 9. 사용자 안내 문구

거부감을 줄이는 추천 문구는 아래와 같다.

- `성함과 연락처만 남겨주시면 요청하신 내용만 빠르게 안내드립니다.`
- `입력하신 정보는 상담 안내 용도로만 사용됩니다.`

## 10. 프론트엔드 검증 규칙

### 이름

- 빈값 불가
- 공백 제거 후 2자 이상 권장

### 연락처

- 빈값 불가
- 숫자만 남긴 후 10자리 또는 11자리 확인
- 형식 오류 시 사용자 친화적 문구 사용

예시

- `연락처를 다시 확인해주세요.`

## 11. 앱스크립트 요구사항

Apps Script는 아래 기능을 수행해야 한다.

- POST 요청 수신
- JSON 데이터 파싱
- 필수값 검증
- Google Sheets에 한 줄 추가
- 성공/실패 JSON 응답 반환

## 12. Apps Script 시트 저장 매핑

### 최소 저장 매핑

| 요청값 | 시트 컬럼 |
|---|---|
| 현재 시간 | `created_at` |
| `name` | `name` |
| `phone` | `phone` |
| `developer` | `developer` |

### 권장 확장 매핑

| 요청값 | 시트 컬럼 |
|---|---|
| 현재 시간 | `created_at` |
| `name` | `name` |
| `phone` | `phone` |
| `developer` | `developer` |
| `pageName` | `page_name` |
| `source` | `source` |
| `campaign` | `campaign` |
| `device` | `device` |

## 13. Apps Script 응답 형식

### 성공 응답 예시

```json
{
  "ok": true,
  "message": "saved"
}
```

### 실패 응답 예시

```json
{
  "ok": false,
  "message": "invalid_phone"
}
```

## 14. 실제 구현용 프론트엔드 예시

아래 예시는 랜딩페이지에서 사용할 수 있는 기본 전송 구조다.

```html
<form id="leadForm">
  <input type="text" id="name" name="name" placeholder="성함" required />
  <input type="tel" id="phone" name="phone" placeholder="연락처" required />
  <button type="submit">상담 연결받기</button>
</form>
```

```js
const GAS_WEBAPP_URL = "https://script.google.com/macros/s/YOUR_WEBAPP_ID/exec";

document.getElementById("leadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.replace(/[^0-9]/g, "");

  if (!name) {
    alert("성함을 입력해주세요.");
    return;
  }

  if (!(phone.length === 10 || phone.length === 11)) {
    alert("연락처를 다시 확인해주세요.");
    return;
  }

  const payload = {
    name,
    phone,
    developer: "서정민",
    pageName: "메디스파크 랜딩페이지",
    source: "direct"
  };

  try {
    const res = await fetch(GAS_WEBAPP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (result.ok) {
      alert("접수가 완료되었습니다. 빠르게 안내드리겠습니다.");
      document.getElementById("leadForm").reset();
    } else {
      alert("접수 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  } catch (error) {
    alert("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
  }
});
```

## 15. Apps Script 예시 코드

```js
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("leads");
    var data = JSON.parse(e.postData.contents);

    var name = (data.name || "").trim();
    var phone = String(data.phone || "").replace(/[^0-9]/g, "");
    var developer = (data.developer || "서정민").trim();
    var pageName = (data.pageName || "메디스파크 랜딩페이지").trim();
    var source = (data.source || "").trim();
    var campaign = (data.campaign || "").trim();
    var device = (data.device || "").trim();

    if (!name) {
      return jsonOutput({ ok: false, message: "invalid_name" });
    }

    if (!(phone.length === 10 || phone.length === 11)) {
      return jsonOutput({ ok: false, message: "invalid_phone" });
    }

    sheet.appendRow([
      new Date(),
      name,
      phone,
      developer,
      pageName,
      source,
      campaign,
      device
    ]);

    return jsonOutput({ ok: true, message: "saved" });
  } catch (error) {
    return jsonOutput({ ok: false, message: "server_error" });
  }
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 16. Apps Script 배포 설정

### 배포 순서

1. 구글시트 생성
2. 시트명 `leads` 생성
3. 첫 행에 컬럼명 입력
4. Apps Script 열기
5. 스크립트 붙여넣기
6. `웹 앱으로 배포`
7. 접근 권한 설정

### 권장 배포 설정

- 실행 사용자: `본인`
- 액세스 권한: `익명 사용자 포함 전체`

랜딩페이지 공개 폼에서 접수받으려면 일반적으로 웹앱 공개 접근이 필요하다.

## 17. 시트 첫 행 추천값

```text
created_at | name | phone | developer | page_name | source | campaign | device
```

## 18. 실무 체크리스트

- 시트 컬럼 순서와 appendRow 순서 일치 확인
- 웹앱 URL 최신 배포본 사용 확인
- 연락처 하이픈 제거 확인
- 성공/실패 안내 문구 점검
- 모바일 접수 테스트
- 실제 시트 저장 테스트
- developer 값이 `서정민`으로 저장되는지 확인

## 19. 최종 명세 한 줄 요약

`사용자는 이름과 연락처만 입력하고, 시스템은 developer=서정민을 함께 전송해 Google Apps Script를 통해 Google Sheets에 저장한다.`
