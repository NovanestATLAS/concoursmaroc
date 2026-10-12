/* Formulaire de contact (/contact/ et /ar/contact/).
 * Les messages sont envoyés par Web3Forms (https://web3forms.com, offre
 * gratuite) à l'adresse liée à la clé d'accès `contactKey` de content/site.mjs.
 * L'adresse e-mail n'apparaît jamais dans le site : la clé est publique par
 * conception et ne peut livrer des messages qu'à cette seule boîte. */
(function () {
  'use strict';
  var form = document.getElementById('contact-form');
  if (!form) return;
  var ar = document.documentElement.lang === 'ar';
  var KEY = form.getAttribute('data-key') || '';
  var status = form.querySelector('.cf-status'), btn = form.querySelector('button[type="submit"]');
  var T = ar ? {
    off: 'نموذج الاتصال قيد الإعداد. يرجى العودة لاحقًا.',
    short: 'يرجى كتابة رسالة أطول قليلًا (10 أحرف على الأقل).',
    sending: 'جارٍ الإرسال…',
    ok: 'شكرًا! تم إرسال رسالتك.',
    fail: 'تعذر إرسال الرسالة. يرجى المحاولة بعد دقائق.',
    net: 'تعذر إرسال الرسالة. تحقق من اتصالك بالإنترنت ثم أعد المحاولة.',
    none: '(غير مذكور)'
  } : {
    off: 'Le formulaire de contact est en cours de mise en place. Revenez un peu plus tard.',
    short: 'Écrivez un message un peu plus long (10 caractères au moins).',
    sending: 'Envoi en cours…',
    ok: 'Merci ! Votre message a bien été envoyé.',
    fail: "Désolé, le message n'a pas pu être envoyé. Réessayez dans quelques minutes.",
    net: "Désolé, le message n'a pas pu être envoyé. Vérifiez votre connexion Internet puis réessayez.",
    none: '(non indiqué)'
  };
  function say(t, kind) { status.textContent = t; status.className = 'cf-status' + (kind ? ' ' + kind : ''); }
  if (!KEY) { btn.disabled = true; say(T.off, 'bad'); return; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.elements.botcheck && form.elements.botcheck.checked) return;      // case cachée cochée : un robot
    var msg = form.elements.message.value.trim();
    if (msg.length < 10) { say(T.short, 'bad'); form.elements.message.focus(); return; }
    var sel = form.elements.topic, topic = sel.options[sel.selectedIndex].text;
    var data = {
      access_key: KEY,
      subject: '[Concours Maroc] ' + topic,
      from_name: 'Concours Maroc',
      topic: topic,
      name: form.elements.name.value.trim() || T.none,
      email: form.elements.email.value.trim(),
      message: msg,
      page: document.referrer || location.href,
      langue: ar ? 'arabe' : 'français'
    };
    if (!data.email) delete data.email;
    btn.disabled = true;
    say(T.sending);
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) { return r.json().catch(function () { return { success: r.ok }; }); })
      .then(function (j) {
        if (j && j.success) { form.reset(); say(T.ok, 'ok'); }
        else say(T.fail, 'bad');
      }, function () { say(T.net, 'bad'); })
      .then(function () { btn.disabled = false; });
  });
})();
