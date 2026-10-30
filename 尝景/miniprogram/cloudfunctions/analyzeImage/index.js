const ENDPOINT = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const MODEL = 'qwen3.8-flash';
const MAX_BASE64_LENGTH = 1_400_000;

const ALLOWED = {
  colors: ['红', '橙', '黄', '绿', '蓝', '紫', '粉', '棕', '黑', '白', '多色'],
  intensity: ['轻盈', '平衡', '浓郁'],
  tastes: ['咸甜', '咸香', '椰香', '清甜', '甘香', '苦甜', '茶香', '辛香', '酸甜', '醇厚', '鲜香'],
  temperatures: ['冰爽', '微凉', '常温', '温热', '滚烫'],
  textures: ['Q弹', '松软', '流动', '清爽', '滑嫩', '绵密', '脆嫩', '脆爽', '软嫩', '软糯', '酥脆', '顺滑', '颗粒分明'],
  seasons: ['all', 'summer', 'winter'],
  scenes: ['celebration', 'comfort', 'daily', 'fresh', 'relaxed', 'social']
};

function cleanDataUrl(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match || match[2].length > MAX_BASE64_LENGTH) return null;
  return { mimeType: match[1], base64: match[2] };
}

function oneOf(value, options, fallback) {
  return options.includes(value) ? value : fallback;
}

function listOf(value, options, limit) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(item => options.includes(item)))].slice(0, limit);
}

function normalize(raw) {
  const colors = listOf(raw.color_groups, ALLOWED.colors, 2);
  return {
    schema_version: 'taste-image-profile-v1',
    color_groups: colors.length ? colors : ['多色'],
    intensity: oneOf(raw.intensity, ALLOWED.intensity, '平衡'),
    taste: listOf(raw.taste, ALLOWED.tastes, 2),
    temperature: oneOf(raw.temperature, ALLOWED.temperatures, '常温'),
    texture: listOf(raw.texture, ALLOWED.textures, 2),
    season: oneOf(raw.season, ALLOWED.seasons, 'all'),
    scene_type: oneOf(raw.scene_type, ALLOWED.scenes, 'daily'),
    ingredients: [],
    visual_summary: typeof raw.visual_summary === 'string' ? raw.visual_summary.slice(0, 80) : '',
    atmosphere: Array.isArray(raw.atmosphere)
      ? raw.atmosphere.filter(item => typeof item === 'string').slice(0, 3)
      : [],
    confidence: Number.isFinite(raw.confidence)
      ? Math.max(0, Math.min(1, raw.confidence))
      : 0.5
  };
}

function buildPrompt() {
  return `你是“尝景”的视觉分析器。观察用户照片，将画面转译为可与食物数据库匹配的感官特征。
只输出一个 JSON 对象，不要 Markdown，不要解释。不要识别或推断人的身份、年龄、健康、种族等敏感信息。
字段及可选值：
{
  "color_groups": 从 ${JSON.stringify(ALLOWED.colors)} 选1至2项，
  "intensity": 从 ${JSON.stringify(ALLOWED.intensity)} 选1项，
  "taste": 从 ${JSON.stringify(ALLOWED.tastes)} 选0至2项，
  "temperature": 从 ${JSON.stringify(ALLOWED.temperatures)} 选1项，
  "texture": 从 ${JSON.stringify(ALLOWED.textures)} 选0至2项，
  "season": 从 ${JSON.stringify(ALLOWED.seasons)} 选1项，
  "scene_type": 从 ${JSON.stringify(ALLOWED.scenes)} 选1项，
  "visual_summary": "20字内客观画面概括",
  "atmosphere": ["最多3个简短氛围词"],
  "confidence": 0到1之间数字
}
优先依据画面的主要色块、光线、场景和材质进行感官联想；不要因为照片中出现某种食物，就直接输出该食物名称。`;
}

exports.main = async (event = {}) => {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) return { ok: false, code: 'MISSING_API_KEY', message: '云函数未配置 DASHSCOPE_API_KEY' };

  const image = cleanDataUrl(event.imageDataUrl);
  if (!image) return { ok: false, code: 'INVALID_IMAGE', message: '图片格式不支持或体积过大' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        enable_thinking: false,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: buildPrompt() },
            { type: 'image_url', image_url: { url: `data:${image.mimeType};base64,${image.base64}` } }
          ]
        }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 450
      })
    });

    const body = await response.json();
    if (!response.ok) {
      console.error('DashScope request failed', response.status, body?.error?.code);
      return { ok: false, code: 'MODEL_REQUEST_FAILED', message: '图片分析服务暂时不可用' };
    }

    const content = body?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('EMPTY_MODEL_OUTPUT');
    return { ok: true, profile: normalize(JSON.parse(content)), model: MODEL };
  } catch (error) {
    const timeout = error?.name === 'AbortError';
    console.error('Image analysis failed', timeout ? 'TIMEOUT' : error?.message);
    return {
      ok: false,
      code: timeout ? 'MODEL_TIMEOUT' : 'INVALID_MODEL_OUTPUT',
      message: timeout ? '图片分析超时' : '图片分析结果无法解析'
    };
  } finally {
    clearTimeout(timer);
  }
};
