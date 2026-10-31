const shareBtn = document.getElementById('shareBtn');
  shareBtn.addEventListener('click', async () => {
    const shareData = {
      title: 'NiceCream',
      text: 'Paletas, helados, malteadas y aguas — El Retoño y Pedregal, CDMX',
      url: 'https://nicecream.com.mx/'
    };
    if(navigator.share){
      try { await navigator.share(shareData); } catch(err) {}
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        shareBtn.textContent = '¡Link copiado! 📋';
        setTimeout(() => { shareBtn.textContent = '🔗 Compartir este sitio'; }, 2500);
      } catch(err) {}
    }
  });

  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  navToggle.addEventListener('click', () => {
    const expanded = navMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(expanded));
  });
  navMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navMenu.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }));

  // ===== VOTACIÓN DE SABOR =====
  // IMPORTANTE: este /exec pertenece a tu implementación actual de Apps Script.
  // El navegador no puede leer el resultado de POST con mode: 'no-cors'.
  // La confirmación real se verifica en la hoja de cálculo y los registros del servidor.
  const VOTE_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzkNin0IP-2fEaN_Xr_JNf4GQeiYrwD_N31hhZ6DKRI_7lGLN1m1JBN_4G0aU1pbMz3nA/exec';
  const SITE_TOKEN = 'nc-2026-8f3a1c'; // Compatibilidad con la versión previa; NO es una clave secreta.

  const voteCards = document.querySelectorAll('.vote-card');
  const voteSubmit = document.getElementById('voteSubmit');
  const voteOtroInputWrap = document.getElementById('voteOtroInputWrap');
  const voteOtroInput = document.getElementById('voteOtroInput');
  const voteWebsite = document.getElementById('voteWebsite');
  const voteStatus = document.getElementById('voteStatus');

  const monthKey = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit'
  }).format(new Date()).slice(0, 7);
  const voteStorageKey = 'nicecream_vote_sent_' + monthKey;

  function safeRead(key) {
    try { return window.localStorage.getItem(key); } catch (_) { return null; }
  }
  function safeSave(key, value) {
    try { window.localStorage.setItem(key, value); } catch (_) { /* Modo privado sin almacenamiento. */ }
  }
  function createAnonymousId() {
    if(window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    if(window.crypto && typeof window.crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    }
    return String(Date.now()) + '-' + Math.random().toString(36).slice(2);
  }
  function getAnonymousId() {
    let id = safeRead('nicecream_anonymous_voter_id');
    if(!id) {
      id = createAnonymousId();
      safeSave('nicecream_anonymous_voter_id', id);
    }
    return id;
  }

  let selectedFlavor = '';
  let isOtro = false;
  let voteSending = false;
  const allowedFlavorValues = new Set(
    Array.from(voteCards, card => card.dataset.flavor).filter(value => value && value !== '__otro__')
  );

  function lockVoting(message) {
    voteCards.forEach(card => {
      card.classList.remove('selected');
      card.disabled = true;
      card.setAttribute('aria-pressed', 'false');
    });
    voteOtroInputWrap.style.display = 'none';
    voteOtroInput.disabled = true;
    voteSubmit.disabled = true;
    voteSubmit.textContent = message;
  }

  function updateVoteButton() {
    if(voteSending) return;
    const candidate = isOtro ? voteOtroInput.value.trim().replace(/\s+/g, ' ') : selectedFlavor;
    const valid = isOtro ? candidate.length >= 3 && candidate.length <= 60 : allowedFlavorValues.has(candidate);
    selectedFlavor = valid ? candidate : '';
    voteSubmit.disabled = !valid;
    voteSubmit.textContent = valid
      ? 'Enviar mi voto por ' + candidate
      : (isOtro ? 'Escribe un sabor de 3 a 60 caracteres' : 'Elige un sabor para votar');
  }

  voteCards.forEach(card => {
    card.setAttribute('aria-pressed', 'false');
    card.addEventListener('click', () => {
      if(voteSending || card.disabled) return;
      voteCards.forEach(button => {
        button.classList.remove('selected');
        button.setAttribute('aria-pressed', 'false');
      });
      card.classList.add('selected');
      card.setAttribute('aria-pressed', 'true');
      isOtro = card.dataset.flavor === '__otro__';
      voteOtroInputWrap.style.display = isOtro ? 'block' : 'none';
      selectedFlavor = isOtro ? '' : card.dataset.flavor;
      if(isOtro) voteOtroInput.focus();
      voteStatus.textContent = '';
      updateVoteButton();
    });
  });

  voteOtroInput.addEventListener('input', () => {
    // No cambiar un voto normal si se escribe algo en el campo de "Otro".
    if(isOtro) updateVoteButton();
  });

  if(safeRead(voteStorageKey) === 'sent') {
    lockVoting('Ya enviaste una solicitud de voto este mes 🍦');
    voteStatus.textContent = 'Tu solicitud ya se transmitió desde este navegador. Confirma su registro con NiceCream si lo necesitas.';
  }

  voteSubmit.addEventListener('click', async () => {
    if(voteSending || voteSubmit.disabled || !selectedFlavor) return;
    // Campo trampa para bots. Nunca se muestra ni solicita al visitante.
    if(voteWebsite.value.trim()) {
      lockVoting('Solicitud recibida');
      return;
    }
    voteSending = true;
    voteSubmit.disabled = true;
    voteSubmit.textContent = 'Enviando tu solicitud...';
    voteStatus.textContent = '';

    const payload = {
      sabor: selectedFlavor,
      fecha: new Date().toISOString(),
      voterId: getAnonymousId(),
      website: '',
      token: SITE_TOKEN // Se conserva mientras se utiliza el Apps Script anterior.
    };

    try {
      await fetch(VOTE_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      // IMPORTANTE: la respuesta es opaca; esto NO confirma que Google guardó el voto.
      safeSave(voteStorageKey, 'sent');
      lockVoting('Solicitud de voto enviada 🍦');
      voteStatus.textContent = 'La solicitud salió de tu navegador; no es posible confirmar aquí que se haya guardado.';
    } catch (err) {
      voteSending = false;
      voteSubmit.disabled = false;
      voteSubmit.textContent = 'Reintentar envío';
      voteStatus.textContent = 'No fue posible transmitir la solicitud. Si ya lo intentaste, verifica antes de reintentar para evitar duplicados.';
    }
  });

  // ===== REGISTRO DE CORREO (novedades) =====
  // ===== POP-UP DE REGISTRO =====
  const newsletterOverlay = document.getElementById('newsletterOverlay');
  const newsletterOpenBtn = document.getElementById('newsletterOpenBtn');
  const newsletterClose = document.getElementById('newsletterClose');
  newsletterOpenBtn.addEventListener('click', () => newsletterOverlay.classList.add('open'));
  newsletterClose.addEventListener('click', () => newsletterOverlay.classList.remove('open'));
  newsletterOverlay.addEventListener('click', (e) => {
    if(e.target === newsletterOverlay) newsletterOverlay.classList.remove('open');
  });

  const signupForm = document.getElementById('signupForm');
  const signupSubmit = document.getElementById('signupSubmit');
  const signupNote = document.getElementById('signupNote');

  if(sessionStorage.getItem('nicecream_registered') === 'true'){
    signupSubmit.disabled = true;
    signupSubmit.textContent = 'Solicitud enviada';
    signupNote.textContent = 'Tu solicitud se envió, pero aún no podemos verificar que el registro se guardó correctamente. Si necesitas confirmarlo, contáctanos por WhatsApp.';
  }

  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    var nombre = document.getElementById('signupNombre').value.trim();
    var correo = document.getElementById('signupCorreo').value.trim();
    var sabor = document.getElementById('signupSabor').value.trim();
    var honeypot = document.getElementById('signupWebsite').value.trim();

    // Si el campo trampa viene lleno, es un bot: fingimos éxito y no enviamos nada
    if(honeypot){
      signupForm.reset();
      signupSubmit.textContent = 'Solicitud enviada';
      signupNote.textContent = 'Tu solicitud se envió, pero aún no podemos verificar que el registro se guardó correctamente. Si necesitas confirmarlo, contáctanos por WhatsApp.';
      return;
    }

    if(!nombre || !correo || !sabor || !document.getElementById('signupConsent').checked) return;

    var emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,24}$/;
    if(!emailPattern.test(correo)){
      signupNote.textContent = 'Ese correo no se ve válido — revisa que esté bien escrito (ej. nombre@correo.com).';
      signupNote.style.color = '#D9534F';
      return;
    }
    signupNote.style.color = '';

    signupSubmit.disabled = true;
    signupSubmit.textContent = 'Enviando...';

    fetch(VOTE_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        tipo: 'registro',
        nombre: nombre,
        correo: correo,
        saborFavorito: sabor,
        consentimiento: true,
        website: '',
        fecha: new Date().toISOString(),
        token: SITE_TOKEN
      })
    }).then(() => {
      sessionStorage.setItem('nicecream_registered', 'true');
      signupForm.reset();
      signupSubmit.textContent = 'Solicitud enviada';
      signupNote.textContent = 'Tu solicitud se envió, pero aún no podemos verificar que el registro se guardó correctamente. Si necesitas confirmarlo, contáctanos por WhatsApp.';
    }).catch(() => {
      signupSubmit.disabled = false;
      signupSubmit.textContent = 'Hubo un error, intenta de nuevo';
    });
  });

  const subTabs = document.querySelectorAll('#paletasSubTabs .sub-tab');
  const subPanels = document.querySelectorAll('#panel-paletas .sub-panel');
  subTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      subTabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-pressed', 'false'); });
      subPanels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      tab.setAttribute('aria-pressed', 'true');
      document.getElementById('subpanel-' + tab.dataset.subtab).classList.add('active');
    });
  });

  const subTabsH = document.querySelectorAll('#heladosSubTabs .sub-tab');
  const subPanelsH = document.querySelectorAll('#panel-helados .sub-panel');
  subTabsH.forEach(tab => {
    tab.addEventListener('click', () => {
      subTabsH.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-pressed', 'false'); });
      subPanelsH.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      tab.setAttribute('aria-pressed', 'true');
      document.getElementById('subpanel-h-' + tab.dataset.subtabH).classList.add('active');
    });
  });

  const tabs = document.querySelectorAll('#menuTabs .flavor-tab');
  const panels = document.querySelectorAll('.menu-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-pressed', 'false'); });
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      tab.setAttribute('aria-pressed', 'true');
      document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
  });
