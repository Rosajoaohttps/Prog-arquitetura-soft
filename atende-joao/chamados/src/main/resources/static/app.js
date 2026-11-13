/* Atende+ — frontend da central de chamados (consome a API REST do Spring Boot). */
const API = '';
const state = { tickets: [], clients: [], technicians: [], categories: [], loadErrors: {}, page: 'dashboard' };
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const labels = {
  ABERTO: 'Aberto', EM_ATENDIMENTO: 'Em atendimento', AGUARDANDO_CLIENTE: 'Aguardando cliente', FECHADO: 'Fechado',
  BAIXA: 'Baixa', MEDIA: 'Média', ALTA: 'Alta', CRITICA: 'Crítica'
};
const perfilLabels = { TECNICO: 'Técnico', ADMIN: 'Admin' };
const AUTOR_PADRAO = 'João';

/* ---------- API ---------- */
async function api(path, opts = {}) {
  const r = await fetch(API + path, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  if (!r.ok) {
    let msg = `Erro ${r.status}`;
    try {
      const d = await r.json();
      msg = d.erro || d.message || d.detail || msg;
      if (Array.isArray(d.detalhes) && d.detalhes.length) msg += ` (${d.detalhes.join('; ')})`;
    } catch { /* corpo sem JSON */ }
    throw new Error(msg);
  }
  if (r.status === 204) return null;
  return r.json();
}

/** Aceita array puro, página Spring ({content}) ou HAL ({_embedded:{x:[...]}}). */
function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  if (Array.isArray(data.content)) return data.content;
  if (data._embedded && typeof data._embedded === 'object') {
    const lista = Object.values(data._embedded).find(Array.isArray);
    if (lista) return lista;
  }
  return [];
}

/* ---------- Utilidades de interface ---------- */
let noticeTimer;
function notify(msg, type = 'success') {
  const n = $('#notice');
  n.textContent = msg;
  n.className = `notice ${type}`;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => n.classList.add('hidden'), 4500);
}
function date(v) { return v ? new Date(v).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'; }
function pill(v) { return `<span class="pill status-${esc(v)}">${esc(labels[v] || v || '—')}</span>`; }
function table(headers, rows) { return `<table class="data-table"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows || ''}</tbody></table>`; }
function empty(msg) { return `<div class="empty">${msg}</div>`; }

/* ---------- Carga de dados (cada recurso é independente) ---------- */
const SOURCES = [
  { key: 'tickets', path: '/chamados?size=100&sort=dataAbertura,desc', label: 'chamados' },
  { key: 'clients', path: '/clientes', label: 'clientes' },
  { key: 'technicians', path: '/tecnicos', label: 'técnicos' },
  { key: 'categories', path: '/categorias', label: 'categorias' }
];

/** Recarrega tudo com Promise.allSettled: uma falha não impede a atualização das demais listas. */
async function loadAll({ quiet = false } = {}) {
  const results = await Promise.allSettled(SOURCES.map(s => api(s.path)));
  state.loadErrors = {};
  results.forEach((r, i) => {
    const s = SOURCES[i];
    if (r.status === 'fulfilled') state[s.key] = normalizeList(r.value);
    else state.loadErrors[s.key] = r.reason?.message || 'erro desconhecido';
  });
  renderAll();
  const falhas = SOURCES.filter(s => state.loadErrors[s.key]);
  if (falhas.length) {
    if (!quiet) notify(`Não foi possível carregar: ${falhas.map(s => `${s.label} (${state.loadErrors[s.key]})`).join(', ')}.`, 'error');
    if (state.loadErrors.tickets) $('#recent-list').innerHTML = empty('Não foi possível carregar os chamados.');
  }
  return falhas.length === 0;
}

/** Insere/atualiza o registro devolvido pela API no estado local, sem depender de novo GET. */
function upsert(key, item) {
  if (!item || item.id == null) return;
  const i = state[key].findIndex(x => x.id === item.id);
  if (i >= 0) state[key][i] = item; else state[key].push(item);
}

/* ---------- Renderização ---------- */
function renderAll() {
  const t = state.tickets;
  $('#stat-total').textContent = t.length;
  $('#stat-open').textContent = t.filter(x => x.status === 'ABERTO').length;
  $('#stat-progress').textContent = t.filter(x => x.status === 'EM_ATENDIMENTO' || x.status === 'AGUARDANDO_CLIENTE').length;
  $('#stat-closed').textContent = t.filter(x => x.status === 'FECHADO').length;
  $('#nav-count').textContent = t.filter(x => x.status !== 'FECHADO').length;
  renderRecent(); renderTickets(); renderClients(); renderTechnicians(); renderCategories();
}
function renderRecent() {
  const rows = state.tickets.slice(0, 6).map(x => `<tr><td class="ticket-title">#${x.id} · ${esc(x.titulo)}</td><td>${esc(x.clienteNome)}</td><td>${pill(x.status)}</td><td>${date(x.dataAbertura)}</td></tr>`).join('');
  $('#recent-list').innerHTML = rows ? table(['CHAMADO', 'CLIENTE', 'STATUS', 'ABERTURA'], rows) : empty('Nenhum chamado cadastrado ainda.');
}
function renderTickets() {
  const q = ($('#ticket-search')?.value || '').toLowerCase(), s = $('#status-filter')?.value || '', p = $('#priority-filter')?.value || '';
  const list = state.tickets.filter(x => (!s || x.status === s) && (!p || x.prioridade === p) &&
    `${x.titulo} ${x.clienteNome} ${x.categoriaNome} ${x.tecnicoNome || ''}`.toLowerCase().includes(q));
  const rows = list.map(x => `<tr><td class="ticket-title">#${x.id} · ${esc(x.titulo)}</td><td>${esc(x.clienteNome)}</td><td>${esc(x.categoriaNome)}</td><td><span class="priority-${esc(x.prioridade)}">${esc(labels[x.prioridade] || x.prioridade)}</span></td><td>${pill(x.status)}</td><td>${esc(x.tecnicoNome || 'Não atribuído')}</td><td><button class="action-btn" onclick="viewTicket(${x.id})">Detalhes</button><button class="action-btn" onclick="editTicket(${x.id})">Editar</button></td></tr>`).join('');
  $('#tickets-list').innerHTML = rows ? table(['CHAMADO', 'CLIENTE', 'CATEGORIA', 'PRIORIDADE', 'STATUS', 'TÉCNICO', 'AÇÕES'], rows) : empty('Nenhum chamado encontrado.');
}
function renderClients() {
  const rows = state.clients.map(x => `<tr><td class="ticket-title">${esc(x.nome)}</td><td>${esc(x.email)}</td><td>${esc(x.telefone || '—')}</td><td><button class="action-btn" onclick="editEntity('client',${x.id})">Editar</button><button class="action-btn danger" onclick="removeEntity('clientes',${x.id})">Excluir</button></td></tr>`).join('');
  $('#clients-list').innerHTML = rows ? table(['NOME', 'E-MAIL', 'TELEFONE', 'AÇÕES'], rows) : empty('Nenhum cliente cadastrado.');
}
function renderTechnicians() {
  const rows = state.technicians.map(x => `<tr><td class="ticket-title">${esc(x.nome)}</td><td>${esc(x.email)}</td><td>${esc(perfilLabels[x.perfil] || x.perfil)}</td><td><button class="action-btn" onclick="editEntity('technician',${x.id})">Editar</button><button class="action-btn danger" onclick="removeEntity('tecnicos',${x.id})">Excluir</button></td></tr>`).join('');
  $('#technicians-list').innerHTML = rows ? table(['NOME', 'E-MAIL', 'PERFIL', 'AÇÕES'], rows) : empty('Nenhum técnico cadastrado.');
}
function renderCategories() {
  const rows = state.categories.map(x => `<tr><td class="ticket-title">${esc(x.nome)}</td><td>${esc(x.descricao || '—')}</td><td><button class="action-btn" onclick="editEntity('category',${x.id})">Editar</button><button class="action-btn danger" onclick="removeEntity('categorias',${x.id})">Excluir</button></td></tr>`).join('');
  $('#categories-list').innerHTML = rows ? table(['NOME', 'DESCRIÇÃO', 'AÇÕES'], rows) : empty('Nenhuma categoria cadastrada.');
}

/* ---------- Navegação ---------- */
const pageNames = {
  dashboard: ['Visão geral', 'Acompanhe o desempenho e mantenha tudo sob controle.'],
  tickets: ['Chamados', 'Acompanhe, filtre e gerencie as solicitações.'],
  clients: ['Clientes', 'Gerencie os clientes cadastrados na plataforma.'],
  technicians: ['Técnicos', 'Gerencie a equipe responsável pelos atendimentos.'],
  categories: ['Categorias', 'Organize os chamados por tipo de solicitação.']
};
function go(page) {
  state.page = page;
  $$('.page').forEach(x => x.classList.add('hidden'));
  $(`#${page}-page`).classList.remove('hidden');
  $$('.nav-item').forEach(x => x.classList.toggle('active', x.dataset.page === page));
  $('#breadcrumb').textContent = pageNames[page][0];
  $('#page-title').textContent = pageNames[page][0];
  $('#page-subtitle').textContent = pageNames[page][1];
  $('#new-ticket').classList.toggle('hidden', page !== 'dashboard' && page !== 'tickets');
}
$$('.nav-item').forEach(b => b.addEventListener('click', () => go(b.dataset.page)));
$$('[data-goto]').forEach(b => b.addEventListener('click', () => go(b.dataset.goto)));
$('#refresh').onclick = async () => { if (await loadAll()) notify('Dados atualizados.'); };
$('#ticket-search').addEventListener('input', renderTickets);
$('#status-filter').onchange = renderTickets;
$('#priority-filter').onchange = renderTickets;

/* ---------- Modal e formulários ---------- */
function closeModal() { $('#modal').classList.add('hidden'); }
$$('[data-close]').forEach(x => x.addEventListener('click', closeModal));

function openModal(title, fields, onSave) {
  $('#modal-title').textContent = title;
  $('#modal-fields').innerHTML = fields;
  $('#modal-submit').classList.remove('hidden');
  $('#modal').classList.remove('hidden');
  $('#modal-form').onsubmit = async e => {
    e.preventDefault();
    const data = {};
    new FormData(e.target).forEach((v, k) => { data[k] = v; });
    try {
      await onSave(data);
      closeModal();
      renderAll(); // mostra imediatamente o que a API devolveu
      if (await loadAll({ quiet: true })) notify('Registro salvo com sucesso.');
      else notify('Registro salvo, mas nem todas as listas puderam ser atualizadas. Use o botão ↻.', 'error');
    } catch (err) { notify(err.message, 'error'); }
  };
}

function field(name, label, type = 'text', opts = {}) {
  const req = opts.required === false ? '' : 'required';
  let control;
  if (type === 'select') {
    control = `<select name="${name}" ${req} class="form-control">${opts.options.map(o => `<option value="${esc(o.value)}" ${String(o.value) === String(opts.value) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`;
  } else if (type === 'textarea') {
    control = `<textarea name="${name}" ${req} placeholder="${esc(opts.placeholder || '')}">${esc(opts.value || '')}</textarea>`;
  } else {
    control = `<input name="${name}" type="${type}" ${req} placeholder="${esc(opts.placeholder || '')}" value="${esc(opts.value || '')}">`;
  }
  return `<div class="field ${opts.full ? 'full' : ''}"><label>${label}</label>${control}</div>`;
}

function ticketFields(x = {}) {
  return field('titulo', 'Título', 'text', { full: true, value: x.titulo })
    + field('descricao', 'Descrição', 'textarea', { full: true, required: false, value: x.descricao })
    + field('prioridade', 'Prioridade', 'select', { value: x.prioridade || 'MEDIA', options: ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'].map(v => ({ value: v, label: labels[v] })) })
    + field('clienteId', 'Cliente', 'select', { value: x.clienteId, options: state.clients.map(v => ({ value: v.id, label: v.nome })) })
    + field('categoriaId', 'Categoria', 'select', { value: x.categoriaId, options: state.categories.map(v => ({ value: v.id, label: v.nome })) });
}
/** Corpo esperado por POST/PUT /chamados: { titulo, descricao, prioridade, clienteId, categoriaId }. */
function ticketPayload(d) {
  return { titulo: d.titulo, descricao: d.descricao || null, prioridade: d.prioridade, clienteId: Number(d.clienteId), categoriaId: Number(d.categoriaId) };
}

$('#new-ticket').onclick = async () => {
  await loadAll({ quiet: true }); // garante listas atuais antes de decidir
  const erroDep = ['clients', 'categories'].filter(k => state.loadErrors[k]);
  if (erroDep.length) {
    notify(`Não foi possível carregar ${erroDep.map(k => SOURCES.find(s => s.key === k).label).join(' e ')}: ${state.loadErrors[erroDep[0]]}.`, 'error');
    return;
  }
  const faltam = [];
  if (!state.clients.length) faltam.push('um cliente');
  if (!state.categories.length) faltam.push('uma categoria');
  if (faltam.length) { notify(`Cadastre ${faltam.join(' e ')} antes de abrir um chamado.`, 'error'); return; }
  openModal('Abrir novo chamado', ticketFields(), async d => {
    const criado = await api('/chamados', { method: 'POST', body: JSON.stringify(ticketPayload(d)) });
    upsert('tickets', criado);
    state.tickets.sort((a, b) => String(b.dataAbertura).localeCompare(String(a.dataAbertura)));
  });
};

$('#add-client').onclick = () => openModal('Novo cliente',
  field('nome', 'Nome') + field('email', 'E-mail', 'email') + field('telefone', 'Telefone', 'text', { required: false }),
  async d => upsert('clients', await api('/clientes', { method: 'POST', body: JSON.stringify({ nome: d.nome, email: d.email, telefone: d.telefone || null }) })));

$('#add-technician').onclick = () => openModal('Novo técnico',
  field('nome', 'Nome') + field('email', 'E-mail', 'email') + field('perfil', 'Perfil', 'select', { options: Object.entries(perfilLabels).map(([value, label]) => ({ value, label })) }),
  async d => upsert('technicians', await api('/tecnicos', { method: 'POST', body: JSON.stringify(d) })));

$('#add-category').onclick = () => openModal('Nova categoria',
  field('nome', 'Nome') + field('descricao', 'Descrição', 'textarea', { full: true, required: false }),
  async d => upsert('categories', await api('/categorias', { method: 'POST', body: JSON.stringify({ nome: d.nome, descricao: d.descricao || null }) })));

window.editEntity = (type, id) => {
  const cfg = {
    client: { path: 'clientes', list: state.clients, title: 'Editar cliente', key: 'clients' },
    technician: { path: 'tecnicos', list: state.technicians, title: 'Editar técnico', key: 'technicians' },
    category: { path: 'categorias', list: state.categories, title: 'Editar categoria', key: 'categories' }
  }[type];
  const x = cfg.list.find(v => v.id === id);
  if (!x) return;
  let fields;
  if (type === 'client') {
    fields = field('nome', 'Nome', 'text', { value: x.nome }) + field('email', 'E-mail', 'email', { value: x.email }) + field('telefone', 'Telefone', 'text', { value: x.telefone || '', required: false });
  } else if (type === 'technician') {
    fields = field('nome', 'Nome', 'text', { value: x.nome }) + field('email', 'E-mail', 'email', { value: x.email }) + field('perfil', 'Perfil', 'select', { value: x.perfil, options: Object.entries(perfilLabels).map(([value, label]) => ({ value, label })) });
  } else {
    fields = field('nome', 'Nome', 'text', { value: x.nome }) + field('descricao', 'Descrição', 'textarea', { value: x.descricao || '', full: true, required: false });
  }
  openModal(cfg.title, fields, async d => {
    if (d.telefone === '') d.telefone = null;
    upsert(cfg.key, await api(`/${cfg.path}/${id}`, { method: 'PUT', body: JSON.stringify(d) }));
  });
};

window.removeEntity = async (path, id) => {
  if (!confirm('Deseja realmente excluir este registro?')) return;
  try {
    await api(`/${path}/${id}`, { method: 'DELETE' });
    notify('Registro excluído.');
    await loadAll({ quiet: true });
  } catch (e) { notify(e.message, 'error'); }
};

window.editTicket = id => {
  const x = state.tickets.find(v => v.id === id);
  if (!x) return;
  openModal(`Editar chamado #${id}`, ticketFields(x), async d => {
    upsert('tickets', await api(`/chamados/${id}`, { method: 'PUT', body: JSON.stringify(ticketPayload(d)) }));
  });
};

window.viewTicket = async id => {
  try {
    const [x, comentarios] = await Promise.all([api(`/chamados/${id}`), api(`/chamados/${id}/comentarios`)]);
    const comments = normalizeList(comentarios);
    $('#modal-title').textContent = `Chamado #${id}`;
    $('#modal-fields').innerHTML = `<div class="detail-grid full"><div class="detail-box"><small>TÍTULO</small><strong>${esc(x.titulo)}</strong></div><div class="detail-box"><small>STATUS</small><strong>${esc(labels[x.status] || x.status)}</strong></div><div class="detail-box"><small>CLIENTE</small><strong>${esc(x.clienteNome)}</strong></div><div class="detail-box"><small>CATEGORIA / PRIORIDADE</small><strong>${esc(x.categoriaNome)} · ${esc(labels[x.prioridade] || x.prioridade)}</strong></div><div class="detail-box"><small>TÉCNICO</small><strong>${esc(x.tecnicoNome || 'Não atribuído')}</strong></div><div class="detail-box"><small>ABERTURA</small><strong>${date(x.dataAbertura)}</strong></div></div>`
      + `<div class="field full" style="margin-top:14px"><label>DESCRIÇÃO</label><div class="detail-box">${esc(x.descricao || 'Sem descrição')}</div></div>`
      + `<div class="field full" style="margin-top:14px"><label>ATRIBUIR TÉCNICO</label><select id="assign-tech" class="form-control">${state.technicians.map(t => `<option value="${t.id}" ${t.id === x.tecnicoId ? 'selected' : ''}>${esc(t.nome)}</option>`).join('')}</select><button type="button" class="secondary-btn" style="margin-top:7px" id="assign-btn" ${state.technicians.length ? '' : 'disabled'}>${state.technicians.length ? 'Atribuir técnico' : 'Cadastre um técnico primeiro'}</button></div>`
      + `<div class="field full" style="margin-top:14px"><label>ATUALIZAR STATUS</label><select id="change-status" class="form-control">${['ABERTO', 'EM_ATENDIMENTO', 'AGUARDANDO_CLIENTE', 'FECHADO'].map(s => `<option value="${s}" ${s === x.status ? 'selected' : ''}>${labels[s]}</option>`).join('')}</select><button type="button" class="secondary-btn" style="margin-top:7px" id="status-btn">Atualizar status</button></div>`
      + `<div class="field full" style="margin-top:14px"><label>COMENTÁRIOS (${comments.length})</label>${comments.map(c => `<div class="detail-box" style="margin-bottom:6px"><strong>${esc(c.autor)}</strong><small>${date(c.data)}</small>${esc(c.texto)}</div>`).join('') || '<div class="muted">Nenhum comentário.</div>'}<input id="comment-author" placeholder="Seu nome" value="${esc(AUTOR_PADRAO)}" style="margin-top:8px"><textarea id="comment-text" placeholder="Escreva um comentário..." style="margin-top:7px"></textarea><button type="button" class="secondary-btn" style="margin-top:7px" id="comment-btn">Adicionar comentário</button></div>`;
    $('#modal-form').onsubmit = e => e.preventDefault();
    $('#modal').classList.remove('hidden');
    $('#modal-submit').classList.add('hidden'); // openModal volta a exibir o botão
    const acao = (msg, fn) => async () => {
      try { await fn(); closeModal(); notify(msg); await loadAll({ quiet: true }); } catch (e) { notify(e.message, 'error'); }
    };
    $('#assign-btn').onclick = acao('Técnico atribuído.', () => api(`/chamados/${id}/atribuir`, { method: 'PATCH', body: JSON.stringify({ tecnicoId: Number($('#assign-tech').value) }) }));
    $('#status-btn').onclick = acao('Status atualizado.', () => api(`/chamados/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: $('#change-status').value }) }));
    $('#comment-btn').onclick = acao('Comentário adicionado.', () => api(`/chamados/${id}/comentarios`, { method: 'POST', body: JSON.stringify({ autor: $('#comment-author').value, texto: $('#comment-text').value }) }));
  } catch (e) { notify(e.message, 'error'); }
};

loadAll();
