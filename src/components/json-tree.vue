<template>
  <div class="json-pretty-demo">
    <vue-json-pretty
      ref="jsonPretty"
      :data="jsonData"
      theme="light"
      :deep="0"
      :show-length="true"
      :selectable="true"
      :showDoubleQuotes="false"
      @click="handleJsonClick"
      class="json-pretty"/>
    <div v-if="clickedPath" class="click-info">
      点击路径: <code>{{ clickedPath }}</code>
    </div>
  </div>
</template>

<script lang="ts">
// https://github.com/leezng/vue-json-pretty/blob/dev/README.zh_CN.md
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import { Component, Vue, Watch } from 'vue-property-decorator';

@Component({
  components: {
    VueJsonPretty
  }
})
export default class JsonTree extends Vue {
  jsonData= {
        status: "success",
        data: {
          products: [
            {
              id: "P001",
              name: "笔记本电脑",
              price: 5999,
              specs: {
                cpu: "Intel i7",
                ram: "16GB",
                storage: "512GB SSD"
              },
              inStock: true
            },
            {
              id: "P002",
              name: "智能手机",
              price: 3999,
              specs: {
                screen: "6.1英寸",
                camera: "双摄",
                battery: "4000mAh"
              },
              inStock: false
            }
          ],
          pagination: {
            total: 2,
            page: 1,
            pageSize: 10
          }
        },
        timestamp: "2024-01-20T10:00:00Z"
  }

  selectedTheme= "dark";

  themes= [
    { value: "dark", label: "暗色" },
    { value: "light", label: "亮色" },
  ];

  clickedPath= ""


  @Watch('selectedTheme')
  onThemeChange() {
    // 当主题改变时，重新渲染 JSON 树
    (this.$refs.jsonPretty as VueJsonPretty).render();
  }

  handleJsonClick(path, data) {
    this.clickedPath = path;
    console.log('点击路径:', path);
    console.log('点击数据:', data);
  }
}

</script>

<style scoped>
.json-pretty-demo {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.theme-selector {
  margin-bottom: 15px;
}

.theme-selector label {
  margin-right: 10px;
}

.theme-selector select {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.json-pretty {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  background: white;
  /* min-height: 400px; */
  height: auto;
  overflow: auto;
}

.click-info {
  margin-top: 15px;
  padding: 10px;
  background: #e8f5e8;
  border-radius: 4px;
  font-family: monospace;
}

code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  color: #d63384;
}
</style>