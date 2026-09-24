import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      component: () => import('../views/DashboardLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'Dashboard',
          component: () => import('../views/DashboardView.vue'),
        },
        {
          path: 'upload',
          name: 'Upload',
          component: () => import('../views/UploadView.vue'),
        },
        {
          path: 'products',
          name: 'Products',
          component: () => import('../views/ProductsView.vue'),
        },
        {
          path: 'products/:id',
          name: 'ProductEdit',
          component: () => import('../views/ProductEditView.vue'),
        },
        {
          path: 'reports',
          name: 'Reports',
          component: () => import('../views/ReportsView.vue'),
        },
        {
          path: 'audit',
          name: 'Audit',
          component: () => import('../views/AuditView.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
});

// Navigation guard — redirect to login if not authenticated
router.beforeEach(async (to) => {
  const auth = useAuthStore();

  // Try to restore session on first navigation
  if (!auth.initialized) {
    await auth.tryRestoreSession();
  }

  if (to.meta.requiresAuth !== false && !auth.isLoggedIn) {
    return { name: 'Login', query: { redirect: to.fullPath } };
  }

  if (to.name === 'Login' && auth.isLoggedIn) {
    return { name: 'Dashboard' };
  }
});

export default router;
