# Google Apps Script 연동 가이드

## 1. 구글 시트 준비
- 새 구글 스프레드시트를 생성합니다.
- Apps Script를 열고 `Code.gs`, `appsscript.json` 내용을 그대로 붙여넣습니다.

## 2. 웹앱 배포
1. Apps Script 상단 `배포` → `새 배포`
2. 유형 `웹 앱`
3. 실행 사용자 `나`
4. 액세스 권한 `모든 사용자`
5. 배포 후 발급된 웹앱 URL을 복사합니다.

## 3. 랜딩페이지 설정
- `/Users/jeongmin/Desktop/Website/apt_p/lead-config.js` 파일의 `appsScriptUrl`에 웹앱 URL을 넣습니다.

```js
window.BraincityLeadConfig = {
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxx/exec"
};
```

## 4. 저장 구조
- `leads` 시트: 실제 문의 데이터
- `lead_tracking` 시트: 유입/CTA/세션 추적 데이터

## 5. 현재 같이 전송되는 추적 항목
- 세션 ID
- 진입 URL
- 현재 페이지 URL
- referrer / referrer host
- utm_source / utm_medium / utm_campaign / utm_term / utm_content
- 마지막 클릭 CTA
- CTA 이력
- user agent
- screen / viewport 크기
- 언어 / timezone

## 6. 주의
- 현재 페이지가 `file://` 로 열려 있어도 브라우저 로컬 백업은 남습니다.
- `appsScriptUrl`을 넣지 않으면 시트 전송은 건너뛰고 브라우저 `localStorage`에만 백업됩니다.
