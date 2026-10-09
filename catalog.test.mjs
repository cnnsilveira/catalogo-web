import assert from 'node:assert/strict';
import test from 'node:test';
import { selectProducts, sourceFromSearch } from './catalog.mjs';

const products = [
  { id: 1, name: 'Azul esgotado', category: 'filamentos', brand: 'Fusionx', material: 'PLA', colorFamilies: ['Azul'], weightGrams: 1000, inStock: false },
  { id: 2, name: 'Verde disponível', category: 'filamentos', brand: 'Fusionx', material: 'PLA', colorFamilies: ['Verde'], weightGrams: 1000, inStock: true },
  { id: 3, name: 'Azul disponível', category: 'filamentos', brand: 'Masterprint', material: 'PLA', colorFamilies: ['Azul', 'Verde'], weightGrams: 500, inStock: true },
  { id: 4, name: 'Impressora', category: 'impressoras', brand: 'Bambu Lab', inStock: false },
];

test('combines choices within a field with OR and fields with AND, keeping sold out products last', () => {
  assert.deepEqual(selectProducts(products, { category: 'filamentos', brand: ['Fusionx', 'Masterprint'], color: ['Azul'] }).map(({ id }) => id), [3, 1]);
  assert.deepEqual(selectProducts(products, { category: 'filamentos', brand: ['Fusionx'], color: ['Azul', 'Verde'], weight: ['1000'], hideSoldOut: true }).map(({ id }) => id), [2]);
  assert.deepEqual(selectProducts(products, { category: 'impressoras' }).map(({ id }) => id), [4]);
});

test('uses the corrected data unless the GET parameter selects CRM', () => {
  assert.equal(sourceFromSearch('?dados=crm'), 'crm');
  assert.equal(sourceFromSearch('?dados=corrigido'), 'corrigido');
  assert.equal(sourceFromSearch('?dados=outro'), 'corrigido');
  assert.equal(sourceFromSearch(''), 'corrigido');
});
