/**
 * Rank foods from a normalized image profile.
 * Visible ingredients are strong evidence, but never a hard filter.
 */
export function rankFoods(foods, profile = {}, options = {}) {
  const random = options.random ?? Math.random;
  const limit = options.limit ?? 8;
  const detected = normalizeDetectedIngredients(profile.ingredients, options.ingredientAliases);
  const colorGroups = new Set(profile.color_groups ?? []);
  const scenes = new Set(profile.scene_affinity ?? []);

  return foods
    .map((food) => {
      let score = 0;
      const reasons = [];
      const breakdown = { ingredients: 0, color: 0, scene: 0, intensity: 0, season: 0, scene_type: 0, surprise: 0 };

      const matchedIngredients = detected.filter(({ name }) => (food.ingredient_tags ?? []).includes(name));
      matchedIngredients.forEach(({ name, confidence }, index) => {
        const points = (index === 0 ? 8 : 4) * confidence;
        breakdown.ingredients += points;
        reasons.push(`画面中的${name}`);
      });
      breakdown.ingredients = Math.min(12, breakdown.ingredients);

      if (colorGroups.has(food.color_group_1)) breakdown.color += 2.5;
      if (colorGroups.has(food.color_group_2)) breakdown.color += 1.25;
      if (breakdown.color > 0) reasons.push('接近画面配色');

      const sceneMatches = food.scene_affinity.filter((tag) => scenes.has(tag));
      breakdown.scene = Math.min(5, sceneMatches.length * 2.5);
      if (sceneMatches.length) reasons.push(`贴近${sceneMatches.slice(0, 2).join('、')}场景`);

      if (profile.intensity && food.intensity === profile.intensity) breakdown.intensity = 1.5;
      if (profile.season && (food.season === profile.season || food.season === 'all')) breakdown.season = 1;
      if (profile.scene_type && food.scene_type === profile.scene_type) breakdown.scene_type = 2;

      breakdown.surprise = random() * 0.9;
      score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
      return { food, score, reasons: [...new Set(reasons)].slice(0, 3), breakdown };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function selectRecommendation(ranked, random = Math.random) {
  if (!ranked.length) return null;
  const candidates = ranked.slice(0, Math.min(5, ranked.length));
  const best = candidates[0].score;
  const weights = candidates.map((item) => Math.exp((item.score - best) / 2.8));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = random() * total;
  for (let index = 0; index < candidates.length; index += 1) {
    roll -= weights[index];
    if (roll <= 0) return candidates[index];
  }
  return candidates[0];
}

function normalizeDetectedIngredients(ingredients, aliases = {}) {
  const unique = new Map();
  for (const item of Array.isArray(ingredients) ? ingredients : []) {
    const rawName = typeof item === 'string' ? item : item?.name;
    const confidence = typeof item === 'string' ? 1 : item?.confidence;
    if (typeof rawName !== 'string' || typeof confidence !== 'number' || !Number.isFinite(confidence) || confidence < 0.55 || confidence > 1) continue;
    const trimmed = rawName.trim();
    if (!trimmed) continue;
    const name = Object.hasOwn(aliases, trimmed) ? aliases[trimmed] : trimmed;
    unique.set(name, Math.max(unique.get(name) ?? 0, confidence));
  }
  return [...unique].map(([name, confidence]) => ({ name, confidence }))
    .sort((a, b) => b.confidence - a.confidence);
}
