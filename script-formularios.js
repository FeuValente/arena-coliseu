/* ========================================================
   Arena Coliseu - Formularios v6 (com logs detalhados)
   ======================================================== */
(function(){
  var DEBUG = true;
  var log = function(){ if(DEBUG && console) console.log.apply(console, ['[ArenaColiseu]'].concat([].slice.call(arguments))); };

  var ENDPOINT = atob('aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J4VktIOHM1eGRkVVhzNEp5cjVlSnA2RHQtbWZZZ25TLVlMa3VFNEFORjUxUFBQUXpieUQxZnE4REo1TmhGcHNYMFIvZXhlYw==');
  log('Script carregado. Endpoint:', ENDPOINT);

  /* ---- helpers ---- */
  function toBase64(file){
    return new Promise(function(resolve){
      if(!file){ resolve(null); return; }
      var r = new FileReader();
      r.onload = function(){ resolve(r.result.split(',')[1]); };
      r.onerror = function(err){ log('Erro ao ler arquivo:', err); resolve(null); };
      r.readAsDataURL(file);
    });
  }

  function safeExt(filename){
    var m = (filename||'').toLowerCase().match(/\.(pdf|png|jpe?g)$/);
    return m ? m[0] : '.pdf';
  }

  function sendPayload(data, type){
    data.type = type;
    data._ts = Date.now();

    log('>>> Enviando payload tipo=' + type);
    log('Campos:', Object.keys(data).join(', '));

    // Honeypot
    var honey = document.querySelector('input[name="website_url"]');
    if(honey && honey.value){
      log('Bloqueado pelo honeypot');
      return Promise.resolve(false);
    }

    // Rate limit: 5 envios/minuto
    var rl = JSON.parse(localStorage.getItem('_ac_rl') || '{}');
    var bucket = Math.floor(Date.now() / 60000);
    if(rl.t === bucket && rl.c >= 5){
      log('Bloqueado pelo rate limit. Execute localStorage.clear() para resetar.');
      alert('Muitos envios em pouco tempo. Aguarde 1 minuto e tente novamente.');
      return Promise.resolve(false);
    }
    rl = { t: bucket, c: (rl.t === bucket ? rl.c : 0) + 1 };
    localStorage.setItem('_ac_rl', JSON.stringify(rl));

    // Usa FormData para evitar problema de body perdido no redirect do Apps Script
    var formData = new FormData();
    formData.append('payload', JSON.stringify(data));

    return fetch(ENDPOINT, {
      method: 'POST',
      body: formData
    }).then(function(resp){
      log('Fetch OK. Status:', resp.status);
      return true;
    }).catch(function(err){
      log('Fetch FALHOU:', err);
      var bk = JSON.parse(localStorage.getItem('_ac_bk_' + type) || '[]');
      data.submitted_at = new Date().toISOString();
      bk.push(data);
      localStorage.setItem('_ac_bk_' + type, JSON.stringify(bk));
      alert('Envio falhou, dados salvos localmente. Tente novamente em alguns instantes.');
      return false;
    });
  }

  /* =========================================================
     FORMULARIO - TIME
     ========================================================= */
  var formTime = document.getElementById('registerForm');
  if(formTime){
    log('Form TIME detectado');

    formTime.addEventListener('submit', function(e){
      e.preventDefault();
      log('Submit TIME disparado');

      var fd = new FormData(this);
      var payload = {};
      fd.forEach(function(v, k){
        if(k === 'team_logo') return;
        if(/^p[1-5]_auth_file$/.test(k)) return;
        payload[k] = v;
      });
      log('Payload base (sem arquivos):', payload);

      var btn = this.querySelector('button[type="submit"]');
      btn.textContent = 'Enviando...';
      btn.disabled = true;

      // Logo
      var logoFile = document.getElementById('logoInput');
      var logo = (logoFile && logoFile.files.length > 0) ? logoFile.files[0] : null;
      log('Logo file:', logo ? logo.name + ' (' + logo.size + 'b)' : 'nenhuma');

      // Autorizacoes dos menores
      var authPromises = [];
      for(var i = 1; i <= 5; i++){
        (function(idx){
          var input = document.querySelector('[data-auth-input="p'+idx+'"]');
          var chk = document.querySelector('[data-minor-check="p'+idx+'"]');
          var isMinor = chk && chk.checked;
          var hasFile = input && input.files.length > 0;
          log('p'+idx+': is_minor=' + isMinor + ', has_file=' + hasFile);

          if(isMinor && hasFile){
            var f = input.files[0];
            authPromises.push(
              toBase64(f).then(function(b64){
                payload['p'+idx+'_auth_base64'] = b64;
                payload['p'+idx+'_auth_filename'] =
                  (payload['p'+idx+'_name']||('jogador'+idx))
                    .replace(/[^a-zA-Z0-9]/g, '_') + '_autorizacao' + safeExt(f.name);
                log('p'+idx+' autorizacao codificada:', payload['p'+idx+'_auth_filename']);
              })
            );
          }
        })(i);
      }

      Promise.all([toBase64(logo)].concat(authPromises)).then(function(results){
        var logoB64 = results[0];
        if(logoB64){
          payload.logo_base64 = logoB64;
          payload.logo_filename = (payload.team_name||'time').replace(/[^a-zA-Z0-9]/g, '_') + '_logo.png';
          log('Logo codificada:', payload.logo_filename);
        }
        return sendPayload(payload, 'time');
      }).then(function(ok){
        formTime.style.display = 'none';
        var w = document.getElementById('wizardSteps');
        if(w) w.style.display = 'none';
        var s = document.getElementById('registerSuccess');
        s.classList.add('show');
        s.scrollIntoView({ behavior: 'smooth', block: 'center' });
        log('Fluxo TIME concluido. Status:', ok);
      });
    });
  }

  /* =========================================================
     FORMULARIO - ESPECTADOR
     ========================================================= */
  var formSpec = document.getElementById('spectatorForm');
  if(formSpec){
    log('Form ESPECTADOR detectado');

    formSpec.addEventListener('submit', function(e){
      e.preventDefault();
      log('Submit ESPECTADOR disparado');

      var fd = new FormData(this);
      var payload = {};
      fd.forEach(function(v, k){
        if(k === 'spec_auth_file') return;
        payload[k] = v;
      });
      log('Payload base:', payload);

      var btn = this.querySelector('button[type="submit"]');
      btn.textContent = 'Enviando...';
      btn.disabled = true;

      var authInput = document.getElementById('specAuthInput');
      var minorChk = document.getElementById('specMinorCheck');
      var isMinor = minorChk && minorChk.checked;
      var hasFile = authInput && authInput.files.length > 0;
      log('ESPEC: is_minor=' + isMinor + ', has_file=' + hasFile);

      var authFile = (isMinor && hasFile) ? authInput.files[0] : null;

      toBase64(authFile).then(function(b64){
        if(b64){
          payload.spec_auth_base64 = b64;
          payload.spec_auth_filename =
            (payload.spec_name||'espectador').replace(/[^a-zA-Z0-9]/g, '_')
            + '_autorizacao' + safeExt(authFile.name);
          log('Autorizacao codificada:', payload.spec_auth_filename);
        }
        return sendPayload(payload, 'espectador');
      }).then(function(ok){
        formSpec.style.display = 'none';
        var s = document.getElementById('spectatorSuccess');
        s.classList.add('show');
        s.scrollIntoView({ behavior: 'smooth', block: 'center' });
        log('Fluxo ESPECTADOR concluido. Status:', ok);
      });
    });
  }

  /* =========================================================
     FORMULARIO - PATROCINADOR
     ========================================================= */
  var formSponsor = document.getElementById('sponsorForm');
  if(formSponsor){
    log('Form PATROCINADOR detectado');

    formSponsor.addEventListener('submit', function(e){
      e.preventDefault();
      log('Submit PATROCINADOR disparado');

      var fd = new FormData(this);
      var payload = {};
      fd.forEach(function(v, k){ payload[k] = v; });

      var btn = this.querySelector('button[type="submit"]');
      btn.textContent = 'Enviando...';
      btn.disabled = true;

      sendPayload(payload, 'patrocinador').then(function(ok){
        formSponsor.style.display = 'none';
        var s = document.getElementById('sponsorSuccess');
        s.classList.add('show');
        s.scrollIntoView({ behavior: 'smooth', block: 'center' });
        log('Fluxo PATROCINADOR concluido. Status:', ok);
      });
    });
  }

  log('Inicializacao concluida.');
})();
