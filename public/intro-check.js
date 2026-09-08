(function () {
  var seen = sessionStorage.getItem('mdt-intro-seen') === '1';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (seen || reduced) {
    document.getElementById('introOverlay').style.display = 'none';
    sessionStorage.setItem('mdt-intro-seen', '1');
  }
})();
