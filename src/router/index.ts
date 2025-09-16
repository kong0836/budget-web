import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'home',
    component: () => import(/* webpackChunkName: "home" */ '@/views/home.vue')
  },
  {
    path: '/json-editor',
    name: 'json-editor',
    component: () => import(/* webpackChunkName: "json-editor" */ '@/components/editor/json-editor-demo.vue')
  },
  {
    path: '/json-tree',
    name: 'json-tree',
    component: () => import(/* webpackChunkName: "json-tree" */ '@/components/json-tree.vue')
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
});

export default router;
