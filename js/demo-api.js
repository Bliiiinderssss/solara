/* ════════════════════════════════════════════════════════════════════════
   SOLARA — FAUX BACKEND DE DÉMONSTRATION (100% navigateur, sans PHP/MySQL)
   ────────────────────────────────────────────────────────────────────────
   Intercepte les appels fetch() vers api/clients.php et api/invoices.php et
   répond avec des données calculées à partir des réservations stockées dans
   localStorage ('solara_reservations'). Permet de faire tourner tout le
   tableau de bord admin sur un hébergement statique type Vercel.

   Pour revenir au vrai backend PHP : il suffit de ne PAS charger ce fichier
   (retirer la balise <script src="js/demo-api.js">).
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KEY_RES     = 'solara_reservations';
  var KEY_VERSION = 'solara_version';

  /* ── Helpers stockage ─────────────────────────────────────────────── */
  function loadRes() {
    try { return JSON.parse(localStorage.getItem(KEY_RES) || '[]'); } catch (e) { return []; }
  }
  function saveRes(list) {
    localStorage.setItem(KEY_RES, JSON.stringify(list));
    var v = parseInt(localStorage.getItem(KEY_VERSION) || '0') + 1;
    localStorage.setItem(KEY_VERSION, String(v));
    try { new BroadcastChannel('solara_sync').postMessage({ action: 'demo-update', version: v }); } catch (e) {}
  }

  /* Identifiant numérique stable dérivé d'une chaîne (pour view/delete par id) */
  function hashId(str) {
    var h = 0, s = String(str);
    for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; }
    return h % 2000000000;
  }
  function cents(eurs) { return Math.round((parseFloat(eurs) || 0) * 100); }
  function splitName(full) {
    var parts = String(full || '').trim().split(/\s+/);
    return { first: parts.shift() || '', last: parts.join(' ') || '' };
  }
  function isPaid(r) { return r.paid === true || r.status === 'confirmed' || r.status === 'acompte'; }

  /* ── Données d'exemple au premier accès (dashboard non vide) ──────── */
  function seedIfEmpty() {
    if (localStorage.getItem(KEY_RES) !== null) return;
    var props = (typeof window.PROPERTIES !== 'undefined' && window.PROPERTIES.length)
      ? window.PROPERTIES.map(function (p) { return { id: p.id, name: p.name }; })
      : [{ id: 1, name: 'Casa Azul Valencia' }, { id: 2, name: 'Villa Marisol Marbella' }, { id: 3, name: 'Loft Gracia Barcelone' }];
    function mk(guest, email, phone, propIdx, checkin, checkout, nights, total, daysAgo) {
      var d = new Date(); d.setDate(d.getDate() - daysAgo);
      var sess = 'DEMO_seed' + hashId(email + checkin).toString(36);
      var p = props[propIdx % props.length];
      return {
        id: 'SOL-' + sess.slice(-8).toUpperCase(), guest: guest, email: email, phone: phone, message: '',
        property: p.name, propId: p.id, checkin: checkin, checkout: checkout, nights: nights,
        total: total, amountPaid: total, isDeposit: false, depositPercent: null, remainingAmount: 0,
        status: 'confirmed', paid: true, paidAt: d.toISOString(), stripeSession: sess, createdAt: d.toISOString()
      };
    }
    var seed = [
      mk('Camille Laurent', 'camille.laurent@example.com', '+33 6 12 34 56 78', 0, '2026-06-12', '2026-06-16', 4, 828, 18),
      mk('Thomas Mercier', 'thomas.mercier@example.com', '+33 6 98 76 54 32', 1, '2026-07-03', '2026-07-10', 7, 2940, 9),
      mk('Sofia Romano', 'sofia.romano@example.com', '+39 333 112 2334', 2, '2026-05-28', '2026-05-31', 3, 615, 2)
    ];
    saveRes(seed);
  }

  /* ── Dérivation des clients depuis les réservations ───────────────── */
  function buildClients() {
    var res = loadRes(), byEmail = {};
    res.forEach(function (r) {
      var email = (r.email || '').toLowerCase();
      if (!email) return;
      (byEmail[email] = byEmail[email] || []).push(r);
    });
    return Object.keys(byEmail).map(function (email) {
      var group = byEmail[email].slice().sort(function (a, b) {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      });
      var latest = group[group.length - 1];
      var nm = splitName(latest.guest);
      var spent = group.reduce(function (s, r) { return s + (isPaid(r) ? cents(r.amountPaid) : 0); }, 0);
      return {
        id: hashId('client:' + email),
        first_name: nm.first, last_name: nm.last, email: email,
        phone: latest.phone || '',
        total_spent_cents: spent,
        total_reservations: group.length,
        confirmed_reservations: group.filter(isPaid).length,
        created_at: group[0].createdAt || null,
        updated_at: latest.paidAt || latest.createdAt || null,
        _group: group
      };
    });
  }

  function resToInvoice(r) {
    var nm = splitName(r.guest);
    var when = r.paidAt || r.createdAt || new Date().toISOString();
    var year = String(when).slice(0, 4) || '2026';
    return {
      id: hashId('inv:' + r.id),
      invoice_number: 'SOL-' + year + '-' + String(hashId('inv:' + r.id) % 100000).padStart(5, '0'),
      first_name: nm.first, last_name: nm.last, email: r.email || '',
      property_name: r.property || '', checkin_date: r.checkin || null, checkout_date: r.checkout || null,
      amount_cents: cents(r.amountPaid), currency: 'EUR', created_at: when,
      client_id: hashId('client:' + (r.email || '').toLowerCase()), _res: r
    };
  }
  function buildInvoices() {
    return loadRes().filter(function (r) { return isPaid(r) && !r._invoiceDeleted; }).map(resToInvoice);
  }

  /* ── Générateur de PDF minimal (sans dépendance) ──────────────────── */
  function buildPdf(lines) {
    function esc(s) { return String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
    function ascii(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7e]/g, ''); }
    var content = 'BT /F1 12 Tf 50 800 Td 18 TL\n';
    lines.forEach(function (l) { content += '(' + esc(ascii(l)) + ') Tj T*\n'; });
    content += 'ET';
    var objs = [
      '<</Type/Catalog/Pages 2 0 R>>',
      '<</Type/Pages/Kids[3 0 R]/Count 1>>',
      '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>',
      '<</Type/Font/Subtype/Type1/BaseFont/Helvetica/Encoding/WinAnsiEncoding>>',
      '<</Length ' + content.length + '>>\nstream\n' + content + '\nendstream'
    ];
    var pdf = '%PDF-1.4\n', offsets = [];
    for (var i = 0; i < objs.length; i++) {
      offsets.push(pdf.length);
      pdf += (i + 1) + ' 0 obj\n' + objs[i] + '\nendobj\n';
    }
    var xref = pdf.length;
    pdf += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n';
    offsets.forEach(function (o) { pdf += String(o).padStart(10, '0') + ' 00000 n \n'; });
    pdf += 'trailer\n<</Size ' + (objs.length + 1) + '/Root 1 0 R>>\nstartxref\n' + xref + '\n%%EOF';
    return new Blob([pdf], { type: 'application/pdf' });
  }
  function invoicePdfBlob(inv) {
    var euros = (inv.amount_cents / 100).toFixed(2);
    return buildPdf([
      'SOLARA — Location de prestige', '', 'FACTURE  ' + inv.invoice_number, '',
      'Client   : ' + (inv.first_name + ' ' + inv.last_name).trim(),
      'Email    : ' + inv.email,
      'Bien     : ' + inv.property_name,
      'Sejour   : ' + (inv.checkin_date || '?') + '  ->  ' + (inv.checkout_date || '?'),
      'Emise le : ' + String(inv.created_at).slice(0, 10), '',
      '--------------------------------------------------',
      'Montant paye : ' + euros + ' EUR  (TVA incluse)',
      '--------------------------------------------------', '',
      'Document de demonstration — paiement simule.',
      'Merci de votre confiance.'
    ]);
  }

  /* ── Réponses ─────────────────────────────────────────────────────── */
  function jsonRes(obj, status) {
    return new Response(JSON.stringify(obj), {
      status: status || 200, headers: { 'Content-Type': 'application/json' }
    });
  }

  function handleClients(method, params, body) {
    var id = params.get('id');
    if (method === 'GET' && !id) {
      return jsonRes(buildClients().map(function (c) { delete c._group; return c; }));
    }
    if (method === 'GET' && id) {
      var c = buildClients().find(function (x) { return String(x.id) === String(id); });
      if (!c) return jsonRes({ error: 'Client introuvable' }, 404);
      var reservations = c._group.map(function (r) {
        return {
          reference: r.id, property_name: r.property, checkin_date: r.checkin, checkout_date: r.checkout,
          amount_cents: cents(r.amountPaid), currency: 'EUR', status: r.status
        };
      });
      var invoices = c._group.filter(function (r) { return isPaid(r) && !r._invoiceDeleted; }).map(resToInvoice)
        .map(function (i) { delete i._res; return i; });
      delete c._group;
      c.reservations = reservations; c.invoices = invoices;
      return jsonRes(c);
    }
    if (method === 'PUT' && id) {
      var c2 = buildClients().find(function (x) { return String(x.id) === String(id); });
      if (!c2) return jsonRes({ error: 'Client introuvable' }, 404);
      var list = loadRes();
      list.forEach(function (r) {
        if ((r.email || '').toLowerCase() === c2.email) {
          if (body.email) r.email = body.email;
          if (typeof body.phone !== 'undefined') r.phone = body.phone;
        }
      });
      saveRes(list);
      return jsonRes({ updated: true });
    }
    if (method === 'DELETE' && id) {
      var target = buildClients().find(function (x) { return String(x.id) === String(id); });
      if (!target) return jsonRes({ error: 'Client introuvable' }, 404);
      saveRes(loadRes().filter(function (r) { return (r.email || '').toLowerCase() !== target.email; }));
      return jsonRes({ deleted: true });
    }
    return jsonRes({ error: 'Methode non supportee' }, 405);
  }

  function handleInvoices(method, params) {
    var download = params.get('download'), id = params.get('id');
    if (method === 'GET' && download) {
      var inv = buildInvoices().find(function (x) { return String(x.id) === String(download); });
      if (!inv) return new Response('Facture introuvable', { status: 404 });
      return new Response(invoicePdfBlob(inv), { status: 200, headers: { 'Content-Type': 'application/pdf' } });
    }
    if (method === 'GET') {
      return jsonRes(buildInvoices().map(function (i) { delete i._res; return i; }));
    }
    if (method === 'DELETE' && id) {
      var list = loadRes(), found = false;
      list.forEach(function (r) { if (String(hashId('inv:' + r.id)) === String(id)) { r._invoiceDeleted = true; found = true; } });
      if (found) saveRes(list);
      return jsonRes({ deleted: found });
    }
    return jsonRes({ error: 'Methode non supportee' }, 405);
  }

  /* ── Interception de fetch ────────────────────────────────────────── */
  var _realFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = (typeof input === 'string') ? input : (input && input.url) || '';
    var method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    var isApi = /(^|\/)api\/(clients|invoices|verify-payment|create-checkout)\.php(\?|$)/.test(url);
    if (!isApi) return _realFetch(input, init);

    var u, params;
    try { u = new URL(url, location.href); params = u.searchParams; }
    catch (e) { params = new URLSearchParams(); u = { pathname: url }; }

    var body = {};
    if (init && init.body) { try { body = JSON.parse(init.body); } catch (e) {} }

    try {
      if (/clients\.php/.test(url))  return Promise.resolve(handleClients(method, params, body));
      if (/invoices\.php/.test(url)) return Promise.resolve(handleInvoices(method, params));
      if (/verify-payment\.php/.test(url)) return Promise.resolve(jsonRes({ verified: true }));
      if (/create-checkout\.php/.test(url)) {
        var sid = 'DEMO_' + Date.now().toString(36);
        return Promise.resolve(jsonRes({ session_id: sid, url: 'success.html?session_id=' + sid }));
      }
    } catch (err) {
      return Promise.resolve(jsonRes({ error: 'Demo API: ' + err.message }, 500));
    }
    return _realFetch(input, init);
  };

  /* Initialisation */
  try { seedIfEmpty(); } catch (e) {}
  console.info('[Solara] Mode démo actif — backend simulé côté navigateur.');
})();
