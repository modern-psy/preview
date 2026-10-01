(function () {
  "use strict";

  var root = document.querySelector(".rpp-training-page");
  if (!root || root.dataset.rppReady === "true") return;
  root.dataset.rppReady = "true";

  /* Отступ якорей под фактическую высоту хедера Tilda. Хедер принадлежит
     Tilda, поэтому измеряем его, а не задаём константой. */
  var observedHeader = null;
  var observer = "ResizeObserver" in window ? new ResizeObserver(syncHeaderOffset) : null;

  function syncHeaderOffset() {
    var header = document.querySelector("#t-header");

    if (observer && header !== observedHeader) {
      observer.disconnect();
      if (header) observer.observe(header);
      observedHeader = header;
    }

    var height = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    root.style.setProperty("--anchor-header-offset", height + "px");
  }

  syncHeaderOffset();
  window.addEventListener("load", syncHeaderOffset);
  window.addEventListener("resize", syncHeaderOffset, { passive: true });
})();
