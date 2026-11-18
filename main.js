/* ─────────────────────────────────────────────
   설정: 여기 값만 채우면 사이트 전체에 반영됩니다
   ───────────────────────────────────────────── */
const CONTACT = {
  phone: "",    // 예: "031-000-0000"
  email: "",    // 예: "help@example.co.kr"
  address: ""   // 예: "경기도 수원시 ..."
};

/* 도입 문의 양식을 받을 Google Apps Script 웹앱 주소
   (apps-script/README.md 순서대로 배포한 뒤 나오는 https://script.google.com/macros/s/.../exec 주소) */
const FORM_ENDPOINT = "https://script.google.com/macros/s/AKfycby3lYWg8yflns_Eh5m3sNg3CnpMlhK_BI4NYDfgAJc0iKmOvm6sBGf_WV-jgJJlqmBJpg/exec";

/* ── 연락처 채우기 ── */
document.querySelectorAll("[data-contact]").forEach(el => {
  const v = CONTACT[el.dataset.contact];
  if (!v) return;
  el.classList.remove("tbd");
  if (el.dataset.contact === "phone") el.innerHTML = `<a href="tel:${v.replace(/[^0-9+]/g, "")}">${v}</a>`;
  else if (el.dataset.contact === "email") el.innerHTML = `<a href="mailto:${v}">${v}</a>`;
  else el.textContent = v;
});

/* ── 휴대폰 하단 빠른 연락: 번호·메일이 있으면 바로 걸기/쓰기, 없으면 상담 창구로 ── */
document.querySelectorAll("[data-quick]").forEach(a => {
  const k = a.dataset.quick, v = CONTACT[k];
  if (v) a.href = k === "phone" ? `tel:${v.replace(/[^0-9+]/g, "")}` : `mailto:${v}`;
});

/* ── 페이지 목차: 지금 보고 있는 부분 표시 ── */
const subLinks = [...document.querySelectorAll(".subnav a")];
if (subLinks.length && "IntersectionObserver" in window) {
  const map = new Map(subLinks.map(a => [a.getAttribute("href").slice(1), a]));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { subLinks.forEach(a => a.classList.remove("on")); map.get(e.target.id)?.classList.add("on"); }
  }), { rootMargin: "-45% 0px -50% 0px" });
  map.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
}

/* ── 모바일 메뉴 ── */
const menuBtn = document.querySelector(".menu-btn"), nav = document.getElementById("nav");
if (menuBtn && nav) {
  menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });
  nav.addEventListener("click", e => {
    if (e.target.tagName === "A") { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", false); }
  });
}

/* ── 도입 문의 양식 ── */
const form = document.getElementById("inquiry");
if (form) {
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const f = form, msg = f.querySelector(".form-msg"), btn = f.querySelector("button[type=submit]");
    msg.classList.remove("form-ok"); msg.textContent = "";
    const errs = {};
    if (!f.name.value.trim()) errs.name = "담당자 성함을 입력해 주세요.";
    const telDigits = f.tel.value.replace(/\D/g, "");
    if (!telDigits) errs.tel = "연락받으실 번호를 입력해 주세요.";
    else if (telDigits.length < 9 || telDigits.length > 12) errs.tel = "번호를 다시 확인해 주세요. 예: 010-1234-5678";
    if (!f.company.value.trim()) errs.company = "회사명을 입력해 주세요.";
    if (f.email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim())) errs.email = "이메일 형식을 확인해 주세요. 예: name@company.com";
    if (!f.querySelector("#f-agree").checked) errs.agree = "답변을 드리려면 개인정보 수집·이용 동의가 필요합니다.";
    ["name", "tel", "company", "email", "agree"].forEach(k => {
      const box = document.getElementById("e-" + k), input = k === "agree" ? f.querySelector("#f-agree") : f[k];
      box.textContent = errs[k] || "";
      input.setAttribute("aria-invalid", errs[k] ? "true" : "false");
      (k === "agree" ? document.getElementById("agree-box") : input.closest(".fg")).classList.toggle("invalid", !!errs[k]);
    });
    const first = Object.keys(errs)[0];
    if (first) { (first === "agree" ? f.querySelector("#f-agree") : f[first]).focus(); return; }
    if (f.website.value) return; // 스팸 방지용 숨김 칸

    const data = {
      name: f.name.value.trim(), tel: f.tel.value.trim(), company: f.company.value.trim(),
      size: f.size.value, email: f.email.value.trim(), industry: f.industry.value.trim(),
      message: f.message.value.trim()
    };

    if (!FORM_ENDPOINT) {
      if (!CONTACT.email) { msg.textContent = "접수 창구를 준비 중입니다. 잠시 후 다시 이용해 주세요."; return; }
      const body = [`담당자: ${data.name}`, `연락처: ${data.tel}`, `회사명: ${data.company}`,
        `회사 규모: ${data.size || "-"}`, `이메일: ${data.email || "-"}`, `업종: ${data.industry || "-"}`,
        "", "문의 내용:", data.message || "-"].join("\n");
      location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(`[도입 문의] ${data.company}`)}&body=${encodeURIComponent(body)}`;
      return;
    }

    const no = receiptNo(); data.receipt = no;
    btn.disabled = true; msg.textContent = "보내는 중입니다…";
    try {
      // Apps Script 웹앱은 다른 도메인이라 응답을 읽지 않는 방식(no-cors)으로 보냅니다.
      await fetch(FORM_ENDPOINT, { method: "POST", mode: "no-cors", body: new URLSearchParams(data) });
      f.reset();
      msg.classList.add("form-ok");
      msg.textContent = `문의가 접수되었습니다(접수번호 ${no}). 담당 노무사가 확인 후 연락드리겠습니다.`;
    } catch (err) {
      msg.textContent = "전송하지 못했습니다. 작성하신 내용은 그대로 있으니 잠시 후 다시 보내 주세요. 계속 안 되면 상담 창구의 전화·이메일로 연락해 주세요.";
    } finally {
      btn.disabled = false;
    }
  });
}

/* ── 접수번호: 한국 시각 기준 YYMMDD-HHMM (예: 261118-0901) ── */
function receiptNo(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul", year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false
  }).formatToParts(d).map(x => [x.type, x.value]));
  return `${p.year}${p.month}${p.day}-${p.hour === "24" ? "00" : p.hour}${p.minute}`;
}

/* ── 임직원 온라인 상담 신청 ── */
const counsel = document.getElementById("counsel");
if (counsel) {
  const f = counsel;
  const $ = sel => f.querySelector(sel);
  const nameLabel = $("[data-name-label]"), nameReq = $("[data-name-req]"), nameOpt = $("[data-name-opt]");
  const contactLabel = $("[data-contact-label]"), contactWrap = $("[data-contact-wrap]");
  const anonOnly = $("[data-anon-only]"), noContactTip = $("[data-nocontact]");
  const receiptBox = $(".receipt"), receiptNum = $("[data-receipt]");

  const sync = () => {
    const named = f.mode.value === "실명";
    nameLabel.textContent = named ? "이름" : "불러 드릴 별칭";
    nameReq.hidden = !named; nameOpt.hidden = named;
    f.name.placeholder = named ? "홍길동" : "예: 김OO, 하늘 (비워도 됩니다)";
    f.name.autocomplete = named ? "name" : "off";
    anonOnly.hidden = named;
    if (named && f.via.value === "연락 안 받음") f.querySelector("input[name=via][value=전화]").checked = true;
    const via = f.via.value, none = via === "연락 안 받음", mail = via === "이메일";
    contactWrap.hidden = none; noContactTip.hidden = !none;
    contactLabel.textContent = mail ? "이메일 주소" : "휴대폰 번호";
    f.contact.type = mail ? "email" : "tel";
    f.contact.inputMode = mail ? "email" : "tel";
    f.contact.placeholder = mail ? "답변 받을 이메일 주소" : "010-0000-0000";
  };
  f.querySelectorAll("input[name=mode],input[name=via]").forEach(r => r.addEventListener("change", sync));
  sync();
  const counter = $("[data-count]");
  f.note.addEventListener("input", () => { counter.textContent = f.note.value.length; });

  const show = (id, box, input, msg) => {
    document.getElementById(id).textContent = msg || "";
    if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
    if (box) box.classList.toggle("invalid", !!msg);
  };

  f.addEventListener("submit", async e => {
    e.preventDefault();
    const out = $(".form-msg"), btn = $("button[type=submit]");
    out.classList.remove("form-ok"); out.textContent = ""; receiptBox.hidden = true;
    if (f.website.value) return;

    const named = f.mode.value === "실명", via = f.via.value, none = via === "연락 안 받음";
    const c = none ? "" : f.contact.value.trim();
    const errs = {};
    if (!f.topic.value) errs.topic = "어떤 일에 가까운지 골라 주세요. 잘 모르겠으면 '잘 모르겠어요'를 고르시면 됩니다.";
    if (named && !f.name.value.trim()) errs.name = "실명 상담은 이름이 필요합니다. 이름 없이 하시려면 '익명 상담'을 골라 주세요.";
    if (!f.company.value.trim()) errs.company = "소속 회사를 입력해 주세요. 센터와 계약된 회사인지 확인하는 데만 씁니다.";
    if (!none) {
      if (via === "이메일") {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) errs.contact = c ? "이메일 형식을 확인해 주세요. 예: name@example.com" : "연락받을 이메일 주소를 입력해 주세요.";
      } else {
        const d = c.replace(/\D/g, "");
        if (!d) errs.contact = named ? "연락받을 휴대폰 번호를 입력해 주세요." : "연락받을 번호를 입력해 주세요. 연락처를 남기기 싫으면 '연락처 없이'를 고르세요.";
        else if (d.length < 10 || d.length > 11) errs.contact = "번호를 다시 확인해 주세요. 예: 010-1234-5678";
      }
    }
    if (!$("#c-agree").checked) errs.agree = "접수하려면 개인정보 수집·이용 동의가 필요합니다.";

    show("e-topic", $(".seg-4"), null, errs.topic);
    show("e-cname", f.name.closest(".fg"), f.name, errs.name);
    show("e-cco", f.company.closest(".fg"), f.company, errs.company);
    show("e-ccontact", contactWrap, f.contact, errs.contact);
    show("e-cagree", document.getElementById("c-agree-box"), $("#c-agree"), errs.agree);
    const first = Object.keys(errs)[0];
    if (first) {
      ({ topic: $("input[name=topic]"), name: f.name, company: f.company, contact: f.contact, agree: $("#c-agree") })[first].focus();
      return;
    }

    if (!FORM_ENDPOINT) { out.textContent = "온라인 접수를 준비 중입니다. 전화나 이메일로 연락해 주세요."; return; }
    const no = receiptNo();
    btn.disabled = true; out.textContent = "보내는 중입니다…";
    try {
      await fetch(FORM_ENDPOINT, { method: "POST", mode: "no-cors", body: new URLSearchParams({
        type: "counsel", receipt: no, mode: f.mode.value, topic: f.topic.value, name: f.name.value.trim(),
        company: f.company.value.trim(), via, contact: c, time: f.time.value, note: f.note.value.trim()
      }) });
      f.reset(); sync(); counter.textContent = "0";
      out.classList.add("form-ok");
      out.textContent = none ? "상담 신청이 접수되었습니다." : "상담 신청이 접수되었습니다. 영업일 기준 3일 이내에 말씀하신 방법으로 연락드리겠습니다.";
      receiptNum.textContent = no; receiptBox.hidden = false;
      receiptBox.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      out.textContent = "전송하지 못했습니다. 작성하신 내용은 그대로 있으니 잠시 후 다시 보내 주세요. 계속 안 되면 전화·이메일로 연락해 주세요.";
    } finally { btn.disabled = false; }
  });
}
