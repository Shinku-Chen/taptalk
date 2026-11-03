(function (root, factory) {
    const core = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = core;
    } else {
        root.TapTalkCore = core;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const PLACEHOLDER = '请选择…';
    const MAX_QUICK_PER_PAGE = 6;

    function getPersons(data) {
        return (data.persons || []).map((person) => (
            typeof person === 'string' ? person : person.label
        ));
    }

    function getCategory(data, key) {
        return (data.categories || []).find((category) => category.key === key) || null;
    }

    // 根据 [人物, 类别, ...项目标签] 解析最后一个项目节点；路径不完整时返回 null。
    function resolveNode(data, path) {
        if (!Array.isArray(path) || path.length < 3) {
            return null;
        }

        const category = getCategory(data, path[1]);
        if (!category) {
            return null;
        }

        let nodes = category.items || [];
        let node = null;

        for (let index = 2; index < path.length; index += 1) {
            node = nodes.find((candidate) => candidate.label === path[index]) || null;
            if (!node) {
                return null;
            }
            nodes = node.children || [];
        }

        return node;
    }

    function getComposeStage(data, path) {
        if (!Array.isArray(path) || path.length === 0) {
            return { stage: 'person', node: null, category: null };
        }

        if (path.length === 1) {
            return { stage: 'category', node: null, category: null };
        }

        const category = getCategory(data, path[1]);
        if (!category) {
            return { stage: 'unknown', node: null, category: null };
        }

        if (path.length === 2) {
            return { stage: 'item', node: null, category };
        }

        const node = resolveNode(data, path);
        if (!node) {
            return { stage: 'unknown', node: null, category };
        }
        if (node.children) {
            return { stage: 'children', node, category };
        }
        if (node.actions) {
            return { stage: 'actions', node, category };
        }
        return { stage: 'say', node, category };
    }

    // 返回当前层可点击的选项，kind 供 app.js 区分人物、类别、项目节点和动作。
    function getComposeOptions(data, path) {
        const safePath = Array.isArray(path) ? path : [];

        if (safePath.length === 0) {
            return getPersons(data).map((label) => ({ kind: 'person', label, tone: 'person' }));
        }

        if (safePath.length === 1) {
            return (data.categories || []).map((category) => ({
                kind: 'category',
                label: category.key,
                title: category.title,
                tone: category.tone
            }));
        }

        const category = getCategory(data, safePath[1]);
        if (!category) {
            return [];
        }

        if (safePath.length === 2) {
            return (category.items || []).map((node) => ({
                kind: 'node',
                label: node.label,
                node,
                tone: category.tone
            }));
        }

        const node = resolveNode(data, safePath);
        if (!node) {
            return [];
        }

        if (node.children) {
            return node.children.map((child) => ({
                kind: 'node',
                label: child.label,
                node: child,
                tone: category.tone
            }));
        }

        if (node.actions) {
            return node.actions.map((action) => ({
                kind: 'action',
                label: action.label,
                action,
                tone: category.tone
            }));
        }

        return [];
    }

    function fillSayTemplate(template, person, item) {
        return String(template).replace(/{p}/g, person).replace(/{i}/g, item);
    }

    function buildSentenceForAction(person, item, action) {
        const pattern = action.pattern || 'state';
        const verb = action.verb || (pattern === 'question' ? '' : action.label);
        const label = action.label;

        switch (pattern) {
            case 'want':
                return person + '要' + verb + item;
            case 'not':
                return person + '不' + verb + item;
            case 'need':
                return person + '需要' + item;
            case 'noNeed':
                return person + '不需要' + item;
            case 'request':
                return person === '我' ? '帮我' + verb + item : '请' + person + '帮我' + verb + item;
            case 'state':
                return person + item + label;
            case 'subjectState':
                return item + label;
            case 'done':
                return person + label;
            case 'question':
                return person + '什么时候' + verb + item + '？';
            case 'where':
                return person === '我' ? '我的' + item + '在哪里？' : person + '的' + item + '在哪里？';
            case 'direct':
                return label;
            default:
                return person + item + label;
        }
    }

    // 把组合路径和动作转成中文句子；say 项目直接套模板，不要求 action。
    function buildSentence(data, path, action) {
        if (!Array.isArray(path) || path.length < 3) {
            return '';
        }

        const person = path[0];
        const node = resolveNode(data, path);
        if (!node) {
            return '';
        }

        if (node.say) {
            return fillSayTemplate(node.say, person, node.label);
        }

        if (!action) {
            return '';
        }

        return buildSentenceForAction(person, node.label, action);
    }

    function buildPartial(data, path) {
        if (!Array.isArray(path) || path.length === 0) {
            return PLACEHOLDER;
        }

        const person = path[0];
        const node = resolveNode(data, path);
        const category = path.length > 1 ? getCategory(data, path[1]) : null;
        const lastLabel = node ? node.label : (category ? category.key : '');

        return lastLabel ? person + ' · ' + lastLabel + '…' : person + '…';
    }

    function buildBreadcrumb(data, path, actionLabel) {
        if (!Array.isArray(path) || path.length === 0) {
            return [];
        }

        const parts = [{ label: path[0], kind: 'person' }];
        if (path.length > 1) {
            const category = getCategory(data, path[1]);
            parts.push({ label: category ? (category.title || category.key) : path[1], kind: 'category' });
        }
        for (let index = 2; index < path.length; index += 1) {
            parts.push({ label: path[index], kind: 'node' });
        }
        if (actionLabel) {
            parts.push({ label: actionLabel, kind: 'action' });
        }
        return parts;
    }

    function getQuickPages(data, customPhrases) {
        const pages = (data.quickPages || []).map((page) => ({
            title: page.title,
            tone: page.tone,
            phrases: page.phrases.map((text) => ({ text, tone: page.tone, custom: false }))
        }));

        const builtInTexts = new Set(pages.flatMap((page) => page.phrases.map((phrase) => phrase.text)));
        const customTexts = [];
        const seenCustom = new Set();

        (customPhrases || []).forEach((rawText) => {
            const text = String(rawText || '').trim();
            if (!text || builtInTexts.has(text) || seenCustom.has(text)) {
                return;
            }
            seenCustom.add(text);
            customTexts.push(text);
        });

        const totalCustomPages = Math.ceil(customTexts.length / MAX_QUICK_PER_PAGE);
        for (let index = 0; index < totalCustomPages; index += 1) {
            const title = totalCustomPages > 1
                ? '我的常用语 ' + (index + 1) + '/' + totalCustomPages
                : '我的常用语';
            pages.push({
                title,
                tone: 'custom',
                phrases: customTexts
                    .slice(index * MAX_QUICK_PER_PAGE, (index + 1) * MAX_QUICK_PER_PAGE)
                    .map((text) => ({ text, tone: 'custom', custom: true }))
            });
        }

        return pages;
    }

    // 开发与测试用的数据完整性检查，返回人类可读的问题列表。
    function validateData(data) {
        const issues = [];
        const persons = getPersons(data);

        if (persons.length === 0) {
            issues.push('persons 不能为空');
        }
        if (new Set(persons).size !== persons.length) {
            issues.push('persons 存在重复项');
        }

        const categoryKeys = new Set();
        (data.categories || []).forEach((category) => {
            if (!category.key || categoryKeys.has(category.key)) {
                issues.push('类别 key 缺失或重复: ' + category.key);
            }
            categoryKeys.add(category.key);
            if (!Array.isArray(category.items) || category.items.length === 0) {
                issues.push('类别 ' + category.key + ' 没有项目');
                return;
            }
            validateNodes(category.items, '类别 ' + category.key, [], issues);
        });

        const quickTexts = new Set();
        (data.quickPages || []).forEach((page) => {
            if (!page.title) {
                issues.push('常用语页面缺少 title');
            }
            if (!Array.isArray(page.phrases) || page.phrases.length === 0) {
                issues.push('常用语页面 ' + page.title + ' 没有内容');
                return;
            }
            if (page.phrases.length > MAX_QUICK_PER_PAGE) {
                issues.push('常用语页面 ' + page.title + ' 超过 ' + MAX_QUICK_PER_PAGE + ' 条');
            }
            page.phrases.forEach((text) => {
                if (!text || typeof text !== 'string') {
                    issues.push('常用语页面 ' + page.title + ' 存在空内容');
                    return;
                }
                if (quickTexts.has(text)) {
                    issues.push('常用语重复: ' + text);
                }
                quickTexts.add(text);
            });
        });

        return issues;
    }

    function validateNodes(nodes, scope, trail, issues) {
        const labels = new Set();

        nodes.forEach((node) => {
            const nodePath = trail.concat(node.label);
            const location = scope + ' > ' + nodePath.join(' > ');

            if (!node.label) {
                issues.push(scope + ' 存在没有 label 的项目');
                return;
            }
            if (labels.has(node.label)) {
                issues.push(location + ' 在同级重复');
            }
            labels.add(node.label);

            const hasChildren = Array.isArray(node.children);
            const hasActions = Array.isArray(node.actions);
            const hasSay = typeof node.say === 'string' && node.say.trim() !== '';
            const kinds = [hasChildren, hasActions, hasSay].filter(Boolean).length;

            if (kinds !== 1) {
                issues.push(location + ' 必须且只能有 children / actions / say 之一');
            }

            if (hasChildren) {
                if (node.children.length === 0) {
                    issues.push(location + ' 的 children 为空');
                } else {
                    validateNodes(node.children, scope, nodePath, issues);
                }
            }

            if (hasActions) {
                if (node.actions.length === 0) {
                    issues.push(location + ' 的 actions 为空');
                }
                const actionLabels = new Set();
                node.actions.forEach((action) => {
                    if (!action || !action.label) {
                        issues.push(location + ' 存在没有 label 的动作');
                        return;
                    }
                    if (actionLabels.has(action.label)) {
                        issues.push(location + ' 的动作重复: ' + action.label);
                    }
                    actionLabels.add(action.label);
                    if (!isKnownPattern(action.pattern)) {
                        issues.push(location + ' 的动作 ' + action.label + ' 使用了未知句式: ' + action.pattern);
                    }
                    if (needsVerb(action.pattern) && !action.verb) {
                        issues.push(location + ' 的动作 ' + action.label + ' 缺少 verb');
                    }
                });
            }

            if (hasSay && !node.say.includes('{p}') && !node.say.includes('{i}')) {
                issues.push(location + ' 的 say 模板至少需要包含 {p} 或 {i}');
            }
        });
    }

    function isKnownPattern(pattern) {
        return [
            'want', 'not', 'need', 'noNeed', 'request', 'state',
            'subjectState', 'done', 'question', 'where', 'direct'
        ].includes(pattern);
    }

    function needsVerb(pattern) {
        return ['want', 'not', 'request'].includes(pattern);
    }

    return {
        PLACEHOLDER,
        MAX_QUICK_PER_PAGE,
        getPersons,
        getCategory,
        resolveNode,
        getComposeStage,
        getComposeOptions,
        buildSentence,
        buildPartial,
        buildBreadcrumb,
        getQuickPages,
        validateData
    };
});
