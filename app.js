/* Model Finder launch site. No dependencies, no network calls, no storage.
   Loaded synchronously in <head> (it is tiny) so the "js" class is set before
   first paint and reveal animations never flash. Everything else waits for DOM. */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    // Sticky nav hairline once the page scrolls.
    var nav = document.querySelector(".site-nav");
    if (nav) {
      var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 8); };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    // Mobile nav.
    var toggle = document.querySelector(".nav-toggle");
    var links = document.getElementById("nav-links");
    if (toggle && links) {
      var setOpen = function (open) {
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        links.classList.toggle("open", open);
      };
      toggle.addEventListener("click", function () { setOpen(toggle.getAttribute("aria-expanded") !== "true"); });
      links.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { setOpen(false); toggle.focus(); }
      });
      window.matchMedia("(min-width: 861px)").addEventListener("change", function (m) { if (m.matches) setOpen(false); });
    }

    // Scroll reveal.
    var targets = document.querySelectorAll(".reveal, .steps, .toolboard, .hero");
    if (reduce || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
      targets.forEach(function (el) { io.observe(el); });
    }

    // Film: poster + explicit play button. Never autoplays.
    document.querySelectorAll("[data-film]").forEach(function (plate) {
      var video = plate.querySelector("video");
      var btn = plate.querySelector(".play");
      if (!video || !btn) return;
      video.removeAttribute("controls");
      plate.classList.add("is-poster");
      var start = function () {
        plate.classList.remove("is-poster");
        video.setAttribute("controls", "");
        var p = video.play();
        if (p && p.catch) p.catch(function () { /* user can press play in controls */ });
        video.focus({ preventScroll: true });
      };
      btn.addEventListener("click", function (e) { e.stopPropagation(); start(); });
      plate.addEventListener("click", function (e) { if (plate.classList.contains("is-poster") && e.target === video) start(); });
    });

    // Tabs (install).
    document.querySelectorAll("[role=tablist]").forEach(function (list) {
      var tabs = Array.prototype.slice.call(list.querySelectorAll("[role=tab]"));
      var select = function (tab, focus) {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute("aria-selected", String(on));
          t.tabIndex = on ? 0 : -1;
          var panel = document.getElementById(t.getAttribute("aria-controls"));
          if (panel) panel.hidden = !on;
        });
        if (focus) tab.focus();
      };
      tabs.forEach(function (t, i) {
        t.addEventListener("click", function () { select(t, false); });
        t.addEventListener("keydown", function (e) {
          var n = null;
          if (e.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
          else if (e.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
          else if (e.key === "Home") n = tabs[0];
          else if (e.key === "End") n = tabs[tabs.length - 1];
          if (n) { e.preventDefault(); select(n, true); }
        });
      });
      select(tabs[0], false);
    });

    // Copy to clipboard. Copies the data-copy text, or the text of the target <pre>/<code>
    // minus prompt glyphs (.p) so "$ " never lands in the user's shell.
    var live = document.getElementById("copy-status");
    function textOf(el) {
      var clone = el.cloneNode(true);
      clone.querySelectorAll(".p").forEach(function (n) { n.remove(); });
      return clone.textContent.replace(/^\s+|\s+$/g, "");
    }
    function fallbackCopy(text) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.className = "sr-only";
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta); return ok;
    }
    document.querySelectorAll(".copy").forEach(function (btn) {
      var label = btn.querySelector("span");
      var original = label ? label.textContent : btn.textContent;
      btn.addEventListener("click", function () {
        var text = btn.getAttribute("data-copy");
        if (!text) { var t = document.getElementById(btn.getAttribute("data-target")); text = t ? textOf(t) : ""; }
        if (!text) return;
        var done = function (ok) {
          btn.classList.toggle("done", ok);
          if (label) label.textContent = ok ? "Copied" : "Press ⌘/Ctrl+C";
          if (live) live.textContent = ok ? "Copied to clipboard." : "Copy failed. Select the text and copy it manually.";
          clearTimeout(btn._t);
          btn._t = setTimeout(function () { btn.classList.remove("done"); if (label) label.textContent = original; }, 1800);
        };
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
        } else { done(fallbackCopy(text)); }
      });
    });

    // Footer year.
    var y = document.getElementById("year");
    if (y) y.textContent = String(new Date().getFullYear());
  });
})();
