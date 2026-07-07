/* ============================================================
   ANEMOIA STUDIO — CONTACT FORM
   Il sito è statico (solo HTML/CSS/JS, nessun backend): non può
   inviare email da solo. "Send" quindi apre il client di posta
   dell'utente con un'email pre-compilata verso design@anemoia.it,
   usando i dati inseriti nel form (soluzione standard per i form
   di contatto su siti statici senza server).
   "Clear" resetta semplicemente i campi.
   ============================================================ */

(function () {

  const form    = document.getElementById('contact-form');
  const note    = document.getElementById('contact-note');
  if (!form) return;

  const nameInput    = document.getElementById('contact-name');
  const emailInput   = document.getElementById('contact-email');
  const messageInput = document.getElementById('contact-message');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();

    const subject = encodeURIComponent(`New project inquiry from ${name || 'website visitor'}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);

    window.location.href = `mailto:design@anemoia.it?subject=${subject}&body=${body}`;

    note.textContent = "Si sta aprendo il tuo client di posta con il messaggio pronto...";
  });

  form.addEventListener('reset', () => {
    note.textContent = '';
  });

})();
