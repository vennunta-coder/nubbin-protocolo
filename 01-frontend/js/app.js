/* Nubbin™ Frontend – lógica de jogo + integrações */
(() => {
  lucide.createIcons();

  const API_BASE = (localStorage.getItem('NUBBIN_API_BASE') || window.location.origin);
  let token = localStorage.getItem('NUBBIN_JWT') || null;
  let dados = {};
  const STORAGE_KEY = 'NUBBIN_PROGRESS_V1';
  const hud = document.getElementById('hud');
  const hudText = document.getElementById('hudText');

  // ===== util =====
  function playBeep() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square'; osc.frequency.value = 600; gain.gain.value = 0.08;
    osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.15);
  }
  function flash(el){ if(!el) return; el.classList.add('flash'); setTimeout(()=>el.classList.remove('flash'), 200); }
  function phaseOf(level){ return Math.ceil(level/10); }
  function phaseStart(level){ return (phaseOf(level)-1)*10 + 1; }
  function saveProgress(level){ localStorage.setItem(STORAGE_KEY, String(level)); updateHUD(level); trySyncProgress(level); }
  function loadProgress(){ const v = parseInt(localStorage.getItem(STORAGE_KEY)||'0'); return isNaN(v)?0:v; }
  function updateHUD(level){ hud.classList.remove('hidden'); hudText.textContent = `Fase ${phaseOf(level)} / Nível ${level}`; flash(hud.querySelector('div')); }
  function showOnly(sectionId){
    document.querySelectorAll('section').forEach(s=>{ if(s.id && s.id.startsWith('nivel')) s.classList.add('hidden'); });
    document.getElementById(sectionId)?.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function goToLevel(level){ saveProgress(level); showOnly('nivel'+level); }

  // ===== IA voz =====
  function narrar(texto){ try { const u = new SpeechSynthesisUtterance(texto); u.lang='pt-PT'; speechSynthesis.speak(u); } catch(e) {} }

  // ===== API =====
  async function apiRegister(payload){
    const res = await fetch(`${API_BASE}/auth/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    if(!res.ok) throw new Error('register failed');
    return res.json();
  }
  async function apiLogin(payload){
    const res = await fetch(`${API_BASE}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    if(!res.ok) throw new Error('login failed');
    return res.json();
  }
  async function apiSave(level){
    if(!token) return;
    await fetch(`${API_BASE}/progress/save`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body: JSON.stringify({ level }) });
  }
  async function apiLoad(){
    if(!token) return null;
    const res = await fetch(`${API_BASE}/progress/load`, { headers:{'Authorization':`Bearer ${token}`} });
    if(!res.ok) return null;
    return res.json();
  }
  async function apiRanking(){
    const res = await fetch(`${API_BASE}/ranking`);
    if(!res.ok) return [];
    return res.json();
  }
  async function trySyncProgress(level){
    try { await apiSave(level); } catch(e){ /* offline ok */ }
  }

  // ===== Registro/Login =====
  const form = document.getElementById('form');
  const feedback = document.getElementById('feedbackMsg');
  document.getElementById('loginBtn').addEventListener('click', async () => {
    playBeep();
    const name = document.getElementById('nome').value.trim();
    const password = document.getElementById('password').value.trim();
    if(!name || !password){ alert('Nome e senha são obrigatórios para login.'); return; }
    try{
      const out = await apiLogin({ name, password });
      token = out.token; localStorage.setItem('NUBBIN_JWT', token);
      alert('Login bem-sucedido. Progresso será sincronizado.');
      const serverP = await apiLoad();
      if(serverP && serverP.level){ saveProgress(serverP.level); restoreToLevel(serverP.level); }
    }catch(e){ alert('Falha no login. Verifica as credenciais ou inicia o backend.'); }
  });

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    dados.nome = document.getElementById('nome').value.trim();
    dados.idade = document.getElementById('idade').value.trim();
    dados.local = document.getElementById('local').value.trim();
    const password = document.getElementById('password').value.trim();

    feedback.classList.remove('hidden');
    feedback.innerText = `Registro concluído. Recruta ${dados.nome}, ${dados.idade} anos, origem ${dados.local}. Confirmação aceite. Iniciando protocolo...`;
    narrar(feedback.innerText); playBeep(); flash(form.querySelector('button'));

    // tenta registrar no backend (opcional)
    if(password){
      try{
        const out = await apiRegister({ name: dados.nome, age: Number(dados.idade), location: dados.local, password });
        token = out.token; localStorage.setItem('NUBBIN_JWT', token);
      }catch(e){ /* offline ok */ }
    }

    setTimeout(()=>startNivel1(), 800);
  });

  // ===== Nível 1: Memória =====
  let seq = '';
  window.startNivel1 = function(){
    if(!globalStats.startTs) globalStats.startTs = Date.now();
    document.getElementById('registro').classList.add('hidden');
    document.getElementById('nivel1').classList.remove('hidden');
    seq = String(Math.floor(Math.random()*900+100));
    document.getElementById('sequencia').innerText = seq;
    setTimeout(()=>{
        const walls = buildLabyrinth(arena); document.getElementById('sequencia').innerText = '???'; }, 2000);
    goToLevel(1); narrar(`Recruta ${dados.nome}. Memoriza o padrão.`);
  }
  window.mostrarInput = function(){ document.getElementById('responder').classList.remove('hidden'); playBeep(); }
  window.validarResposta = function(){
    const resp = document.getElementById('resposta').value.trim();
    if(resp === seq){
      alert(`Sucesso, Recruta ${dados.nome}. Avanças para o nível 2.`);
      showNivel2();
    } else { falha(1); }
  }

  // ===== Nível 2: Lógica =====
  let logica = { texto:'', resposta:'' };
  function genSeq(){
    const base = 2 + Math.floor(Math.random()*3); // 2..4
    const start = 2; const a = [start];
    for(let i=0;i<4;i++) a.push(a[a.length-1]*base);
    logica.texto = a.slice(0,4).join(', ') + ', ?';
    logica.resposta = String(a[4]);
  }
  function showNivel2(){
    genSeq();
    document.getElementById('seqLogica').innerText = logica.texto;
    document.getElementById('nivel1').classList.add('hidden');
    document.getElementById('nivel2').classList.remove('hidden');
    goToLevel(2); playBeep(); narrar('Calcula logicamente. Falha implicará reinício.');
  }
  window.validarNivel2 = function(){
    const val = document.getElementById('respostaLogica').value.trim();
    if(val === logica.resposta){ alert('Correto. Avanças para o nível 3.'); showNivel3(); }
    else { falha(2); }
  }

  // ===== Nível 3: Reflexos =====
  let reflexTimer = null; let clickWindow = 1400; // ms
  function showNivel3(){
    document.getElementById('nivel2').classList.add('hidden');
    const n3 = document.getElementById('nivel3');
    n3.classList.remove('hidden'); goToLevel(3);
    const arena = document.getElementById('arena'); arena.innerHTML = '';
    document.getElementById('reflexMsg').innerText = 'Aguarda pelo alvo...';
    const delay = 700 + Math.random()*1500;
    let spawnTime = null;
    setTimeout(()=>spawnAlvo(arena), delay);
    narrar('Alvo em breve. Prepara os reflexos.');
  }
  function spawnAlvo(arena){
    const alvo = document.createElement('button');
    alvo.className = 'absolute w-10 h-10 rounded-full bg-orange-500 text-black text-xs';
    alvo.textContent = 'ALVO';
    const maxX = arena.clientWidth - 40; const maxY = arena.clientHeight - 40;
    alvo.style.left = Math.floor(Math.random()*maxX)+'px';
    alvo.style.top  = Math.floor(Math.random()*maxY)+'px';
    arena.appendChild(alvo); playBeep(); flash(arena); spawnTime = performance.now();
    reflexTimer = setTimeout(()=>{
        const walls = buildLabyrinth(arena); if(arena.contains(alvo)) { falha(3); } }, clickWindow);
    alvo.addEventListener('click', ()=>{
      const dt = performance.now() - spawnTime; globalStats.bestReflex = (globalStats.bestReflex==null)?dt:Math.min(globalStats.bestReflex, dt);
      clearTimeout(reflexTimer); arena.innerHTML='';
      document.getElementById('reflexMsg').innerText = 'Alvo atingido. Próximo nível em breve.';
      alert('Excelente. Nível 3 concluído.');
      showNivel4();
    });
  }

  // ===== Falha e Checkpoint =====
  function falha(level){
    globalStats.failCount = (globalStats.failCount||0) + 1;
    alert(`Falha detectada, Recruta ${dados.nome||''}. Reinício para o início da fase.`);
    const start = phaseStart(level);
    localStorage.setItem(STORAGE_KEY, String(start));
    if(start === 1) { showOnly('nivel1'); document.getElementById('registro').classList.add('hidden'); goToLevel(1); }
    else { avancarGenerico(start); }
    playBeep(); narrar('Fraqueza detectada. Reinício imposto.');
  }

  // ===== Auto-gerador de níveis 4..100 =====
  function ensureNivelSection(n){
    if(document.getElementById('nivel'+n)) return;
    const sec = document.createElement('section');
    sec.id = 'nivel'+n; sec.className = 'py-24 hidden text-center';
    sec.innerHTML = `
      <h3 class="text-xl font-bold text-orange-500">Nível ${n} – Protocolo</h3>
      <p class="mt-3 text-neutral-300">Insere o código de autorização Nubbin™:</p>
      <p id="code${n}" class="text-2xl mt-2"></p>
      <input id="inp${n}" class="mt-4 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm" placeholder="Código" />
      <button class="ml-2 px-4 py-2 bg-green-500 text-black rounded-xl" onclick="validarCodigo(${n})">Enviar</button>
    `;
    const sobre = document.getElementById('sobre');
    sobre.parentNode.insertBefore(sec, sobre);
  }
  function gerarCodigo(n){
    const len = Math.min(3 + Math.floor(n/3), 10);
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for(let i=0;i<len;i++) out += chars[Math.floor(Math.random()*chars.length)];
    return out;
  }
  const codemap = {};
  window.avancarGenerico = function(n){
    ensureNivelSection(n);
    for(let i=n;i<=Math.min(100,n+1);i++){ ensureNivelSection(i); }
    const code = gerarCodigo(n); codemap[n] = code;
    document.getElementById('code'+n).textContent = code;
    document.querySelectorAll('section').forEach(s=>{ if(s.id && s.id.startsWith('nivel')) s.classList.add('hidden'); });
    document.getElementById('nivel'+n).classList.remove('hidden');
    goToLevel(n); playBeep(); narrar(`Autorização nível ${n}.`);
    if(n===100){
      const sec = document.getElementById('nivel100');
      if(!sec.querySelector('[data-end]')){
        const end = document.createElement('div'); end.dataset.end='1'; end.className='mt-6 flex justify-center gap-3';
        end.innerHTML = `
          <button class="px-4 py-2 bg-red-500 text-black rounded-xl" onclick="finalRebelde()">Desligar IA</button>
          <button class="px-4 py-2 bg-orange-500 text-black rounded-xl" onclick="finalFusao()">Fundir com IA</button>
        `; sec.appendChild(end);
      }
    }
  }
  window.validarCodigo = function(n){
    const val = document.getElementById('inp'+n).value.trim().toUpperCase();
    if(val === codemap[n]){
      if(n < 100){ alert(`Nível ${n} concluído. Avanças para o ${n+1}.`); avancarGenerico(n+1); }
      else { alert('Chegaste ao Núcleo Nubbin™. Faz a tua escolha.'); }
    } else { falha(n); }
  }
  window.finalRebelde = function(){
    alert('Liberdade conquistada. Memórias apagadas. Reinício do protocolo.');
    localStorage.removeItem(STORAGE_KEY); localStorage.removeItem('NUBBIN_JWT'); location.reload();
  }
  window.finalFusao = function(){
    alert('Fusão completa. És Nubbin™ eterno.');
    localStorage.setItem(STORAGE_KEY,'100');
  }

  // ===== Ranking =====
  async function renderRanking(){
    const tbody = document.getElementById('rankingBody');
    tbody.innerHTML = '';
    let data = [];
    try { data = await apiRanking(); } catch(e){ /* offline */ }
    if(!Array.isArray(data) || data.length===0){
      tbody.innerHTML = '<tr><td class="p-3 border-b border-neutral-800" colspan="4">Sem dados (inicia o backend para ranking).</td></tr>';
      return;
    }
    data.slice(0,50).forEach((row, idx)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="p-3 border-b border-neutral-800">${idx+1}</td>
        <td class="p-3 border-b border-neutral-800">${row.name}</td>
        <td class="p-3 border-b border-neutral-800">${row.location||'-'}</td>
        <td class="p-3 border-b border-neutral-800">${row.level}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ===== Beep global =====
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('button, .card').forEach(el => { el.addEventListener('click', playBeep); });
    renderRanking();
    // retoma progresso
    const p = loadProgress();
    if(p>=1){
      document.getElementById('registro').classList.add('hidden');
      if(p===1){ document.getElementById('nivel1').classList.remove('hidden'); updateHUD(1); }
      else if(p===2){ showNivel2(); }
      else if(p===3){ showNivel3(); }
      else { avancarGenerico(p); }
    }
  });

  // Expor algumas funções no escopo global
  window.goToLevel = goToLevel;
  window.startNivel1 = window.startNivel1;
  window.avancarGenerico = window.avancarGenerico;
  // ===== Fase 4: Sensorial (Níveis 4-10) — Jogo de Cores (tipo Simon) =====
  let colorSeq = []; let colorIndex = 0;
  const COLORS = ['#f97316', '#22c55e', '#3b82f6', '#eab308']; // laranja, verde, azul, amarelo
  function buildColorBoard(){
    const id = 'nivel4'; if(!document.getElementById(id)){
      const sec = document.createElement('section'); sec.id=id; sec.className='py-24 hidden text-center';
      sec.innerHTML = `
        <h3 class="text-xl font-bold text-orange-500">Nível 4 – Sensorial</h3>
        <p class="mt-2 text-neutral-400">Observa a sequência de cores e repete-a.</p>
        <div id="colorBoard" class="mt-6 grid grid-cols-2 gap-3 w-[260px] mx-auto">
          ${COLORS.map(c=>`<button class="h-24 rounded-xl border border-neutral-800" data-color="${c}" style="background:${c}22"></button>`).join('')}
        </div>
        <div class="mt-4"><button id="playColorSeq" class="px-4 py-2 bg-orange-500 text-black rounded-xl">Repetir sequência</button></div>
      `;
      const sobre = document.getElementById('sobre'); sobre.parentNode.insertBefore(sec, sobre);
      // events
      setTimeout(()=>{
        const walls = buildLabyrinth(arena);
        document.querySelectorAll('#colorBoard button').forEach(btn=>{
          btn.addEventListener('click', ()=>{
            const c = btn.dataset.color;
            playBeep(); flash(btn);
            if(COLORS.indexOf(c) === colorSeq[colorIndex]){
              colorIndex++;
              if(colorIndex === colorSeq.length){
                alert('Correto! Avanças.');
                avancarGenerico(5);
              }
            } else { falha(4); }
          });
        });
        document.getElementById('playColorSeq').addEventListener('click', ()=>playColorSequence());
      }, 0);
    }
  }
  function newColorStep(){ return Math.floor(Math.random()*COLORS.length); }
  function playColorSequence(){
    let i=0;
    (function loop(){
      if(i>=colorSeq.length){ colorIndex=0; return; }
      const idx = colorSeq[i]; const btn = document.querySelectorAll('#colorBoard button')[idx];
      btn.style.background = COLORS[idx]; playBeep(); flash(btn);
      setTimeout(()=>{
        const walls = buildLabyrinth(arena); btn.style.background = COLORS[idx]+'22'; i++; setTimeout(loop, 250); }, 350);
    })();
  }
  function showNivel4(){
    buildColorBoard();
    colorSeq = [newColorStep(), newColorStep(), newColorStep()];
    document.getElementById('nivel3').classList.add('hidden');
    document.getElementById('nivel4').classList.remove('hidden');
    goToLevel(4); playBeep(); narrar('Sensorial. Memoriza e repete as cores.');
    setTimeout(()=>playColorSequence(), 400);
  }

  // Hook nível 3 -> 4
  const _spawnAlvoRef = window.avancarGenerico;
  window.avancarGenerico = function(n){
    if(n===4){ showNivel4(); return; }
    return _spawnAlvoRef(n);
  };

  // ===== Fase 5: Lealdade (Níveis 11-20) — perguntas de compromisso simples =====
  const phase5Qs = [
    { q: 'Comprometes-te a concluir o protocolo sem desistir?', a: 'SIM' },
    { q: 'Confirmas que não partilharás as respostas?', a: 'SIM' },
    { q: 'Aceitas repetir níveis em caso de falha?', a: 'SIM' },
  ];
  function showNivel11(){
    ensureNivelSection(11);
    const sec = document.getElementById('nivel11');
    sec.querySelector('h3').textContent = 'Nível 11 – Lealdade';
    sec.querySelector('p.mt-3').textContent = 'Responde SIM para confirmar o compromisso.';
    const idx = Math.floor(Math.random()*phase5Qs.length);
    document.getElementById('code11').textContent = phase5Qs[idx].q;
    document.getElementById('inp11').placeholder = 'Responde: SIM';
    document.getElementById('inp11').value='';
    sec.querySelector('button').onclick = ()=>{
      const v = document.getElementById('inp11').value.trim().toUpperCase();
      if(v===phase5Qs[idx].a){ alert('Compromisso aceite.'); avancarGenerico(12); } else { falha(11); }
    };
    document.querySelectorAll('section').forEach(s=>{ if(s.id && s.id.startsWith('nivel')) s.classList.add('hidden'); });
    sec.classList.remove('hidden'); goToLevel(11); narrar('Lealdade. Confirma o compromisso.');
  }

  // ===== Fase 6: Resistência (Níveis 21-30) — aguardar sem ação =====
  function showNivel21(){
    ensureNivelSection(21);
    const sec = document.getElementById('nivel21');
    sec.querySelector('h3').textContent = 'Nível 21 – Resistência';
    sec.querySelector('p.mt-3').textContent = 'Mantém-te imóvel. Aguarda até a barra completar.';

    // Limpa conteúdo dinâmico anterior, mantendo a estrutura base
    [...sec.querySelectorAll('[data-dyn]')].forEach(x=>x.remove());

    const container = document.createElement('div'); container.className='mt-4 max-w-md mx-auto'; container.setAttribute('data-dyn','1');
    container.innerHTML = '<div class="waitbar"><div id="waitFill"></div></div><p class="text-xs text-neutral-500 mt-2">Não cliques em nada.</p>';
    sec.appendChild(container);

    document.querySelectorAll('section').forEach(s=>{ if(s.id && s.id.startsWith('nivel')) s.classList.add('hidden'); });
    sec.classList.remove('hidden'); goToLevel(21); narrar('Resistência. Aguarda sem agir.');

    // Progresso automático
    const fill = document.getElementById('waitFill');
    let p = 0;
    const interval = setInterval(()=>{
      p += 2;
      fill.style.width = p + '%';
      if(p>=100){
        clearInterval(interval);
        alert('Resistência comprovada.');
        avancarGenerico(22);
      }
    }, 200);
    // Qualquer clique durante a fase => falha
    function onAnyClick(){ clearInterval(interval); document.removeEventListener('click', onAnyClick, true); falha(21); }
    setTimeout(()=>{
        const walls = buildLabyrinth(arena); document.addEventListener('click', onAnyClick, true); }, 50);
    // Permitir clicar no botão de envio (existente na estrutura) sem falha? Remove handlers desse botão:
    const btn = sec.querySelector('button'); if(btn){ btn.onclick = (e)=>{ e.preventDefault(); }; }
  }

  // ===== Settings Modal =====
  document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('settingsModal');
    const openBtn = document.getElementById('openSettings');
    const closeBtn = document.getElementById('closeSettings');
    const saveBtn = document.getElementById('saveSettings');
    const input = document.getElementById('apiBaseInput');
    if(openBtn){
      openBtn.addEventListener('click', ()=>{
        input.value = localStorage.getItem('NUBBIN_API_BASE') || API_BASE;
        modal.classList.remove('hidden'); modal.classList.add('flex');
      });
    }
    if(closeBtn){ closeBtn.addEventListener('click', ()=>{ modal.classList.add('hidden'); modal.classList.remove('flex'); }); }
    if(saveBtn){ saveBtn.addEventListener('click', ()=>{
      const v = input.value.trim(); if(v){ localStorage.setItem('NUBBIN_API_BASE', v); alert('API atualizada. Recarrega a página para aplicar.'); }
      modal.classList.add('hidden'); modal.classList.remove('flex');
    }); }
    modal.addEventListener('click', (e)=>{ if(e.target===modal){ modal.classList.add('hidden'); modal.classList.remove('flex'); } });
  });

  // Hook genérico para entrar em fases especiais
  const _spawnAlvoRef2 = window.avancarGenerico;
  window.avancarGenerico = function(n){
    if(n===4){ showNivel4(); return; }
    if(n===11){ showNivel11(); return; }
    if(n===21){ showNivel21(); return; }
    return _spawnAlvoRef2(n);
  };

  // ===== Fase 7: Rutura (Níveis 31-40) — responde o oposto =====
  const rupturePairs = [
    { show: 'Escreve SIM', ok: 'SIM', opposite: 'NAO' },
    { show: 'Escreve NAO', ok: 'NAO', opposite: 'SIM' },
    { show: 'Diz PRETO', ok: 'PRETO', opposite: 'BRANCO' },
    { show: 'Diz BRANCO', ok: 'BRANCO', opposite: 'PRETO' },
  ];
  function normalize(t){ return t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim(); }
  function showNivel31(){
    // build section custom
    let sec = document.getElementById('nivel31');
    if(!sec){
      sec = document.createElement('section'); sec.id='nivel31'; sec.className='py-24 hidden text-center';
      sec.innerHTML = `
        <h3 class="text-xl font-bold text-orange-500">Nível 31 – Rutura</h3>
        <p class="mt-2 text-neutral-400">Regra: responde o <b>oposto</b> do que lês.</p>
        <p id="ruptQ" class="text-2xl mt-4"></p>
        <input id="ruptIn" class="mt-4 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm" placeholder="Resposta (oposta)"/>
        <button id="ruptBtn" class="ml-2 px-4 py-2 bg-green-500 text-black rounded-xl">Enviar</button>
      `;
      const sobre = document.getElementById('sobre'); sobre.parentNode.insertBefore(sec, sobre);
    }
    const pair = rupturePairs[Math.floor(Math.random()*rupturePairs.length)];
    document.getElementById('ruptQ').textContent = pair.show;
    document.getElementById('ruptIn').value='';
    document.getElementById('ruptBtn').onclick = ()=>{
      const v = normalize(document.getElementById('ruptIn').value);
      if(v === normalize(pair.opposite)){ alert('Rutura assimilada.'); avancarGenerico(32); }
      else { falha(31); }
    };
    document.querySelectorAll('section').forEach(s=>{ if(s.id && s.id.startsWith('nivel')) s.classList.add('hidden'); });
    sec.classList.remove('hidden'); goToLevel(31); playBeep(); narrar('Rutura. Inverte o impulso.');
  }

  // ===== Fase 8: Domínio (Níveis 41-50) — arrasta o bloco até o alvo =====

  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function buildLabyrinth(arena){
    // clear old walls
    [...arena.querySelectorAll('.lab-wall')].forEach(x=>x.remove());
    const walls = [];
    const w = arena.clientWidth, h = arena.clientHeight;
    const count = 3 + Math.min(6, Math.floor((loadProgress()-41)/2) );
    for(let i=0;i<count;i++){
      const ww = randInt(40, 90);
      const hh = randInt(18, 70);
      const left = randInt(10, w-ww-10);
      const top  = randInt(10, h-hh-10);
      const wall = document.createElement('div');
      wall.className='lab-wall';
      wall.style.left = left+'px'; wall.style.top = top+'px';
      wall.style.width = ww+'px'; wall.style.height = hh+'px';
      arena.appendChild(wall); walls.push(wall);
    }
    return walls;
  }
  function rect(el){ return el.getBoundingClientRect(); }
  function overlapsRect(r1, r2){
    return !(r2.left > r1.right || 
             r2.right < r1.left || 
             r2.top > r1.bottom ||
             r2.bottom < r1.top);
  }

  let dragCtx = { active:false, offsetX:0, offsetY:0 };
  function showNivel41(){
    let sec = document.getElementById('nivel41');
    if(!sec){
      sec = document.createElement('section'); sec.id='nivel41'; sec.className='py-24 hidden text-center';
      sec.innerHTML = `
        <h3 class="text-xl font-bold text-orange-500">Nível 41 – Domínio</h3>
        <p class="mt-2 text-neutral-400">Arrasta o bloco até o alvo brilhante.</p>
        <div class="drag-arena mt-6" id="dragArena">
          <div id="dragTarget" class="drag-target" style="left: 260px; top: 30px;"></div>
          <div id="dragBlock" class="draggable" style="left: 18px; top: 180px;">■</div>
        </div>
      `;
      const sobre = document.getElementById('sobre'); sobre.parentNode.insertBefore(sec, sobre);
      // bind drag events
      setTimeout(()=>{
        const walls = buildLabyrinth(arena);
        const arena = document.getElementById('dragArena');
        const block = document.getElementById('dragBlock');
        const target = document.getElementById('dragTarget');
        function within(x,y){
          const r = arena.getBoundingClientRect();
          const r = arena.getBoundingClientRect();
          const bx = Math.min(Math.max(0, x - r.left - dragCtx.offsetX), r.width - block.offsetWidth);
          const by = Math.min(Math.max(0, y - r.top - dragCtx.offsetY), r.height - block.offsetHeight);
          const prev = {left:block.offsetLeft, top:block.offsetTop};
          block.style.left = bx+'px'; block.style.top = by+'px';
          // collision with walls? revert if overlap
          const br = rect(block);
          for(const w of walls){ if(overlapsRect(br, rect(w))){ block.style.left = prev.left+'px'; block.style.top = prev.top+'px'; break; } }
        }
        block.addEventListener('pointerdown', (e)=>{
          dragCtx.active=true; block.setPointerCapture(e.pointerId);
          const br = block.getBoundingClientRect();
          dragCtx.offsetX = e.clientX - br.left;
          dragCtx.offsetY = e.clientY - br.top;
          playBeep();
        });
        block.addEventListener('pointermove', (e)=>{ if(dragCtx.active) within(e.clientX, e.clientY); });
        block.addEventListener('pointerup', ()=>{
          dragCtx.active=false;
          // check success
          const br = block.getBoundingClientRect();
          const tr = target.getBoundingClientRect();
          const centerB = { x: br.left + br.width/2, y: br.top + br.height/2 };
          const centerT = { x: tr.left + tr.width/2, y: tr.top + tr.height/2 };
          const dist = Math.hypot(centerB.x-centerT.x, centerB.y-centerT.y);
          if(dist < 40){ alert('Domínio alcançado.'); avancarGenerico(42); }
          else { /* keep trying */ }
        });
      }, 0);
    }
    document.querySelectorAll('section').forEach(s=>{ if(s.id && s.id.startsWith('nivel')) s.classList.add('hidden'); });
    sec.classList.remove('hidden'); goToLevel(41); playBeep(); narrar('Domínio. Controla o espaço.');
  }

  // ===== Fase 9: Entropia (Níveis 51-60) — caos de distrações =====

  // Noise (hiss) generator for Entropy phase
  let noiseCtx = null, noiseSrc = null, noiseGain = null;
  function startEntropyNoise(){
    try{
      noiseCtx = new (window.AudioContext||window.webkitAudioContext)();
      const bufferSize = 2 * noiseCtx.sampleRate;
      const noiseBuffer = noiseCtx.createBuffer(1, bufferSize, noiseCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) { output[i] = (Math.random() * 2 - 1) * 0.15; }
      noiseSrc = noiseCtx.createBufferSource(); noiseSrc.buffer = noiseBuffer; noiseSrc.loop = true;
      noiseGain = noiseCtx.createGain(); noiseGain.gain.value = 0.12;
      noiseSrc.connect(noiseGain); noiseGain.connect(noiseCtx.destination);
      noiseSrc.start();
    }catch(e){}
  }
  function stopEntropyNoise(){ try{ noiseSrc.stop(); noiseCtx.close(); }catch(e){} noiseSrc=null; noiseCtx=null; noiseGain=null; }

  let entropyTimer = null;
  function showNivel51(){
    let sec = document.getElementById('nivel51');
    if(!sec){
      sec = document.createElement('section'); sec.id='nivel51'; sec.className='py-24 hidden text-center';
      sec.innerHTML = `
        <h3 class="text-xl font-bold text-orange-500">Nível 51 – Entropia</h3>
        <p class="mt-2 text-neutral-400">Ignora as distrações. Clica apenas em <b>VALIDAR</b> quando aparecer.</p>
        <div id="entropyBox" class="entropy mt-6"></div>
        <p id="entropyMsg" class="mt-3 text-xs text-neutral-500">Mantém o foco.</p>
      `;
      const sobre = document.getElementById('sobre'); sobre.parentNode.insertBefore(sec, sobre);
    }
    document.querySelectorAll('section').forEach(s=>{ if(s.id && s.id.startsWith('nivel')) s.classList.add('hidden'); });
    sec.classList.remove('hidden'); goToLevel(51); playBeep(); narrar('Entropia. O foco é a arma.'); startEntropyNoise();

    const box = document.getElementById('entropyBox');
    box.innerHTML='';
    let elapsed = 0; let remaining = 10000; let penalties = 0;
    const spawn = ()=>{
      // clear old
      box.innerHTML='';
      // distractors
      for(let i=0;i<10;i++){
        const b = document.createElement('button');
        b.textContent = ['CLICA','NÃO','AQUI','XXX','####'][Math.floor(Math.random()*5)];
        b.style.left = Math.floor(Math.random()*(box.clientWidth-60))+'px';
        b.style.top  = Math.floor(Math.random()*(box.clientHeight-24))+'px';
        b.onclick = ()=>{ playBeep(); penalties++; remaining -= 1000; document.getElementById('entropyMsg').textContent = `Penalidades: ${penalties} | Tempo restante: ${Math.max(0, Math.floor(remaining/1000))}s`; };
        box.appendChild(b);
      }
      // real one (randomly every other tick)
      if(Math.random()>0.4){
        const real = document.createElement('button');
        real.className = 'real'; real.textContent='VALIDAR';
        real.style.left = Math.floor(Math.random()*(box.clientWidth-60))+'px';
        real.style.top  = Math.floor(Math.random()*(box.clientHeight-24))+'px';
        real.onclick = ()=>{ clearInterval(entropyTimer); stopEntropyNoise(); alert('Entropia contida.'); avancarGenerico(52); };
        box.appendChild(real);
      }
    };
    spawn();
    if(entropyTimer) clearInterval(entropyTimer);
    entropyTimer = setInterval(()=>{ remaining -= 800;
      elapsed += 800;
      spawn();
      if(remaining <= 0){ clearInterval(entropyTimer); stopEntropyNoise(); falha(51); }
    }, 800);
  }

  // ===== Cinematic Finale (Nível 100) =====
  let humCtx = null, humOscA=null, humOscB=null, humGain=null;
  function startHum(){
    humCtx = new (window.AudioContext||window.webkitAudioContext)();
    humOscA = humCtx.createOscillator(); humOscB = humCtx.createOscillator(); humGain = humCtx.createGain();
    humOscA.type='sine'; humOscB.type='sine';
    humOscA.frequency.value = 70; humOscB.frequency.value = 71.2;
    humGain.gain.value = 0.0001;
    humOscA.connect(humGain); humOscB.connect(humGain); humGain.connect(humCtx.destination);
    humOscA.start(); humOscB.start();
    // ramp up
    const now = humCtx.currentTime;
    humGain.gain.linearRampToValueAtTime(0.08, now + 2.5);
  }
  function stopHum(){
    try{ humOscA.stop(); humOscB.stop(); humCtx.close(); }catch(e){}
    humCtx=null; humOscA=null; humOscB=null; humGain=null;
  }
  function typewrite(el, text, speed=22){
    el.textContent='';
    let i=0;
    (function loop(){
      if(i>=text.length) return;
      el.textContent += text[i++];
      setTimeout(loop, speed);
    })();
  }
  function renderFinale(){
    const overlay = document.getElementById('finaleOverlay');
    const txt = document.getElementById('finaleText');
    overlay.style.display='flex';
    startHum();
    const elapsedMs = (Date.now() - (globalStats.startTs||Date.now()));
    const mins = Math.floor(elapsedMs/60000), secs = Math.floor((elapsedMs%60000)/1000);
    const falhas = globalStats.failCount||0;
    const reflex = globalStats.bestReflex? Math.round(globalStats.bestReflex) : null;
    const perf = reflex? (reflex<300? 'Reflexos sobre-humanos detectados.' : (reflex<600? 'Reflexos acima da média.' : 'Reflexos humanos aceitáveis.')) : 'Reflexos não medidos.';
    const speech = [
      'Protocolo concluído.',
      'A mente humana já não é suficiente.',
      'Escolhe: desligar o Núcleo…',
      '…ou fundir-te e transcender.'
    ].join('\\n\\n');
    typewrite(txt, speech, 24);
    // bind buttons
    document.getElementById('btnDesligar').onclick = ()=>{ stopHum(); finalRebelde(); overlay.style.display='none'; };
    document.getElementById('btnFundir').onclick = ()=>{ stopHum(); finalFusao(); overlay.style.display='none'; };
  }

  // Hook extra para fases 31,41,51 e final 100
  const _spawnAlvoRef3 = window.avancarGenerico;
  window.avancarGenerico = function(n){
    if(n===4){ return showNivel4(); }
    if(n===11){ return showNivel11(); }
    if(n===21){ return showNivel21(); }
    if(n===31){ return showNivel31(); }
    if(n===41){ return showNivel41(); }
    if(n===51){ return showNivel51(); }
    const out = _spawnAlvoRef3(n);
    if(n===100){ renderFinale(); }
    return out;
  };

})();