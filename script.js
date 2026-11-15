/* Beyoğlu Ocakbaşı: menü, üst çubuk, mobil arama çubuğu, rezervasyon formu (Supabase) */
(function () {
  var ust = document.querySelector('[data-ust]');
  var menuDugme = document.querySelector('[data-menu]');
  var gezinti = document.getElementById('gezinti');
  var cubuk = document.querySelector('[data-cubuk]');
  var acilis = document.querySelector('.acilis');
  var form = document.getElementById('rezervasyon');
  var TEL = '0212 249 30 30';
  // Rezervasyonlar Supabase'e yazılır. Anahtar herkese açık (publishable) anahtardır;
  // tablo yalnızca ekleme izni verir, okuma/silme yok
  // (bkz. supabase/migrations/20261115120000_beyoglu_rezervasyonlar.sql).
  var SUPABASE_URL = 'https://gkbdxrcdknsvtowzknmn.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_tWavH4T9LPPrTAZnw8FkMQ_ij_uc0ML';
  var TABLO = 'beyoglu_rezervasyonlar';

  // Yıl
  var yil = document.querySelector('[data-yil]');
  if (yil) yil.textContent = new Date().getFullYear();

  // Mobil menü
  function menuKapat() {
    gezinti.classList.remove('is-acik');
    ust.classList.remove('is-menu');
    menuDugme.setAttribute('aria-expanded', 'false');
    menuDugme.querySelector('.sr').textContent = 'Menüyü aç';
  }
  menuDugme.addEventListener('click', function () {
    var acik = gezinti.classList.toggle('is-acik');
    ust.classList.toggle('is-menu', acik);
    menuDugme.setAttribute('aria-expanded', String(acik));
    menuDugme.querySelector('.sr').textContent = acik ? 'Menüyü kapat' : 'Menüyü aç';
  });
  gezinti.addEventListener('click', function (e) { if (e.target.closest('a')) menuKapat(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && gezinti.classList.contains('is-acik')) { menuKapat(); menuDugme.focus(); }
  });

  // Kaydırma: üst çubuğa zemin, mobil çubuğu göster/gizle, aktif menü bağlantısı
  var bolumler = Array.prototype.map.call(gezinti.querySelectorAll('a'), function (a) {
    return { a: a, el: document.querySelector(a.getAttribute('href')) };
  });
  function kaydir() {
    var y = window.scrollY;
    ust.classList.toggle('is-dolu', y > 40);
    if (cubuk) {
      var heroBitti = y > acilis.offsetHeight * 0.6;
      var r = form.getBoundingClientRect();
      var formda = r.top < window.innerHeight && r.bottom > 0;
      cubuk.classList.toggle('is-gorunur', heroBitti && !formda);
    }
    var aktif = null;
    bolumler.forEach(function (b) { if (b.el && b.el.getBoundingClientRect().top < window.innerHeight * 0.45) aktif = b; });
    bolumler.forEach(function (b) { if (b === aktif) b.a.setAttribute('aria-current', 'true'); else b.a.removeAttribute('aria-current'); });
  }
  window.addEventListener('scroll', kaydir, { passive: true });
  kaydir();

  // Tarih alanı bugünden önce olamaz
  var tarih = document.getElementById('f-tarih');
  var bugun = new Date(); bugun.setMinutes(bugun.getMinutes() - bugun.getTimezoneOffset());
  tarih.min = bugun.toISOString().slice(0, 10);

  // Form
  var durum = form.querySelector('[data-durum]');
  function goster(mesaj, tur) { durum.textContent = mesaj; durum.className = 'form__durum ' + (tur || ''); }
  function hataVer(alan, mesaj) { alan.setAttribute('aria-invalid', 'true'); alan.focus(); goster(mesaj, 'is-hata'); return false; }
  function dogrula() {
    Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid]'), function (el) { el.removeAttribute('aria-invalid'); });
    var ad = form.ad, tel = form.telefon, saat = form.saat, kisi = form.kisi;
    if (!ad.value.trim()) return hataVer(ad, 'Adınızı yazın.');
    if (!/^[0-9 +()-]{10,20}$/.test(tel.value.trim())) return hataVer(tel, 'Telefon numaranızı rakamlarla yazın, örneğin 0532 123 45 67.');
    if (!tarih.value) return hataVer(tarih, 'Bir tarih seçin.');
    if (tarih.value < tarih.min) return hataVer(tarih, 'Geçmiş bir tarih seçilemez.');
    if (!saat.value) return hataVer(saat, 'Bir saat seçin.');
    if (saat.value < '12:00' || saat.value > '23:30') return hataVer(saat, 'Rezervasyon saatleri 12:00 - 23:30 arası.');
    if (!kisi.value) return hataVer(kisi, 'Kişi sayısını seçin.');
    return true;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!dogrula()) return;
    if (form['bot-field'].value) { goster('Talebiniz alındı.', 'is-tamam'); return; }
    var dugme = form.querySelector('button[type="submit"]');
    dugme.disabled = true;
    goster('Gönderiliyor...');
    fetch(SUPABASE_URL + '/rest/v1/' + TABLO, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        ad: form.ad.value.trim(),
        telefon: form.telefon.value.trim(),
        tarih: tarih.value,
        saat: form.saat.value,
        kisi: form.kisi.value,
        notlar: form.not.value.trim() || null
      })
    }).then(function (y) {
      if (!y.ok) throw new Error(y.status);
      form.reset();
      goster('Talebiniz alındı. Masanızı teyit etmek için sizi arayacağız.', 'is-tamam');
    }).catch(function () {
      goster('Talebiniz gönderilemedi. Lütfen ' + TEL + ' numarasını arayın.', 'is-hata');
    }).then(function () { dugme.disabled = false; });
  });
})();
