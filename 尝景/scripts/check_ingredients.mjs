import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rankFoods } from '../lib/matcher.mjs';

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const { foods } = read('../data/foods-clean.json');
const original = read('../data/foods-full.json').foods;
const taxonomy = read('../data/taxonomy.json');
const options = { random: () => 0, limit: foods.length, ingredientAliases: taxonomy.ingredient_aliases };
const tags = (id) => foods.find(f => f.food_id === id).ingredient_tags;
assert.equal(foods.length, 406);
assert.equal(new Set(foods.map(f => f.food_id)).size, 406);
for (const food of foods) {
  assert.deepEqual(food.asset, original.find(f => f.food_id === food.food_id).asset);
  assert.equal(new Set(food.ingredient_tags).size, food.ingredient_tags.length);
  assert.ok(food.ingredient_tags.every(t => taxonomy.ingredient_tags.includes(t)));
}
assert.ok(tags(63).includes('燕麦') && !tags(63).includes('牛奶'));
assert.ok(tags(134).includes('海底椰') && !tags(134).includes('椰子'));
assert.ok(tags(170).includes('蟹柳') && !tags(170).includes('蟹'));
assert.ok(!tags(219).includes('虾'));
assert.ok(!tags(362).includes('猪肉'));
const rank = ingredients => rankFoods(foods, { ingredients }, options);
assert.deepEqual(rank(['菠萝']), rank(['凤梨', '菠萝', '菠萝']));
assert.deepEqual(rank([]), rank([{ name: '菠萝', confidence: 0.54 }, { name: '虾', confidence: Infinity }, { name: '苹果' }]));
assert.deepEqual(rank([]), rank(null));
assert.ok(rank(['苹果']).slice(0, 5).every(r => r.food.ingredient_tags.includes('苹果')));
assert.ok(rank(['菠萝', '虾'])[0].food.ingredient_tags.includes('菠萝'));
assert.ok(rank(['菠萝', '虾'])[0].food.ingredient_tags.includes('虾'));
const empty = foods.filter(f => !f.ingredient_tags.length);
console.log(JSON.stringify({ records: foods.length, tagged: foods.length - empty.length, pending: empty.length, checks: 'passed' }));
