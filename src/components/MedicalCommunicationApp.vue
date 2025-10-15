<template>
  <div class="medical-app">
    <!-- 状态栏 -->
    <div class="status-bar">
      <span>9:41</span>
      <span>🔋 100%</span>
    </div>

    <!-- 应用头部 -->
    <t-navbar class="app-header" fixed>
      <template #left>
        <t-icon name="chevron-left" v-if="currentLevel > 0" @click="goBack" />
      </template>
      <template #center>
        <span class="header-title">医疗沟通助手</span>
      </template>
    </t-navbar>

    <!-- 句子显示区域 -->
    <div class="sentence-display">
      <div class="sentence-container">
        <div class="sentence-text">{{ currentSentence || '请选择...' }}</div>
        <t-button 
          theme="primary" 
          size="large"
          class="speak-button"
          @click="speakSentence"
          :loading="isSpeaking"
        >
          <span class="speak-text">播放</span>
        </t-button>
      </div>
      
      <!-- 历史记录 -->
      <div class="history-section" v-if="history.length > 0">
        <t-collapse>
          <t-collapse-panel header="历史记录" :value="'history'">
            <div class="history-list">
              <t-tag 
                v-for="(item, index) in history.slice(-5)" 
                :key="index"
                theme="primary"
                variant="outline"
                class="history-item"
                @click="speakText(item)"
              >
                {{ item }}
              </t-tag>
            </div>
          </t-collapse-panel>
        </t-collapse>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 九宫格按钮区域 -->
      <div class="grid-container">
        <t-grid :column="3" :gutter="[16, 16]" class="button-grid">
          <!-- 前6个按钮 -->
          <t-grid-item 
            v-for="(button, index) in currentButtons.slice(0, 6)" 
            :key="index"
            class="grid-item"
          >
            <t-button 
              block 
              size="large"
              :theme="button.selected ? 'primary' : 'default'"
              :variant="button.selected ? 'base' : 'outline'"
              class="grid-button main-button"
              @click="selectButton(button, index)"
            >
              <span class="button-text-large">{{ button.text }}</span>
            </t-button>
          </t-grid-item>
          
          <!-- 第三行功能按钮 -->
          <t-grid-item class="grid-item">
            <t-button 
              block 
              size="large"
              theme="warning"
              variant="outline"
              class="grid-button function-button"
              @click="clearSentence"
            >
              <span class="button-text-large">清空</span>
            </t-button>
          </t-grid-item>
          
          <t-grid-item class="grid-item">
            <t-button 
              block 
              size="large"
              theme="default"
              variant="outline"
              class="grid-button function-button"
              @click="previousPage"
              :disabled="!canGoPrevious"
            >
              <span class="button-text-large">上一页</span>
            </t-button>
          </t-grid-item>
          
          <t-grid-item class="grid-item">
            <t-button 
              block 
              size="large"
              theme="default"
              variant="outline"
              class="grid-button function-button"
              @click="nextPage"
              :disabled="!canGoNext"
            >
              <span class="button-text-large">下一页</span>
            </t-button>
          </t-grid-item>
        </t-grid>
      </div>
    </div>

    <!-- 底部导航指示器 -->
    <div class="bottom-indicator">
      <t-steps 
        :current="currentLevel" 
        size="small" 
        theme="dot"
        class="progress-steps"
      >
        <t-step title="人称" />
        <t-step title="类别" />
        <t-step title="项目" />
        <t-step title="动作" />
      </t-steps>
    </div>

    <!-- 语音反馈提示 -->
    <t-toast ref="toast" />
  </div>
</template>

<script>
export default {
  name: 'MedicalCommunicationApp',
  data() {
    return {
      currentLevel: 0,
      currentSentence: '',
      selectedPath: [],
      history: [],
      isSpeaking: false,
      currentPage: 0,
      
      // 数据结构
      levelData: {
        0: { // 人称选择
          buttons: [
            { text: '我', value: '我' },
            { text: '你', value: '你' },
            { text: '他', value: '他' },
            { text: '医生', value: '医生' },
            { text: '护士', value: '护士' },
            { text: '家人', value: '家人' }
          ]
        },
        1: { // 类别选择
          buttons: [
            { text: '衣', value: '衣', color: '#e3f2fd' },
            { text: '食', value: '食', color: '#fff3e0' },
            { text: '住', value: '住', color: '#f3e5f5' },
            { text: '行', value: '行', color: '#e8f5e8' },
            { text: '医', value: '医', color: '#fce4ec' },
            { text: '其他', value: '其他', color: '#f5f5f5' }
          ]
        },
        2: { // 具体项目
          '衣': [
            { text: '衣服', value: '衣服' },
            { text: '裤子', value: '裤子' },
            { text: '鞋子', value: '鞋子' },
            { text: '袜子', value: '袜子' },
            { text: '被子', value: '被子' },
            { text: '枕头', value: '枕头' }
          ],
          '食': [
            { text: '饭', value: '饭' },
            { text: '菜', value: '菜' },
            { text: '汤', value: '汤' },
            { text: '药', value: '药' },
            { text: '水', value: '水' },
            { text: '茶', value: '茶' }
          ],
          '住': [
            { text: '灯', value: '灯' },
            { text: '空调', value: '空调' },
            { text: '床', value: '床' },
            { text: '被子', value: '被子' },
            { text: '温度', value: '温度' },
            { text: '窗户', value: '窗户' }
          ],
          '行': [
            { text: '走路', value: '走路' },
            { text: '坐下', value: '坐下' },
            { text: '站起', value: '站起' },
            { text: '轮椅', value: '轮椅' },
            { text: '拐杖', value: '拐杖' },
            { text: '搀扶', value: '搀扶' }
          ],
          '医': [
            { text: '体检', value: '体检' },
            { text: '住院', value: '住院' },
            { text: '护理', value: '护理' },
            { text: '疼痛', value: '疼痛' },
            { text: '不适', value: '不适' },
            { text: '检查', value: '检查' }
          ]
        },
        3: { // 动作选择
          default: [
            { text: '需要', value: '需要' },
            { text: '不需要', value: '不需要' },
            { text: '要', value: '要' },
            { text: '不要', value: '不要' },
            { text: '好了', value: '好了' },
            { text: '还没', value: '还没' }
          ],
          '衣服': [
            { text: '穿', value: '穿' },
            { text: '脱', value: '脱' },
            { text: '洗', value: '洗' },
            { text: '换', value: '换' },
            { text: '整理', value: '整理' },
            { text: '收起', value: '收起' }
          ]
        }
      }
    }
  },
  
  computed: {
    currentButtons() {
      if (this.currentLevel === 0) {
        return this.levelData[0].buttons;
      } else if (this.currentLevel === 1) {
        return this.levelData[1].buttons;
      } else if (this.currentLevel === 2) {
        const category = this.selectedPath[1];
        return this.levelData[2][category] || [];
      } else if (this.currentLevel === 3) {
        const item = this.selectedPath[2];
        return this.levelData[3][item] || this.levelData[3].default;
      }
      return [];
    },
    
    canGoPrevious() {
      return this.currentPage > 0;
    },
    
    canGoNext() {
      return (this.currentPage + 1) * 6 < this.currentButtons.length;
    }
  },
  
  methods: {
    selectButton(button, index) {
      // 清除之前的选中状态
      this.currentButtons.forEach(btn => btn.selected = false);
      button.selected = true;
      
      this.selectedPath[this.currentLevel] = button.value;
      this.updateSentence();
      
      // 自动进入下一级
      if (this.currentLevel < 3) {
        setTimeout(() => {
          this.currentLevel++;
          this.currentPage = 0;
        }, 300);
      } else {
        // 完成句子构建
        this.completeSentence();
      }
    },
    
    updateSentence() {
      const parts = this.selectedPath.filter(Boolean);
      if (parts.length === 0) {
        this.currentSentence = '';
        return;
      }
      
      // 智能拼接逻辑
      let sentence = '';
      if (parts.length === 1) {
        sentence = parts[0] + '...';
      } else if (parts.length === 2) {
        sentence = parts[0] + parts[1] + '...';
      } else if (parts.length === 3) {
        sentence = parts[0] + parts[1] + parts[2] + '...';
      } else if (parts.length === 4) {
        // 完整句子构建
        const [person, category, item, action] = parts;
        if (action === '需要' || action === '要') {
          sentence = `${person}${action}${action === '要' ? '' : ''}${item}`;
        } else if (action === '不需要' || action === '不要') {
          sentence = `${person}${action}${item}`;
        } else {
          sentence = `${person}要${action}${item}`;
        }
      }
      
      this.currentSentence = sentence;
    },
    
    completeSentence() {
      if (this.currentSentence && !this.currentSentence.includes('...')) {
        this.history.push(this.currentSentence);
        this.speakSentence();
        
        // 显示完成提示
        this.$refs.toast.add({
          theme: 'success',
          message: '句子构建完成！',
          duration: 2000
        });
      }
    },
    
    clearSentence() {
      this.currentSentence = '';
      this.selectedPath = [];
      this.currentLevel = 0;
      this.currentPage = 0;
      this.currentButtons.forEach(btn => btn.selected = false);
    },
    
    goBack() {
      if (this.currentLevel > 0) {
        this.currentLevel--;
        this.selectedPath[this.currentLevel + 1] = undefined;
        this.updateSentence();
        this.currentPage = 0;
      }
    },
    
    previousPage() {
      if (this.canGoPrevious) {
        this.currentPage--;
      }
    },
    
    nextPage() {
      if (this.canGoNext) {
        this.currentPage++;
      }
    },
    
    async speakSentence() {
      if (!this.currentSentence || this.currentSentence.includes('...')) return;
      await this.speakText(this.currentSentence);
    },
    
    async speakText(text) {
      if (!text || this.isSpeaking) return;
      
      this.isSpeaking = true;
      try {
        // 使用Web Speech API
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'zh-CN';
          utterance.rate = 0.8;
          utterance.pitch = 1;
          
          utterance.onend = () => {
            this.isSpeaking = false;
          };
          
          speechSynthesis.speak(utterance);
        }
      } catch (error) {
        console.error('语音播放失败:', error);
        this.isSpeaking = false;
      }
    }
  }
}
</script>

<style scoped>
.medical-app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.status-bar {
  height: 24px;
  background: #000;
  color: white;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.sentence-display {
  background: white;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  border-bottom: 1px solid #ebeef5;
}

.sentence-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.sentence-text {
  font-size: clamp(18px, 5vw, 42px);
  font-weight: 700;
  color: #000000;
  flex: 1;
  margin-right: 16px;
  line-height: 1.2;
  letter-spacing: 0.3px;
}

.speak-button {
  min-width: 80px;
  height: 60px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  border-radius: 12px;
}

.speak-text {
  font-size: clamp(16px, 3vw, 22px);
  font-weight: 600;
  letter-spacing: 0.3px;
}

.history-section {
  margin-top: 16px;
}

.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-item {
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.main-content {
  flex: 1;
  padding: min(4vw, 20px);
  display: flex;
  flex-direction: column;
  min-height: 0;
  container-type: inline-size;
}

.grid-container {
  flex: 1;
  display: flex;
  align-items: center;
  min-height: 0;
  width: 100%;
}

.button-grid {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: min(3vw, 16px);
  aspect-ratio: 1;
  max-width: min(90vw, 600px);
  margin: 0 auto;
}

.grid-item {
  width: 100%;
  height: 100%;
  aspect-ratio: 1;
  min-width: 60px;
  min-height: 60px;
}

.grid-button {
  height: 100%;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.grid-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.main-button {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.main-button.t-button--theme-primary {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;
}

.function-button {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
}

.button-text-large {
  font-size: clamp(12px, 4cqw, 28px);
  font-weight: 700;
  text-align: center;
  line-height: 1.1;
  color: inherit;
  letter-spacing: 0.2px;
}

.bottom-indicator {
  padding: 16px 20px;
  background: white;
  box-shadow: 0 -2px 12px rgba(0,0,0,0.08);
}

.progress-steps {
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .main-content {
    padding: 2vw;
  }
  
  .button-grid {
    gap: 2vw;
    max-width: 95vw;
  }
}

@media (orientation: landscape) and (max-height: 600px) {
  .button-grid {
    max-width: 80vh;
    gap: 1.5vw;
  }
  
  .main-content {
    padding: 1vw;
  }
}

/* 动画效果 */
.grid-button {
  animation: fadeInUp 0.6s ease forwards;
}

.grid-button:nth-child(1) { animation-delay: 0.1s; }
.grid-button:nth-child(2) { animation-delay: 0.2s; }
.grid-button:nth-child(3) { animation-delay: 0.3s; }
.grid-button:nth-child(4) { animation-delay: 0.4s; }
.grid-button:nth-child(5) { animation-delay: 0.5s; }
.grid-button:nth-child(6) { animation-delay: 0.6s; }
.grid-button:nth-child(7) { animation-delay: 0.7s; }
.grid-button:nth-child(8) { animation-delay: 0.8s; }
.grid-button:nth-child(9) { animation-delay: 0.9s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

