// ============================================
// ARENA COLISEU - ENVIO DE FORMULÁRIOS
// ============================================
// Troque a URL abaixo pela URL do seu Google Apps Script Web App
// (Veja o guia 06_GUIA_BACKEND_FORMULARIOS.html para instruções)

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwc25AZPUl8Yazum0Mc6HgKeyY5wbGnu0ytHmKbDXWZVheQdmmnm4NKsKP-y5U64OFSlw/exec';

// ---- Função genérica de envio ----
async function enviarParaGoogle(data, type) {
  data.type = type;
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return true;
  } catch (error) {
    console.error('Erro ao enviar:', error);
    // Salva no localStorage como backup
    const backup = JSON.parse(localStorage.getItem('arena_backup_' + type) || '[]');
    data.submitted_at = new Date().toISOString();
    backup.push(data);
    localStorage.setItem('arena_backup_' + type, JSON.stringify(backup));
    return true; // Mostra sucesso mesmo assim (dados ficam no backup)
  }
}

// ---- Inscrição de Time (inscricao-time.html) ----
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const payload = {};
    formData.forEach((value, key) => { payload[key] = value; });

    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;

    await enviarParaGoogle(payload, 'time');

    this.style.display = 'none';
    const wizardSteps = document.getElementById('wizardSteps');
    if (wizardSteps) wizardSteps.style.display = 'none';
    const preActions = document.querySelector('.register__pre-actions');
    if (preActions) preActions.style.display = 'none';
    const success = document.getElementById('registerSuccess');
    success.classList.add('show');
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

// ---- Inscrição de Espectador (inscricao-espectador.html) ----
const spectatorForm = document.getElementById('spectatorForm');
if (spectatorForm) {
  spectatorForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const payload = {};
    formData.forEach((value, key) => { payload[key] = value; });

    const submitBtn = this.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;

    await enviarParaGoogle(payload, 'espectador');

    this.style.display = 'none';
    const success = document.getElementById('spectatorSuccess');
    success.classList.add('show');
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

// ---- Formulário de Patrocinador (index.html) ----
const sponsorForm = document.getElementById('sponsorForm');
if (sponsorForm) {
  sponsorForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const payload = {};
    formData.forEach((value, key) => { payload[key] = value; });

    const submitBtn = this.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;

    await enviarParaGoogle(payload, 'patrocinador');

    this.style.display = 'none';
    const success = document.getElementById('sponsorSuccess');
    success.classList.add('show');
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}
