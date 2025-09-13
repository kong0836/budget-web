import App from '@/App.vue';
import router from '@/router';
import store from '@/store';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import VJsoneditor from 'v-jsoneditor';
import Vue from 'vue';
import './style/index.scss';

Vue.use(ElementUI);
Vue.use(VJsoneditor);
Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app');
