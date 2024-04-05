import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/home/index.vue';
import SidebarView from '../views/sidebar/index.vue';
import PanelView from '../views/panel/index.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/sidebar',
      name: 'sidebar',
      component: SidebarView
    },
    {
      path: '/panel',
      name: 'panel',
      component: PanelView
    }
  ]
});

export default router;
