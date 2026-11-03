const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function read(relativePath) {
    return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

test('静态资源版本号在 index、Service Worker 和注册地址中保持一致', () => {
    const index = read('index.html');
    const sw = read('sw.js');
    const app = read('js/app.js');

    const indexVersions = [...index.matchAll(/\?v=(\d+)/g)].map((match) => match[1]);
    assert.ok(indexVersions.length >= 4, 'index.html 应给 CSS/JS/manifest 加版本参数');
    assert.equal(new Set(indexVersions).size, 1, 'index.html 中的版本参数不一致');

    const version = indexVersions[0];
    assert.match(sw, new RegExp("CACHE_VERSION = 'taptalk-v" + version + "'"));
    assert.match(app, new RegExp("SERVICE_WORKER_URL = 'sw.js\\?v=" + version + "'"));
    assert.match(sw, new RegExp("'\\./js/app\\.js\\?v=" + version + "'"));
    assert.match(sw, new RegExp("'\\./css/app\\.css\\?v=" + version + "'"));
    assert.match(sw, new RegExp("'\\./manifest\\.webmanifest\\?v=" + version + "'"));
});
