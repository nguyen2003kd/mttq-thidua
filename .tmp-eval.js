(() => {
  const header = document.querySelector('.grid.sticky.top-0');
  const listContainer = header ? header.parentElement : null;
  const unified = listContainer ? listContainer.parentElement : null;
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, h: b.height }; };
  return JSON.stringify({
    dpr: window.devicePixelRatio,
    scrollY: window.scrollY,
    header: r(header),
    listContainer: r(listContainer),
    unified: r(unified),
    headerPos: header ? getComputedStyle(header).position + ' top=' + getComputedStyle(header).top : null,
    listBorderTop: listContainer ? getComputedStyle(listContainer).borderTopWidth + ' ' + getComputedStyle(listContainer).borderTopColor : null
  });
})()
