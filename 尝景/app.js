const views = {
  upload: document.querySelector('#upload-view'),
  analysis: document.querySelector('#analysis-view'),
  result: document.querySelector('#result-view'),
};

const $ = (selector) => document.querySelector(selector);
const canvas = $('#analysis-canvas');
const context = canvas.getContext('2d', { willReadFrequently: true });
let foods = [];
let sourceImageUrl = '';
let currentResult = null;

const colorGroups = {
  red: ['红', '粉'], orange: ['橙'], yellow: ['黄'], green: ['绿'],
  blue: ['蓝'], purple: ['紫'], brown: ['棕'], black: ['黑'], white: ['白']
};

function showView(name) {
  Object.entries(views).forEach(([key, view]) => { view.hidden = key !== name; });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadFoods() {
  const response = await fetch('./data/foods.json');
  if (!response.ok) throw new Error('食物数据库读取失败');
  foods = await response.json();
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('照片读取失败'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('照片格式暂不支持'));
    image.src = src;
  });
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > .5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h: h * 360, s, l };
}

function getColorName({ h, s, l }) {
  if (l < .17) return 'black';
  if (l > .82 && s < .22) return 'white';
  if (s < .18) return l < .48 ? 'black' : 'white';
  if (h < 18 || h >= 345) return 'red';
  if (h < 45) return h < 28 ? 'orange' : 'brown';
  if (h < 72) return 'yellow';
  if (h < 165) return 'green';
  if (h < 255) return 'blue';
  if (h < 345) return 'purple';
  return 'red';
}

function analyseImage(image) {
  const size = 96;
  canvas.width = size;
  canvas.height = size;
  context.drawImage(image, 0, 0, size, size);
  const { data } = context.getImageData(0, 0, size, size);
  let r = 0, g = 0, b = 0, count = 0, contrast = 0;
  const samples = [];
  for (let i = 0; i < data.length; i += 16) {
    const alpha = data[i + 3];
    if (alpha < 200) continue;
    r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
    samples.push((data[i] * .299 + data[i + 1] * .587 + data[i + 2] * .114) / 255);
  }
  r /= count; g /= count; b /= count;
  const hsl = rgbToHsl(r, g, b);
  samples.forEach((value) => { contrast += Math.abs(value - hsl.l); });
  contrast /= samples.length;
  const color = getColorName(hsl);
  const brightness = hsl.l > .66 ? 'bright' : hsl.l < .35 ? 'dark' : 'balanced';
  const intensity = hsl.s > .52 || contrast > .24 ? '浓郁' : hsl.s < .24 ? '轻盈' : '平衡';
  const temperature = ['red','orange','yellow','brown'].includes(color) ? 'warm' : ['blue','green','purple'].includes(color) ? 'cool' : 'neutral';
  return { ...hsl, color, brightness, intensity, temperature, contrast, rgb: [r,g,b] };
}

function matchesColor(food, color) {
  return [...colorGroups[color]].some((token) => food.color_group_1.includes(token) || food.color_group_2.includes(token));
}

function scoreFoods(profile) {
  return foods.map((food) => {
    let score = 0;
    if (matchesColor(food, profile.color)) score += 4;
    if (food.intensity === profile.intensity) score += 2;
    if (profile.temperature === 'cool' && ['冰爽','微凉'].includes(food.temperature)) score += 1.8;
    if (profile.temperature === 'warm' && ['温热','滚烫'].includes(food.temperature)) score += 1.8;
    if (profile.brightness === 'bright' && ['fresh','relaxed','celebration'].includes(food.scene_type)) score += 1.2;
    if (profile.brightness === 'dark' && ['comfort','social'].includes(food.scene_type)) score += 1.2;
    score += Math.random() * 1.25;
    return { food, score };
  }).sort((a, b) => b.score - a.score);
}

function chooseResult(profile) {
  const top = scoreFoods(profile).slice(0, Math.min(4, foods.length));
  const weights = [0.52, 0.25, 0.15, 0.08];
  let roll = Math.random();
  let index = 0;
  while (index < top.length - 1 && roll > weights[index]) { roll -= weights[index]; index++; }
  return top[index].food;
}

function describeVisual(profile) {
  const colorText = { red:'偏红的色彩', orange:'温暖的橙色', yellow:'明亮的黄色', green:'清新的绿色', blue:'偏蓝的冷色', purple:'安静的紫色', brown:'沉稳的棕色', black:'深色阴影', white:'轻柔的浅色' }[profile.color];
  const lightText = { bright:'通透光线', dark:'低照度氛围', balanced:'柔和明暗' }[profile.brightness];
  return `${colorText}，${lightText}`;
}

function makeTasteLine(food, profile) {
  const scene = profile.brightness === 'bright' ? '明亮的一刻' : profile.brightness === 'dark' ? '安静的片刻' : '刚好的日常';
  const ending = {
    '清爽':'轻轻散开。', '绵密':'慢慢融化。', '松软':'柔软地落下来。', '酥脆':'发出清脆的回声。',
    '顺滑':'顺着光线滑过。', '浓滑':'把周围包裹起来。', '软糯':'留下温柔的余韵。', '嫩滑':'在舌尖轻晃。',
    'Q弹':'带着一点轻快弹性。', '细碎':'像冰晶一样碎开。', '浓稠':'缓慢而温暖地铺开。'
  }[food.texture] || '在口中慢慢展开。';
  return `像把${scene}含入口中，${food.taste}，${ending}`;
}

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (char) => ({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[char]));
}

function illustrationSvg(food) {
  const [a,b,c] = food.palette;
  const dish = food.form === 'glass'
    ? `<path d="M225 188h150l-18 244c-2 27-22 42-57 42s-55-15-57-42z" fill="#fff" fill-opacity=".72" stroke="#111" stroke-width="3"/><path d="M239 232h122l-14 188c-1 15-13 24-47 24s-46-9-47-24z" fill="${a}"/><circle cx="273" cy="290" r="12" fill="${c}"/><circle cx="324" cy="352" r="8" fill="${b}"/><circle cx="306" cy="263" r="6" fill="#fff" fill-opacity=".8"/>`
    : food.form === 'cup'
    ? `<path d="M190 220h205v160c0 62-39 98-102 98s-103-36-103-98z" fill="${a}" stroke="#111" stroke-width="3"/><path d="M395 264h35c54 0 57 102 2 109h-37" fill="none" stroke="#111" stroke-width="18"/><ellipse cx="293" cy="220" rx="102" ry="28" fill="${b}" stroke="#111" stroke-width="3"/><path d="M260 204c-12-46 33-50 16-99M315 200c-15-38 28-50 10-91" fill="none" stroke="#111" stroke-width="3"/>`
    : food.form === 'bowl'
    ? `<path d="M145 245h310c-10 145-63 225-155 225s-145-80-155-225z" fill="${b}" stroke="#111" stroke-width="3"/><ellipse cx="300" cy="245" rx="155" ry="42" fill="${a}" stroke="#111" stroke-width="3"/><path d="M207 246c50-24 116-25 184 0" fill="none" stroke="${c}" stroke-width="18" stroke-linecap="round"/>`
    : `<ellipse cx="300" cy="418" rx="185" ry="50" fill="#fff" stroke="#111" stroke-width="3"/><path d="M195 363c30-91 69-139 112-143 50-4 87 56 103 143-65 37-151 39-215 0z" fill="${a}" stroke="#111" stroke-width="3"/><path d="M245 289c39-25 79-23 119 4" fill="none" stroke="${b}" stroke-width="24" stroke-linecap="round"/><circle cx="294" cy="245" r="18" fill="${c}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
    <rect width="600" height="600" fill="#f7f7f8"/>
    <path d="M0 84h600M0 516h600M84 0v600M516 0v600" stroke="#d7d7d7" stroke-width="1"/>
    <circle cx="500" cy="95" r="54" fill="${c}" fill-opacity=".66"/>
    ${dish}
    <text x="24" y="40" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#002fa7">${escapeXml(food.type.toUpperCase())}</text>
    <text x="576" y="570" text-anchor="end" font-family="Helvetica,Arial,sans-serif" font-size="11" fill="#111">${escapeXml(food.food_id)}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function renderResult(food, profile) {
  currentResult = { food, profile };
  $('#result-name').textContent = food.name;
  $('#result-illustration').src = illustrationSvg(food);
  $('#result-illustration').alt = `${food.name}编辑插画`;
  $('#source-thumb').src = sourceImageUrl;
  $('#visual-reading').textContent = describeVisual(profile);
  $('#taste-line').textContent = makeTasteLine(food, profile);
  $('#taste-value').textContent = food.taste;
  $('#temperature-value').textContent = food.temperature;
  $('#texture-value').textContent = food.texture;
  showView('result');
}

async function runAnalysis(file) {
  if (!file || !file.type.startsWith('image/')) {
    alert('请选择一张图片文件。');
    return;
  }
  try {
    if (!foods.length) await loadFoods();
    sourceImageUrl = await readFile(file);
    const image = await loadImage(sourceImageUrl);
    $('#analysis-photo').src = sourceImageUrl;
    showView('analysis');
    const stages = [['读取光线', 28], ['观察色彩', 58], ['寻找味觉线索', 84], ['生成这一口', 100]];
    for (const [label, percent] of stages) {
      $('#analysis-detail').textContent = label;
      $('#progress-bar').style.width = `${percent}%`;
      await new Promise((resolve) => setTimeout(resolve, 460));
    }
    const profile = analyseImage(image);
    renderResult(chooseResult(profile), profile);
  } catch (error) {
    console.error(error);
    alert(error.message || '没有读懂这张照片，请换一张试试。');
    showView('upload');
  }
}

async function shareResult() {
  if (!currentResult) return;
  const text = `今天的照片，尝起来像${currentResult.food.name}。${makeTasteLine(currentResult.food, currentResult.profile)}`;
  try {
    if (navigator.share) await navigator.share({ title: '一口｜这张照片的味道', text });
    else {
      await navigator.clipboard.writeText(text);
      $('#share-feedback').textContent = '分享文案已复制';
    }
  } catch (error) {
    if (error.name !== 'AbortError') $('#share-feedback').textContent = '暂时无法分享，请稍后重试';
  }
}

function reset() {
  sourceImageUrl = '';
  currentResult = null;
  $('#album-input').value = '';
  $('#camera-input').value = '';
  $('#progress-bar').style.width = '0';
  $('#share-feedback').textContent = '';
  showView('upload');
}

['#album-input', '#camera-input'].forEach((selector) => {
  $(selector).addEventListener('change', (event) => runAnalysis(event.target.files[0]));
});

const dropZone = $('#drop-zone');
['dragenter','dragover'].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.add('is-dragging'); }));
['dragleave','drop'].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.remove('is-dragging'); }));
dropZone.addEventListener('drop', (event) => runAnalysis(event.dataTransfer.files[0]));
$('#share-button').addEventListener('click', shareResult);
$('#retry-button').addEventListener('click', reset);

loadFoods().catch((error) => console.error(error));
