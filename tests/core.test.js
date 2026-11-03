const test = require('node:test');
const assert = require('node:assert/strict');

const data = require('../js/data.js');
const core = require('../js/core.js');

function collectNodePaths(items, trail = []) {
    const paths = [];
    items.forEach((node) => {
        const nextTrail = trail.concat(node.label);
        paths.push({ path: nextTrail, node });
        if (node.children) {
            paths.push(...collectNodePaths(node.children, nextTrail));
        }
    });
    return paths;
}

test('词板数据通过完整性校验', () => {
    assert.deepEqual(core.validateData(data), []);
});

test('常用语页面固定为 6 条以内且不重复', () => {
    const texts = new Set();
    let totalPhrases = 0;
    data.quickPages.forEach((page) => {
        assert.ok(page.phrases.length > 0 && page.phrases.length <= 6, page.title);
        page.phrases.forEach((text) => {
            assert.ok(!texts.has(text), '重复常用语: ' + text);
            texts.add(text);
            totalPhrases += 1;
        });
    });
    assert.equal(data.quickPages.length, 11);
    assert.equal(totalPhrases, 66);
});

test('组合表达按人物、类别、项目、动作生成自然句子', () => {
    const examples = [
        { path: ['我', '衣', '衣服'], action: { label: '穿', pattern: 'want', verb: '穿' }, expected: '我要穿衣服' },
        { path: ['我', '衣', '衣服'], action: { label: '不穿', pattern: 'not', verb: '穿' }, expected: '我不穿衣服' },
        { path: ['护士', '衣', '衣服'], action: { label: '帮我穿', pattern: 'request', verb: '穿' }, expected: '请护士帮我穿衣服' },
        { path: ['我', '医', '检查', '抽血'], action: { label: '需要', pattern: 'need' }, expected: '我需要抽血' },
        { path: ['我', '医', '检查', '抽血'], action: { label: '什么时候', pattern: 'question', verb: '' }, expected: '我什么时候抽血？' },
        { path: ['我', '身体', '头'], action: { label: '很疼', pattern: 'state' }, expected: '我头很疼' },
        { path: ['我', '住', '灯'], action: { label: '太亮', pattern: 'subjectState' }, expected: '灯太亮' },
        { path: ['我', '食', '饭'], action: { label: '吃好了', pattern: 'done' }, expected: '我吃好了' },
        { path: ['我', '行', '轮椅'], action: { label: '在哪里', pattern: 'where' }, expected: '我的轮椅在哪里？' }
    ];

    examples.forEach(({ path, action, expected }) => {
        assert.equal(core.buildSentence(data, path, action), expected);
    });
});

test('直接说出类项目无需再选动作', () => {
    assert.equal(core.buildSentence(data, ['我', '感受', '害怕']), '我害怕');
    assert.equal(core.buildSentence(data, ['我', '其他', '休息']), '我想休息');
    assert.equal(core.buildSentence(data, ['我', '医', '不适', '头晕']), '我头晕');
});

test('所有动作组合都不会产生重复助词或空值', () => {
    const persons = core.getPersons(data);
    let sentenceCount = 0;

    data.categories.forEach((category) => {
        collectNodePaths(category.items).forEach(({ path, node }) => {
            const fullPathBase = [persons[0], category.key].concat(path);
            if (node.say) {
                const sentence = core.buildSentence(data, fullPathBase);
                assertNatural(sentence, fullPathBase);
                sentenceCount += 1;
            }
            if (node.actions) {
                persons.forEach((person) => {
                    const fullPath = [person, category.key].concat(path);
                    node.actions.forEach((action) => {
                        const sentence = core.buildSentence(data, fullPath, action);
                        assertNatural(sentence, fullPath.concat(action.label));
                        if (action.pattern === 'question' || action.pattern === 'where') {
                            assert.ok(sentence.endsWith('？'), sentence);
                        } else {
                            assert.ok(!sentence.endsWith('？'), sentence);
                        }
                        sentenceCount += 1;
                    });
                });
            }
        });
    });

    assert.ok(sentenceCount > 700, '组合覆盖数量不足: ' + sentenceCount);
});

test('翻页与自定义常用语分组正确', () => {
    const custom = ['请把床摇高一点', '我想听广播', '请关门', '帮我开窗', '我想剪头发', '我想擦脸', '我要换枕头'];
    const pages = core.getQuickPages(data, custom);
    const builtInCount = data.quickPages.length;

    assert.equal(pages.length, builtInCount + 2);
    assert.equal(pages[builtInCount].phrases.length, 6);
    assert.equal(pages[builtInCount + 1].phrases.length, 1);
    assert.equal(pages[builtInCount].title, '我的常用语 1/2');
    assert.equal(pages[builtInCount].phrases[0].text, '请把床摇高一点');
});

test('组合导航层级可以逐步展开', () => {
    assert.equal(core.getComposeStage(data, []).stage, 'person');
    assert.equal(core.getComposeStage(data, ['我']).stage, 'category');
    assert.equal(core.getComposeStage(data, ['我', '医']).stage, 'item');
    assert.equal(core.getComposeStage(data, ['我', '医', '检查']).stage, 'children');
    assert.equal(core.getComposeStage(data, ['我', '医', '检查', '抽血']).stage, 'actions');
    assert.equal(core.getComposeStage(data, ['我', '感受', '害怕']).stage, 'say');
    assert.equal(core.getComposeOptions(data, ['我', '医', '检查', '抽血']).length, 4);
});

function assertNatural(sentence, context) {
    assert.ok(sentence, '句子为空: ' + context.join(' > '));
    assert.doesNotMatch(sentence, /undefined|null/, '句子含空值: ' + sentence);
    assert.doesNotMatch(sentence, /我要要|我不不|我我|你你|他他|请我帮我|帮我扶|帮我陪|。。/, '句子不自然: ' + sentence);
    assert.doesNotMatch(sentence, /^s|s$/, '句子首尾有空格: ' + sentence);
    assert.ok(sentence.length <= 40, '句子过长: ' + sentence);
}
