<template>
    <div>
    <el-form :model="form" ref="formRef" :rules="formRules" :label-width="120">
        <el-form-item label="数据" prop="value">
            <json-editor ref="jsonEditorRef" v-model="form.value" />
        </el-form-item>
    </el-form>
    <el-button type="primary" @click="submitForm">提交</el-button>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import JsonEditor from '@/components/editor/json-editor.vue';
import { Form } from 'element-ui';

@Component({
    name: 'JsonEditorDemo',
    components: {
        JsonEditor,
    },
})
export default class JsonEditorDemo extends Vue {
    form = {
        value : '{"a": "b"}',
    };
    valueValidator(rule: any, value: any,callback: any){
        const valid = (this.$refs.jsonEditorRef as JsonEditor).handleValidate();
        callback(valid ? undefined: '请输入正确的json格式');
    }
    formRules = {
        value: [
            { required: true, validator: this.valueValidator, trigger: 'change' },
        ],
    };
    async submitForm(){
        await (this.$refs.formRef as Form).validate();
    }
}
</script>