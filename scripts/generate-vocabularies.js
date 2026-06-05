const fs = require('fs')
const path = require('path')

const OUT_DIR = path.join(__dirname, '..', 'miniprogram', 'vocabularies')
const TARGET_COUNT = 620

function parseRows(text) {
  return text.trim().split(/\r?\n/).map((line) => {
    const [en, enPron, ja, jaPron, ko, koPron, meaning, tag] = line.split('|')
    return { en, enPron, ja, jaPron, ko, koPron, meaning, tag }
  })
}

function makeEntry(prefix, language, level, index, item, wordKey, pronKey, exampleMaker) {
  const word = item[wordKey]
  const pronunciation = item[pronKey]

  return {
    id: `${prefix}-${String(index + 1).padStart(3, '0')}`,
    language,
    level,
    word,
    pronunciation,
    meaning: item.meaning,
    example: exampleMaker(word),
    exampleMeaning: `今天学习“${item.meaning}”。`,
    tags: [item.tag],
  }
}

function unique(items, key) {
  const seen = new Set()
  return items.filter((item) => {
    const value = item[key]
    if (!value || seen.has(value)) return false
    seen.add(value)
    return true
  })
}

function writeFile(fileName, prefix, language, level, items, wordKey, pronKey, exampleMaker) {
  const data = unique(items, wordKey).slice(0, TARGET_COUNT)

  if (data.length < TARGET_COUNT) {
    throw new Error(`${fileName} only generated ${data.length} entries`)
  }

  const entries = data.map((item, index) => makeEntry(prefix, language, level, index, item, wordKey, pronKey, exampleMaker))
  fs.writeFileSync(path.join(OUT_DIR, fileName), `${JSON.stringify(entries, null, 2)}\n`, 'utf8')
}

function chineseNumber(n) {
  const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
  if (n <= 10) return ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][n]
  if (n < 20) return `十${digits[n - 10]}`
  if (n === 100) return '一百'
  const ten = Math.floor(n / 10)
  const one = n % 10
  return one === 0 ? `${digits[ten]}十` : `${digits[ten]}十${digits[one]}`
}

const enNums = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
]
const enTens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
const jaNums = [
  ['零', 'れい'], ['一', 'いち'], ['二', 'に'], ['三', 'さん'], ['四', 'よん'],
  ['五', 'ご'], ['六', 'ろく'], ['七', 'なな'], ['八', 'はち'], ['九', 'きゅう'], ['十', 'じゅう'],
]
const koNums = [
  ['영', 'yeong'], ['일', 'il'], ['이', 'i'], ['삼', 'sam'], ['사', 'sa'],
  ['오', 'o'], ['육', 'yuk'], ['칠', 'chil'], ['팔', 'pal'], ['구', 'gu'], ['십', 'sip'],
]

function enNumber(n) {
  if (n === 100) return 'one hundred'
  if (n < 20) return enNums[n]
  const ten = Math.floor(n / 10)
  const one = n % 10
  return one === 0 ? enTens[ten] : `${enTens[ten]}-${enNums[one]}`
}

function jaNumber(n) {
  if (n === 100) return ['百', 'ひゃく']
  if (n <= 10) return jaNums[n]
  if (n < 20) return [`十${jaNums[n - 10][0]}`, `じゅう${jaNums[n - 10][1]}`]
  const ten = Math.floor(n / 10)
  const one = n % 10
  const tenPart = ten === 1 ? jaNums[10] : [`${jaNums[ten][0]}十`, `${jaNums[ten][1]}じゅう`]
  return one === 0 ? tenPart : [`${tenPart[0]}${jaNums[one][0]}`, `${tenPart[1]}${jaNums[one][1]}`]
}

function koNumber(n) {
  if (n === 100) return ['백', 'baek']
  if (n <= 10) return koNums[n]
  if (n < 20) return [`십${koNums[n - 10][0]}`, `sip ${koNums[n - 10][1]}`]
  const ten = Math.floor(n / 10)
  const one = n % 10
  const tenPart = ten === 1 ? koNums[10] : [`${koNums[ten][0]}십`, `${koNums[ten][1]}sip`]
  return one === 0 ? tenPart : [`${tenPart[0]}${koNums[one][0]}`, `${tenPart[1]} ${koNums[one][1]}`]
}

const baseRows = parseRows(`
hello|/həˈloʊ/|こんにちは|こんにちは|안녕하세요|annyeonghaseyo|你好|greeting
goodbye|/ˌɡʊdˈbaɪ/|さようなら|さようなら|안녕히 가세요|annyeonghi gaseyo|再见|greeting
please|/pliːz/|お願いします|おねがいします|부탁합니다|butakhamnida|请|greeting
thanks|/θæŋks/|ありがとう|ありがとう|감사합니다|gamsahamnida|谢谢|greeting
sorry|/ˈsɑːri/|すみません|すみません|죄송합니다|joesonghamnida|对不起|greeting
yes|/jes/|はい|はい|네|ne|是|common
no|/noʊ/|いいえ|いいえ|아니요|aniyo|不是|common
I|/aɪ/|私|わたし|저|jeo|我|pronoun
you|/juː/|あなた|あなた|당신|dangsin|你|pronoun
he|/hiː/|彼|かれ|그|geu|他|pronoun
she|/ʃiː/|彼女|かのじょ|그녀|geunyeo|她|pronoun
we|/wiː/|私たち|わたしたち|우리|uri|我们|pronoun
they|/ðeɪ/|彼ら|かれら|그들|geudeul|他们|pronoun
this|/ðɪs/|これ|これ|이것|igeot|这个|pronoun
that|/ðæt/|それ|それ|그것|geugeot|那个|pronoun
who|/huː/|誰|だれ|누구|nugu|谁|question
what|/wʌt/|何|なに|무엇|mueot|什么|question
where|/wer/|どこ|どこ|어디|eodi|哪里|question
when|/wen/|いつ|いつ|언제|eonje|什么时候|question
why|/waɪ/|なぜ|なぜ|왜|wae|为什么|question
how|/haʊ/|どう|どう|어떻게|eotteoke|怎样|question
person|/ˈpɜːrsn/|人|ひと|사람|saram|人|people
man|/mæn/|男|おとこ|남자|namja|男人|people
woman|/ˈwʊmən/|女|おんな|여자|yeoja|女人|people
child|/tʃaɪld/|子供|こども|아이|ai|孩子|people
boy|/bɔɪ/|男の子|おとこのこ|소년|sonyeon|男孩|people
girl|/ɡɜːrl/|女の子|おんなのこ|소녀|sonyeo|女孩|people
friend|/frend/|友達|ともだち|친구|chingu|朋友|people
family|/ˈfæməli/|家族|かぞく|가족|gajok|家人|family
father|/ˈfɑːðər/|父|ちち|아버지|abeoji|父亲|family
mother|/ˈmʌðər/|母|はは|어머니|eomeoni|母亲|family
brother|/ˈbrʌðər/|兄弟|きょうだい|형제|hyeongje|兄弟|family
sister|/ˈsɪstər/|姉妹|しまい|자매|jamae|姐妹|family
teacher|/ˈtiːtʃər/|先生|せんせい|선생님|seonsaengnim|老师|people
student|/ˈstuːdnt/|学生|がくせい|학생|haksaeng|学生|people
doctor|/ˈdɑːktər/|医者|いしゃ|의사|uisa|医生|people
worker|/ˈwɜːrkər/|会社員|かいしゃいん|회사원|hoesawon|职员|people
name|/neɪm/|名前|なまえ|이름|ireum|名字|people
age|/eɪdʒ/|年|とし|나이|nai|年龄|people
home|/hoʊm/|家|いえ|집|jip|家|place
house|/haʊs/|家屋|かおく|주택|jutaek|房子|place
room|/ruːm/|部屋|へや|방|bang|房间|place
school|/skuːl/|学校|がっこう|학교|hakgyo|学校|place
classroom|/ˈklæsruːm/|教室|きょうしつ|교실|gyosil|教室|place
office|/ˈɑːfɪs/|事務所|じむしょ|사무실|samusil|办公室|place
shop|/ʃɑːp/|店|みせ|가게|gage|商店|place
market|/ˈmɑːrkɪt/|市場|いちば|시장|sijang|市场|place
bank|/bæŋk/|銀行|ぎんこう|은행|eunhaeng|银行|place
hospital|/ˈhɑːspɪtl/|病院|びょういん|병원|byeongwon|医院|place
hotel|/hoʊˈtel/|ホテル|ほてる|호텔|hotel|酒店|place
restaurant|/ˈrestərɑːnt/|レストラン|れすとらん|식당|sikdang|餐馆|place
park|/pɑːrk/|公園|こうえん|공원|gongwon|公园|place
station|/ˈsteɪʃn/|駅|えき|역|yeok|车站|place
airport|/ˈerpɔːrt/|空港|くうこう|공항|gonghang|机场|place
street|/striːt/|通り|とおり|거리|geori|街道|place
city|/ˈsɪti/|町|まち|도시|dosi|城市|place
country|/ˈkʌntri/|国|くに|나라|nara|国家|place
book|/bʊk/|本|ほん|책|chaek|书|object
pen|/pen/|ペン|ぺん|펜|pen|钢笔|object
pencil|/ˈpensl/|鉛筆|えんぴつ|연필|yeonpil|铅笔|object
paper|/ˈpeɪpər/|紙|かみ|종이|jongi|纸|object
bag|/bæɡ/|鞄|かばん|가방|gabang|包|object
box|/bɑːks/|箱|はこ|상자|sangja|盒子|object
key|/kiː/|鍵|かぎ|열쇠|yeolsoe|钥匙|object
phone|/foʊn/|電話|でんわ|전화|jeonhwa|电话|object
computer|/kəmˈpjuːtər/|コンピューター|こんぴゅーたー|컴퓨터|keompyuteo|电脑|object
table|/ˈteɪbl/|机|つくえ|책상|chaeksang|桌子|object
chair|/tʃer/|椅子|いす|의자|uija|椅子|object
door|/dɔːr/|ドア|どあ|문|mun|门|object
window|/ˈwɪndoʊ/|窓|まど|창문|changmun|窗户|object
bed|/bed/|ベッド|べっど|침대|chimdae|床|object
cup|/kʌp/|コップ|こっぷ|컵|keop|杯子|object
plate|/pleɪt/|皿|さら|접시|jeopsi|盘子|object
clock|/klɑːk/|時計|とけい|시계|sigye|钟表|object
photo|/ˈfoʊtoʊ/|写真|しゃしん|사진|sajin|照片|object
map|/mæp/|地図|ちず|지도|jido|地图|object
money|/ˈmʌni/|お金|おかね|돈|don|钱|object
ticket|/ˈtɪkɪt/|切符|きっぷ|표|pyo|票|object
water|/ˈwɔːtər/|水|みず|물|mul|水|food
tea|/tiː/|お茶|おちゃ|차|cha|茶|food
coffee|/ˈkɔːfi/|コーヒー|こーひー|커피|keopi|咖啡|food
milk|/mɪlk/|牛乳|ぎゅうにゅう|우유|uyu|牛奶|food
juice|/dʒuːs/|ジュース|じゅーす|주스|juseu|果汁|food
bread|/bred/|パン|ぱん|빵|ppang|面包|food
rice|/raɪs/|ご飯|ごはん|밥|bap|米饭|food
egg|/eɡ/|卵|たまご|계란|gyeran|鸡蛋|food
meat|/miːt/|肉|にく|고기|gogi|肉|food
fish|/fɪʃ/|魚|さかな|생선|saengseon|鱼|food
vegetable|/ˈvedʒtəbl/|野菜|やさい|야채|yachae|蔬菜|food
fruit|/fruːt/|果物|くだもの|과일|gwail|水果|food
apple|/ˈæpl/|林檎|りんご|사과|sagwa|苹果|food
banana|/bəˈnænə/|バナナ|ばなな|바나나|banana|香蕉|food
orange|/ˈɔːrɪndʒ/|蜜柑|みかん|오렌지|orenji|橙子|food
cake|/keɪk/|ケーキ|けーき|케이크|keikeu|蛋糕|food
soup|/suːp/|味噌汁|みそしる|국|guk|汤|food
breakfast|/ˈbrekfəst/|朝ご飯|あさごはん|아침밥|achimbap|早饭|food
lunch|/lʌntʃ/|昼ご飯|ひるごはん|점심|jeomsim|午饭|food
dinner|/ˈdɪnər/|晩ご飯|ばんごはん|저녁밥|jeonyeokbap|晚饭|food
today|/təˈdeɪ/|今日|きょう|오늘|oneul|今天|time
tomorrow|/təˈmɑːroʊ/|明日|あした|내일|naeil|明天|time
yesterday|/ˈjestərdeɪ/|昨日|きのう|어제|eoje|昨天|time
morning|/ˈmɔːrnɪŋ/|朝|あさ|아침|achim|早晨|time
afternoon|/ˌæftərˈnuːn/|午後|ごご|오후|ohu|下午|time
evening|/ˈiːvnɪŋ/|夕方|ゆうがた|저녁|jeonyeok|傍晚|time
night|/naɪt/|夜|よる|밤|bam|夜晚|time
week|/wiːk/|週|しゅう|주|ju|星期|time
month|/mʌnθ/|月|つき|달|dal|月份|time
year|/jɪr/|年|ねん|년|nyeon|年|time
time|/taɪm/|時間|じかん|시간|sigan|时间|time
hour|/ˈaʊər/|時間|じかん|시간|sigan|小时|time
minute|/ˈmɪnɪt/|分|ふん|분|bun|分钟|time
go|/ɡoʊ/|行く|いく|가다|gada|去|verb
come|/kʌm/|来る|くる|오다|oda|来|verb
eat|/iːt/|食べる|たべる|먹다|meokda|吃|verb
drink|/drɪŋk/|飲む|のむ|마시다|masida|喝|verb
read|/riːd/|読む|よむ|읽다|ikda|读|verb
write|/raɪt/|書く|かく|쓰다|sseuda|写|verb
listen|/ˈlɪsn/|聞く|きく|듣다|deutda|听|verb
speak|/spiːk/|話す|はなす|말하다|malhada|说|verb
see|/siː/|見る|みる|보다|boda|看见|verb
meet|/miːt/|会う|あう|만나다|mannada|见面|verb
buy|/baɪ/|買う|かう|사다|sada|买|verb
sell|/sel/|売る|うる|팔다|palda|卖|verb
use|/juːz/|使う|つかう|사용하다|sayonghada|使用|verb
make|/meɪk/|作る|つくる|만들다|mandeulda|制作|verb
do|/duː/|する|する|하다|hada|做|verb
have|/hæv/|ある|ある|있다|itda|有|verb
want|/wɑːnt/|欲しい|ほしい|원하다|wonhada|想要|verb
like|/laɪk/|好き|すき|좋아하다|joahada|喜欢|verb
know|/noʊ/|知る|しる|알다|alda|知道|verb
think|/θɪŋk/|思う|おもう|생각하다|saenggakhada|想|verb
wait|/weɪt/|待つ|まつ|기다리다|gidarida|等待|verb
rest|/rest/|休む|やすむ|쉬다|swida|休息|verb
sleep|/sliːp/|寝る|ねる|자다|jada|睡觉|verb
walk|/wɔːk/|歩く|あるく|걷다|geotda|走路|verb
run|/rʌn/|走る|はしる|달리다|dallida|跑|verb
sit|/sɪt/|座る|すわる|앉다|antda|坐|verb
stand|/stænd/|立つ|たつ|서다|seoda|站|verb
open|/ˈoʊpən/|開ける|あける|열다|yeolda|打开|verb
close|/kloʊz/|閉める|しめる|닫다|datda|关闭|verb
study|/ˈstʌdi/|勉強する|べんきょうする|공부하다|gongbuhada|学习|verb
work|/wɜːrk/|働く|はたらく|일하다|ilhada|工作|verb
play|/pleɪ/|遊ぶ|あそぶ|놀다|nolda|玩|verb
wash|/wɑːʃ/|洗う|あらう|씻다|ssitda|洗|verb
clean|/kliːn/|掃除する|そうじする|청소하다|cheongsohada|打扫|verb
cook|/kʊk/|料理する|りょうりする|요리하다|yorihada|做饭|verb
big|/bɪɡ/|大きい|おおきい|크다|keuda|大的|adjective
small|/smɔːl/|小さい|ちいさい|작다|jakda|小的|adjective
good|/ɡʊd/|良い|いい|좋다|jota|好的|adjective
bad|/bæd/|悪い|わるい|나쁘다|nappeuda|坏的|adjective
new|/nuː/|新しい|あたらしい|새롭다|saeropda|新的|adjective
old|/oʊld/|古い|ふるい|오래되다|oraedoeda|旧的|adjective
hot|/hɑːt/|暑い|あつい|덥다|deopda|热的|adjective
cold|/koʊld/|寒い|さむい|춥다|chupda|冷的|adjective
happy|/ˈhæpi/|嬉しい|うれしい|기쁘다|gippeuda|高兴的|adjective
sad|/sæd/|悲しい|かなしい|슬프다|seulpeuda|难过的|adjective
easy|/ˈiːzi/|簡単|かんたん|쉽다|swipda|简单的|adjective
difficult|/ˈdɪfɪkəlt/|難しい|むずかしい|어렵다|eoryeopda|困难的|adjective
fast|/fæst/|速い|はやい|빠르다|ppareuda|快的|adjective
slow|/sloʊ/|遅い|おそい|느리다|neurida|慢的|adjective
long|/lɔːŋ/|長い|ながい|길다|gilda|长的|adjective
short|/ʃɔːrt/|短い|みじかい|짧다|jjalda|短的|adjective
red|/red/|赤|あか|빨강|ppalgang|红色|color
blue|/bluː/|青|あお|파랑|parang|蓝色|color
green|/ɡriːn/|緑|みどり|초록|chorok|绿色|color
yellow|/ˈjeloʊ/|黄色|きいろ|노랑|norang|黄色|color
black|/blæk/|黒|くろ|검정|geomjeong|黑色|color
white|/waɪt/|白|しろ|하양|hayang|白色|color
head|/hed/|頭|あたま|머리|meori|头|body
face|/feɪs/|顔|かお|얼굴|eolgul|脸|body
eye|/aɪ/|目|め|눈|nun|眼睛|body
ear|/ɪr/|耳|みみ|귀|gwi|耳朵|body
nose|/noʊz/|鼻|はな|코|ko|鼻子|body
mouth|/maʊθ/|口|くち|입|ip|嘴|body
hand|/hænd/|手|て|손|son|手|body
foot|/fʊt/|足|あし|발|bal|脚|body
weather|/ˈweðər/|天気|てんき|날씨|nalssi|天气|nature
rain|/reɪn/|雨|あめ|비|bi|雨|nature
snow|/snoʊ/|雪|ゆき|눈송이|nunsongi|雪|nature
wind|/wɪnd/|風|かぜ|바람|baram|风|nature
sky|/skaɪ/|空|そら|하늘|haneul|天空|nature
mountain|/ˈmaʊntn/|山|やま|산|san|山|nature
river|/ˈrɪvər/|川|かわ|강|gang|河|nature
sea|/siː/|海|うみ|바다|bada|海|nature
tree|/triː/|木|き|나무|namu|树|nature
flower|/ˈflaʊər/|花|はな|꽃|kkot|花|nature
dog|/dɔːɡ/|犬|いぬ|개|gae|狗|animal
cat|/kæt/|猫|ねこ|고양이|goyangi|猫|animal
bird|/bɜːrd/|鳥|とり|새|sae|鸟|animal
car|/kɑːr/|車|くるま|자동차|jadongcha|汽车|transport
bus|/bʌs/|バス|ばす|버스|beoseu|公交车|transport
train|/treɪn/|電車|でんしゃ|기차|gicha|火车|transport
bicycle|/ˈbaɪsɪkl/|自転車|じてんしゃ|자전거|jajeongeo|自行车|transport
plane|/pleɪn/|飛行機|ひこうき|비행기|bihaenggi|飞机|transport
`)

const numbers = Array.from({ length: 101 }, (_, n) => {
  const ja = jaNumber(n)
  const ko = koNumber(n)
  return {
    en: enNumber(n),
    enPron: enNumber(n),
    ja: ja[0],
    jaPron: ja[1],
    ko: ko[0],
    koPron: ko[1],
    meaning: chineseNumber(n),
    tag: 'number',
  }
})

const months = Array.from({ length: 12 }, (_, i) => {
  const month = i + 1
  const ja = jaNumber(month)
  const ko = koNumber(month)
  const names = [
    ['January', 'January'], ['February', 'February'], ['March', 'March'], ['April', 'April'],
    ['May', 'May'], ['June', 'June'], ['July', 'July'], ['August', 'August'],
    ['September', 'September'], ['October', 'October'], ['November', 'November'], ['December', 'December'],
  ]
  return {
    en: names[i][0],
    enPron: names[i][1],
    ja: `${ja[0]}月`,
    jaPron: `${ja[1]}がつ`,
    ko: `${ko[0]}월`,
    koPron: `${ko[1]} wol`,
    meaning: `${chineseNumber(month)}月`,
    tag: 'time',
  }
})

const weekdays = parseRows(`
Monday|Monday|月曜日|げつようび|월요일|woryoil|星期一|time
Tuesday|Tuesday|火曜日|かようび|화요일|hwayoil|星期二|time
Wednesday|Wednesday|水曜日|すいようび|수요일|suyoil|星期三|time
Thursday|Thursday|木曜日|もくようび|목요일|mogyoil|星期四|time
Friday|Friday|金曜日|きんようび|금요일|geumyoil|星期五|time
Saturday|Saturday|土曜日|どようび|토요일|toyoil|星期六|time
Sunday|Sunday|日曜日|にちようび|일요일|iryoil|星期日|time
`)

const phraseAdjectives = parseRows(`
new|new|新しい|あたらしい|새|sae|新的|phrase
old|old|古い|ふるい|오래된|oraedoen|旧的|phrase
big|big|大きい|おおきい|큰|keun|大的|phrase
small|small|小さい|ちいさい|작은|jageun|小的|phrase
good|good|良い|いい|좋은|joeun|好的|phrase
long|long|長い|ながい|긴|gin|长的|phrase
short|short|短い|みじかい|짧은|jjalbeun|短的|phrase
clean|clean|きれいな|きれいな|깨끗한|kkaekkeuthan|干净的|phrase
quiet|quiet|静かな|しずかな|조용한|joyonghan|安静的|phrase
beautiful|beautiful|美しい|うつくしい|예쁜|yeppeun|漂亮的|phrase
warm|warm|暖かい|あたたかい|따뜻한|ttatteuthan|温暖的|phrase
cool|cool|涼しい|すずしい|시원한|siwonhan|凉爽的|phrase
`)

const phraseNouns = baseRows.filter((item) => ['people', 'place', 'object', 'food', 'time', 'nature', 'transport'].includes(item.tag))

const phrases = []
for (const adj of phraseAdjectives) {
  for (const noun of phraseNouns) {
    phrases.push({
      en: `${adj.en} ${noun.en}`,
      enPron: `${adj.enPron} ${noun.enPron}`,
      ja: `${adj.ja}${noun.ja}`,
      jaPron: `${adj.jaPron}${noun.jaPron}`,
      ko: `${adj.ko} ${noun.ko}`,
      koPron: `${adj.koPron} ${noun.koPron}`,
      meaning: `${adj.meaning}${noun.meaning}`,
      tag: 'phrase',
    })
  }
}

const allItems = [...baseRows, ...numbers, ...months, ...weekdays, ...phrases]

writeFile('en-a1.json', 'en-a1', 'en', 'A1', allItems, 'en', 'enPron', (word) => `I learned "${word}" today.`)
writeFile('ja-n5.json', 'ja-n5', 'ja', 'N5', allItems, 'ja', 'jaPron', (word) => `今日は「${word}」を覚えます。`)
writeFile('ko-beginner.json', 'ko-beginner', 'ko', 'Beginner', allItems, 'ko', 'koPron', (word) => `오늘 "${word}"를 배워요.`)

