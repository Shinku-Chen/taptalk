(function () {
    'use strict';

    const data = window.TapTalkData;
    const core = window.TapTalkCore;
    if (!data || !core) {
        return;
    }

    const prefix = (data.app && data.app.storagePrefix) || 'taptalk';
    const STORAGE = {
        settings: prefix + '.settings.v1',
        history: prefix + '.history.v1',
        custom: prefix + '.custom.v1',
        mode: prefix + '.mode.v1'
    };

    const DEFAULT_SETTINGS = {
        theme: 'light',
        fontScale: 'normal',
        speechEnabled: true,
        autoSpeak: true,
        speechRate: 0.8,
        voiceURI: '',
        haptics: true,
        wakeLock: false
    };

    const MAX_HISTORY = 30;
    const MAX_CUSTOM = 30;
    const MAX_COMPOSE_PAGE_SIZE = 6;
    const BUILT_IN_QUICK = new Set(
        (data.quickPages || []).reduce(function (texts, page) {
            return texts.concat(page.phrases || []);
        }, [])
    );

    const state = {
        mode: 'quick',
        quickPage: 0,
        composePath: [],
        composePage: 0,
        completed: null,
        settings: Object.assign({}, DEFAULT_SETTINGS),
        history: [],
        custom: [],
        speaking: false,
        speechSeq: 0,
        speechTimer: null,
        wakeLock: null,
        toastTimer: null
    };

    const els = {};

    function byId(id) {
        return document.getElementById(id);
    }

    function initElements() {
        [
            'modeQuick', 'modeCompose', 'historyBtn', 'settingsBtn',
            'backBtn', 'breadcrumb', 'pageIndicator', 'sentenceText',
            'speakBtn', 'favoriteBtn', 'hintText', 'buttonGrid',
            'settingsDialog', 'historyDialog', 'helpDialog', 'toast',
            'themeSelect', 'fontSelect', 'speechEnabled', 'autoSpeak',
            'rateRange', 'rateValue', 'voiceSelect', 'speechNote',
            'hapticsToggle', 'wakeLockToggle', 'fullscreenBtn',
            'customInput', 'customAddBtn', 'customList',
            'helpBtn', 'resetSettingsBtn', 'historyList',
            'historyEmpty', 'clearHistoryBtn'
        ].forEach(function (id) {
            els[id] = byId(id);
        });
    }

    function readJSON(key, fallback) {
        try {
            const value = window.localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function writeJSON(key, value) {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            // 隐私模式或存储空间不足时继续使用内存状态。
        }
    }

    function normalizeSettings(raw) {
        const settings = Object.assign({}, DEFAULT_SETTINGS, raw || {});
        if (['light', 'dark', 'contrast'].indexOf(settings.theme) === -1) {
            settings.theme = DEFAULT_SETTINGS.theme;
        }
        if (['normal', 'large', 'xlarge'].indexOf(settings.fontScale) === -1) {
            settings.fontScale = DEFAULT_SETTINGS.fontScale;
        }
        if (typeof settings.speechEnabled !== 'boolean') {
            settings.speechEnabled = DEFAULT_SETTINGS.speechEnabled;
        }
        if (typeof settings.autoSpeak !== 'boolean') {
            settings.autoSpeak = DEFAULT_SETTINGS.autoSpeak;
        }
        if (typeof settings.haptics !== 'boolean') {
            settings.haptics = DEFAULT_SETTINGS.haptics;
        }
        if (typeof settings.wakeLock !== 'boolean') {
            settings.wakeLock = DEFAULT_SETTINGS.wakeLock;
        }
        const rate = Number(settings.speechRate);
        settings.speechRate = Number.isFinite(rate) ? Math.min(1.2, Math.max(0.6, rate)) : DEFAULT_SETTINGS.speechRate;
        settings.voiceURI = typeof settings.voiceURI === 'string' ? settings.voiceURI : '';
        return settings;
    }

    function normalizeHistory(raw) {
        if (!Array.isArray(raw)) {
            return [];
        }
        const result = [];
        const seen = new Set();
        raw.forEach(function (entry) {
            const text = typeof entry === 'string' ? entry : (entry && entry.text);
            const at = entry && Number(entry.at) ? Number(entry.at) : Date.now();
            const trimmed = String(text || '').trim();
            if (!trimmed || seen.has(trimmed)) {
                return;
            }
            seen.add(trimmed);
            result.push({ text: trimmed, at: at });
        });
        return result.slice(0, MAX_HISTORY);
    }

    function normalizeCustom(raw) {
        if (!Array.isArray(raw)) {
            return [];
        }
        const result = [];
        const seen = new Set();
        raw.forEach(function (entry) {
            const text = String(entry || '').trim();
            if (!text || text.length > 30 || seen.has(text) || BUILT_IN_QUICK.has(text)) {
                return;
            }
            seen.add(text);
            result.push(text);
        });
        return result.slice(0, MAX_CUSTOM);
    }

    function loadState() {
        state.settings = normalizeSettings(readJSON(STORAGE.settings, {}));
        state.history = normalizeHistory(readJSON(STORAGE.history, []));
        state.custom = normalizeCustom(readJSON(STORAGE.custom, []));
        const storedMode = readJSON(STORAGE.mode, 'quick');
        state.mode = storedMode === 'compose' ? 'compose' : 'quick';
    }

    function saveSettings() {
        writeJSON(STORAGE.settings, state.settings);
    }

    function saveHistory() {
        writeJSON(STORAGE.history, state.history);
    }

    function saveCustom() {
        writeJSON(STORAGE.custom, state.custom);
    }

    function saveMode() {
        writeJSON(STORAGE.mode, state.mode);
    }

    function clampPage(page, total) {
        return Math.min(Math.max(0, page), Math.max(0, total - 1));
    }

    function getQuickPages() {
        return core.getQuickPages(data, state.custom);
    }

    // 根据当前模式、层级和页码计算本轮要渲染的选项与分页信息。
    function getView() {
        if (state.mode === 'quick') {
            const pages = getQuickPages();
            state.quickPage = clampPage(state.quickPage, pages.length);
            const page = pages[state.quickPage] || { title: '', tone: 'need', phrases: [] };
            const options = page.phrases.map(function (phrase) {
                return { kind: 'phrase', text: phrase.text, tone: phrase.tone };
            });
            return {
                options: options,
                pageIndex: state.quickPage,
                totalPages: pages.length,
                page: page
            };
        }

        const options = core.getComposeOptions(data, state.composePath);
        const totalPages = Math.max(1, Math.ceil(options.length / MAX_COMPOSE_PAGE_SIZE));
        state.composePage = clampPage(state.composePage, totalPages);
        return {
            options: options,
            pageIndex: state.composePage,
            totalPages: totalPages,
            page: null
        };
    }

    function getStage() {
        return core.getComposeStage(data, state.composePath);
    }

    function render() {
        const view = getView();
        renderModeTabs();
        renderBreadcrumb(view);
        renderSentence(view);
        renderPageIndicator(view);
        renderGrid(view);
        renderBackButton();
        updateSpeakButton();
        updateFavoriteButton();
        fitAfterRender();
    }

    function renderModeTabs() {
        const isQuick = state.mode === 'quick';
        els.modeQuick.setAttribute('aria-selected', String(isQuick));
        els.modeCompose.setAttribute('aria-selected', String(!isQuick));
        els.modeQuick.tabIndex = isQuick ? 0 : -1;
        els.modeCompose.tabIndex = isQuick ? -1 : 0;
    }

    function appendCrumb(container, label, isCurrent) {
        const crumb = document.createElement('span');
        crumb.className = 'crumb' + (isCurrent ? ' is-current' : '');
        crumb.textContent = label;
        container.appendChild(crumb);
    }

    function renderBreadcrumb(view) {
        const breadcrumb = els.breadcrumb;
        breadcrumb.replaceChildren();

        let crumbs = [];
        if (state.mode === 'quick') {
            crumbs = [
                { label: '常用表达' },
                { label: view.page && view.page.title ? view.page.title : '词板' }
            ];
        } else if (state.completed && state.completed.mode === 'compose') {
            crumbs = core.buildBreadcrumb(data, state.completed.path, state.completed.actionLabel);
        } else if (state.composePath.length === 0) {
            crumbs = [
                { label: '组合表达' },
                { label: '选择说话人' }
            ];
        } else {
            crumbs = core.buildBreadcrumb(data, state.composePath, '');
            const stage = getStage().stage;
            if (stage === 'actions') {
                crumbs.push({ label: '选择动作' });
            } else if (stage === 'children') {
                crumbs.push({ label: '选择项目' });
            } else if (stage === 'category') {
                crumbs.push({ label: '选择类别' });
            }
        }

        crumbs.forEach(function (crumb, index) {
            if (index > 0) {
                const sep = document.createElement('span');
                sep.className = 'crumb-sep';
                sep.textContent = '›';
                sep.setAttribute('aria-hidden', 'true');
                breadcrumb.appendChild(sep);
            }
            appendCrumb(breadcrumb, crumb.label, index === crumbs.length - 1);
        });
    }

    function currentSentenceText() {
        if (state.completed) {
            return state.completed.text;
        }
        if (state.mode === 'quick') {
            return core.PLACEHOLDER;
        }
        return core.buildPartial(data, state.composePath);
    }

    function renderSentence() {
        const text = currentSentenceText();
        els.sentenceText.textContent = text;
        els.sentenceText.classList.toggle('is-placeholder', !state.completed && text.indexOf('…') !== -1);

        if (state.completed) {
            els.hintText.textContent = '已说出，点 🔊 可重复朗读';
            return;
        }

        if (state.mode === 'quick') {
            els.hintText.textContent = '点击一句话，立即朗读';
            return;
        }

        const stage = getStage().stage;
        const hints = {
            person: '先选择谁在说话',
            category: '选择想表达的类别',
            item: '选择具体内容',
            children: '继续选择具体项目',
            actions: '选择想表达的动作',
            say: '点击项目即可说出'
        };
        els.hintText.textContent = hints[stage] || '继续选择';
    }

    function renderPageIndicator(view) {
        if (view.totalPages > 1) {
            els.pageIndicator.textContent = (view.pageIndex + 1) + ' / ' + view.totalPages;
        } else {
            els.pageIndicator.textContent = '';
        }
    }

    function renderBackButton() {
        const canGoBack = state.mode === 'compose' && (state.composePath.length > 0 || Boolean(state.completed));
        els.backBtn.disabled = !canGoBack;
    }

    function optionLabel(option) {
        if (option.kind === 'phrase') {
            return '朗读：' + option.text;
        }
        if (option.kind === 'person') {
            return '选择说话人：' + option.label;
        }
        if (option.kind === 'category') {
            return '选择类别：' + option.label;
        }
        if (option.kind === 'action') {
            return '选择动作：' + option.label;
        }
        return '选择：' + option.label;
    }

    function renderGrid(view) {
        const grid = els.buttonGrid;
        grid.replaceChildren();

        const start = state.mode === 'quick' ? 0 : view.pageIndex * MAX_COMPOSE_PAGE_SIZE;
        const visible = view.options.slice(start, start + MAX_COMPOSE_PAGE_SIZE);

        for (let index = 0; index < MAX_COMPOSE_PAGE_SIZE; index += 1) {
            const option = visible[index];
            if (!option) {
                const empty = document.createElement('div');
                empty.className = 'grid-button grid-empty';
                empty.setAttribute('aria-hidden', 'true');
                grid.appendChild(empty);
                continue;
            }

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'grid-button tone-' + (option.tone || 'need');
            button.setAttribute('aria-label', optionLabel(option));
            button.dataset.index = String(index);
            button.dataset.shortcut = String(index + 1);

            if (isSelectedOption(option)) {
                button.classList.add('is-selected');
            }

            const label = document.createElement('span');
            label.className = 'btn-label';
            label.textContent = option.label || option.text;
            button.appendChild(label);
            button.addEventListener('click', function () {
                selectOption(option);
            });
            grid.appendChild(button);
        }

        const clear = document.createElement('button');
        clear.type = 'button';
        clear.className = 'grid-button function-btn clear';
        clear.textContent = '清空';
        clear.setAttribute('aria-label', '清空当前句子');
        clear.dataset.shortcut = '7';
        clear.addEventListener('click', resetAll);
        grid.appendChild(clear);

        const prev = document.createElement('button');
        prev.type = 'button';
        prev.className = 'grid-button function-btn page';
        prev.textContent = '上一页';
        prev.setAttribute('aria-label', '上一页');
        prev.dataset.shortcut = '8';
        prev.disabled = view.pageIndex <= 0;
        prev.addEventListener('click', previousPage);
        grid.appendChild(prev);

        const next = document.createElement('button');
        next.type = 'button';
        next.className = 'grid-button function-btn page';
        next.textContent = '下一页';
        next.setAttribute('aria-label', '下一页');
        next.dataset.shortcut = '9';
        next.disabled = view.pageIndex >= view.totalPages - 1;
        next.addEventListener('click', nextPage);
        grid.appendChild(next);
    }

    function isSelectedOption(option) {
        if (!state.completed || option.kind !== 'action') {
            return false;
        }
        return state.completed.actionLabel === option.label &&
            JSON.stringify(state.completed.path) === JSON.stringify(state.composePath);
    }

    // 处理一次点击：常用语直接完成，组合表达按人物/类别/项目/动作推进层级。
    function selectOption(option) {
        if (state.speaking) {
            stopSpeaking();
        }
        haptic();

        if (state.mode === 'quick') {
            complete(option.text, { mode: 'quick', path: [], actionLabel: '' });
            return;
        }

        state.completed = null;
        const path = state.composePath.slice();

        if (option.kind === 'person') {
            state.composePath = [option.label];
        } else if (option.kind === 'category') {
            path[1] = option.label;
            state.composePath = path.slice(0, 2);
        } else if (option.kind === 'node') {
            path.push(option.label);
            state.composePath = path;
            if (option.node && option.node.say) {
                const itemPath = state.composePath.slice();
                const text = core.buildSentence(data, itemPath);
                state.composePath = itemPath.slice(0, -1);
                complete(text, {
                    mode: 'compose',
                    path: itemPath,
                    actionLabel: ''
                });
                return;
            }
        } else if (option.kind === 'action') {
            complete(core.buildSentence(data, state.composePath, option.action), {
                mode: 'compose',
                path: state.composePath.slice(),
                actionLabel: option.label
            });
            return;
        }

        state.composePage = 0;
        render();
    }

    // 记录完整句子、写入历史、刷新界面，并按设置自动朗读。
    function complete(text, meta) {
        if (!text) {
            return;
        }
        state.completed = {
            text: text,
            at: Date.now(),
            mode: meta.mode,
            path: meta.path,
            actionLabel: meta.actionLabel || ''
        };
        addHistory(text);
        render();
        if (state.settings.autoSpeak && state.settings.speechEnabled && canSpeak()) {
            speak(text);
        }
    }

    function addHistory(text) {
        const trimmed = String(text || '').trim();
        if (!trimmed) {
            return;
        }
        state.history = [{ text: trimmed, at: Date.now() }]
            .concat(state.history.filter(function (entry) {
                return entry.text !== trimmed;
            }))
            .slice(0, MAX_HISTORY);
        saveHistory();
    }

    function goBack() {
        if (state.mode !== 'compose') {
            return;
        }
        if (state.speaking) {
            stopSpeaking();
        }
        if (state.completed) {
            haptic();
            state.completed = null;
            render();
            return;
        }
        if (state.composePath.length === 0) {
            return;
        }
        haptic();
        state.composePath = state.composePath.slice(0, -1);
        state.composePage = 0;
        render();
    }

    function resetAll() {
        if (state.speaking) {
            stopSpeaking();
        }
        haptic();
        state.completed = null;
        state.composePath = [];
        state.composePage = 0;
        state.quickPage = 0;
        render();
    }

    function previousPage() {
        const view = getView();
        if (view.pageIndex <= 0) {
            return;
        }
        haptic();
        if (state.mode === 'quick') {
            state.quickPage = view.pageIndex - 1;
        } else {
            state.composePage = view.pageIndex - 1;
        }
        render();
    }

    function nextPage() {
        const view = getView();
        if (view.pageIndex >= view.totalPages - 1) {
            return;
        }
        haptic();
        if (state.mode === 'quick') {
            state.quickPage = view.pageIndex + 1;
        } else {
            state.composePage = view.pageIndex + 1;
        }
        render();
    }

    function switchMode(mode) {
        if (mode === state.mode) {
            return;
        }
        if (state.speaking) {
            stopSpeaking();
        }
        haptic();
        state.mode = mode;
        state.completed = null;
        state.quickPage = 0;
        state.composePage = 0;
        saveMode();
        render();
    }

    function haptic() {
        if (!state.settings.haptics || !navigator.vibrate) {
            return;
        }
        try {
            navigator.vibrate(12);
        } catch (error) {
            // 部分浏览器禁用了震动，不影响主流程。
        }
    }

    function toast(message) {
        if (!els.toast) {
            return;
        }
        els.toast.textContent = message;
        els.toast.classList.add('is-visible');
        window.clearTimeout(state.toastTimer);
        state.toastTimer = window.setTimeout(function () {
            els.toast.classList.remove('is-visible');
        }, 2600);
    }

    function canSpeak() {
        return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    }

    function pickVoice() {
        if (!canSpeak()) {
            return null;
        }
        const voices = window.speechSynthesis.getVoices();
        if (state.settings.voiceURI) {
            const selected = voices.find(function (voice) {
                return voice.voiceURI === state.settings.voiceURI;
            });
            if (selected) {
                return selected;
            }
        }
        return voices.find(function (voice) {
            return /^zh/i.test(voice.lang);
        }) || null;
    }

    // 使用浏览器本地 TTS 朗读；取消上一句，并用兜底计时避免按钮一直停留在播放态。
    function speak(text) {
        if (!state.settings.speechEnabled) {
            toast('语音朗读已关闭，可在设置中打开');
            return;
        }
        if (!canSpeak()) {
            toast('当前浏览器不支持语音朗读');
            return;
        }
        const trimmed = String(text || '').trim();
        if (!trimmed) {
            toast('先选择一句完整的话');
            return;
        }

        window.speechSynthesis.cancel();
        window.clearTimeout(state.speechTimer);
        const speechSeq = state.speechSeq + 1;
        state.speechSeq = speechSeq;
        const utterance = new SpeechSynthesisUtterance(trimmed);
        utterance.lang = 'zh-CN';
        utterance.rate = state.settings.speechRate;
        utterance.pitch = 1;
        const voice = pickVoice();
        if (voice) {
            utterance.voice = voice;
        }
        utterance.onstart = function () {
            if (speechSeq !== state.speechSeq) {
                return;
            }
            state.speaking = true;
            updateSpeakButton();
        };
        utterance.onend = function () {
            if (speechSeq === state.speechSeq) {
                finishSpeaking();
            }
        };
        utterance.onerror = function () {
            if (speechSeq === state.speechSeq) {
                finishSpeaking();
            }
        };
        state.speaking = true;
        updateSpeakButton();
        try {
            window.speechSynthesis.speak(utterance);
        } catch (error) {
            finishSpeaking();
            toast('语音朗读失败，请检查浏览器设置');
            return;
        }
        const estimatedMs = Math.max(2600, Math.min(16000, trimmed.length * 520 / state.settings.speechRate));
        state.speechTimer = window.setTimeout(function () {
            if (speechSeq === state.speechSeq) {
                finishSpeaking();
            }
        }, estimatedMs + 1600);
    }

    function stopSpeaking() {
        state.speechSeq += 1;
        if (canSpeak()) {
            window.speechSynthesis.cancel();
        }
        finishSpeaking();
    }

    function finishSpeaking() {
        window.clearTimeout(state.speechTimer);
        state.speechTimer = null;
        state.speaking = false;
        updateSpeakButton();
    }

    function currentSpeakableText() {
        return state.completed ? state.completed.text : '';
    }

    function updateSpeakButton() {
        const hasText = Boolean(currentSpeakableText());
        els.speakBtn.classList.toggle('is-speaking', state.speaking);
        els.speakBtn.setAttribute('aria-label', state.speaking ? '停止朗读' : (hasText ? '朗读当前句子' : '朗读当前句子，尚未选择内容'));
        els.speakBtn.title = state.speaking ? '停止朗读' : '朗读当前句子';
    }

    function updateFavoriteButton() {
        const text = state.completed ? state.completed.text : '';
        const isFavorite = Boolean(text) && state.custom.indexOf(text) !== -1;
        els.favoriteBtn.classList.toggle('is-favorite', isFavorite);
        els.favoriteBtn.setAttribute('aria-label', isFavorite ? '已收藏为常用语' : '收藏为常用语');
        els.favoriteBtn.title = isFavorite ? '已收藏为常用语' : '收藏为常用语';
    }

    function addCustom(rawText) {
        const text = String(rawText || '').trim();
        if (!text) {
            toast('请输入一句话');
            return false;
        }
        if (text.length > 30) {
            toast('一句话最多 30 个字');
            return false;
        }
        if (state.custom.indexOf(text) !== -1) {
            toast('这句话已经在常用语里了');
            return false;
        }
        if (BUILT_IN_QUICK.has(text)) {
            toast('这句话已经在常用表达里了');
            return false;
        }
        if (state.custom.length >= MAX_CUSTOM) {
            toast('最多保存 ' + MAX_CUSTOM + ' 条常用语');
            return false;
        }
        state.custom.unshift(text);
        saveCustom();
        render();
        renderCustomList();
        toast('已加入我的常用语');
        return true;
    }

    function removeCustom(text) {
        state.custom = state.custom.filter(function (item) {
            return item !== text;
        });
        saveCustom();
        render();
        renderCustomList();
        toast('已删除常用语');
    }

    function addCurrentToCustom() {
        if (!state.completed) {
            toast('先选择一句完整的话');
            return;
        }
        addCustom(state.completed.text);
    }

    function renderCustomList() {
        const list = els.customList;
        list.replaceChildren();

        if (state.custom.length === 0) {
            const empty = document.createElement('li');
            empty.className = 'empty-state';
            empty.textContent = '还没有自定义常用语。';
            list.appendChild(empty);
            return;
        }

        state.custom.forEach(function (text) {
            const item = document.createElement('li');
            item.className = 'custom-item';

            const label = document.createElement('span');
            label.className = 'custom-text';
            label.textContent = text;

            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'custom-remove';
            remove.setAttribute('aria-label', '删除常用语：' + text);
            remove.textContent = '×';
            remove.addEventListener('click', function () {
                removeCustom(text);
            });

            item.appendChild(label);
            item.appendChild(remove);
            list.appendChild(item);
        });
    }

    function renderHistoryList() {
        const list = els.historyList;
        list.replaceChildren();
        const hasHistory = state.history.length > 0;

        els.historyEmpty.hidden = hasHistory;
        els.clearHistoryBtn.disabled = !hasHistory;

        state.history.forEach(function (entry) {
            const item = document.createElement('li');
            item.className = 'history-item';

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'history-play';
            button.setAttribute('aria-label', '重播：' + entry.text);

            const text = document.createElement('span');
            text.className = 'history-text';
            text.textContent = entry.text;

            const time = document.createElement('span');
            time.className = 'history-time';
            time.textContent = formatTime(entry.at);

            button.appendChild(text);
            button.appendChild(time);
            button.addEventListener('click', function () {
                speak(entry.text);
            });
            item.appendChild(button);
            list.appendChild(item);
        });
    }

    function formatTime(timestamp) {
        try {
            return new Date(timestamp).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return '';
        }
    }

    function clearHistory() {
        if (state.history.length === 0) {
            return;
        }
        if (!window.confirm('确定清空全部历史记录？')) {
            return;
        }
        state.history = [];
        saveHistory();
        renderHistoryList();
        toast('历史记录已清空');
    }

    function applySettings() {
        document.documentElement.dataset.theme = state.settings.theme;
        document.documentElement.dataset.font = state.settings.fontScale;
        const themeColor = state.settings.theme === 'contrast'
            ? '#000000'
            : (state.settings.theme === 'dark' ? '#08101f' : '#1456d8');
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.setAttribute('content', themeColor);
        }
    }

    function syncSettingsControls() {
        els.themeSelect.value = state.settings.theme;
        els.fontSelect.value = state.settings.fontScale;
        els.speechEnabled.checked = state.settings.speechEnabled;
        els.autoSpeak.checked = state.settings.autoSpeak;
        els.rateRange.value = String(state.settings.speechRate);
        els.rateValue.textContent = String(Number(state.settings.speechRate.toFixed(2)));
        els.hapticsToggle.checked = state.settings.haptics;
        els.wakeLockToggle.checked = state.settings.wakeLock;

        const speechSupported = canSpeak();
        [els.speechEnabled, els.autoSpeak, els.rateRange, els.voiceSelect].forEach(function (control) {
            control.disabled = !speechSupported;
        });
        els.speechNote.textContent = speechSupported
            ? '应用不会上传句子内容；语音由浏览器合成。'
            : '当前浏览器不支持语音朗读，句子仍会显示在屏幕上。';

        if (!('wakeLock' in navigator)) {
            els.wakeLockToggle.disabled = true;
        }

        const fullscreenSupported = Boolean(
            document.documentElement.requestFullscreen ||
            document.documentElement.webkitRequestFullscreen
        );
        els.fullscreenBtn.disabled = !fullscreenSupported;
        updateFullscreenButton();
        populateVoices();
        renderCustomList();
    }

    function populateVoices() {
        if (!canSpeak() || !els.voiceSelect) {
            return;
        }
        const voices = window.speechSynthesis.getVoices().filter(function (voice) {
            return /^zh/i.test(voice.lang);
        });
        const current = state.settings.voiceURI;
        els.voiceSelect.replaceChildren();

        const auto = document.createElement('option');
        auto.value = '';
        auto.textContent = voices.length ? '自动选择中文语音' : '系统未检测到中文语音';
        els.voiceSelect.appendChild(auto);

        voices.forEach(function (voice) {
            const option = document.createElement('option');
            option.value = voice.voiceURI;
            option.textContent = voice.name + '（' + voice.lang + '）';
            els.voiceSelect.appendChild(option);
        });

        if (current && voices.some(function (voice) { return voice.voiceURI === current; })) {
            els.voiceSelect.value = current;
        } else if (current && voices.length > 0) {
            state.settings.voiceURI = '';
            els.voiceSelect.value = '';
        } else {
            els.voiceSelect.value = '';
        }
    }

    // 请求或释放屏幕常亮锁；浏览器不支持或用户拒绝时回退到关闭状态。
    function setWakeLock(enabled) {
        if (!('wakeLock' in navigator)) {
            state.settings.wakeLock = false;
            saveSettings();
            els.wakeLockToggle.checked = false;
            toast('当前浏览器不支持屏幕常亮');
            return;
        }

        if (!enabled) {
            if (state.wakeLock) {
                state.wakeLock.release().catch(function () {});
                state.wakeLock = null;
            }
            return;
        }

        let request;
        try {
            request = navigator.wakeLock.request('screen');
        } catch (error) {
            request = Promise.reject(error);
        }
        Promise.resolve(request).then(function (lock) {
            state.wakeLock = lock;
            lock.addEventListener('release', function () {
                state.wakeLock = null;
            });
            toast('已开启屏幕常亮');
        }).catch(function () {
            state.settings.wakeLock = false;
            saveSettings();
            els.wakeLockToggle.checked = false;
            toast('无法保持屏幕常亮，请检查浏览器权限');
        });
    }

    function toggleFullscreen() {
        const element = document.documentElement;
        const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
        if (fullscreenElement) {
            const exit = document.exitFullscreen || document.webkitExitFullscreen;
            if (exit) {
                try {
                    Promise.resolve(exit.call(document)).catch(function () {});
                } catch (error) {
                    // 退出全屏失败时保持当前状态。
                }
            }
            return;
        }
        const request = element.requestFullscreen || element.webkitRequestFullscreen;
        if (!request) {
            toast('当前浏览器不支持全屏');
            return;
        }
        try {
            Promise.resolve(request.call(element)).catch(function () {
                toast('无法进入全屏，请检查浏览器设置');
            });
        } catch (error) {
            toast('无法进入全屏，请检查浏览器设置');
        }
    }

    function updateFullscreenButton() {
        if (!(document.fullscreenElement || document.webkitFullscreenElement)) {
            els.fullscreenBtn.textContent = '进入全屏';
        } else {
            els.fullscreenBtn.textContent = '退出全屏';
        }
    }

    function openDialog(id) {
        const dialog = byId(id);
        if (dialog && !dialog.open) {
            if (typeof dialog.showModal === 'function') {
                dialog.showModal();
            } else {
                dialog.setAttribute('open', '');
            }
        }
    }

    function closeDialog(id) {
        const dialog = byId(id);
        if (dialog && dialog.open) {
            if (typeof dialog.close === 'function') {
                dialog.close();
            } else {
                dialog.removeAttribute('open');
            }
        }
    }

    function resetSettings() {
        if (!window.confirm('恢复默认设置？字体、主题和语音选项会重置。')) {
            return;
        }
        if (state.speaking) {
            stopSpeaking();
        }
        if (state.wakeLock) {
            state.wakeLock.release().catch(function () {});
            state.wakeLock = null;
        }
        state.settings = Object.assign({}, DEFAULT_SETTINGS);
        saveSettings();
        applySettings();
        syncSettingsControls();
        render();
        toast('已恢复默认设置');
    }

    function fitAfterRender() {
        window.requestAnimationFrame(function () {
            fitSentence();
            fitButtons();
        });
    }

    function shrinkToFit(element, minSize) {
        element.style.fontSize = '';
        const computed = window.getComputedStyle(element);
        let size = parseFloat(computed.fontSize);
        if (!Number.isFinite(size)) {
            return;
        }
        const contentWidth = element.clientWidth;
        const contentHeight = element.clientHeight;
        if (!contentWidth || !contentHeight) {
            return;
        }
        while ((element.scrollWidth > contentWidth + 1 || element.scrollHeight > contentHeight + 1) && size > minSize) {
            size -= 1;
            element.style.fontSize = size + 'px';
        }
    }

    function fitSentence() {
        shrinkToFit(els.sentenceText, 18);
    }

    function fitButtons() {
        const buttons = els.buttonGrid.querySelectorAll('.grid-button:not(.grid-empty)');
        buttons.forEach(function (button) {
            const label = button.querySelector('.btn-label');
            if (!label) {
                return;
            }
            button.style.fontSize = '';
            const computed = window.getComputedStyle(button);
            let size = parseFloat(computed.fontSize);
            if (!Number.isFinite(size)) {
                return;
            }
            const paddingX = parseFloat(computed.paddingLeft) + parseFloat(computed.paddingRight);
            const paddingY = parseFloat(computed.paddingTop) + parseFloat(computed.paddingBottom);
            const availableWidth = button.clientWidth - paddingX;
            const availableHeight = button.clientHeight - paddingY;
            if (availableWidth <= 0 || availableHeight <= 0) {
                return;
            }
            while ((label.scrollWidth > availableWidth + 1 || label.scrollHeight > availableHeight + 1) && size > 12) {
                size -= 1;
                button.style.fontSize = size + 'px';
            }
        });
    }

    function handleKeydown(event) {
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
            return;
        }
        const target = event.target;
        if (target && target.closest && target.closest('input, select, textarea, dialog')) {
            return;
        }
        if (document.querySelector('dialog[open]')) {
            return;
        }

        if (/^[1-9]$/.test(event.key)) {
            const button = els.buttonGrid.querySelector('[data-shortcut="' + event.key + '"]');
            if (button) {
                event.preventDefault();
                button.click();
            }
            return;
        }
        if (event.key === 'Backspace') {
            event.preventDefault();
            goBack();
            return;
        }
        if (event.key === 'Delete') {
            event.preventDefault();
            resetAll();
            return;
        }
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            previousPage();
            return;
        }
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            nextPage();
            return;
        }
        if (event.key.toLowerCase() === 'r') {
            event.preventDefault();
            if (currentSpeakableText()) {
                speak(currentSpeakableText());
            }
        }
    }

    function bindEvents() {
        els.modeQuick.addEventListener('click', function () {
            switchMode('quick');
        });
        els.modeCompose.addEventListener('click', function () {
            switchMode('compose');
        });
        els.backBtn.addEventListener('click', goBack);
        els.speakBtn.addEventListener('click', function () {
            if (state.speaking) {
                stopSpeaking();
            } else {
                speak(currentSpeakableText());
            }
        });
        els.favoriteBtn.addEventListener('click', addCurrentToCustom);
        els.historyBtn.addEventListener('click', function () {
            renderHistoryList();
            openDialog('historyDialog');
        });
        els.settingsBtn.addEventListener('click', function () {
            syncSettingsControls();
            openDialog('settingsDialog');
        });

        document.querySelectorAll('[data-close]').forEach(function (button) {
            button.addEventListener('click', function () {
                closeDialog(button.dataset.close);
            });
        });

        ['settingsDialog', 'historyDialog', 'helpDialog'].forEach(function (id) {
            const dialog = byId(id);
            if (!dialog) {
                return;
            }
            dialog.addEventListener('click', function (event) {
                if (event.target === dialog) {
                    dialog.close();
                }
            });
        });

        els.themeSelect.addEventListener('change', function () {
            state.settings.theme = els.themeSelect.value;
            saveSettings();
            applySettings();
        });
        els.fontSelect.addEventListener('change', function () {
            state.settings.fontScale = els.fontSelect.value;
            saveSettings();
            applySettings();
            fitAfterRender();
        });
        els.speechEnabled.addEventListener('change', function () {
            state.settings.speechEnabled = els.speechEnabled.checked;
            if (!state.settings.speechEnabled) {
                stopSpeaking();
            }
            saveSettings();
        });
        els.autoSpeak.addEventListener('change', function () {
            state.settings.autoSpeak = els.autoSpeak.checked;
            saveSettings();
        });
        els.rateRange.addEventListener('input', function () {
            state.settings.speechRate = Number(els.rateRange.value);
            els.rateValue.textContent = String(Number(state.settings.speechRate.toFixed(2)));
            saveSettings();
        });
        els.voiceSelect.addEventListener('change', function () {
            state.settings.voiceURI = els.voiceSelect.value;
            saveSettings();
        });
        els.hapticsToggle.addEventListener('change', function () {
            state.settings.haptics = els.hapticsToggle.checked;
            saveSettings();
            if (state.settings.haptics) {
                haptic();
            }
        });
        els.wakeLockToggle.addEventListener('change', function () {
            state.settings.wakeLock = els.wakeLockToggle.checked;
            saveSettings();
            setWakeLock(state.settings.wakeLock);
        });
        els.fullscreenBtn.addEventListener('click', toggleFullscreen);
        els.helpBtn.addEventListener('click', function () {
            closeDialog('settingsDialog');
            openDialog('helpDialog');
        });
        els.resetSettingsBtn.addEventListener('click', resetSettings);
        els.customAddBtn.addEventListener('click', function () {
            if (addCustom(els.customInput.value)) {
                els.customInput.value = '';
            }
        });
        els.customInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                if (addCustom(els.customInput.value)) {
                    els.customInput.value = '';
                }
            }
        });
        els.clearHistoryBtn.addEventListener('click', clearHistory);

        document.addEventListener('keydown', handleKeydown);
        document.addEventListener('fullscreenchange', updateFullscreenButton);
        document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'visible' && state.settings.wakeLock && !state.wakeLock) {
                setWakeLock(true);
            }
        });
        window.addEventListener('resize', fitAfterRender, { passive: true });
        window.addEventListener('orientationchange', fitAfterRender, { passive: true });

        if (canSpeak()) {
            window.speechSynthesis.onvoiceschanged = populateVoices;
        }
    }

    function registerServiceWorker() {
        if (!('serviceWorker' in navigator) || !/^https?:$/.test(window.location.protocol)) {
            return;
        }
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('sw.js').catch(function () {
                // 离线缓存失败不影响在线使用。
            });
        });
    }

    function init() {
        initElements();
        loadState();
        bindEvents();
        applySettings();
        syncSettingsControls();
        render();
        registerServiceWorker();
        if (state.settings.wakeLock) {
            setWakeLock(true);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
