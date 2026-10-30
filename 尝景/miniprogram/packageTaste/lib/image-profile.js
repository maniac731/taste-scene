const COLOR_TOKENS = {
  red: ['红', '粉'], orange: ['橙'], yellow: ['黄'], green: ['绿'],
  blue: ['蓝'], purple: ['紫'], brown: ['棕'], black: ['黑'], white: ['白']
};

const COLOR_TEXT = {
  red: '温柔又醒目的红', orange: '带着暖意的橙', yellow: '被阳光照亮的黄',
  green: '有呼吸感的绿', blue: '清透安静的蓝', purple: '朦胧的紫',
  brown: '沉稳温暖的棕', black: '低照度的深色', white: '轻盈柔软的浅色'
};

function fallbackProfile() {
  return {
    color: 'white', color_groups: ['白'], brightness: 'balanced', intensity: '平衡',
    taste: [], texture: [], temperature: '', season: '', scene_type: ''
  };
}

function profileFromPixels(data) {
  let r = 0; let g = 0; let b = 0; let count = 0; let brightnessTotal = 0;
  for (let index = 0; index < data.length; index += 16) {
    if (data[index + 3] < 180) continue;
    r += data[index]; g += data[index + 1]; b += data[index + 2]; count += 1;
    brightnessTotal += (data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114) / 255;
  }
  if (!count) return fallbackProfile();

  r /= count; g /= count; b /= count;
  const max = Math.max(r, g, b); const min = Math.min(r, g, b);
  const lightness = (max + min) / 510;
  const saturation = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
  let hue = 0;
  if (max !== min) {
    if (max === r) hue = 60 * (((g - b) / (max - min)) % 6);
    else if (max === g) hue = 60 * ((b - r) / (max - min) + 2);
    else hue = 60 * ((r - g) / (max - min) + 4);
    if (hue < 0) hue += 360;
  }

  let color = 'red';
  if (lightness < 0.18) color = 'black';
  else if ((lightness > 0.82 && saturation < 0.24) || saturation < 0.12) color = 'white';
  else if (hue < 18 || hue >= 345) color = 'red';
  else if (hue < 45) color = hue < 28 ? 'orange' : 'brown';
  else if (hue < 72) color = 'yellow';
  else if (hue < 165) color = 'green';
  else if (hue < 255) color = 'blue';
  else if (hue < 345) color = 'purple';

  return {
    color,
    color_groups: COLOR_TOKENS[color] || ['多色'],
    brightness: brightnessTotal / count > 0.65 ? 'bright' : brightnessTotal / count < 0.35 ? 'dark' : 'balanced',
    intensity: saturation > 0.5 ? '浓郁' : saturation < 0.22 ? '轻盈' : '平衡',
    taste: [], texture: [], temperature: '', season: '', scene_type: ''
  };
}

function visualReading(profile, source) {
  if (source === 'ai' && profile.visual_summary) return profile.visual_summary;
  const lightText = profile.brightness === 'bright'
    ? '和通透的光'
    : profile.brightness === 'dark' ? '和安静的阴影' : '与柔和的明暗';
  return `${COLOR_TEXT[profile.color] || '柔和的画面'}，${lightText}`;
}

module.exports = { fallbackProfile, profileFromPixels, visualReading };
