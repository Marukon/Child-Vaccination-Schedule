window.VACCINE_DATA = {
  "meta": {
    "title": "宝贝疫苗接种全周期规划",
    "defaultBirthDate": "2026-09-01",
    "guidelineVersion": "2026年6月版（国家免疫规划疫苗儿童免疫程序及说明）",
    "sourceWorkbook": "疫苗接种全周期规划_MS_Project导入与数据总表1.xlsx",
    "sourceClinic": "双桥区西大街街道社区卫生服务中心",
    "updatedAt": "2026-11-24"
  },
  "correctionNotes": [
    "常规程序按出生日期推算。已过参考日期但没有记录时，先核对接种证。迟种、混用及有基础疾病儿童的安排由接种门诊确定。",
    "联合疫苗可按所含成分和已完成的剂次计入相应程序。切换方案只调整待办，已登记的接种记录单独保留。",
    "乙脑和甲肝均有减毒活和灭活程序；本地供应和免费产品请向门诊确认。",
    "自费项目价格取自原门诊公示，展示的金额仅供估算。流感按季安排，肺炎球菌、轮状病毒等需核对具体产品和起种年龄。"
  ],
  "sources": [
    {
      "id": "nip",
      "label": "国家疾控局、国家卫生健康委 · 2026 年儿童免疫程序",
      "url": "https://www.ndcpa.gov.cn/jbkzzx/c100014/common/content/content_2073005020766703616.html"
    },
    {
      "id": "flu",
      "label": "中国疾控中心 · 2026—2027 年流感疫苗接种指南",
      "url": "https://ivdc.chinacdc.cn/cnic/fascc/202609/t20260903_1839790.htm"
    },
    {
      "id": "ev71",
      "label": "中国疾控中心 · 肠道病毒 71 型灭活疫苗使用技术指南",
      "url": "https://www.chinacdc.cn/jkyj/crb2/bl/grxfxb/jswj_fxb/202409/P020240907592483972395.pdf"
    },
    {
      "id": "rv",
      "label": "河北省疾控中心 · 轮状病毒疫苗接种程序",
      "url": "https://www.hebeicdc.cn/jkdt/83253.jhtml"
    },
    {
      "id": "pcv",
      "label": "河北省疾控中心 · 肺炎球菌疫苗与适用人群",
      "url": "https://www.hebeicdc.cn/jkdt/83252.jhtml"
    },
    {
      "id": "var",
      "label": "河北省疾控中心 · 水痘疫苗接种程序",
      "url": "https://www.hebeicdc.cn/jkdt/83254.jhtml"
    },
    {
      "id": "hpv",
      "label": "深圳市卫生健康委 · 四价及九价 HPV 疫苗男性适龄范围",
      "url": "https://www.sz.gov.cn/hdjlpt/detail?pid=3461654&via=pc"
    },
    {
      "id": "men",
      "label": "康希诺生物 · 曼海欣产品免疫程序",
      "url": "https://cansinotech.com.cn/detail-818"
    },
    {
      "id": "rabies",
      "label": "国家疾控局、国家卫生健康委 · 狂犬病暴露预防处置规范",
      "url": "https://www.ndcpa.gov.cn/jbkzzx/c100014/common/content/content_1706569159854649344.html"
    }
  ],
  "replacementPlans": [
    {
      "id": "pentavalent",
      "name": "五联疫苗全程方案",
      "price": 2500,
      "replaces": [
        "task-9",
        "task-14",
        "task-20",
        "task-54",
        "task-10",
        "task-21",
        "task-27",
        "task-42"
      ],
      "doses": [
        {
          "id": "pentavalent-1",
          "ageMonths": 2,
          "name": "五联疫苗 - 第1剂",
          "price": 625
        },
        {
          "id": "pentavalent-2",
          "ageMonths": 3,
          "name": "五联疫苗 - 第2剂",
          "price": 625
        },
        {
          "id": "pentavalent-3",
          "ageMonths": 4,
          "name": "五联疫苗 - 第3剂",
          "price": 625
        },
        {
          "id": "pentavalent-4",
          "ageMonths": 18,
          "name": "五联疫苗 - 第4剂（加强）",
          "price": 625
        }
      ]
    },
    {
      "id": "menhyxia",
      "exclusiveGroup": "meningococcal_infant",
      "name": "曼海欣 ACYW135结合疫苗方案（6月龄起替代A群）",
      "price": 840,
      "replaces": [
        "task-28",
        "task-36"
      ],
      "doses": [
        {
          "id": "menhyxia-1",
          "ageMonths": 6,
          "name": "曼海欣 ACYW135结合疫苗 - 第1剂",
          "price": 420
        },
        {
          "id": "menhyxia-2",
          "ageMonths": 9,
          "name": "曼海欣 ACYW135结合疫苗 - 第2剂",
          "price": 420
        }
      ]
    },
    {
      "id": "menac",
      "exclusiveGroup": "meningococcal_infant",
      "name": "AC结合流脑疫苗方案（替代A群）",
      "price": 390,
      "replaces": [
        "task-28",
        "task-36"
      ],
      "doses": [
        {
          "id": "menac-course",
          "ageMonths": 3,
          "name": "AC结合流脑疫苗（全程按门诊安排）",
          "price": 390
        }
      ]
    },
    {
      "id": "acyw-mpsv4",
      "name": "ACYW135群流脑多糖疫苗方案（3岁/6岁替代A+C群）",
      "price": 420,
      "replaces": [
        "task-52",
        "task-58"
      ],
      "doses": [
        {
          "id": "acyw-mpsv4-1",
          "ageMonths": 36,
          "name": "ACYW135流脑多糖疫苗 - 第1剂",
          "price": 210
        },
        {
          "id": "acyw-mpsv4-2",
          "ageMonths": 72,
          "name": "ACYW135流脑多糖疫苗 - 第2剂（加强）",
          "price": 210
        }
      ]
    },
    {
      "id": "hepa-inactivated",
      "name": "甲肝灭活疫苗方案",
      "price": 316,
      "replaces": [
        "task-44"
      ],
      "doses": [
        {
          "id": "hepa-i-1",
          "ageMonths": 18,
          "name": "甲肝灭活疫苗 - 第1剂",
          "price": 158
        },
        {
          "id": "hepa-i-2",
          "ageMonths": 24,
          "name": "甲肝灭活疫苗 - 第2剂",
          "price": 158
        }
      ]
    },
    {
      "id": "hpv4",
      "exclusiveGroup": "hpv",
      "name": "四价HPV自费方案",
      "price": 2454,
      "replaces": [
        "task-60",
        "task-61"
      ],
      "doses": [
        {
          "id": "hpv4-course",
          "ageMonths": 156,
          "name": "四价HPV疫苗（全程3剂）",
          "price": 2454
        }
      ]
    },
    {
      "id": "hpv9",
      "exclusiveGroup": "hpv",
      "name": "九价HPV自费方案（男女均可接种）",
      "price": 3954,
      "replaces": [
        "task-60",
        "task-61"
      ],
      "doses": [
        {
          "id": "hpv9-course",
          "ageMonths": 156,
          "name": "九价HPV疫苗（全程3剂）",
          "price": 3954
        }
      ]
    }
  ],
  "schedule": [
    {
      "id": "task-4",
      "uid": 4,
      "ageMonths": 0,
      "name": "卡介苗 (BCG) - 第1剂",
      "isFree": true,
      "category": "free",
      "site": "上臂三角肌中部略下处",
      "route": "皮内注射",
      "dose": "0.1ml",
      "prevents": "结核性脑膜炎及粟粒性肺结核",
      "cost": 0,
      "detail": "早产、免疫缺陷或错过出生接种时，由门诊评估适宜时机。",
      "catalogId": 2
    },
    {
      "id": "task-5",
      "uid": 5,
      "ageMonths": 0,
      "name": "乙肝疫苗 (HepB) - 第1剂（出生24小时内）",
      "isFree": true,
      "category": "free",
      "site": "上臂三角肌",
      "route": "肌肉注射",
      "dose": "酵母10μg或CHO 10/20μg",
      "prevents": "乙型病毒性肝炎",
      "cost": 0,
      "detail": "常规在出生后 24 小时内尽早接种。母亲乙肝表面抗原阳性或情况不详时，应由出生医院在 12 小时内尽早安排首剂，并评估其他预防措施。",
      "catalogId": 1
    },
    {
      "id": "task-7",
      "uid": 7,
      "ageMonths": 1,
      "name": "乙肝疫苗 (HepB) - 第2剂",
      "isFree": true,
      "category": "free",
      "site": "上臂三角肌",
      "route": "肌肉注射",
      "dose": "酵母10μg或CHO 10/20μg",
      "prevents": "乙型病毒性肝炎",
      "cost": 0,
      "detail": "常规在 1 月龄接种。首剂延迟时请门诊核对间隔。",
      "catalogId": 1
    },
    {
      "id": "task-9",
      "uid": 9,
      "ageMonths": 2,
      "name": "【免费方案】脊灰灭活疫苗 (IPV) - 第1剂",
      "isFree": true,
      "category": "free",
      "site": "大腿前外侧中部或上臂三角肌",
      "route": "肌肉注射",
      "dose": "0.5ml",
      "prevents": "脊髓灰质炎(I、II、III型)",
      "cost": 0,
      "detail": "2026版国家免疫规划2+2程序首针IPV灭活疫苗",
      "catalogId": 3
    },
    {
      "id": "task-10",
      "uid": 10,
      "ageMonths": 2,
      "name": "【免费方案】百白破疫苗 (DTaP) - 第1剂",
      "isFree": true,
      "category": "free",
      "site": "上臂外侧三角肌或臀部",
      "route": "肌肉注射",
      "dose": "0.5ml",
      "prevents": "百日咳、白喉、破伤风",
      "cost": 0,
      "detail": "【2026年版新规】满2月龄应尽早接种首剂百白破（DTaP 5剂次程序首针）。",
      "catalogId": 5
    },
    {
      "id": "task-11",
      "uid": 11,
      "ageMonths": 2,
      "name": "13价肺炎球菌结合疫苗 - 第1剂",
      "isFree": false,
      "category": "paid",
      "site": "大腿前外侧或上臂三角肌",
      "route": "肌肉注射",
      "dose": "0.5ml",
      "prevents": "13种血清型引起的侵袭性肺炎、脑膜炎",
      "cost": 703,
      "detail": "时间线按河北疾控列举的婴儿期示例排期。品牌和开始接种年龄会改变剂次与间隔。",
      "catalogId": 16
    },
    {
      "id": "task-12",
      "uid": 12,
      "ageMonths": 2,
      "name": "【可选自费】五价轮状病毒疫苗 - 第1剂",
      "isFree": false,
      "category": "paid",
      "site": "口服",
      "route": "口服",
      "dose": "2ml",
      "prevents": "G1-G4, G9型婴幼儿轮状病毒腹泻",
      "cost": 280,
      "detail": "五价口服疫苗首剂为 6–12 周龄，相邻剂次间隔 4–10 周，第 3 剂不晚于 32 周龄。",
      "catalogId": 14
    },
    {
      "id": "task-14",
      "uid": 14,
      "ageMonths": 3,
      "name": "【免费方案】脊灰灭活疫苗 (IPV) - 第2剂",
      "isFree": true,
      "category": "free",
      "site": "大腿前外侧或上臂三角肌",
      "route": "肌肉注射",
      "dose": "0.5ml",
      "prevents": "脊髓灰质炎(I、II、III型)",
      "cost": 0,
      "detail": "2026版国家免疫规划2+2程序第2剂IPV灭活疫苗。",
      "catalogId": 3
    },
    {
      "id": "task-24",
      "uid": 24,
      "ageMonths": 3,
      "name": "【可选自费】五价轮状病毒疫苗 - 第2剂",
      "isFree": false,
      "category": "paid",
      "site": "口服",
      "route": "口服",
      "dose": "2ml",
      "prevents": "轮状病毒腹泻",
      "cost": 280,
      "detail": "与上剂间隔 4–10 周，全程须在产品规定的周龄内完成。",
      "catalogId": 14,
      "previous": "task-12"
    },
    {
      "id": "task-17",
      "uid": 17,
      "ageMonths": 4,
      "name": "13价肺炎球菌结合疫苗 - 第2剂",
      "isFree": false,
      "category": "paid",
      "site": "大腿前外侧或上臂三角肌",
      "route": "肌肉注射",
      "dose": "0.5ml",
      "prevents": "肺炎球菌侵袭性疾病",
      "cost": 703,
      "detail": "时间线按河北疾控列举的婴儿期示例排期。品牌和开始接种年龄会改变剂次与间隔。",
      "catalogId": 16
    },
    {
      "id": "task-20",
      "uid": 20,
      "ageMonths": 4,
      "name": "【免费方案】脊灰减毒活疫苗 (bOPV) - 第3剂",
      "isFree": true,
      "category": "free",
      "site": "口服",
      "route": "口服",
      "dose": "1粒或2滴(0.1ml)",
      "prevents": "脊髓灰质炎",
      "cost": 0,
      "detail": "2026版国家免疫规划2+2程序第3剂（bOPV）。",
      "catalogId": 4
    },
    {
      "id": "task-21",
      "uid": 21,
      "ageMonths": 4,
      "name": "【免费方案】百白破疫苗 (DTaP) - 第2剂",
      "isFree": true,
      "category": "free",
      "site": "上臂外侧三角肌或臀部",
      "route": "肌肉注射",
      "dose": "0.5ml",
      "prevents": "百日咳、白喉、破伤风",
      "cost": 0,
      "detail": "【2026年版新规】4月龄接种百白破（DTaP）第2剂。",
      "catalogId": 5
    },
    {
      "id": "task-37",
      "uid": 37,
      "ageMonths": 4,
      "name": "【可选自费】五价轮状疫苗 - 第3剂（全程完成）",
      "isFree": false,
      "category": "paid",
      "site": "口服",
      "route": "口服",
      "dose": "2ml",
      "prevents": "轮状病毒腹泻",
      "cost": 280,
      "detail": "与上剂间隔 4–10 周，第 3 剂不晚于 32 周龄。超过窗口，请带接种证向门诊核对。",
      "catalogId": 14,
      "previous": "task-24"
    },
    {
      "id": "task-23",
      "uid": 23,
      "ageMonths": 6,
      "name": "13价肺炎球菌结合疫苗 - 第3剂",
      "isFree": false,
      "category": "paid",
      "site": "大腿前外侧或上臂三角肌",
      "route": "肌肉注射",
      "dose": "0.5ml",
      "prevents": "肺炎球菌侵袭性疾病",
      "cost": 703,
      "detail": "时间线按河北疾控列举的婴儿期示例排期。品牌和开始接种年龄会改变剂次与间隔。",
      "catalogId": 16
    },
    {
      "id": "task-26",
      "uid": 26,
      "ageMonths": 6,
      "name": "【免费方案】乙肝疫苗 (HepB) - 第3剂（全程完成）",
      "isFree": true,
      "category": "free",
      "site": "上臂三角肌",
      "route": "肌肉注射",
      "dose": "酵母10μg或CHO 10/20μg",
      "prevents": "乙型病毒性肝炎",
      "cost": 0,
      "detail": "乙肝全程3剂完成（小于12月龄内完成）。",
      "catalogId": 1
    },
    {
      "id": "task-27",
      "uid": 27,
      "ageMonths": 6,
      "name": "【免费方案】百白破疫苗 (DTaP) - 第3剂",
      "isFree": true,
      "category": "free",
      "site": "上臂外侧三角肌或臀部",
      "route": "肌肉注射",
      "dose": "0.5ml",
      "prevents": "百日咳、白喉、破伤风",
      "cost": 0,
      "detail": "【2026年版新规】6月龄接种百白破（DTaP）第3剂，完成婴儿期基础3剂。",
      "catalogId": 5
    },
    {
      "id": "task-28",
      "uid": 28,
      "ageMonths": 6,
      "name": "【免费方案】A群流脑多糖疫苗 - 第1剂",
      "isFree": true,
      "category": "free",
      "site": "上臂外侧三角肌附着处",
      "route": "皮下注射",
      "dose": "0.5ml (30μg)",
      "prevents": "A群流行性脑脊髓膜炎",
      "cost": 0,
      "detail": "A 群多糖疫苗的常规首剂在 6 月龄，第 2 剂在 9 月龄。",
      "catalogId": 10
    },
    {
      "id": "task-29",
      "uid": 29,
      "ageMonths": 6,
      "name": "【可选自费】手足口疫苗 (EV71) - 第1剂",
      "isFree": false,
      "category": "paid",
      "site": "上臂外侧三角肌附着处",
      "route": "肌肉注射",
      "dose": "0.5ml",
      "prevents": "EV71型手足口病及重症",
      "cost": 198,
      "detail": "预防 EV71 感染引起的手足口病。6 月龄起接种 2 剂，相隔 1 个月，鼓励在 12 月龄前完成。",
      "catalogId": 23
    },
    {
      "id": "task-30",
      "uid": 30,
      "ageMonths": 6,
      "name": "流感疫苗（旧版单项记录）",
      "isFree": false,
      "category": "paid",
      "site": "上臂外侧三角肌附着处",
      "route": "肌肉注射",
      "dose": "0.5ml",
      "prevents": "流行性感冒",
      "cost": 82,
      "detail": "旧版保存的单条流感计划或记录。本季用哪种疫苗、需要几剂，请与门诊核对。",
      "catalogId": 28,
      "legacyFlu": true
    },
    {
      "id": "task-34",
      "uid": 34,
      "ageMonths": 7,
      "name": "【可选自费】手足口疫苗 (EV71) - 第2剂",
      "isFree": false,
      "category": "paid",
      "site": "上臂外侧三角肌附着处",
      "route": "肌肉注射",
      "dose": "0.5ml",
      "prevents": "EV71型手足口病",
      "cost": 198,
      "detail": "首剂后 1 个月。登记首剂实际日期后，第二剂的参考日期随之更新。",
      "catalogId": 23,
      "anchor": "task-29",
      "offsetMonths": 1
    },
    {
      "id": "task-32",
      "uid": 32,
      "ageMonths": 8,
      "name": "【免费方案】麻腮风疫苗 (MMR) - 第1剂",
      "isFree": true,
      "category": "free",
      "site": "上臂外侧三角肌下缘附着处",
      "route": "皮下注射",
      "dose": "0.5ml",
      "prevents": "麻疹、风疹、流行性腮腺炎",
      "cost": 0,
      "detail": "【2026年版新规】8月龄接种MMR首剂（小于12月龄完成）。",
      "catalogId": 8
    },
    {
      "id": "task-33",
      "uid": 33,
      "ageMonths": 8,
      "name": "【免费方案】乙脑减毒活疫苗 (JE-L) - 第1剂",
      "isFree": true,
      "category": "free",
      "site": "上臂外侧三角肌下缘附着处",
      "route": "皮下注射",
      "dose": "0.5ml",
      "prevents": "流行性乙型脑炎",
      "cost": 0,
      "detail": "8月龄第1剂（小于12月龄完成）。",
      "catalogId": 9
    },
    {
      "id": "task-36",
      "uid": 36,
      "ageMonths": 9,
      "name": "【免费方案】A群流脑多糖疫苗 - 第2剂",
      "isFree": true,
      "category": "free",
      "site": "上臂外侧三角肌附着处",
      "route": "皮下注射",
      "dose": "0.5ml (30μg)",
      "prevents": "A群流行性脑脊髓膜炎",
      "cost": 0,
      "detail": "与第1剂间隔不小于3个月（小于24月龄完成）。",
      "catalogId": 10
    },
    {
      "id": "task-39",
      "uid": 39,
      "ageMonths": 12,
      "name": "【可选自费】水痘减毒活疫苗 - 第1剂",
      "isFree": false,
      "category": "paid",
      "site": "上臂外侧三角肌附着处",
      "route": "皮下注射",
      "dose": "0.5ml",
      "prevents": "水痘",
      "cost": 176,
      "detail": "河北疾控给出的儿童常规首剂在 12–18 月龄；其他地区按当地程序。",
      "catalogId": 24
    },
    {
      "id": "task-40",
      "uid": 40,
      "ageMonths": 12,
      "name": "13价肺炎球菌结合疫苗 - 加强剂",
      "isFree": false,
      "category": "paid",
      "site": "大腿前外侧或上臂三角肌",
      "route": "肌肉注射",
      "dose": "0.5ml",
      "prevents": "肺炎球菌侵袭性疾病",
      "cost": 703,
      "detail": "时间线按河北疾控列举的婴儿期示例排期。品牌和开始接种年龄会改变剂次与间隔。",
      "catalogId": 16
    },
    {
      "id": "task-42",
      "uid": 42,
      "ageMonths": 18,
      "name": "【免费方案】百白破疫苗 (DTaP) - 第4剂（幼儿加强）",
      "isFree": true,
      "category": "free",
      "site": "上臂外侧三角肌或臀部",
      "route": "肌肉注射",
      "dose": "0.5ml",
      "prevents": "百日咳、白喉、破伤风",
      "cost": 0,
      "detail": "【2026年版新规】18月龄接种百白破（DTaP）第4剂（与第3剂间隔不小于6个月，小于24月龄完成）。",
      "catalogId": 5
    },
    {
      "id": "task-43",
      "uid": 43,
      "ageMonths": 18,
      "name": "【免费方案】麻腮风疫苗 (MMR) - 第2剂",
      "isFree": true,
      "category": "free",
      "site": "上臂外侧三角肌下缘附着处",
      "route": "皮下注射",
      "dose": "0.5ml",
      "prevents": "麻疹、风疹、流行性腮腺炎",
      "cost": 0,
      "detail": "【2026年版新规】18月龄接种麻腮风疫苗第2剂（小于24月龄完成）。",
      "catalogId": 8
    },
    {
      "id": "task-44",
      "uid": 44,
      "ageMonths": 18,
      "name": "【免费方案】甲肝减毒活疫苗 (HepA-L) - 第1剂",
      "isFree": true,
      "category": "free",
      "site": "上臂外侧三角肌附着处",
      "route": "皮下注射",
      "dose": "0.5或1.0ml",
      "prevents": "甲型病毒性肝炎",
      "cost": 0,
      "detail": "18月龄接种1剂（小于24月龄完成）。",
      "catalogId": 12
    },
    {
      "id": "task-48",
      "uid": 48,
      "ageMonths": 24,
      "name": "【免费方案】乙脑减毒活疫苗 (JE-L) - 第2剂（全程完成）",
      "isFree": true,
      "category": "free",
      "site": "上臂外侧三角肌下缘附着处",
      "route": "皮下注射",
      "dose": "0.5ml",
      "prevents": "流行性乙型脑炎",
      "cost": 0,
      "detail": "2周岁接种第2剂，乙脑减毒全程完成（小于3周岁完成）。",
      "catalogId": 9
    },
    {
      "id": "task-49",
      "uid": 49,
      "ageMonths": 24,
      "name": "【可选自费】23价肺炎球菌多糖疫苗",
      "isFree": false,
      "category": "paid",
      "site": "上臂外侧三角肌附着处",
      "route": "肌肉或皮下注射",
      "dose": "0.5ml",
      "prevents": "肺炎、脑膜炎、中耳炎、败血症",
      "cost": 225,
      "detail": "23 价多糖疫苗用于 2 岁及以上适宜人群，尤其需评估高风险情况；与婴幼儿肺炎球菌结合疫苗分别管理。",
      "catalogId": 26
    },
    {
      "id": "task-50",
      "uid": 50,
      "ageMonths": 24,
      "name": "【可选自费】ACYW135群脑膜炎多糖疫苗 - 第1剂",
      "isFree": false,
      "category": "paid",
      "site": "上臂外侧三角肌附着处",
      "route": "皮下注射",
      "dose": "0.5ml",
      "prevents": "ACYW135群流行性脑脊髓膜炎",
      "cost": 210,
      "detail": "请门诊结合接种史、产品和间隔评估；与 3、6 周岁流脑方案一并核对。",
      "catalogId": 27
    },
    {
      "id": "task-52",
      "uid": 52,
      "ageMonths": 36,
      "name": "【免费方案】A+C群流脑多糖疫苗 - 第1剂",
      "isFree": true,
      "category": "free",
      "site": "上臂外侧三角肌附着处",
      "route": "皮下注射",
      "dose": "0.5ml (100μg)",
      "prevents": "A群及C群流行性脑膜炎",
      "cost": 0,
      "detail": "3周岁接种第1剂（与A群第2剂间隔不小于12个月，小于4周岁完成）。",
      "catalogId": 11
    },
    {
      "id": "task-54",
      "uid": 54,
      "ageMonths": 48,
      "name": "【免费方案】脊灰减毒活疫苗 (bOPV) - 第4剂（全程完成）",
      "isFree": true,
      "category": "free",
      "site": "口服",
      "route": "口服",
      "dose": "1粒或2滴(0.1ml)",
      "prevents": "脊髓灰质炎",
      "cost": 0,
      "detail": "4周岁加强第4剂，脊灰全程完成（小于5周岁完成）。",
      "catalogId": 4
    },
    {
      "id": "task-55",
      "uid": 55,
      "ageMonths": 48,
      "name": "【可选自费】水痘减毒活疫苗 - 第2剂（全程完成）",
      "isFree": false,
      "category": "paid",
      "site": "上臂外侧三角肌附着处",
      "route": "皮下注射",
      "dose": "0.5ml",
      "prevents": "水痘",
      "cost": 176,
      "detail": "河北疾控给出的儿童常规第二剂在 3–4 周岁，时间线以 4 周岁为例。",
      "catalogId": 24
    },
    {
      "id": "task-57",
      "uid": 57,
      "ageMonths": 72,
      "name": "【免费方案】百白破疫苗 (DTaP) - 第5剂（学龄前加强）",
      "isFree": true,
      "category": "free",
      "site": "上臂三角肌",
      "route": "肌肉注射",
      "dose": "0.5ml",
      "prevents": "百日咳、白喉、破伤风",
      "cost": 0,
      "detail": "【2026年版新规】6周岁接种百白破疫苗（DTaP）第5剂加强针（原白破DT升级为DTaP，小于7周岁完成）。",
      "catalogId": 5
    },
    {
      "id": "task-58",
      "uid": 58,
      "ageMonths": 72,
      "name": "【免费方案】A+C群流脑多糖疫苗 - 第2剂（全程完成）",
      "isFree": true,
      "category": "free",
      "site": "上臂外侧三角肌附着处",
      "route": "皮下注射",
      "dose": "0.5ml (100μg)",
      "prevents": "A群及C群流行性脑膜炎",
      "cost": 0,
      "detail": "6周岁接种第2剂（两剂次间隔不小于3年，小于7周岁完成），流脑全程完成。",
      "catalogId": 11
    },
    {
      "id": "task-60",
      "uid": 60,
      "ageMonths": 156,
      "name": "【国家规划】双价HPV疫苗 - 第1剂（13周岁女孩免费）",
      "isFree": true,
      "category": "free",
      "gender": "female",
      "site": "上臂外侧三角肌",
      "route": "肌肉注射",
      "dose": "0.5ml",
      "prevents": "HPV 16、18型宫颈癌",
      "cost": 0,
      "detail": "国家免费双价 HPV 面向 2011 年 11 月 10 日及以后出生的适龄女孩，13 周岁接种首剂。",
      "catalogId": 13
    },
    {
      "id": "task-61",
      "uid": 61,
      "ageMonths": 162,
      "name": "【国家规划】双价HPV疫苗 - 第2剂（13周岁女孩免费，全程完成）",
      "isFree": true,
      "category": "free",
      "gender": "female",
      "site": "上臂外侧三角肌",
      "route": "肌肉注射",
      "dose": "0.5ml",
      "prevents": "HPV 16、18型宫颈癌",
      "cost": 0,
      "detail": "首剂后间隔 6 个月；建议在首剂后 12 个月内完成第 2 剂。",
      "catalogId": 13,
      "anchor": "task-60",
      "offsetMonths": 6
    }
  ],
  "catalog": [
    {
      "id": 1,
      "name": "乙肝疫苗",
      "type": "免疫规划",
      "prevents": "乙型病毒性肝炎",
      "note": "出生首剂通常在 24 小时内；母亲乙肝表面抗原阳性或情况不详时由出生医院尽早安排。",
      "source": "nip",
      "price": "免费",
      "route": "肌内注射"
    },
    {
      "id": 2,
      "name": "卡介苗",
      "type": "免疫规划",
      "prevents": "结核性脑膜炎、粟粒性肺结核",
      "note": "早产、免疫异常或未及时接种者，由门诊评估。",
      "source": "nip",
      "price": "免费",
      "route": "皮内注射"
    },
    {
      "id": 3,
      "name": "脊灰灭活疫苗 (IPV)",
      "type": "免疫规划",
      "prevents": "脊髓灰质炎(I、II、III型)",
      "note": "常规脊灰程序的前 2 剂为灭活疫苗。",
      "source": "nip",
      "compare": "combination",
      "price": "免费",
      "route": "肌内注射"
    },
    {
      "id": 4,
      "name": "脊灰减毒活疫苗 (bOPV)",
      "type": "免疫规划",
      "prevents": "脊髓灰质炎",
      "note": "常规脊灰程序的第 3、4 剂为口服减毒活疫苗。",
      "source": "nip",
      "compare": "combination",
      "price": "免费",
      "route": "口服"
    },
    {
      "id": 5,
      "name": "百白破疫苗",
      "type": "免疫规划",
      "prevents": "百日咳、白喉、破伤风",
      "note": "6 周岁的加强剂仍为百白破；婴幼儿期使用五联后也应核对这一剂。",
      "source": "nip",
      "compare": "combination",
      "price": "免费",
      "route": "肌内注射"
    },
    {
      "id": 6,
      "name": "白破疫苗（DT）",
      "type": "特定情况",
      "prevents": "白喉、破伤风",
      "note": "免疫规划白破（DT）用于 7–11 周岁儿童补种，具体剂次由门诊按既往接种史确定。",
      "source": "nip",
      "route": "肌内注射"
    },
    {
      "id": 7,
      "name": "麻风疫苗（MR，旧记录）",
      "type": "特定情况",
      "prevents": "麻疹、风疹",
      "note": "旧接种证上可能出现麻风（MR）。现行常规程序的两剂均使用麻腮风（MMR）；核对旧记录请带接种证。",
      "source": "nip"
    },
    {
      "id": 8,
      "name": "麻腮风疫苗",
      "type": "免疫规划",
      "prevents": "麻疹、腮腺炎、风疹",
      "note": "常规程序的两剂均使用含麻疹、腮腺炎、风疹成分的联合疫苗。",
      "source": "nip",
      "price": "免费",
      "route": "皮下注射"
    },
    {
      "id": 9,
      "name": "乙脑减毒活疫苗",
      "type": "免疫规划",
      "prevents": "流行性乙型脑炎",
      "note": "当地也可使用乙脑灭活程序，产品和剂次数不同。",
      "source": "nip",
      "compare": "je",
      "price": "免费",
      "route": "皮下注射"
    },
    {
      "id": 10,
      "name": "A群流脑多糖疫苗",
      "type": "免疫规划",
      "prevents": "A群流行性脑脊髓膜炎",
      "note": "两剂至少相隔 3 个月。含 A、C 群成分的结合疫苗须按具体产品完成相应剂次。",
      "source": "nip",
      "compare": "men-infant",
      "price": "免费",
      "route": "皮下注射"
    },
    {
      "id": 11,
      "name": "A+C流脑多糖疫苗",
      "type": "免疫规划",
      "prevents": "A群及C群流行性脑脊髓膜炎",
      "note": "面向儿童期的两剂 A+C 群程序，和婴儿期流脑安排分开比较。",
      "source": "nip",
      "compare": "men-child",
      "price": "免费",
      "route": "皮下注射"
    },
    {
      "id": 12,
      "name": "甲肝减毒活疫苗",
      "type": "免疫规划",
      "prevents": "甲型病毒性肝炎",
      "note": "当地也可使用两剂甲肝灭活程序。",
      "source": "nip",
      "compare": "hepa",
      "price": "免费",
      "route": "皮下注射"
    },
    {
      "id": 13,
      "name": "双价HPV疫苗",
      "type": "免疫规划",
      "prevents": "HPV 16、18型宫颈癌",
      "note": "国家免费双价 HPV 面向 2011 年 11 月 10 日及以后出生的适龄女孩，13 周岁接种首剂。两剂间隔 6 个月。",
      "source": "nip",
      "compare": "hpv",
      "price": "免费/适龄补贴",
      "route": "肌内注射"
    },
    {
      "id": 14,
      "name": "五价轮状疫苗",
      "type": "自费可选",
      "prevents": "G1-G4, G9型婴幼儿轮状病毒腹泻",
      "note": "五价口服疫苗首剂为 6–12 周龄，相邻剂次间隔 4–10 周，第 3 剂不晚于 32 周龄。",
      "source": "rv",
      "price": "280.00元/剂",
      "route": "口服",
      "care": "有肠套叠史、免疫缺陷或正在接受免疫抑制治疗时，请在接种前告知门诊并核对具体产品。"
    },
    {
      "id": 15,
      "name": "脊灰灭活疫苗（非免疫规划产品）",
      "type": "自费可选",
      "prevents": "脊髓灰质炎(I、II、III型)",
      "note": "按说明书接种的 IPV 可计入相应脊灰剂次。完成规定的 4 剂含 IPV 疫苗后，无需再接种 bOPV。产品和后续衔接由门诊核对。",
      "source": "nip",
      "price": "188.00元/剂"
    },
    {
      "id": 16,
      "name": "13价肺炎疫苗",
      "type": "自费可选",
      "prevents": "13种血清型侵袭性肺炎、脑膜炎等",
      "note": "婴儿期示例为 2、4、6 月龄基础免疫，12–15 月龄加强。起种年龄与品牌会改变安排。",
      "source": "pcv",
      "price": "703.00元/针",
      "care": "接种后可有局部红肿、疼痛或发热。已知对产品成分严重过敏时请提前告知门诊。"
    },
    {
      "id": 17,
      "name": "原公示“三联苗”（品名待核）",
      "type": "特定情况",
      "prevents": "原表产品名称有歧义",
      "note": "原公示的“三联苗”名称和所列成分不一致。请先出示接种证上的完整产品名，再由门诊确认成分和程序。"
    },
    {
      "id": 18,
      "name": "五联苗 (百白破-IPV-Hib)",
      "type": "自费可选",
      "prevents": "百白破、脊灰、Hib五病同防",
      "note": "含百白破、灭活脊灰和 Hib 成分。按说明书完成相应剂次后，门诊可按成分核对。",
      "source": "nip",
      "compare": "combination",
      "price": "625.00元/剂"
    },
    {
      "id": 19,
      "name": "四联疫苗 (百白破-Hib)",
      "type": "自费可选",
      "prevents": "百白破、b型流感嗜血杆菌",
      "note": "含百白破和 Hib 成分，不含脊灰。剂次按具体产品说明书；脊灰仍应单独安排。",
      "source": "nip",
      "price": "370.00元/剂"
    },
    {
      "id": 20,
      "name": "b型流感嗜血杆菌 (Hib)",
      "type": "自费可选",
      "prevents": "b型流感嗜血杆菌侵袭性疾病",
      "note": "开始接种的年龄和具体产品决定剂次。已用含 Hib 的联合疫苗时请门诊核对。",
      "price": "115.00元/剂"
    },
    {
      "id": 21,
      "name": "口服轮状病毒活疫苗",
      "type": "自费可选",
      "prevents": "A群轮状病毒引起的腹泻",
      "note": "河北疾控列出的口服轮状病毒活疫苗适用于 2 月龄至 3 岁婴幼儿，每年 1 剂。五价产品有另一套周龄限制。",
      "source": "rv",
      "price": "185.00元/剂",
      "route": "口服",
      "care": "有肠套叠史、免疫缺陷或正在接受免疫抑制治疗时，请在接种前告知门诊并核对具体产品。"
    },
    {
      "id": 22,
      "name": "AC结合流脑疫苗",
      "type": "自费可选",
      "prevents": "A群及C群流行性脑膜炎",
      "note": "小于 24 月龄时，按结合疫苗说明书完成规定剂次后，可计入相应 A 群流脑程序。",
      "source": "nip",
      "compare": "men-infant",
      "price": "130.00元/剂"
    },
    {
      "id": 23,
      "name": "手足口疫苗 (EV71)",
      "type": "自费可选",
      "prevents": "EV71型手足口病及重症",
      "note": "预防 EV71 感染引起的手足口病。6 月龄起接种 2 剂，相隔 1 个月，鼓励在 12 月龄前完成。",
      "source": "ev71",
      "price": "198.00元/剂"
    },
    {
      "id": 24,
      "name": "水痘减毒活疫苗",
      "type": "自费可选",
      "prevents": "水痘",
      "note": "河北省示例：1–12 岁无接种史儿童接种 2 剂，首剂 12–18 月龄，第二剂 3–4 周岁。请核对当地程序。",
      "source": "var",
      "price": "176.00元/剂",
      "route": "皮下注射",
      "care": "有免疫缺陷、正在使用免疫抑制剂或既往有严重过敏反应，请提前向门诊说明。"
    },
    {
      "id": 25,
      "name": "甲肝灭活疫苗",
      "type": "免疫规划",
      "prevents": "甲型病毒性肝炎",
      "note": "可使用免疫规划灭活产品或当地自费产品，先向门诊确认供应。",
      "source": "nip",
      "compare": "hepa",
      "schedulePlan": "hepa-nip",
      "price": "免疫规划免费；原自费公示 158 元/剂",
      "route": "肌内注射"
    },
    {
      "id": 26,
      "name": "23价肺炎球菌多糖疫苗",
      "type": "特定情况",
      "prevents": "肺炎、脑膜炎、败血症等",
      "note": "23 价多糖疫苗用于 2 岁及以上适宜人群，尤其需评估高风险情况；与婴幼儿肺炎球菌结合疫苗分别管理。",
      "source": "pcv",
      "price": "225.00元/剂",
      "care": "接种后可有局部红肿、疼痛或发热。已知对产品成分严重过敏时请提前告知门诊。"
    },
    {
      "id": 27,
      "name": "ACYW135群流脑多糖疫苗",
      "type": "自费可选",
      "prevents": "ACYW135群流行性脑脊髓膜炎",
      "note": "四价多糖和四价结合产品的适龄、程序不同。3、6 周岁的安排由门诊按既往剂次核对。",
      "source": "nip",
      "compare": "men-child",
      "price": "210.00元/剂"
    },
    {
      "id": 28,
      "name": "流感灭活疫苗（含裂解疫苗）",
      "type": "自费可选",
      "prevents": "流行性感冒",
      "note": "6 月龄至未满 9 岁：从未接种过流感疫苗且本季选用灭活疫苗时，需同厂家同种疫苗 2 剂，至少相隔 4 周；既往接种过者本季 1 剂。9 岁及以上本季 1 剂。减毒活疫苗仅用于相应适龄人群，本季 1 剂。",
      "source": "flu",
      "price": "82.00 ~ 148.00元/针"
    },
    {
      "id": 29,
      "name": "甲乙型肝炎联合疫苗",
      "type": "特定情况",
      "prevents": "联合预防甲型、乙型肝炎",
      "note": "甲乙肝联合疫苗有不同规格。请按具体产品、年龄与既往接种史核对全程，儿童常规表分别列出甲肝和乙肝。",
      "price": "120.00元/剂"
    },
    {
      "id": 30,
      "name": "四价HPV疫苗",
      "type": "自费可选",
      "prevents": "HPV 6, 11, 16, 18型感染及宫颈癌",
      "note": "进口四价男性适龄为 9–26 周岁；女性和男性均须按具体产品说明书确定适用年龄、剂次。",
      "source": "hpv",
      "compare": "hpv",
      "price": "818.00元/针"
    },
    {
      "id": 31,
      "name": "九价HPV疫苗",
      "type": "自费可选",
      "prevents": "疫苗覆盖型别的人乳头瘤病毒感染及相关疾病",
      "note": "进口佳达修 9 男性适龄为 16–26 周岁。不同九价产品的适应证可能不同，按所用产品核对。",
      "source": "hpv",
      "compare": "hpv",
      "price": "1318.00元/针"
    },
    {
      "id": 32,
      "name": "成人乙肝疫苗",
      "type": "特定情况",
      "prevents": "乙型病毒性肝炎",
      "note": "此项为成人用规格。儿童常规接种请查看乙肝疫苗。",
      "price": "95.00元/剂"
    },
    {
      "id": 33,
      "name": "人用狂犬病疫苗",
      "type": "特定情况",
      "prevents": "狂犬病 (致死率近100%)",
      "note": "动物抓咬伤或疑似暴露后，应尽快到狂犬病暴露预防处置门诊。接种程序由门诊依据暴露、免疫史及所用疫苗决定。",
      "source": "rabies",
      "price": "原公示 75 元/剂"
    },
    {
      "id": 34,
      "name": "狂犬病人免疫球蛋白",
      "type": "特定情况",
      "prevents": "狂犬病暴露后保护（被动免疫制剂）",
      "note": "被动免疫制剂。暴露后是否需要与疫苗配合使用，由狂犬病暴露预防处置门诊及时评估。",
      "source": "rabies"
    },
    {
      "id": 35,
      "name": "乙脑灭活疫苗（JE-I）",
      "type": "免疫规划",
      "prevents": "流行性乙型脑炎",
      "note": "8 月龄两剂相隔 7–10 天，另在 2、6 周岁各接种一剂；产品与当地供应有关。",
      "source": "nip",
      "compare": "je",
      "schedulePlan": "je-inactivated",
      "price": "免疫规划免费",
      "route": "肌内注射"
    }
  ]
};
