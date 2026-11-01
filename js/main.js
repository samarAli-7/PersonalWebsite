/* =========================================================
   SAMAR ALI — PORTFOLIO 2026
   Nav state, scroll reveals, copy email
   ========================================================= */

(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- active nav ---------------- */

  const navLinks = $$(".mainnav .navpill");
  const sectionIds = ["home", "about", "work", "contact"];
  let ticking = false;

  function updateScrollState() {
    let activeId = "home";
    const marker = window.innerHeight * 0.35;

    sectionIds.forEach((id) => {
      const section = document.getElementById(id);
      if (section && section.getBoundingClientRect().top <= marker) activeId = id;
    });

    navLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${activeId}`;
      link.classList.toggle("is-active", isActive);
      if (isActive) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });

    ticking = false;
  }

  function requestScrollUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateScrollState);
  }

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate);
  updateScrollState();

  /* ---------------- reveal on scroll ---------------- */

  const revealElements = $$(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-in"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -5% 0px" }
    );

    revealElements.forEach((element) => observer.observe(element));
  }

  /* ---------------- copy email ---------------- */

  async function writeToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (error) {
      /* Fall through to the legacy path. */
    }

    try {
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      field.style.pointerEvents = "none";
      document.body.appendChild(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();
      return copied;
    } catch (error) {
      return false;
    }
  }

  $$("[data-copy-email]").forEach((button) => {
    const label = $(".copybtn__label", button);

    button.addEventListener("click", async () => {
      const email = button.dataset.email || "samarali.01491625@gmail.com";
      const copied = await writeToClipboard(email);

      if (!copied) {
        if (label) label.textContent = "Press ⌘C";
        return;
      }

      button.classList.add("is-copied");
      button.setAttribute("aria-label", "Email address copied");
      if (label) label.textContent = "Copied";

      window.setTimeout(() => {
        button.classList.remove("is-copied");
        button.setAttribute("aria-label", "Copy email address");
        if (label) label.textContent = "Copy";
      }, 2000);
    });
  });

  /* ---------------- 3D scroll lift ----------------
     The paper and the checkerboard are pinned with background-attachment,
     so only these blocks travel: each one rides slightly ahead of the scroll,
     tips back as it leaves centre and sits further away when it is off-screen.
     Depth comes from data-float (1 = the base amount).
  ------------------------------------------------- */

  const floatItems = $$("[data-float]");
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  let floatTicking = false;

  function paintFloats() {
    floatTicking = false;
    const viewportHeight = window.innerHeight || 1;

    floatItems.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.bottom < -240 || rect.top > viewportHeight + 240) return;

      const depth = Number.parseFloat(element.dataset.float) || 1;
      const centre = rect.top + rect.height / 2;
      const progress = clamp((centre - viewportHeight / 2) / viewportHeight, -1.15, 1.15);

      const lift = -progress * 30 * depth;
      const tilt = progress * 6 * depth;
      const push = -Math.abs(progress) * 110 * depth;
      const scale = 1 - Math.abs(progress) * 0.02 * depth;

      element.style.transform =
        "perspective(1400px) " +
        "translate3d(0, " + lift.toFixed(2) + "px, " + push.toFixed(1) + "px) " +
        "rotateX(" + tilt.toFixed(2) + "deg) scale(" + scale.toFixed(3) + ")";
    });
  }

  function requestFloatUpdate() {
    if (floatTicking) return;
    floatTicking = true;
    window.requestAnimationFrame(paintFloats);
  }

  if (!reduceMotion && floatItems.length) {
    window.addEventListener("scroll", requestFloatUpdate, { passive: true });
    window.addEventListener("resize", requestFloatUpdate);
    window.addEventListener("load", requestFloatUpdate);
    requestFloatUpdate();
  }

  /* ---------------- misc ---------------- */

  $$("[data-top]").forEach((button) => {
    button.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------------- contact form ---------------- */

  const contactForm = $("[data-contact-form]");
  const contactStatus = $("[data-contact-status]");

  if (contactForm && contactStatus) {
    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submit = $("button[type='submit']", contactForm);
      submit.disabled = true;
      submit.textContent = "SENDING...";
      contactStatus.textContent = "";
      contactStatus.className = "contact__status";

      try {
        const response = await fetch(contactForm.action, {
          method: "POST",
          body: new FormData(contactForm),
          headers: { Accept: "application/json" }
        });

        if (!response.ok) throw new Error("Form submission failed");
        contactForm.reset();
        contactStatus.textContent = "Message sent. Thanks for reaching out!";
        contactStatus.classList.add("is-success");
      } catch (error) {
        contactStatus.textContent = "Could not send right now. Please email me directly.";
        contactStatus.classList.add("is-error");
      } finally {
        submit.disabled = false;
        submit.textContent = "SEND MESSAGE";
      }
    });
  }

})();
