(function (root, factory) {
    const data = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = data;
    } else {
        root.TapTalkData = data;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    // 动作句式工厂：pattern 由 js/core.js 解释，verb 用于生成“要/不/什么时候”等句子。
    const want = (label, verb) => ({ label, pattern: 'want', verb: verb || label });
    const not = (label, verb) => ({ label, pattern: 'not', verb: verb || label.replace(/^不/, '') });
    const need = () => ({ label: '需要', pattern: 'need' });
    const noNeed = () => ({ label: '不需要', pattern: 'noNeed' });
    const request = (label, verb) => ({ label, pattern: 'request', verb: verb || label.replace(/^帮我/, '') });
    const state = (label) => ({ label, pattern: 'state' });
    const subject = (label) => ({ label, pattern: 'subjectState' });
    const done = (label) => ({ label, pattern: 'done' });
    const question = (verb) => ({ label: '什么时候', pattern: 'question', verb });
    const where = () => ({ label: '在哪里', pattern: 'where' });
    const direct = (label) => ({ label, pattern: 'direct' });

    // 词板节点工厂：一个节点只能是 children（下级）、actions（动作）或 say（直接说出）之一。
    const item = (label, actions) => ({ label, actions });
    const say = (label, template) => ({ label, say: template || '{p}{i}' });
    const group = (label, children) => ({ label, children });

    const bodyPart = (label) => item(label, [
        state('疼'), state('很疼'), state('有点疼'), state('酸'),
        state('麻'), state('痒'), state('肿'), state('动不了')
    ]);

    const medicalCheck = (label, verb, questionVerb) => item(label, [
        need(), noNeed(), question(questionVerb === undefined ? '' : questionVerb), done(verb + '完了')
    ]);

    const medicalCare = (label, verb, questionVerb) => item(label, [
        need(), noNeed(), question(questionVerb === undefined ? '' : questionVerb), done(verb + '好了')
    ]);

    const medicine = (label) => item(label, [
        want('吃'), not('不吃', '吃'), need(), noNeed(), question('吃'), done('吃过了')
    ]);

    return {
        app: {
            name: '医疗沟通助手',
            shortName: '开口说',
            version: '0.2.0',
            storagePrefix: 'taptalk'
        },

        persons: ['我', '你', '他/她', '医生', '护士', '家人'],

        quickPages: [
            {
                title: '紧急求助',
                tone: 'danger',
                phrases: ['救命', '叫医生', '叫护士', '我不舒服', '我很疼', '我喘不上气']
            },
            {
                title: '基本需求',
                tone: 'need',
                phrases: ['我要喝水', '我要上厕所', '我要吃饭', '我饿了', '我渴了', '帮我翻身']
            },
            {
                title: '如厕护理',
                tone: 'care',
                phrases: ['我要小便', '我要大便', '我尿不出来', '我便秘', '帮我换尿布', '帮我擦干净']
            },
            {
                title: '身体不适',
                tone: 'warning',
                phrases: ['我头晕', '我恶心', '我想吐', '我胸闷', '我发烧', '我睡不着']
            },
            {
                title: '疼痛位置',
                tone: 'danger',
                phrases: ['我头疼', '我胸口疼', '我肚子疼', '我腰疼', '我伤口疼', '我全身疼']
            },
            {
                title: '照护需求',
                tone: 'care',
                phrases: ['帮我擦身', '帮我换衣服', '我要刷牙', '我要洗头', '帮我拍背', '我要起床']
            },
            {
                title: '回答',
                tone: 'answer',
                phrases: ['是', '不是', '好', '不好', '等一下', '我不知道']
            },
            {
                title: '感受',
                tone: 'feeling',
                phrases: ['我冷', '我热', '我害怕', '我难过', '我想家', '我累了']
            },
            {
                title: '医疗',
                tone: 'medical',
                phrases: ['我要吃药', '我要量体温', '我要测血压', '我要换药', '我要打针', '我要抽血']
            },
            {
                title: '社交',
                tone: 'social',
                phrases: ['谢谢', '请帮我', '我想休息', '我想看电视', '我想听音乐', '再见']
            },
            {
                title: '家人',
                tone: 'social',
                phrases: ['我爱你', '我想你', '抱抱我', '陪我一会儿', '我没事', '别担心']
            }
        ],

        categories: [
            {
                key: '衣',
                title: '穿衣',
                tone: 'cloth',
                items: [
                    item('衣服', [want('穿'), want('脱'), want('换'), want('洗'), not('不穿', '穿'), request('帮我穿', '穿'), request('帮我脱', '脱')]),
                    item('裤子', [want('穿'), want('脱'), want('换'), want('洗'), not('不穿', '穿'), request('帮我穿', '穿'), request('帮我脱', '脱')]),
                    item('鞋子', [want('穿'), want('脱'), want('换'), want('洗'), not('不穿', '穿'), request('帮我穿', '穿'), request('帮我脱', '脱')]),
                    item('袜子', [want('穿'), want('脱'), want('换'), want('洗'), not('不穿', '穿'), request('帮我穿', '穿'), request('帮我脱', '脱')]),
                    item('帽子', [want('戴'), want('脱'), want('换'), want('洗'), not('不戴', '戴'), request('帮我戴', '戴'), request('帮我脱', '脱')]),
                    item('手套', [want('戴'), want('脱'), want('换'), want('洗'), not('不戴', '戴'), request('帮我戴', '戴'), request('帮我脱', '脱')])
                ]
            },
            {
                key: '食',
                title: '吃饭',
                tone: 'food',
                items: [
                    item('饭', [want('吃'), not('不吃', '吃'), done('吃好了'), request('帮我热', '热'), question('吃')]),
                    item('菜', [want('吃'), not('不吃', '吃'), done('吃好了'), request('帮我热', '热'), question('吃')]),
                    item('汤', [want('喝'), not('不喝', '喝'), done('喝好了'), request('帮我热', '热'), question('喝')]),
                    item('药', [want('吃'), not('不吃', '吃'), need(), done('吃过了'), question('吃'), request('帮我拿', '拿')]),
                    item('水', [want('喝'), not('不喝', '喝'), done('喝好了'), request('帮我倒', '倒'), question('喝')]),
                    item('茶', [want('喝'), not('不喝', '喝'), done('喝好了'), request('帮我倒', '倒'), question('喝')]),
                    item('水果', [want('吃'), not('不吃', '吃'), done('吃好了'), request('帮我洗', '洗'), request('帮我切', '切')]),
                    item('粥', [want('喝'), not('不喝', '喝'), done('喝好了'), request('帮我热', '热'), question('喝')])
                ]
            },
            {
                key: '住',
                title: '居住',
                tone: 'home',
                items: [
                    item('灯', [want('开'), want('关'), subject('太亮'), subject('太暗'), request('帮我开', '开'), request('帮我关', '关')]),
                    item('空调', [want('开'), want('关'), direct('把空调调高一点'), direct('把空调调低一点'), subject('太冷'), subject('太热')]),
                    item('床', [want('调高'), want('调低'), direct('帮我摇高床头'), direct('帮我摇低床头'), direct('帮我抬腿'), direct('帮我放平')]),
                    item('被子', [want('盖好', '盖'), want('拿开', '拿'), want('换'), subject('太厚'), subject('太薄'), request('帮我盖', '盖')]),
                    item('枕头', [want('垫高', '垫'), want('拿开', '拿'), want('换'), request('帮我垫', '垫')]),
                    item('窗户', [want('打开', '开'), want('关上', '关'), want('开窗帘', '开'), want('关窗帘', '关'), subject('太吵')]),
                    item('电视', [direct('我想看电视'), direct('帮我打开电视'), direct('帮我关掉电视'), direct('我想换台'), direct('声音小一点'), direct('声音大一点')]),
                    item('手机', [direct('帮我把手机拿来'), direct('帮我充电'), direct('帮我解锁'), direct('我想打电话'), direct('我想看手机')])
                ]
            },
            {
                key: '行',
                title: '行动',
                tone: 'move',
                items: [
                    item('走路', [direct('我想走一走'), direct('扶我走'), direct('我走不动了'), direct('先不走')]),
                    item('坐下', [direct('我想坐下'), direct('扶我坐下'), direct('先不坐')]),
                    item('站起', [direct('我想站起来'), direct('扶我站起来'), direct('先不站')]),
                    item('轮椅', [direct('我想坐轮椅'), request('帮我推轮椅', '推'), where(), direct('先不坐')]),
                    item('拐杖', [direct('我想用拐杖'), request('帮我拿拐杖', '拿'), where(), direct('先不用')]),
                    item('搀扶', [direct('扶我一下'), direct('我想休息一下'), direct('先不用扶')]),
                    item('翻身', [direct('帮我翻身'), direct('向左翻'), direct('向右翻'), direct('我想平躺'), direct('先不翻')]),
                    item('散步', [direct('我想出去走走'), direct('陪我散步'), direct('先不去')])
                ]
            },
            {
                key: '医',
                title: '医疗',
                tone: 'medical',
                items: [
                    group('检查', [
                        medicalCheck('抽血', '抽'),
                        medicalCheck('CT', '做', '做'),
                        medicalCheck('核磁', '做', '做'),
                        medicalCheck('X光', '拍', '拍'),
                        medicalCheck('超声', '做', '做'),
                        medicalCheck('心电图', '做', '做'),
                        medicalCheck('胃镜', '做', '做'),
                        medicalCheck('肠镜', '做', '做')
                    ]),
                    group('治疗', [
                        medicalCare('输液', '输'),
                        medicalCare('打针', '打'),
                        medicalCare('换药', '换'),
                        medicalCare('拆线', '拆'),
                        medicalCare('吸氧', '吸'),
                        medicalCare('雾化', '做', '做')
                    ]),
                    group('用药', [
                        medicine('止痛药'),
                        medicine('消炎药'),
                        medicine('降压药'),
                        medicine('安眠药'),
                        medicine('胃药'),
                        medicine('中药')
                    ]),
                    group('护理', [
                        medicalCare('量体温', '量'),
                        medicalCare('测血压', '测'),
                        medicalCare('测血糖', '测'),
                        medicalCare('擦身', '擦'),
                        medicalCare('洗头', '洗'),
                        medicalCare('剪指甲', '剪')
                    ]),
                    group('住院', [
                        item('入院', [need(), noNeed(), question('办')]),
                        item('出院', [need(), noNeed(), question('办')]),
                        item('换病房', [want('换'), need(), question('')]),
                        item('陪护', [need(), noNeed(), question('')]),
                        item('探视', [need(), noNeed(), question('')])
                    ]),
                    group('不适', [
                        say('疼'),
                        say('头晕'),
                        say('恶心'),
                        say('胸闷'),
                        say('气短'),
                        say('发烧'),
                        say('想吐'),
                        say('出血了')
                    ])
                ]
            },
            {
                key: '身体',
                title: '身体',
                tone: 'body',
                items: [
                    bodyPart('头'), bodyPart('眼睛'), bodyPart('耳朵'), bodyPart('鼻子'),
                    bodyPart('嘴'), bodyPart('牙'), bodyPart('脖子'), bodyPart('肩膀'),
                    bodyPart('胸口'), bodyPart('肚子'), bodyPart('腰'), bodyPart('背'),
                    bodyPart('手臂'), bodyPart('手'), bodyPart('腿'), bodyPart('脚'),
                    bodyPart('关节'), bodyPart('伤口')
                ]
            },
            {
                key: '感受',
                title: '感受',
                tone: 'feeling',
                items: [
                    say('害怕'), say('难过'), say('焦虑'), say('孤独'), say('生气'), say('累'),
                    say('冷'), say('热'), say('困'), say('想家'), say('无聊'), say('安心')
                ]
            },
            {
                key: '其他',
                title: '日常',
                tone: 'daily',
                items: [
                    say('休息', '{p}想{i}'),
                    say('睡觉', '{p}想{i}'),
                    say('起床', '{p}想{i}'),
                    say('洗澡', '{p}想{i}'),
                    say('刷牙', '{p}想{i}'),
                    say('洗脸', '{p}想{i}'),
                    item('上厕所', [direct('我想小便'), direct('我想大便'), direct('帮我上厕所'), direct('帮我换尿布'), direct('帮我擦干净')]),
                    item('翻身', [direct('帮我翻身'), direct('向左翻'), direct('向右翻'), direct('我想平躺')]),
                    item('拍背', [direct('帮我拍背'), direct('轻一点'), direct('重一点')]),
                    say('看电视', '{p}想{i}'),
                    say('听音乐', '{p}想{i}'),
                    say('打电话', '{p}想{i}'),
                    say('写字', '{p}想{i}'),
                    say('散步', '{p}想出去走走'),
                    say('回家', '{p}想{i}')
                ]
            }
        ]
    };
});
