(() => {
  const config = window.WEDDING_CONFIG || {};
  // Lightweight decorative petals, kept out of the accessibility tree.
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const petals = document.getElementById('petals');
    for (let i = 0; i < 18; i++) {
      const petal = document.createElement('span');
      petal.className = 'petal';
      petal.style.setProperty('--left', `${Math.random() * 100}%`);
      petal.style.setProperty('--duration', `${9 + Math.random() * 9}s`);
      petal.style.setProperty('--delay', `${-Math.random() * 18}s`);
      petal.style.setProperty('--drift', `${Math.round(Math.random() * 140 - 70)}px`);
      petal.style.setProperty('--size', `${6 + Math.random() * 7}px`);
      petals.appendChild(petal);
    }
    // A few softly falling flower petals carry the wedding motif through the whole invitation.
    const weddingPetals = document.getElementById('wedding-petals');
    if (weddingPetals) for (let i = 0; i < 12; i++) {
      const petal = document.createElement('span');
      petal.className = 'wedding-petal' + (i % 4 === 0 ? ' rose-petal' : '');
      petal.style.setProperty('--petal-left', `${Math.random() * 100}%`);
      petal.style.setProperty('--petal-duration', `${15 + Math.random() * 9}s`);
      petal.style.setProperty('--petal-delay', `${-Math.random() * 24}s`);
      petal.style.setProperty('--petal-drift', `${Math.round(Math.random() * 100 - 50)}px`);
      petal.style.setProperty('--petal-size', `${6 + Math.random() * 5}px`);
      weddingPetals.appendChild(petal);
    }
  }
  if (config.couplePhoto) {
    const image = document.getElementById('couple-photo');
    image.src = config.couplePhoto;
    image.onload = () => { document.getElementById('photo-section').hidden = false; };
  }
  const audio = document.getElementById('background-audio');
  const sound = document.getElementById('sound');
  const musicWidget = document.getElementById('music-widget');
  if (config.backgroundMusic) {
    audio.src = config.backgroundMusic;
    musicWidget.hidden = false;
    const updateMusicControl = playing => {
      sound.setAttribute('aria-pressed', String(playing));
      sound.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
      document.getElementById('sound-label').textContent = playing ? 'MUSIC ON' : 'TAP FOR MUSIC';
    };
    sound.addEventListener('click', async () => {
      if (audio.paused) {
        try { await audio.play(); updateMusicControl(true); }
        catch { updateMusicControl(false); document.getElementById('sound-label').textContent = 'AUDIO UNAVAILABLE'; }
      } else { audio.pause(); updateMusicControl(false); }
    });
  }
  // Scratch covers are added only when JavaScript and canvas are available.
  // The actual invitation remains readable without JavaScript.
  document.querySelectorAll('.event-card').forEach((card, index) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx || !('PointerEvent' in window)) return;
    document.querySelector('.scratch-instruction').hidden = false;
    const coverTitle = `Celebration ${String(index + 1).padStart(2, '0')}`;
    const details = document.createElement('div');
    details.className = 'event-details';
    while (card.firstChild) details.appendChild(card.firstChild);
    card.appendChild(details);
    details.setAttribute('aria-hidden', 'true');
    if ('inert' in details) details.inert = true;
    else details.querySelectorAll('button, a').forEach(el => el.tabIndex = -1);

    const cover = document.createElement('div');
    cover.className = 'scratch-cover';
    canvas.className = 'scratch-canvas';
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'button');
    canvas.setAttribute('aria-label', `${coverTitle}: scratch to uncover the event. Keyboard users, press Space repeatedly to scratch.`);
    cover.appendChild(canvas);
    card.appendChild(cover);
    let drawing = false, revealed = false, previous = null, width = 0, height = 0;
    const drawCover = () => {
      if (revealed) return;
      const rect = cover.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      width = rect.width; height = rect.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#48201b'); gradient.addColorStop(.5, '#6c3325'); gradient.addColorStop(1, '#35110f');
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(226,190,130,.6)'; ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, width - 20, height - 20);
      ctx.strokeStyle = 'rgba(226,190,130,.22)'; ctx.strokeRect(15, 15, width - 30, height - 30);
      ctx.fillStyle = 'rgba(230,192,132,.30)';
      for (let x = 28; x < width; x += 28) for (let y = 28; y < height; y += 28) { ctx.beginPath(); ctx.arc(x, y, .7, 0, Math.PI * 2); ctx.fill(); }
      ctx.textAlign = 'center'; ctx.fillStyle = '#e7c88e';
      ctx.font = '19px Georgia, serif'; ctx.fillText('✦', width / 2, height * .25);
      ctx.fillStyle = '#fff0d8'; ctx.font = `500 ${Math.min(27, width * .09)}px Georgia, serif`; ctx.fillText(coverTitle, width / 2, height * .43);
      ctx.font = `${Math.min(10, width / 22)}px Arial, sans-serif`; ctx.fillStyle = '#e6c697'; ctx.fillText('S C R A T C H   T O   R E V E A L', width / 2, height * .55);
    };
    const revealCard = () => {
      if (revealed) return;
      revealed = true; drawing = false;
      const hadFocus = document.activeElement === canvas;
      details.removeAttribute('aria-hidden');
      if ('inert' in details) details.inert = false;
      else details.querySelectorAll('button, a').forEach(el => el.removeAttribute('tabindex'));
      if (hadFocus) { const heading = details.querySelector('h3'); heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
      cover.classList.add('is-revealed');
      cover.setAttribute('aria-hidden', 'true');
      canvas.tabIndex = -1;
      setTimeout(() => cover.remove(), 500);
    };
    const scratch = event => {
      const rect = canvas.getBoundingClientRect();
      const point = { x: (event.clientX - rect.left) * width / rect.width, y: (event.clientY - rect.top) * height / rect.height };
      ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = 38; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(previous ? previous.x : point.x, previous ? previous.y : point.y); ctx.lineTo(point.x, point.y); ctx.stroke();
      previous = point;
    };
    const checkProgress = () => {
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let transparent = 0, total = 0;
      for (let i = 3; i < pixels.length; i += 64) { total++; if (pixels[i] < 128) transparent++; }
      if (transparent / total > .32) revealCard();
    };
    canvas.addEventListener('pointerdown', event => { event.preventDefault(); drawing = true; previous = null; canvas.setPointerCapture(event.pointerId); scratch(event); });
    canvas.addEventListener('pointermove', event => { if (drawing) { event.preventDefault(); scratch(event); } });
    const finish = () => { if (drawing) { drawing = false; previous = null; checkProgress(); } };
    canvas.addEventListener('pointerup', finish); canvas.addEventListener('pointercancel', finish);
    let keyboardPass = 0;
    canvas.addEventListener('keydown', event => {
      if ((event.key !== ' ' && event.key !== 'Enter') || revealed) return;
      event.preventDefault();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = height / 5; ctx.lineCap = 'round';
      const y = height * (.125 + keyboardPass * .25);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      keyboardPass++;
      if (keyboardPass >= 4) revealCard();
      else canvas.setAttribute('aria-label', `${coverTitle}: ${keyboardPass} of 4 scratch strokes complete. Press Space again to continue.`);
    });
    drawCover();
    if ('ResizeObserver' in window) {
      const resize = new ResizeObserver(() => { if (!revealed && Math.abs(cover.clientWidth - width) > 1) drawCover(); else if (revealed) resize.disconnect(); });
      resize.observe(cover);
    }
  });
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: .08 });
    reveals.forEach(el => observer.observe(el));
  } else reveals.forEach(el => el.classList.add('visible'));
  // Animate each name when it actually enters view, rather than while it is off-screen.
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const nameObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('name-visible'); nameObserver.unobserve(entry.target); }
    }), { threshold: .45 });
    document.querySelectorAll('.family-member h3').forEach(name => nameObserver.observe(name));
  }
  // Add a small pointer-driven tilt to the illustrative miniature on fine-pointer devices.
  const miniature = document.getElementById('miniature-art');
  if (miniature && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    miniature.addEventListener('pointermove', event => {
      const rect = miniature.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      miniature.style.setProperty('--tilt-x', `${(-y * 7).toFixed(2)}deg`);
      miniature.style.setProperty('--tilt-y', `${(x * 7).toFixed(2)}deg`);
    });
    miniature.addEventListener('pointerleave', () => {
      miniature.style.setProperty('--tilt-x', '0deg');
      miniature.style.setProperty('--tilt-y', '0deg');
    });
  }
  const updateCountdown = () => {
    const diff = new Date('2026-12-14T06:10:00+05:30').getTime() - Date.now();
    if (diff <= 0) {
      document.getElementById('countdown').hidden = true;
      document.getElementById('countdown-message').textContent = 'Thank you for being part of our story.';
      return;
    }
    const seconds = Math.floor(diff / 1000);
    const values = { days: Math.floor(seconds / 86400), hours: Math.floor(seconds % 86400 / 3600), minutes: Math.floor(seconds % 3600 / 60), seconds: seconds % 60 };
    Object.entries(values).forEach(([id, value]) => document.getElementById(id).textContent = String(value).padStart(2, '0'));
  };
  updateCountdown(); setInterval(updateCountdown, 1000);
  const events = {
    reception: { title: 'Gowsik & Gayathri — Reception', start: '20261213T133000Z', end: '20261213T153000Z', file: 'reception.ics' },
    wedding: { title: 'Gowsik & Gayathri — Wedding', start: '20261214T004000Z', end: '20261214T014000Z', file: 'wedding.ics' }
  };
  const icalEscape = value => value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  document.querySelectorAll('.calendar').forEach(button => button.addEventListener('click', () => {
    const event = events[button.dataset.event];
    const stamp = new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Gowsik and Gayathri//Wedding Invitation//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:${button.dataset.event}-202612@gowsik-gayathri-wedding`,`DTSTAMP:${stamp}`,`DTSTART:${event.start}`,`DTEND:${event.end}`,`SUMMARY:${icalEscape(event.title)}`,`LOCATION:${icalEscape('Sri Kamatchi Amman Thirumana Mandapam, Pollachi, Tamil Nadu')}`,`DESCRIPTION:${icalEscape('Join us to celebrate! Directions: https://maps.app.goo.gl/dgPAQsjs9VcgywAc6')}`,'END:VEVENT','END:VCALENDAR'];
    const url = URL.createObjectURL(new Blob([lines.join('\r\n')+'\r\n'], {type:'text/calendar;charset=utf-8'}));
    const link = document.createElement('a'); link.href=url; link.download=event.file; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }));
  document.getElementById('share').addEventListener('click', async () => {
    const feedback = document.getElementById('share-feedback');
    const shareData = { title: 'Gowsik & Gayathri | Wedding Invitation', text: 'Join us to celebrate our wedding in Pollachi!', url: window.location.href };
    try {
      if (navigator.share) { await navigator.share(shareData); feedback.textContent = ''; }
      else if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(window.location.href); feedback.textContent = 'Invitation link copied to clipboard.'; }
      else { feedback.textContent = 'Copy the link from your browser’s address bar to share.'; }
    } catch (error) { if (error.name !== 'AbortError') feedback.textContent = 'Copy the link from your browser’s address bar to share.'; }
  });
})();
