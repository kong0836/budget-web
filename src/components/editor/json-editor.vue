<template>
  <v-jsoneditor
      ref="jsonEditorRef"
      v-model="jsonValue"
      :options="options"
      height="400px" />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

const DEFAULT_OPTIONS = {
    // 编辑模式：'code'表示代码模式，也可以是'text'或'tree'
    mode: 'code',
    // 缩进空格数：设置为2个空格
    indentation: 2,
    // 是否只读：false表示可编辑
    readonly: false,
    // 是否显示状态栏：false表示不显示
    statusBar: false,
    // 是否显示导航栏：true表示显示
    navigationBar: true,
    // 是否显示主菜单栏：true表示显示
    mainMenuBar: true,
};

@Component({
  name: 'JsonEditor'
})
export default class JsonEditor extends Vue {
    @Prop({ required: true, type:String, default: { "a": "b" } }) value!: string;
    // @Prop({required: false,type:Object,default: {}}) options!: any;

    options = DEFAULT_OPTIONS;

    get jsonValue(){
        try {
            if (!this.value){
                return {};
            }
            return typeof this.value === 'string' ? JSON.parse(this.value) : this.value;
        } catch (error) {
            return this.value;
        }
    }

    set jsonValue(value){
        if (typeof value === 'string'){
            this.$emit('input', value);
            return;
        }

        this.$emit('input', JSON.stringify(value));
    }

    handleValidate(){
        try {
            // 尝试从编辑器获取当前值
            const { editor } = this.$refs.jsonEditorRef as any;
            if (editor && typeof editor.get === 'function'){
                const currentValue = editor.get();
                if (typeof currentValue === 'object'){
                    // 如果是对象，尝试序列化
                 JSON.stringify(currentValue);
                } else if (typeof currentValue === 'string'){
                    // 如果是字符串，尝试解析
                    JSON.parse(currentValue);
                }
                return true;
            }

            // 如果无法从编辑器获取值，则验证当前的jsonValue
            if (typeof this.jsonValue === 'string'){
                JSON.parse(this.jsonValue);
            } else {
                JSON.stringify(this.jsonValue);
            }
            return true;
        } catch (error) {
            return false;
        }
    }
}
</script>