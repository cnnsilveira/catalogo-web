import { selectProducts, sourceFromSearch } from './catalog.mjs';

const categories = ['filamentos', 'impressoras', 'acessorios'];
const filtersByCategory = Object.fromEntries(categories.map(category => [category, { hideSoldOut: false }]));
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const productsElement = document.querySelector('#products');
const resultsCount = document.querySelector('#results-count');
const filterFields = document.querySelector('#filter-fields');
const filterPanel = document.querySelector('#filters');
const hideSoldOut = document.querySelector('#hide-sold-out');
const dialog = document.querySelector('#image-dialog');
let products = [];
let category = 'filamentos';

if (matchMedia('(max-width: 680px)').matches) filterPanel.open = false;

function optionValues(key) {
  return [...new Set(products.filter(product => product.category === category)
    .flatMap(product => key === 'color' ? product.colorFamilies : [product[key]])
    .filter(value => value !== null && value !== undefined && value !== ''))]
    .sort((a, b) => typeof a === 'number' ? a - b : String(a).localeCompare(String(b), 'pt-BR'));
}

function addFilter(key, label, values, placeholder, format = value => String(value)) {
  const field = document.createElement('details');
  field.className = 'multi-filter';
  field.dataset.key = key;
  const summary = document.createElement('summary');
  const caption = document.createElement('span');
  caption.className = 'multi-filter-label';
  caption.textContent = label;
  const current = document.createElement('span');
  current.className = 'multi-filter-current';
  const selected = filtersByCategory[category][key] ?? [];
  const updateSummary = () => {
    current.textContent = selected.length === 1
      ? format(values.find(value => String(value) === selected[0]))
      : selected.length ? `${selected.length} opções` : placeholder;
  };
  updateSummary();
  summary.append(caption, current);
  const options = document.createElement('div');
  options.className = 'multi-filter-options';
  options.setAttribute('role', 'group');
  options.setAttribute('aria-label', label);
  for (const value of values) {
    const option = document.createElement('label');
    option.className = 'multi-option';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = String(value);
    checkbox.checked = selected.includes(checkbox.value);
    const text = document.createElement('span');
    text.textContent = format(value);
    option.append(checkbox, text);
    options.append(option);
  }
  options.addEventListener('change', () => {
    selected.splice(0, selected.length, ...[...options.querySelectorAll('input:checked')].map(input => input.value));
    filtersByCategory[category][key] = selected;
    updateSummary();
    renderProducts();
  });
  field.addEventListener('toggle', () => {
    if (field.open) filterFields.querySelectorAll('.multi-filter[open]').forEach(other => {
      if (other !== field) other.open = false;
    });
  });
  field.append(summary, options);
  filterFields.append(field);
}

function renderFilters() {
  filterFields.replaceChildren();
  addFilter('brand', 'Marca', optionValues('brand'), 'Todas');
  if (category === 'filamentos') {
    addFilter('material', 'Material', optionValues('material'), 'Todos');
    addFilter('color', 'Cor', optionValues('color'), 'Todas');
    addFilter('weight', 'Peso', optionValues('weightGrams'), 'Todos', value => value < 1000 ? `${value} g` : `${String(value / 1000).replace('.', ',')} kg`);
  }
  hideSoldOut.checked = filtersByCategory[category].hideSoldOut;
  renderProducts();
}

function placeholder() {
  const box = document.createElement('div');
  box.className = 'product-image product-placeholder';
  const mark = document.createElement('img');
  mark.src = 'imagens/triomax-mark.svg';
  mark.alt = '';
  const caption = document.createElement('span');
  caption.textContent = 'Imagem em breve';
  box.append(mark, caption);
  return box;
}

function openImage(product) {
  document.querySelector('#dialog-image').src = product.image;
  document.querySelector('#dialog-image').alt = `Foto de ${product.name}`;
  document.querySelector('#image-dialog-title').textContent = product.name;
  dialog.showModal();
  document.querySelector('#dialog-close').focus();
}

function productCard(product) {
  const card = document.createElement('article');
  card.className = 'product-card';
  if (product.image) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'product-image-button';
    button.setAttribute('aria-label', `Ampliar foto de ${product.name}`);
    const image = document.createElement('img');
    image.src = product.image;
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', () => button.replaceWith(placeholder()), { once: true });
    button.append(image);
    button.addEventListener('click', () => openImage(product));
    card.append(button);
  } else {
    card.append(placeholder());
  }

  const info = document.createElement('div');
  info.className = 'product-info';
  const reference = document.createElement('p');
  reference.className = 'product-reference';
  reference.textContent = product.reference;
  const name = document.createElement('h2');
  name.className = 'product-name';
  name.textContent = product.name;
  const bottom = document.createElement('div');
  bottom.className = 'product-bottom';
  const price = document.createElement('span');
  price.className = `product-price${product.priceCents === 0 ? ' inquire' : ''}`;
  price.textContent = product.priceCents === 0 ? 'Consulte o valor' : money.format(product.priceCents / 100);
  const stock = document.createElement('span');
  stock.className = `stock${product.inStock ? '' : ' sold-out'}`;
  stock.textContent = product.inStock ? 'Disponível' : 'Esgotado';
  bottom.append(price, stock);
  info.append(reference, name, bottom);
  card.append(info);
  return card;
}

function renderProducts() {
  const filters = { ...filtersByCategory[category], category };
  const visible = selectProducts(products, filters);
  const activeCount = ['brand', 'material', 'color', 'weight'].reduce((count, key) => count + (filters[key]?.length ?? 0), 0) + Number(filters.hideSoldOut);
  document.querySelector('#active-filter-count').textContent = activeCount ? `· ${activeCount} ${activeCount === 1 ? 'seleção' : 'seleções'}` : '';
  resultsCount.textContent = `${visible.length} ${visible.length === 1 ? 'produto' : 'produtos'}`;
  if (!visible.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Nenhum produto encontrado com estes filtros.';
    productsElement.replaceChildren(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const product of visible) fragment.append(productCard(product));
  productsElement.replaceChildren(fragment);
}

function setCategory(next, focus = false) {
  category = next;
  for (const tab of document.querySelectorAll('[role="tab"]')) {
    const selected = tab.dataset.category === category;
    tab.setAttribute('aria-selected', selected);
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
  }
  document.querySelector('#catalog-panel').setAttribute('aria-labelledby', `tab-${category}`);
  renderFilters();
}

for (const tab of document.querySelectorAll('[role="tab"]')) {
  tab.addEventListener('click', () => setCategory(tab.dataset.category));
  tab.addEventListener('keydown', event => {
    const index = categories.indexOf(tab.dataset.category);
    const next = event.key === 'ArrowRight' ? (index + 1) % categories.length
      : event.key === 'ArrowLeft' ? (index + categories.length - 1) % categories.length
      : event.key === 'Home' ? 0 : event.key === 'End' ? categories.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    setCategory(categories[next], true);
  });
}

hideSoldOut.addEventListener('change', () => {
  filtersByCategory[category].hideSoldOut = hideSoldOut.checked;
  renderProducts();
});
document.querySelector('#clear-filters').addEventListener('click', () => {
  filtersByCategory[category] = { hideSoldOut: false };
  renderFilters();
});
document.querySelector('#dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

try {
  const source = sourceFromSearch(location.search);
  const response = await fetch(`products-${source}.json`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const snapshot = await response.json();
  if (!Array.isArray(snapshot.products)) throw new Error('Invalid product data');
  products = snapshot.products;
  document.querySelector('#snapshot-date').textContent = `Dados consultados em ${snapshot.collectedAt.split('-').reverse().join('/')} · Demonstração`;
  for (const item of categories) {
    document.querySelector(`#count-${item}`).textContent = products.filter(product => product.category === item).length;
  }
  renderFilters();
} catch (error) {
  resultsCount.textContent = '';
  const message = document.createElement('p');
  message.className = 'error';
  message.setAttribute('role', 'alert');
  message.textContent = 'Não foi possível carregar o catálogo. Recarregue a página para tentar novamente.';
  productsElement.replaceChildren(message);
  console.error('Catalog load failed:', error);
}
