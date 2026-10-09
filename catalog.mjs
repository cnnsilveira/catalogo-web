export function selectProducts(products, filters = {}) {
  return products.filter(product =>
    (!filters.category || product.category === filters.category) &&
    (!filters.brand?.length || filters.brand.includes(product.brand)) &&
    (!filters.material?.length || filters.material.includes(product.material)) &&
    (!filters.color?.length || filters.color.some(color => product.colorFamilies?.includes(color))) &&
    (!filters.weight?.length || filters.weight.some(weight => product.weightGrams === Number(weight))) &&
    (!filters.hideSoldOut || product.inStock)
  ).sort((a, b) =>
    Number(b.inStock) - Number(a.inStock) ||
    a.name.localeCompare(b.name, 'pt-BR')
  );
}

export function sourceFromSearch(search) {
  return new URLSearchParams(search).get('dados') === 'crm' ? 'crm' : 'corrigido';
}
