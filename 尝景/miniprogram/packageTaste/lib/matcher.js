function addReason(reasons, value) {
  if (value && !reasons.includes(value)) reasons.push(value);
}

function rankFoods(foods, profile) {
  const colors = new Set(profile.color_groups || []);
  const tastes = new Set(profile.taste || []);
  const textures = new Set(profile.texture || []);

  return foods.map((food) => {
    const breakdown = {
      color: 0,
      intensity: 0,
      taste: 0,
      temperature: 0,
      texture: 0,
      season: 0,
      scene_type: 0
    };
    const reasons = [];

    if (colors.has(food.color_group_1)) breakdown.color += 3;
    if (colors.has(food.color_group_2)) breakdown.color += 1.5;
    if (breakdown.color) addReason(reasons, '接近画面配色');

    if (profile.intensity && food.intensity === profile.intensity) {
      breakdown.intensity = 1.5;
      addReason(reasons, `同样${profile.intensity}`);
    }
    if (tastes.has(food.taste)) {
      breakdown.taste = 2;
      addReason(reasons, `联想到${food.taste}`);
    }
    if (profile.temperature && food.temperature === profile.temperature) {
      breakdown.temperature = 1.5;
      addReason(reasons, `画面像${food.temperature}的温度`);
    }
    if (textures.has(food.texture)) {
      breakdown.texture = 1.5;
      addReason(reasons, `带着${food.texture}的质感`);
    }
    if (profile.season && (food.season === profile.season || food.season === 'all')) {
      breakdown.season = 0.75;
    }
    if (profile.scene_type && food.scene_type === profile.scene_type) {
      breakdown.scene_type = 1.5;
      addReason(reasons, '贴近这一刻的场景');
    }

    const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
    return { food, score, reasons: reasons.slice(0, 3), breakdown };
  }).sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    return String(left.food.food_code).localeCompare(String(right.food.food_code));
  });
}

function selectRecommendation(ranked) {
  return ranked.length ? ranked[0] : null;
}

module.exports = { rankFoods, selectRecommendation };
