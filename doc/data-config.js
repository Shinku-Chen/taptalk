// 医疗沟通APP - 可扩展数据配置
// 这个文件展示了如何扩展和自定义APP的数据

// 扩展示例：添加新的人员角色
function addNewPersons() {
    // 添加新的医护人员
    DataManager.addPerson({
        id: 'therapist',
        text: '治疗师', 
        value: '治疗师',
        category: 'medical'
    });
    
    DataManager.addPerson({
        id: 'volunteer',
        text: '志愿者',
        value: '志愿者', 
        category: 'helper'
    });
}

// 扩展示例：添加新的类别
function addNewCategories() {
    // 添加娱乐类别
    DataManager.addCategory({
        id: 'entertainment',
        text: '娱',
        value: '娱',
        color: '#e8f5e8',
        priority: 7
    });
    
    // 添加学习类别
    DataManager.addCategory({
        id: 'learning', 
        text: '学',
        value: '学',
        color: '#fff8e1',
        priority: 8
    });
}

// 扩展示例：添加带子项目的复杂项目
function addComplexMedicalItems() {
    // 添加手术类别（带详细子项目）
    DataManager.addItem('medical', {
        id: 'surgery',
        text: '手术',
        value: '手术',
        tags: ['治疗', '外科'],
        hasSubItems: true,
        subItems: [
            { id: 'heart_surgery', text: '心脏手术', value: '心脏手术', tags: ['心脏', '外科'] },
            { id: 'brain_surgery', text: '脑部手术', value: '脑部手术', tags: ['神经', '外科'] },
            { id: 'orthopedic', text: '骨科手术', value: '骨科手术', tags: ['骨骼', '外科'] },
            { id: 'eye_surgery', text: '眼科手术', value: '眼科手术', tags: ['眼部', '外科'] },
            { id: 'dental', text: '牙科手术', value: '牙科手术', tags: ['口腔', '外科'] },
            { id: 'plastic', text: '整形手术', value: '整形手术', tags: ['美容', '外科'] }
        ]
    });
    
    // 添加药物类别（带详细分类）
    DataManager.addItem('medical', {
        id: 'medication',
        text: '用药',
        value: '用药',
        tags: ['治疗', '药物'],
        hasSubItems: true,
        subItems: [
            { id: 'painkiller', text: '止痛药', value: '止痛药', tags: ['止痛', '镇痛'] },
            { id: 'antibiotic', text: '抗生素', value: '抗生素', tags: ['抗菌', '消炎'] },
            { id: 'blood_pressure', text: '降压药', value: '降压药', tags: ['心血管', '降压'] },
            { id: 'diabetes', text: '降糖药', value: '降糖药', tags: ['糖尿病', '降糖'] },
            { id: 'sleeping_pill', text: '安眠药', value: '安眠药', tags: ['睡眠', '镇静'] },
            { id: 'vitamin', text: '维生素', value: '维生素', tags: ['营养', '补充'] },
            { id: 'chinese_medicine', text: '中药', value: '中药', tags: ['中医', '草药'] }
        ]
    });
}

// 扩展示例：添加娱乐项目（带子分类）
function addEntertainmentItems() {
    DataManager.addItem('entertainment', {
        id: 'tv_programs',
        text: '电视节目',
        value: '电视节目',
        tags: ['娱乐', '视觉'],
        hasSubItems: true,
        subItems: [
            { id: 'news', text: '新闻', value: '新闻', tags: ['资讯', '时事'] },
            { id: 'drama', text: '电视剧', value: '电视剧', tags: ['剧情', '娱乐'] },
            { id: 'variety', text: '综艺', value: '综艺', tags: ['娱乐', '搞笑'] },
            { id: 'documentary', text: '纪录片', value: '纪录片', tags: ['教育', '知识'] },
            { id: 'sports', text: '体育', value: '体育', tags: ['运动', '竞技'] },
            { id: 'music_show', text: '音乐节目', value: '音乐节目', tags: ['音乐', '表演'] }
        ]
    });
    
    DataManager.addItem('entertainment', {
        id: 'books',
        text: '读物',
        value: '读物',
        tags: ['阅读', '学习'],
        hasSubItems: true,
        subItems: [
            { id: 'novel', text: '小说', value: '小说', tags: ['文学', '故事'] },
            { id: 'magazine', text: '杂志', value: '杂志', tags: ['资讯', '图文'] },
            { id: 'newspaper', text: '报纸', value: '报纸', tags: ['新闻', '时事'] },
            { id: 'poetry', text: '诗歌', value: '诗歌', tags: ['文学', '艺术'] }
        ]
    });
}

// 扩展示例：添加新的动作类型
function addEntertainmentActions() {
    DataManager.addAction('entertainment', {
        id: 'watch',
        text: '看',
        value: '看',
        type: 'consume'
    });
    
    DataManager.addAction('entertainment', {
        id: 'listen',
        text: '听',
        value: '听', 
        type: 'consume'
    });
    
    DataManager.addAction('entertainment', {
        id: 'play',
        text: '玩',
        value: '玩',
        type: 'interact'
    });
    
    DataManager.addAction('entertainment', {
        id: 'read',
        text: '读',
        value: '读',
        type: 'consume'
    });
    
    DataManager.addAction('entertainment', {
        id: 'open',
        text: '打开',
        value: '打开',
        type: 'activate'
    });
    
    DataManager.addAction('entertainment', {
        id: 'close',
        text: '关闭',
        value: '关闭', 
        type: 'deactivate'
    });
}

// 扩展示例：添加新的句式模板
function addNewSentenceTemplates() {
    // 为娱乐类别添加专门的句式
    AppConfig.sentenceTemplates.entertainment = {
        consume: '{person}要{action}{item}',
        interact: '{person}想{action}{item}',
        activate: '{person}要{action}{item}',
        deactivate: '{person}要{action}{item}',
        default: '{person}要{action}{item}'
    };
}

// 扩展示例：添加项目映射
function addNewItemMapping() {
    // 添加娱乐项目的动作映射
    AppConfig.itemActionMapping['电视'] = 'entertainment';
    AppConfig.itemActionMapping['音乐'] = 'entertainment';
    AppConfig.itemActionMapping['书'] = 'entertainment';
    AppConfig.itemActionMapping['游戏'] = 'entertainment';
}

// 批量数据导入示例
function importBulkData() {
    const newData = {
        // 新增康复类别的完整数据
        rehabilitation: {
            category: {
                id: 'rehabilitation',
                text: '康复',
                value: '康复',
                color: '#f0f4ff',
                priority: 9
            },
            items: [
                { id: 'physio', text: '理疗', value: '理疗', tags: ['康复', '物理'] },
                { id: 'exercise', text: '锻炼', value: '锻炼', tags: ['康复', '运动'] },
                { id: 'massage', text: '按摩', value: '按摩', tags: ['康复', '放松'] },
                { id: 'acupuncture', text: '针灸', value: '针灸', tags: ['康复', '中医'] }
            ],
            actions: [
                { id: 'start', text: '开始', value: '开始', type: 'begin' },
                { id: 'stop', text: '停止', value: '停止', type: 'end' },
                { id: 'continue', text: '继续', value: '继续', type: 'ongoing' },
                { id: 'need', text: '需要', value: '需要', type: 'positive' },
                { id: 'dont_need', text: '不需要', value: '不需要', type: 'negative' }
            ],
            templates: {
                begin: '{person}要{action}{item}',
                end: '{person}要{action}{item}',
                ongoing: '{person}要{action}{item}',
                positive: '{person}需要{item}',
                negative: '{person}不需要{item}',
                default: '{person}要{action}{item}'
            }
        }
    };
    
    // 批量添加数据
    const rehab = newData.rehabilitation;
    
    // 添加类别
    DataManager.addCategory(rehab.category);
    
    // 添加项目
    rehab.items.forEach(item => {
        DataManager.addItem('rehabilitation', item);
    });
    
    // 添加动作
    rehab.actions.forEach(action => {
        DataManager.addAction('rehabilitation', action);
    });
    
    // 添加模板
    AppConfig.sentenceTemplates.rehabilitation = rehab.templates;
    
    // 添加映射
    rehab.items.forEach(item => {
        AppConfig.itemActionMapping[item.value] = 'rehabilitation';
    });
}

// 从JSON文件加载数据的示例
async function loadDataFromJSON(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // 验证数据格式
        if (validateDataStructure(data)) {
            // 合并到现有配置
            mergeDataConfig(data);
            console.log('数据加载成功');
        } else {
            console.error('数据格式验证失败');
        }
    } catch (error) {
        console.error('数据加载失败:', error);
    }
}

// 数据结构验证
function validateDataStructure(data) {
    // 检查必需字段
    const requiredFields = ['levels', 'items', 'actions'];
    return requiredFields.every(field => data.hasOwnProperty(field));
}

// 合并数据配置
function mergeDataConfig(newData) {
    // 深度合并新数据到现有配置
    if (newData.levels) {
        Object.assign(AppConfig.levels, newData.levels);
    }
    if (newData.items) {
        Object.assign(AppConfig.items, newData.items);
    }
    if (newData.actions) {
        Object.assign(AppConfig.actions, newData.actions);
    }
    if (newData.sentenceTemplates) {
        Object.assign(AppConfig.sentenceTemplates, newData.sentenceTemplates);
    }
    if (newData.itemActionMapping) {
        Object.assign(AppConfig.itemActionMapping, newData.itemActionMapping);
    }
}

// 数据导出功能
function exportCurrentData() {
    const exportData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        config: AppConfig
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `medical-app-config-${Date.now()}.json`;
    link.click();
}

// 设备控制动作示例
function addDeviceControlExamples() {
    // 添加更多电器设备
    const electricalDevices = [
        {
            id: 'fan',
            text: '风扇', 
            value: '风扇',
            tags: ['电器', '通风'],
            actionType: 'electrical'
        },
        {
            id: 'heater',
            text: '暖气',
            value: '暖气', 
            tags: ['电器', '取暖'],
            actionType: 'electrical'
        },
        {
            id: 'tv',
            text: '电视',
            value: '电视',
            tags: ['电器', '娱乐'],
            actionType: 'electrical'
        }
    ];
    
    // 添加设备到住房类别
    electricalDevices.forEach(device => {
        DataManager.addItem('housing', device);
        AppConfig.itemActionMapping[device.value] = device.actionType;
    });
}

// 医院床具控制示例
function addHospitalBedActions() {
    // 为医院床添加专属动作类型
    DataManager.addAction('hospital_bed', {
        id: 'raise',
        text: '调高',
        value: '调高',
        type: 'raise'
    });
    
    DataManager.addAction('hospital_bed', {
        id: 'lower',
        text: '调低',
        value: '调低',
        type: 'lower'
    });
    
    DataManager.addAction('hospital_bed', {
        id: 'adjust_head_up',
        text: '抬床头',
        value: '抬床头',
        type: 'head_up'
    });
    
    DataManager.addAction('hospital_bed', {
        id: 'adjust_head_down',
        text: '降床头',
        value: '降床头',
        type: 'head_down'
    });
    
    DataManager.addAction('hospital_bed', {
        id: 'adjust_foot_up',
        text: '抬床尾',
        value: '抬床尾',
        type: 'foot_up'
    });
    
    DataManager.addAction('hospital_bed', {
        id: 'adjust_foot_down',
        text: '降床尾',
        value: '降床尾',
        type: 'foot_down'
    });
    
    // 添加医院床的句式模板
    AppConfig.sentenceTemplates.hospital_bed = {
        raise: '{person}要{action}床',
        lower: '{person}要{action}床',
        head_up: '{person}要{action}',
        head_down: '{person}要{action}',
        foot_up: '{person}要{action}',
        foot_down: '{person}要{action}',
        default: '{person}要{action}'
    };
    
    // 更新床的映射为医院床专属动作
    AppConfig.itemActionMapping['床'] = 'hospital_bed';
}

// 具体设备动作扩展示例
function addSpecificDeviceActions() {
    // 为电视添加专属动作
    DataManager.addAction('tv_control', {
        id: 'turn_on',
        text: '开',
        value: '开',
        type: 'activate'
    });
    
    DataManager.addAction('tv_control', {
        id: 'turn_off', 
        text: '关',
        value: '关',
        type: 'deactivate'
    });
    
    DataManager.addAction('tv_control', {
        id: 'volume_up',
        text: '调大声音',
        value: '调大声音',
        type: 'volume_increase'
    });
    
    DataManager.addAction('tv_control', {
        id: 'volume_down',
        text: '调小声音', 
        value: '调小声音',
        type: 'volume_decrease'
    });
    
    DataManager.addAction('tv_control', {
        id: 'change_channel',
        text: '换台',
        value: '换台',
        type: 'change_channel'
    });
    
    // 添加电视的句式模板
    AppConfig.sentenceTemplates.tv_control = {
        activate: '{person}要{action}{item}',
        deactivate: '{person}要{action}{item}',
        volume_increase: '{person}要{action}',
        volume_decrease: '{person}要{action}',
        change_channel: '{person}要{action}',
        default: '{person}要{action}{item}'
    };
    
    // 添加映射
    AppConfig.itemActionMapping['电视'] = 'tv_control';
}

// 使用示例
function demonstrateExtensibility() {
    console.log('=== 完善的数据扩展演示 ===');
    
    // 1. 添加新人员
    console.log('添加新人员...');
    addNewPersons();
    
    // 2. 添加新类别
    console.log('添加新类别...');
    addNewCategories();
    
    // 3. 添加复杂医疗项目
    console.log('添加复杂医疗项目...');
    addComplexMedicalItems();
    
    // 4. 添加娱乐项目
    console.log('添加娱乐项目...');
    addEntertainmentItems();
    
    // 5. 添加设备控制
    console.log('添加设备控制...');
    addDeviceControlExamples();
    
    // 6. 添加医院床控制
    console.log('添加医院床控制...');
    addHospitalBedActions();
    
    // 7. 添加具体设备动作
    console.log('添加具体设备动作...');
    addSpecificDeviceActions();
    
    // 7. 添加娱乐动作
    console.log('添加娱乐动作...');
    addEntertainmentActions();
    
    // 8. 添加句式模板
    console.log('添加句式模板...');
    addNewSentenceTemplates();
    
    // 9. 批量导入数据
    console.log('批量导入康复数据...');
    importBulkData();
    
    console.log('数据扩展完成！');
    console.log('当前配置:', AppConfig);
    
    // 测试新功能
    testNewFeatures();
}

// 测试新功能
function testNewFeatures() {
    console.log('=== 功能测试 ===');
    
    // 测试灯控制
    console.log('测试：我 → 住 → 灯 → 开');
    console.log('预期：我要开灯');
    
    // 测试空调控制
    console.log('测试：我 → 住 → 空调 → 升温');
    console.log('预期：我要升温');
    
    // 测试床控制
    console.log('测试：我 → 住 → 床 → 调高');
    console.log('预期：我要调高床');
    
    console.log('测试：我 → 住 → 床 → 抬床头');
    console.log('预期：我要抬床头');
    
    // 测试体检细分
    console.log('测试：我 → 医 → 体检 → 采血 → 需要');
    console.log('预期：我需要采血');
    
    // 测试护理细分
    console.log('测试：护士 → 医 → 护理 → 换药 → 要');
    console.log('预期：护士要换药');
}

// 数据管理工具
const DataTools = {
    // 搜索功能
    searchItems(keyword) {
        const results = [];
        Object.values(AppConfig.items).forEach(category => {
            category.items.forEach(item => {
                if (item.text.includes(keyword) || 
                    item.tags?.some(tag => tag.includes(keyword))) {
                    results.push(item);
                }
            });
        });
        return results;
    },
    
    // 按标签筛选
    filterByTag(tag) {
        const results = [];
        Object.values(AppConfig.items).forEach(category => {
            category.items.forEach(item => {
                if (item.tags?.includes(tag)) {
                    results.push(item);
                }
            });
        });
        return results;
    },
    
    // 获取统计信息
    getStatistics() {
        const stats = {
            totalPersons: AppConfig.levels.person.items.length,
            totalCategories: AppConfig.levels.category.items.length,
            totalItems: 0,
            totalActions: 0,
            categoriesDetail: {}
        };
        
        Object.entries(AppConfig.items).forEach(([key, category]) => {
            const itemCount = category.items?.length || 0;
            stats.totalItems += itemCount;
            stats.categoriesDetail[key] = {
                name: category.name,
                itemCount: itemCount
            };
        });
        
        Object.values(AppConfig.actions).forEach(actionGroup => {
            stats.totalActions += actionGroup.actions?.length || 0;
        });
        
        return stats;
    },
    
    // 验证数据完整性
    validateIntegrity() {
        const issues = [];
        
        // 检查映射关系
        Object.entries(AppConfig.itemActionMapping).forEach(([item, actionType]) => {
            if (!AppConfig.actions[actionType]) {
                issues.push(`项目"${item}"映射到不存在的动作类型"${actionType}"`);
            }
        });
        
        // 检查模板完整性
        Object.keys(AppConfig.items).forEach(categoryKey => {
            if (!AppConfig.sentenceTemplates[categoryKey]) {
                issues.push(`类别"${categoryKey}"缺少句式模板`);
            }
        });
        
        return {
            isValid: issues.length === 0,
            issues: issues
        };
    }
};

// 导出供外部使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AppConfig,
        DataManager,
        SentenceBuilder,
        DataTools,
        addNewPersons,
        addNewCategories,
        addEntertainmentItems,
        addEntertainmentActions,
        importBulkData,
        loadDataFromJSON,
        exportCurrentData,
        demonstrateExtensibility
    };
}
