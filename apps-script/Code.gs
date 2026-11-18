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
  if (p.type === "counsel") return counsel_(field);
  const d = {
    name: field("name", 50), tel: field("tel", 30), company: field("company", 100),
    size: field("size", 30), email: field("email", 100), industry: field("industry", 100),
    message: field("message", 3000)
  };
  if (!d.name || !d.tel || !d.company) return ok_();
  const no = receipt_(field("receipt", 20));

  const body = [
    "직장갑질센터 홈페이지에서 도입 문의가 접수되었습니다.", "",
    "접수번호: " + no,
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

  MailApp.sendEmail(TO, "[도입 문의 " + no + "] " + d.company + " / " + d.name, body, opt);
  return ok_();
}

// 임직원 온라인 상담 신청
function counsel_(field) {
  const d = {
    mode: field("mode", 10), topic: field("topic", 30), name: field("name", 50), company: field("company", 100),
    via: field("via", 10), contact: field("contact", 100), time: field("time", 30), note: field("note", 300),
    code: field("code", 5), codeName: field("codeName", 100),
    receipt: receipt_(field("receipt", 20))
  };
  if (!d.company) return ok_();

  const body = [
    "직장갑질센터 홈페이지에서 상담 신청이 접수되었습니다.", "",
    "접수번호: " + d.receipt,
    "상담 방식: " + (d.mode || "-"),
    "상담 분야: " + (d.topic || "-"),
    (d.mode === "실명" ? "이름: " : "별칭: ") + (d.name || "(남기지 않음)"),
    "소속 회사: " + d.company + "  (회사 코드 " + (d.code || "Z00") + (d.codeName ? " = " + d.codeName : " = 목록에 없음, 확인 필요") + ")",
    "연락 방법: " + (d.via === "연락 안 받음" ? "연락처 없이 접수 — 신청인이 접수번호로 직접 연락할 예정" : (d.via || "-") + " / " + d.contact),
    "편한 시간: " + (d.time || "언제든"), "",
    "[미리 남긴 말]", d.note || "-", "",
    "접수 시각: " + Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm"),
    "", "※ 비밀보장: 본인 동의 없이 회사에 전달하지 않습니다."
  ].join("\n");

  // 제목에는 이름을 넣지 않습니다(메일 목록에 신원이 드러나지 않도록).
  MailApp.sendEmail(TO, "[상담 신청 " + d.receipt + "] " + (d.mode || "") + " · " + (d.topic || "분야 미선택"), body, { name: "직장갑질센터 홈페이지" });
  return ok_();
}

// 접수번호: 화면에서 만든 번호(YYMMDD-HHMM 또는 YYMMDD-HHMM-H01)를 쓰고, 형식이 다르면 서버 시각으로 만듭니다.
function receipt_(v) {
  return /^\d{6}-\d{4}(-[A-Z]\d{2})?$/.test(v) ? v : Utilities.formatDate(new Date(), "Asia/Seoul", "yyMMdd-HHmm");
}

function ok_() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// 처음 한 번 실행해서 메일 보내기 권한을 승인하고, 테스트 메일이 오는지 확인합니다.
function testSend() {
  MailApp.sendEmail(TO, "[테스트] 직장갑질센터 홈페이지 문의 연결", "이 메일이 보이면 홈페이지 도입 문의가 이 메일함으로 정상적으로 들어옵니다.");
}
