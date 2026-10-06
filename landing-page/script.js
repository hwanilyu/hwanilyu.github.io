/* =========================================================
   좁은 주방 롤매트 안내 - script.js
   동작 기준: 01-landing-page-plan.md 5-5 UI 동작 표
   - 스크롤 반응은 IntersectionObserver만 사용 (scroll 이벤트 없음)
   - prefers-reduced-motion이면 애니메이션 없이 바로 이동
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HIGHLIGHT_MS = 1500;
  var TOAST_MS = 2500;
  var HEADER_HEIGHT = 64; // styles.css의 --header-h와 같은 값 (offsetHeight로 읽으면 강제 리플로우가 생김)
  var CTA_PENDING_MESSAGE = '아직 준비 중입니다.';

  /* ---------- 토스트 ---------- */
  var toast = document.getElementById('toast');
  var toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = window.setTimeout(function () {
      toast.classList.remove('is-visible');
    }, TOAST_MS);
  }

  /* ---------- CTA (#cta-hero-button, #cta-final-button) ----------
     두 CTA는 HTML의 <a href>(쿠팡 파트너스 링크, 새 탭, rel="sponsored noopener")로 이동한다.
     스크립트는 이동에 관여하지 않고, href가 비어 있을 때만 준비 중 안내를 보여 준다. */
  document.querySelectorAll('.js-coupang-cta').forEach(function (cta) {
    cta.addEventListener('click', function (event) {
      if ((cta.getAttribute('href') || '').trim()) return; // 링크가 있으면 브라우저 기본 동작 그대로
      event.preventDefault();
      showToast(CTA_PENDING_MESSAGE);
    });
  });

  /* ---------- 강조 효과 ---------- */
  function flash(el) {
    if (!el) return;
    el.classList.remove('is-highlight');
    // 레이아웃을 강제로 다시 계산하지 않고, 다음 프레임에 클래스를 붙여 애니메이션을 다시 시작한다.
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        el.classList.add('is-highlight');
        window.setTimeout(function () { el.classList.remove('is-highlight'); }, HIGHLIGHT_MS);
      });
    });
  }

  /* ---------- FAQ 아코디언 ---------- */
  var faqButtons = document.querySelectorAll('.faq-q');

  function setExpanded(button, expanded) {
    var panel = document.getElementById(button.getAttribute('aria-controls'));
    button.setAttribute('aria-expanded', String(expanded));
    if (panel) panel.hidden = !expanded;
  }

  // HTML은 JS가 없어도 모든 답이 보이게 열어 두고, 여기서 Q1만 열린 상태로 맞춘다.
  faqButtons.forEach(function (button) {
    setExpanded(button, button.id === 'faq-q1');
    button.addEventListener('click', function () {
      setExpanded(button, button.getAttribute('aria-expanded') !== 'true');
    });
  });

  /* ---------- #size-check 이동: Q1 열기 + 스크롤 + 강조 ---------- */
  var sizeCheck = document.getElementById('size-check');
  var sizeQuestion = document.getElementById('faq-q1');

  function openSizeCheck() {
    if (!sizeCheck || !sizeQuestion) return;
    setExpanded(sizeQuestion, true);
    sizeCheck.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    flash(sizeQuestion);
  }

  document.querySelectorAll('.js-size-link').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      if (window.location.hash !== '#size-check') {
        history.pushState(null, '', '#size-check');
      }
      openSizeCheck();
    });
  });

  function handleHash() {
    if (window.location.hash === '#size-check') openSizeCheck();
  }
  window.addEventListener('hashchange', handleHash);
  if (window.location.hash === '#size-check') {
    // 이미지 비율이 잡힌 뒤 위치를 맞추도록 한 박자 늦춘다.
    window.requestAnimationFrame(handleHash);
  }

  /* ---------- 히어로 인셋 카드 → #roll-storage 강조 ---------- */
  document.querySelectorAll('[data-highlight]').forEach(function (link) {
    link.addEventListener('click', function () {
      var target = document.getElementById(link.getAttribute('data-highlight'));
      window.setTimeout(function () { flash(target); }, reduceMotion ? 0 : 450);
    });
  });

  /* ---------- 제품 정보 펼치기/접기 ---------- */
  var specToggle = document.getElementById('spec-toggle');
  var specTable = document.getElementById('spec-table');

  function setSpecOpen(open) {
    if (!specToggle || !specTable) return;
    specToggle.setAttribute('aria-expanded', String(open));
    specToggle.textContent = open
      ? specToggle.getAttribute('data-open-label')
      : specToggle.getAttribute('data-closed-label');
    specTable.hidden = !open;
  }

  if (specToggle) {
    setSpecOpen(false); // 접힌 상태로 시작
    specToggle.addEventListener('click', function () {
      setSpecOpen(specToggle.getAttribute('aria-expanded') !== 'true');
    });
  }

  /* ---------- 관찰자: 헤더 구분선, 스크롤 유도 숨김, 등장 효과 ---------- */
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  // 히어로를 지나면 헤더 아래 구분선
  var header = document.getElementById('site-header');
  var hero = document.getElementById('hero');
  if (header && hero) {
    new IntersectionObserver(function (entries) {
      header.classList.toggle('is-scrolled', !entries[0].isIntersecting);
    }, { rootMargin: '-' + HEADER_HEIGHT + 'px 0px 0px 0px' }).observe(hero);
  }

  // 200px 이상 내려가면 스크롤 유도 문구를 숨김
  var cue = document.querySelector('.scroll-cue');
  var sentinel = document.querySelector('.hero-sentinel');
  if (cue && sentinel) {
    new IntersectionObserver(function (entries) {
      var entry = entries[0];
      cue.classList.toggle('is-hidden', !entry.isIntersecting && entry.boundingClientRect.top < 0);
    }).observe(sentinel);
  }

  // 섹션 등장 효과 (한 번만)
  var revealObserver = new IntersectionObserver(function (entries, observer) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

  document.querySelectorAll('[data-reveal]').forEach(function (el) {
    if (reduceMotion) {
      el.classList.add('is-visible');
    } else {
      revealObserver.observe(el);
    }
  });
})();

/* =========================================================
   GA4 측정: section_view(구간 도달) · cta_click(CTA 클릭)
   - Google 태그는 index.html <head>의 기본 태그를 재사용 (중복 설치 없음)
   - page_view 수동 전송, purchase, debug_mode, 개인정보 수집 없음
   - GA가 차단되거나 로드되지 않아도 링크 이동에는 영향 없음
   ========================================================= */
(function () {
  'use strict';

  // 같은 코드가 다시 실행돼도 관찰자·리스너를 다시 등록하지 않는다.
  if (window.__landingAnalytics) return;
  var state = window.__landingAnalytics = {
    sentSections: {},          // section_name → true (페이지 로드당 1회)
    boundCtas: new WeakSet()   // 리스너를 붙인 CTA 요소
  };

  var HEADER_HEIGHT = 64; // styles.css --header-h. 고정 헤더가 가리는 높이는 관찰 영역에서 제외

  function sendEvent(name, params) {
    // index.html의 기본 태그가 gtag를 정의한다. gtag.js가 차단돼도 dataLayer에만 쌓이고 오류는 나지 않는다.
    if (typeof window.gtag !== 'function') return;
    try { window.gtag('event', name, params); } catch (e) { /* 측정 실패가 페이지 동작을 막지 않도록 */ }
  }

  /* ---------- 1. section_view ---------- */
  // 각 구간을 대표하는 제목 하나씩만 관찰한다 (긴 section 전체나 사진은 관찰하지 않음).
  var SECTION_TARGETS = [
    { id: 'hero-title', name: 'hero' },        // 히어로 h1
    { id: 'change-title', name: 'detail' },    // 해결책과 변화(#space-change) h2
    { id: 'cta-final-title', name: 'cta' }     // 최하단 구매 유도(#cta-final) h2
  ];

  var latestRatio = {}; // section_name → 마지막으로 관찰된 보이는 비율

  function trySendSection(name) {
    if (state.sentSections[name]) return;
    if (document.visibilityState !== 'visible') return; // 문서가 실제로 보일 때만 기록
    if (!(latestRatio[name] >= 0.5)) return;            // 제목 면적의 50% 이상
    state.sentSections[name] = true;
    sendEvent('section_view', { section_name: name });
    if (sectionObserver && targetsByName[name]) sectionObserver.unobserve(targetsByName[name]);
  }

  var sectionObserver = null;
  var targetsByName = {};
  var nameByElement = new Map(); // 관찰 요소 → section_name (DOM 속성은 건드리지 않음)

  if ('IntersectionObserver' in window) {
    sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var name = nameByElement.get(entry.target);
        latestRatio[name] = entry.isIntersecting ? entry.intersectionRatio : 0;
        trySendSection(name);
      });
    }, {
      rootMargin: '-' + HEADER_HEIGHT + 'px 0px 0px 0px',
      threshold: [0, 0.5, 1]
    });

    SECTION_TARGETS.forEach(function (t) {
      var el = document.getElementById(t.id);
      if (!el) return;
      targetsByName[t.name] = el;
      nameByElement.set(el, t.name);
      sectionObserver.observe(el);
    });

    // 다른 탭에 있다가 돌아왔을 때, 그 사이 화면에 들어와 있던 제목을 빠뜨리지 않는다.
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState !== 'visible') return;
      SECTION_TARGETS.forEach(function (t) { trySendSection(t.name); });
    });
  }

  /* ---------- 2. cta_click ---------- */
  // #cta-hero·#cta-final은 버튼을 감싼 영역이므로, 그 안의 쿠팡 링크에만 리스너를 붙인다
  // (같은 영역의 「사이즈 확인하기」 등 다른 링크는 CTA 클릭으로 세지 않음).
  var CTA_SELECTORS = [
    { selector: '#cta-hero .js-coupang-cta, [data-cta-location="hero"]', location: 'hero' },
    { selector: '#cta-final .js-coupang-cta, [data-cta-location="final"]', location: 'final' }
  ];

  CTA_SELECTORS.forEach(function (group) {
    document.querySelectorAll(group.selector).forEach(function (el) {
      if (state.boundCtas.has(el)) return; // 두 선택자가 같은 요소를 가리켜도 한 번만 등록
      state.boundCtas.add(el);
      // 'click'은 마우스 클릭과 키보드 Enter 활성화 모두에서 한 번씩 발생한다.
      // preventDefault를 하지 않으므로 링크 이동(새 탭)은 지연·차단되지 않는다.
      el.addEventListener('click', function () {
        sendEvent('cta_click', { button_location: group.location });
      });
    });
  });
})();
