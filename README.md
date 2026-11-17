# 다연 × 솔숲 직장갑질센터

다연노동법률컨설팅 × 솔숲노동법률사무소가 공동 운영하는 외부 고충상담·신고 채널 홈페이지입니다. GitHub Pages로 배포합니다.

## 페이지
- `index.html` — 첫 화면 (센터 소개, 상담 범위, 비밀보장, 상담 창구)
- `employee.html` — 임직원 상담 안내 (상담 방식, 상담 후 선택지, 자주 묻는 질문)
- `company.html` — 기업 도입 안내 (필요성, 센터 역할, 보고서, 도입 절차, 도입 문의 양식)

공통: `style.css`(디자인), `main.js`(동작), `icons.svg`(아이콘)

## 자주 고치는 곳
- **연락처**: `main.js` 맨 위 `CONTACT`의 phone·email·address만 채우면 모든 페이지에 반영됩니다.
- **도입 문의 → Gmail**: `apps-script/README.md` 순서대로 배포한 뒤, 나온 주소를 `main.js`의 `FORM_ENDPOINT`에 넣습니다.
