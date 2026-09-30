export type CharacterFact = {
  label: string;
  text: string;
  examples: Array<{ hanzi: string; pinyin: string; meaning: string }>;
};

type FactRule = CharacterFact & { matches: string };

const FACT_RULES: FactRule[] = [
  {
    matches: "水汤洗游泳",
    label: "The water family",
    text: "水 means water. When it becomes the three-dot component 氵, it often hints that a character is connected with liquids, washing, or flowing.",
    examples: [
      { hanzi: "河", pinyin: "hé", meaning: "river" },
      { hanzi: "海", pinyin: "hǎi", meaning: "sea" },
    ],
  },
  {
    matches: "冰冷",
    label: "Two drops of ice",
    text: "冰 uses 冫, the two-dot ice component. It often appears in characters connected with cold or freezing.",
    examples: [
      { hanzi: "冷", pinyin: "lěng", meaning: "cold" },
      { hanzi: "冻", pinyin: "dòng", meaning: "to freeze" },
    ],
  },
  {
    matches: "咖啡和呢嗨吗吃哪叫呀站喜欢",
    label: "The mouth component",
    text: "口 means mouth. It appears in many characters involving speech, sounds, eating, or an open mouth; it also serves as a useful sound-bearing component.",
    examples: [
      { hanzi: "喝", pinyin: "hē", meaning: "to drink" },
      { hanzi: "唱", pinyin: "chàng", meaning: "to sing" },
    ],
  },
  {
    matches: "茶英菜节",
    label: "Grass on top",
    text: "艹 is the grass or plant component. It sits on top of many characters associated with plants, herbs, vegetables, and flowers.",
    examples: [
      { hanzi: "花", pinyin: "huā", meaning: "flower" },
      { hanzi: "药", pinyin: "yào", meaning: "medicine" },
    ],
  },
  {
    matches: "米糖粥",
    label: "Grains of rice",
    text: "米 means rice and also acts as a component in characters connected with grain, powder, and foods made from them.",
    examples: [
      { hanzi: "粉", pinyin: "fěn", meaning: "powder; noodles" },
      { hanzi: "糕", pinyin: "gāo", meaning: "cake" },
    ],
  },
  {
    matches: "饭馆食",
    label: "The food component",
    text: "食 means food. Its compressed form 饣 appears on the left of many characters related to eating and meals.",
    examples: [
      { hanzi: "饮", pinyin: "yǐn", meaning: "to drink" },
      { hanzi: "饿", pinyin: "è", meaning: "hungry" },
    ],
  },
  {
    matches: "热火",
    label: "Fire underneath",
    text: "火 means fire. The four dots 灬 are a common bottom form of the same component and often suggest heat or burning.",
    examples: [
      { hanzi: "点", pinyin: "diǎn", meaning: "dot; to order" },
      { hanzi: "照", pinyin: "zhào", meaning: "to shine; photo" },
    ],
  },
  {
    matches: "人你他们健",
    label: "A person at the side",
    text: "亻 is the side form of 人, person. It is common in characters describing people, identities, and human actions.",
    examples: [
      { hanzi: "住", pinyin: "zhù", meaning: "to live" },
      { hanzi: "休", pinyin: "xiū", meaning: "to rest" },
    ],
  },
  {
    matches: "女她妈婆奶要好",
    label: "The woman component",
    text: "女 means woman and is reused in many family terms and characters historically connected with women.",
    examples: [
      { hanzi: "姐", pinyin: "jiě", meaning: "older sister" },
      { hanzi: "妹", pinyin: "mèi", meaning: "younger sister" },
    ],
  },
  {
    matches: "子学字",
    label: "A child below",
    text: "子 means child. You can see it at the bottom of 学, where it helps form the character for learning.",
    examples: [
      { hanzi: "孩子", pinyin: "háizi", meaning: "child" },
      { hanzi: "孙子", pinyin: "sūnzi", meaning: "grandson" },
    ],
  },
  {
    matches: "日是间音",
    label: "The sun component",
    text: "日 began as a picture of the sun. It is frequently reused in characters involving days, time, light, and daily life.",
    examples: [
      { hanzi: "明", pinyin: "míng", meaning: "bright" },
      { hanzi: "晚", pinyin: "wǎn", meaning: "evening; late" },
    ],
  },
  {
    matches: "本杯机李新",
    label: "The wood component",
    text: "木 means tree or wood. It appears as a full character and as a component in objects, plants, and things traditionally made from wood.",
    examples: [
      { hanzi: "林", pinyin: "lín", meaning: "woods; forest" },
      { hanzi: "桌", pinyin: "zhuō", meaning: "table" },
    ],
  },
  {
    matches: "国园四",
    label: "An enclosing border",
    text: "囗 is the enclosure component. It surrounds another element and often suggests an area, boundary, or something contained.",
    examples: [
      { hanzi: "回", pinyin: "huí", meaning: "to return" },
      { hanzi: "因", pinyin: "yīn", meaning: "cause; because" },
    ],
  },
  {
    matches: "球",
    label: "Jade becomes a ball",
    text: "球 has 王 on the left, a compressed form associated with 玉, jade. The character first referred to a jade sphere and later came to mean ball.",
    examples: [
      { hanzi: "玩", pinyin: "wán", meaning: "to play" },
      { hanzi: "理", pinyin: "lǐ", meaning: "reason; pattern" },
    ],
  },
  {
    matches: "语说课谢",
    label: "Words at the side",
    text: "讠 is the simplified side form of 言, speech. It commonly appears in characters involving language, speaking, and communication.",
    examples: [
      { hanzi: "话", pinyin: "huà", meaning: "speech; words" },
      { hanzi: "请", pinyin: "qǐng", meaning: "please; to invite" },
    ],
  },
  {
    matches: "手打排",
    label: "The hand component",
    text: "手 means hand. Its side form 扌 appears in many characters for actions performed with the hands.",
    examples: [
      { hanzi: "找", pinyin: "zhǎo", meaning: "to look for" },
      { hanzi: "提", pinyin: "tí", meaning: "to lift; mention" },
    ],
  },
  {
    matches: "跑",
    label: "Feet in motion",
    text: "足 means foot. Its left-side form ⻊appears in many characters involving walking, running, jumping, and roads.",
    examples: [
      { hanzi: "跳", pinyin: "tiào", meaning: "to jump" },
      { hanzi: "路", pinyin: "lù", meaning: "road" },
    ],
  },
  {
    matches: "这运还",
    label: "The movement component",
    text: "辶 is often called the movement or walking component. It appears in many characters involving motion, direction, or a path.",
    examples: [
      { hanzi: "近", pinyin: "jìn", meaning: "near" },
      { hanzi: "远", pinyin: "yuǎn", meaning: "far" },
    ],
  },
  {
    matches: "间",
    label: "Something inside a gate",
    text: "门 means door or gate. As an enclosing component it often frames ideas connected with rooms, openings, or asking at a doorway.",
    examples: [
      { hanzi: "问", pinyin: "wèn", meaning: "to ask" },
      { hanzi: "闻", pinyin: "wén", meaning: "to hear; smell" },
    ],
  },
  {
    matches: "车较",
    label: "The vehicle component",
    text: "车 means vehicle. It is also a component in characters historically connected with carts, wheels, and movement.",
    examples: [
      { hanzi: "辆", pinyin: "liàng", meaning: "measure word for vehicles" },
      { hanzi: "转", pinyin: "zhuǎn", meaning: "to turn" },
    ],
  },
  {
    matches: "钱",
    label: "Metal at the side",
    text: "钅 is the simplified side form of 金, metal or gold. It appears in characters for metals, coins, and metal objects.",
    examples: [
      { hanzi: "银", pinyin: "yín", meaning: "silver" },
      { hanzi: "铁", pinyin: "tiě", meaning: "iron" },
    ],
  },
  {
    matches: "看",
    label: "A hand shading the eyes",
    text: "看 combines a hand-like shape above 目, eye: an old visual idea of shading your eyes to look into the distance.",
    examples: [
      { hanzi: "眼", pinyin: "yǎn", meaning: "eye" },
      { hanzi: "睛", pinyin: "jīng", meaning: "eyeball" },
    ],
  },
  {
    matches: "客",
    label: "A roof overhead",
    text: "宀 is the roof component. It appears in many characters involving houses, rooms, shelter, and people under a roof.",
    examples: [
      { hanzi: "家", pinyin: "jiā", meaning: "home; family" },
      { hanzi: "安", pinyin: "ān", meaning: "peaceful; safe" },
    ],
  },
  {
    matches: "店腐",
    label: "Shelter and buildings",
    text: "广 depicts a sloping roof or shelter. It appears in characters connected with buildings, covered places, and interiors.",
    examples: [
      { hanzi: "床", pinyin: "chuáng", meaning: "bed" },
      { hanzi: "库", pinyin: "kù", meaning: "warehouse" },
    ],
  },
  {
    matches: "在去里",
    label: "The earth component",
    text: "土 means earth or soil. It is reused in characters concerning places, ground, land, and things built on the earth.",
    examples: [
      { hanzi: "地", pinyin: "dì", meaning: "ground; place" },
      { hanzi: "场", pinyin: "chǎng", meaning: "site; field" },
    ],
  },
  {
    matches: "篮第",
    label: "Bamboo on top",
    text: "⺮ is the bamboo component. It appears on top of many characters for objects once made from bamboo.",
    examples: [
      { hanzi: "笔", pinyin: "bǐ", meaning: "pen" },
      { hanzi: "筷子", pinyin: "kuàizi", meaning: "chopsticks" },
    ],
  },
  {
    matches: "网",
    label: "A picture of a net",
    text: "网 began as a drawing of a net. Modern words reuse it for both physical nets and networks such as the internet.",
    examples: [
      { hanzi: "网上", pinyin: "wǎngshàng", meaning: "online" },
      { hanzi: "网络", pinyin: "wǎngluò", meaning: "network" },
    ],
  },
  {
    matches: "零",
    label: "Weather from above",
    text: "雨 is the rain component at the top of 零. It appears in many characters connected with weather and things falling from the sky.",
    examples: [
      { hanzi: "雪", pinyin: "xuě", meaning: "snow" },
      { hanzi: "雷", pinyin: "léi", meaning: "thunder" },
    ],
  },
  {
    matches: "对欢",
    label: "A recurring 又 shape",
    text: "又 originally depicted a right hand. It survives as a component in characters such as 对 and 欢, usually contributing shape or sound rather than the modern meaning 'again'.",
    examples: [
      { hanzi: "双", pinyin: "shuāng", meaning: "a pair" },
      { hanzi: "友", pinyin: "yǒu", meaning: "friend" },
    ],
  },
  {
    matches: "加动历",
    label: "The force component",
    text: "力 means strength or force. It appears in characters involving effort, motion, and applying power.",
    examples: [
      { hanzi: "努力", pinyin: "nǔlì", meaning: "to work hard" },
      { hanzi: "帮助", pinyin: "bāngzhù", meaning: "to help" },
    ],
  },
  {
    matches: "美大天",
    label: "A large 大 shape",
    text: "大 depicts a person standing with arms spread wide and means big. It is reused inside characters such as 天 and 美.",
    examples: [
      { hanzi: "太", pinyin: "tài", meaning: "too; extremely" },
      { hanzi: "奇", pinyin: "qí", meaning: "strange; unusual" },
    ],
  },
  {
    matches: "一二三两",
    label: "Counting with strokes",
    text: "The earliest numbers are wonderfully direct: 一, 二, and 三 use one, two, and three horizontal strokes.",
    examples: [
      { hanzi: "二十", pinyin: "èrshí", meaning: "twenty" },
      { hanzi: "三月", pinyin: "sānyuè", meaning: "March" },
    ],
  },
  {
    matches: "生",
    label: "Life and growth",
    text: "生 originally suggested a plant sprouting from the ground. Its meanings developed toward life, birth, growth, and being a student.",
    examples: [
      { hanzi: "生日", pinyin: "shēngrì", meaning: "birthday" },
      { hanzi: "生活", pinyin: "shēnghuó", meaning: "life; to live" },
    ],
  },
  {
    matches: "老",
    label: "The reusable 老",
    text: "老 means old, but before a title or relationship it can also add familiarity or respect rather than literal age.",
    examples: [
      { hanzi: "老人", pinyin: "lǎorén", meaning: "elderly person" },
      { hanzi: "老家", pinyin: "lǎojiā", meaning: "hometown" },
    ],
  },
  {
    matches: "我",
    label: "The character 我",
    text: "我 is the everyday first-person pronoun. Chinese builds possessive and plural forms by attaching reusable characters after it.",
    examples: [
      { hanzi: "我的", pinyin: "wǒ de", meaning: "my; mine" },
      { hanzi: "我们", pinyin: "wǒmen", meaning: "we; us" },
    ],
  },
  {
    matches: "中",
    label: "The character 中",
    text: "中 depicts a line passing through the middle of a frame. It means middle or center and appears in many words connected with China.",
    examples: [
      { hanzi: "中心", pinyin: "zhōngxīn", meaning: "center" },
      { hanzi: "中文", pinyin: "Zhōngwén", meaning: "Chinese language" },
    ],
  },
  {
    matches: "不",
    label: "A reusable negative",
    text: "不 is the basic negator. It combines directly with verbs and adjectives instead of changing their form.",
    examples: [
      { hanzi: "不是", pinyin: "bú shì", meaning: "is not" },
      { hanzi: "不好", pinyin: "bù hǎo", meaning: "not good" },
    ],
  },
  {
    matches: "上",
    label: "A mark above a line",
    text: "上 began as a short mark above a baseline. From 'above' it developed useful meanings such as on, previous, and to attend.",
    examples: [
      { hanzi: "上午", pinyin: "shàngwǔ", meaning: "morning" },
      { hanzi: "上课", pinyin: "shàngkè", meaning: "to attend class" },
    ],
  },
  {
    matches: "的",
    label: "The linking particle 的",
    text: "的 is one of Chinese's most reusable particles. It can link an owner or description to a noun.",
    examples: [
      { hanzi: "我的书", pinyin: "wǒ de shū", meaning: "my book" },
      { hanzi: "新的车", pinyin: "xīn de chē", meaning: "a new car" },
    ],
  },
  {
    matches: "也",
    label: "The character 也",
    text: "也 means also or too and normally appears before the verb. It is a handy reusable building block in short sentences.",
    examples: [
      { hanzi: "也是", pinyin: "yě shì", meaning: "also is" },
      { hanzi: "我也去", pinyin: "wǒ yě qù", meaning: "I am going too" },
    ],
  },
  {
    matches: "公",
    label: "The reusable 公",
    text: "公 carries ideas including public and male seniority. The same character appears in family words and public places.",
    examples: [
      { hanzi: "公司", pinyin: "gōngsī", meaning: "company" },
      { hanzi: "公共", pinyin: "gōnggòng", meaning: "public" },
    ],
  },
  {
    matches: "文",
    label: "Writing and language",
    text: "文 is associated with writing, text, and culture. Language names often combine a place or people with 文.",
    examples: [
      { hanzi: "英文", pinyin: "Yīngwén", meaning: "English writing" },
      { hanzi: "文化", pinyin: "wénhuà", meaning: "culture" },
    ],
  },
  {
    matches: "都那",
    label: "The place component 阝",
    text: "On the right side, 阝comes from 邑, a settlement. It appears in several characters connected historically with places or cities.",
    examples: [
      { hanzi: "邻", pinyin: "lín", meaning: "neighboring" },
      { hanzi: "郊", pinyin: "jiāo", meaning: "suburbs" },
    ],
  },
  {
    matches: "有",
    label: "The character 有",
    text: "有 means to have or there is. It combines with other common characters to express possession and existence.",
    examples: [
      { hanzi: "没有", pinyin: "méiyǒu", meaning: "not to have" },
      { hanzi: "有名", pinyin: "yǒumíng", meaning: "famous" },
    ],
  },
  {
    matches: "买",
    label: "The character 买",
    text: "买 means to buy. Keep it distinct from the visually related 卖, which adds 十 on top and means to sell.",
    examples: [
      { hanzi: "买票", pinyin: "mǎi piào", meaning: "to buy a ticket" },
      { hanzi: "买东西", pinyin: "mǎi dōngxi", meaning: "to go shopping" },
    ],
  },
  {
    matches: "市超",
    label: "The character 市",
    text: "市 means market or city. It is reused in compounds for urban places and kinds of markets.",
    examples: [
      { hanzi: "市场", pinyin: "shìchǎng", meaning: "market" },
      { hanzi: "市中心", pinyin: "shìzhōngxīn", meaning: "city center" },
    ],
  },
  {
    matches: "父爸",
    label: "Father inside 爸",
    text: "爸 places 父, father, above 巴, which helps suggest the sound. It is a neat semantic-plus-sound construction.",
    examples: [
      { hanzi: "父亲", pinyin: "fùqīn", meaning: "father" },
      { hanzi: "父母", pinyin: "fùmǔ", meaning: "parents" },
    ],
  },
  {
    matches: "师",
    label: "The reusable 师",
    text: "师 means teacher, master, or a skilled professional. It appears in several occupation words.",
    examples: [
      { hanzi: "师傅", pinyin: "shīfu", meaning: "master; skilled worker" },
      { hanzi: "工程师", pinyin: "gōngchéngshī", meaning: "engineer" },
    ],
  },
  {
    matches: "常",
    label: "The cloth shape 巾",
    text: "巾 originally pictured a hanging cloth. It appears at the bottom of 常 and in many characters involving cloth or hanging shapes.",
    examples: [
      { hanzi: "帽", pinyin: "mào", meaning: "hat" },
      { hanzi: "布", pinyin: "bù", meaning: "cloth" },
    ],
  },
];

const FALLBACK_FACT: CharacterFact = {
  label: "Characters as building blocks",
  text: "Chinese words are often assembled from reusable characters. Notice each character's position and look for it again in compound words.",
  examples: [
    { hanzi: "中国", pinyin: "Zhōngguó", meaning: "China" },
    { hanzi: "中文", pinyin: "Zhōngwén", meaning: "Chinese language" },
  ],
};

export const getCharacterFact = (hanzi: string): CharacterFact =>
  FACT_RULES.find((rule) => [...hanzi].some((character) => rule.matches.includes(character))) ??
  FALLBACK_FACT;
