<template>
    <json-editor v-model="value" />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import JsonEditor from '@/components/editor/json-editor.vue';

@Component({
    name: 'JsonEditorDemo',
    components: {
        JsonEditor,
    },
})
export default class JsonEditorDemo extends Vue {
    value = '{"a": "b"}';
}
</script>