(function () {
  'use strict';
  const schools = window.SCHOOL_DATA;
  const elements = Object.fromEntries(['query', 'reset', 'school-list', 'result-count'].map(id => [id, document.getElementById(id)]));
  const number = new Intl.NumberFormat('bg-BG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const normalize = value => value.toLocaleLowerCase('bg').replace(/[^\p{L}\p{N}]/gu, '');
  const place = value => value.replace(/^ГР\./, 'гр. ').replace(/^С\./, 'с. ');
  const markers = new Map();
  let selectedCode = null;
  let map = null;
  let cluster = null;

  function schoolIcon(school) {
    return L.divIcon({ className: 'pin-marker' + (selectedCode === school.code ? ' selected' : ''), html: '<div class="pin-dot"></div>', iconSize: [16, 16], iconAnchor: [8, 8] });
  }

  function popup(school) {
    return '<h2 class="popup-name">' + escape(school.name) + '</h2><p class="popup-code">НЕИСПУО ' + school.code + '</p><p class="popup-address">' + escape(school.address) + '<br>' + escape(place(school.place)) + '</p>' + '<table class="popup-table"><thead><tr><th>Година</th><th>Успех</th><th>Явили се</th></tr></thead><tbody>' + school.scores.map((score, index) => '<tr><th>' + (2024 + index) + '</th><td>' + number.format(score) + '</td><td>' + school.examinees[index] + '</td></tr>').join('') + '</tbody></table><p class="popup-links"><a href="https://www.google.com/maps/search/?api=1&query=' + school.latitude + ',' + school.longitude + '" target="_blank" rel="noopener noreferrer">Адрес в Google Maps ↗</a><a href="' + escape(school.addressSource) + '" target="_blank" rel="noopener noreferrer">Източник на адреса ↗</a><a href="' + escape(school.coordinateSource) + '" target="_blank" rel="noopener noreferrer">Източник на координатите ↗</a></p>' + (school.coordinateNote ? '<p class="popup-code">' + escape(school.coordinateNote) + '</p>' : '');
  }

  function selectSchool(school, focusMap) {
    selectedCode = school.code;
    for (const button of elements['school-list'].querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.code === school.code));
    if (!map) { window.location.hash = 'school-' + school.code; return; }
    for (const record of schools) markers.get(record.code).setIcon(schoolIcon(record));
    const marker = markers.get(school.code);
    if (focusMap) {
      map.setView(marker.getLatLng(), 16, { animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches });
      if (typeof cluster.zoomToShowLayer === 'function') cluster.zoomToShowLayer(marker, () => marker.openPopup());
      else marker.openPopup();
    }
  }

  function render() {
    const query = normalize(elements.query.value);
    const visible = schools.filter(school => !query || normalize(school.name + school.place + school.code + school.address).includes(query));
    elements['result-count'].textContent = visible.length + ' от ' + schools.length + ' училища';
    elements['school-list'].innerHTML = '';
    for (const school of [...visible].sort((a, b) => a.name.localeCompare(b.name, 'bg') || a.place.localeCompare(b.place, 'bg'))) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'school-choice';
      button.dataset.code = school.code;
      button.setAttribute('aria-pressed', String(selectedCode === school.code));
      button.innerHTML = '<strong>' + escape(school.name) + '</strong><small>' + escape(place(school.place)) + '</small>';
      button.addEventListener('click', () => selectSchool(school, true));
      elements['school-list'].append(button);
    }
    if (!visible.length) elements['school-list'].innerHTML = '<p class="empty-list">Няма намерени училища.</p>';
    if (cluster) { cluster.clearLayers(); for (const school of visible) cluster.addLayer(markers.get(school.code)); }
  }

  if (typeof window.L !== 'undefined') {
    document.documentElement.classList.add('live-map');
    map = L.map('map', { scrollWheelZoom: true }).setView([42.7, 25.2], 7);
    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
    let loadedTiles = 0;
    let failedTiles = 0;
    tiles.on('tileload', () => { loadedTiles++; });
    tiles.on('tileerror', () => { failedTiles++; if (!loadedTiles && failedTiles >= 3 && map) { map.remove(); map = null; cluster = null; document.documentElement.classList.remove('live-map'); } });
    cluster = L.markerClusterGroup({ maxClusterRadius: 35, showCoverageOnHover: false, spiderfyOnMaxZoom: true, iconCreateFunction: group => {
      return L.divIcon({ className: 'pin-cluster', html: String(group.getChildCount()), iconSize: [36, 36], iconAnchor: [18, 18] });
    } });
    for (const school of schools) {
      const marker = L.marker([school.latitude, school.longitude], { icon: schoolIcon(school), title: school.name, alt: school.name, keyboard: true });
      marker.bindPopup(popup(school), { maxWidth: 300 });
      marker.on('click', () => selectSchool(school, false));
      markers.set(school.code, marker);
    }
    map.addLayer(cluster);
    map.fitBounds(L.latLngBounds([...markers.values()].map(marker => marker.getLatLng())), { padding: [25, 25] });
  }

  elements.query.addEventListener('input', render);
  elements.reset.addEventListener('click', () => { elements.query.value = ''; render(); if (map) map.fitBounds(L.latLngBounds([...markers.values()].map(marker => marker.getLatLng())), { padding: [25, 25] }); });
  render();
})();
