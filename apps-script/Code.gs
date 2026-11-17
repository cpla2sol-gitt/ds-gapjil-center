/**
 * 다연 × 솔숲 직장갑질센터 — 도입 문의 양식 → Gmail 전달
 * 센터용 구글 계정의 Apps Script에 붙여넣고 웹앱으로 배포합니다. (apps-script/README.md 참고)
 */

// 문의를 받을 메일 주소 (여러 개면 쉼표로 구분, Outlook 주소도 가능)
const TO = "cpla.2sol@gmail.com";

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.website) return ok_(); // 스팸 방지용 숨김 칸이 채워지면 무시

  const field = (k, max) => String(p[k] || "").slice(0, max || 200).trim();
  const d = {
    name: field("name", 50), tel: field("tel", 30), company: field("company", 100),
    size: field("size", 30), email: field("email", 100), industry: field("industry", 100),
    message: field("message", 3000)
  };
  if (!d.name || !d.tel || !d.company) return ok_();

  const body = [
    "직장갑질센터 홈페이지에서 도입 문의가 접수되었습니다.", "",
    "담당자: " + d.name,
    "연락처: " + d.tel,
    "회사명: " + d.company,
    "회사 규모: " + (d.size || "-"),
    "이메일: " + (d.email || "-"),
    "업종: " + (d.industry || "-"), "",
    "[문의 내용]", d.message || "-", "",
    "접수 시각: " + Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm")
  ].join("\n");

  const opt = { name: "직장갑질센터 홈페이지" };
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) opt.replyTo = d.email;

  MailApp.sendEmail(TO, "[도입 문의] " + d.company + " / " + d.name, body, opt);
  return ok_();
}

function ok_() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// 처음 한 번 실행해서 메일 보내기 권한을 승인하고, 테스트 메일이 오는지 확인합니다.
function testSend() {
  MailApp.sendEmail(TO, "[테스트] 직장갑질센터 홈페이지 문의 연결", "이 메일이 보이면 홈페이지 도입 문의가 이 메일함으로 정상적으로 들어옵니다.");
}
