<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import SidebarIcon from '../components/SidebarIcon.vue';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const sidebarOpen = ref(true);

async function logout() {
  await auth.logout();
  router.push({ name: 'Login' });
}

const navItems = [
  { to: '/', label: 'ড্যাশবোর্ড', icon: 'grid' },
  { to: '/upload', label: 'ফাইল আপলোড', icon: 'upload' },
  { to: '/products', label: 'পণ্য তালিকা', icon: 'package' },
  { to: '/reports', label: 'রিপোর্ট', icon: 'file-text' },
  { to: '/audit', label: 'অডিট লগ', icon: 'activity' },
];

function isActive(path: string) {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
}
</script>

<template>
  <div class="admin-shell" :class="{ 'admin-shell--sidebar-closed': !sidebarOpen }">
    <!-- ── Sidebar ───────────────────────────────────────────────────── -->
    <aside class="sidebar" :class="{ 'sidebar--closed': !sidebarOpen }" aria-label="প্রধান মেনু">
      <!-- Brand -->
      <div class="sidebar__brand">
        <span class="sidebar__logo" aria-hidden="true">🛒</span>
        <Transition name="fade">
          <span v-if="sidebarOpen" class="sidebar__brand-text">বাজার দর</span>
        </Transition>
      </div>

      <!-- Nav -->
      <nav class="sidebar__nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="sidebar__nav-item"
          :class="{ 'sidebar__nav-item--active': isActive(item.to) }"
          :aria-current="isActive(item.to) ? 'page' : undefined"
        >
          <SidebarIcon :name="item.icon" class="sidebar__nav-icon" />
          <Transition name="fade">
            <span v-if="sidebarOpen" class="sidebar__nav-label">{{ item.label }}</span>
          </Transition>
        </RouterLink>
      </nav>

      <!-- Bottom: User + Logout -->
      <div class="sidebar__footer">
        <div class="sidebar__user">
          <div class="sidebar__user-avatar" aria-hidden="true">
            {{ auth.user?.email.charAt(0).toUpperCase() }}
          </div>
          <Transition name="fade">
            <div v-if="sidebarOpen" class="sidebar__user-info">
              <span class="sidebar__user-email">{{ auth.user?.email }}</span>
              <button type="button" class="sidebar__logout-btn" @click="logout">লগআউট</button>
            </div>
          </Transition>
        </div>
      </div>
    </aside>

    <!-- ── Main Content ─────────────────────────────────────────────── -->
    <div class="admin-main">
      <!-- Header -->
      <header class="admin-header">
        <button
          type="button"
          class="admin-header__toggle"
          :aria-label="sidebarOpen ? 'সাইডবার বন্ধ করুন' : 'সাইডবার খুলুন'"
          @click="sidebarOpen = !sidebarOpen"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <h1 class="admin-header__title">
          {{ navItems.find((n) => isActive(n.to))?.label ?? 'অ্যাডমিন' }}
        </h1>

        <!-- Quick actions -->
        <div class="admin-header__actions">
          <RouterLink to="/upload" class="admin-header__upload-btn">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            ফাইল আপলোড
          </RouterLink>
        </div>
      </header>

      <!-- Page Content -->
      <main id="admin-main-content" class="admin-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* ── Admin Shell Layout ───────────────────────────────────────────────────── */
.admin-shell {
  display: flex;
  min-height: 100dvh;
  background-color: var(--color-bg-canvas);
}

/* ── Sidebar ──────────────────────────────────────────────────────────────── */
.sidebar {
  width: var(--admin-sidebar-width, 240px);
  min-height: 100dvh;
  background-color: var(--color-bg-surface);
  border-right: 1px solid var(--color-border-subtle);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width var(--duration-normal, 250ms) var(--ease-standard, cubic-bezier(0.2, 0, 0, 1));
  overflow: hidden;
  position: sticky;
  top: 0;
  align-self: flex-start;
  max-height: 100dvh;
}

.sidebar--closed {
  width: 64px;
}

/* Brand */
.sidebar__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2, 0.5rem);
  padding: var(--space-4, 1rem) var(--space-4, 1rem);
  height: var(--admin-header-height, 56px);
  border-bottom: 1px solid var(--color-border-subtle, #e7e0d8);
  flex-shrink: 0;
}

.sidebar__logo {
  font-size: 1.4rem;
  line-height: 1;
  flex-shrink: 0;
}

.sidebar__brand-text {
  font-family: var(--font-heading);
  font-size: var(--text-base, 1rem);
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
}

/* Nav */
.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-0-5, 0.125rem);
  padding: var(--space-3, 0.75rem) var(--space-2, 0.5rem);
  flex: 1;
  overflow-y: auto;
}

.sidebar__nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3, 0.75rem);
  padding: var(--space-2-5, 0.625rem) var(--space-3, 0.75rem);
  border-radius: var(--radius-md, 10px);
  text-decoration: none;
  color: var(--color-text-secondary, #57534e);
  font-size: var(--text-sm, 0.875rem);
  font-weight: 500;
  transition: all var(--duration-fast, 150ms);
  white-space: nowrap;
  overflow: hidden;
}

.sidebar__nav-item:hover {
  background-color: var(--color-bg-subtle, #f4efeb);
  color: var(--color-text-primary);
  text-decoration: none;
}

.sidebar__nav-item--active {
  background-color: var(--color-brand-subtle, #fef3c7);
  color: var(--color-brand-ink, #78350f);
  font-weight: 600;
}

.sidebar__nav-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.sidebar__nav-label {
  white-space: nowrap;
}

/* Footer */
.sidebar__footer {
  padding: var(--space-3, 0.75rem) var(--space-2, 0.5rem);
  border-top: 1px solid var(--color-border-subtle, #e7e0d8);
  flex-shrink: 0;
}

.sidebar__user {
  display: flex;
  align-items: center;
  gap: var(--space-2-5, 0.625rem);
  padding: var(--space-2, 0.5rem) var(--space-2, 0.5rem);
}

.sidebar__user-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full, 9999px);
  background-color: var(--color-brand-primary, #d97706);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: var(--text-sm, 0.875rem);
  flex-shrink: 0;
}

.sidebar__user-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-0-5, 0.125rem);
  min-width: 0;
}

.sidebar__user-email {
  font-size: var(--text-xs, 0.75rem);
  color: var(--color-text-muted, #78716c);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar__logout-btn {
  background: transparent;
  border: none;
  color: var(--color-brand-primary, #d97706);
  font-size: var(--text-xs, 0.75rem);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  text-align: left;
  transition: color var(--duration-fast);
}

.sidebar__logout-btn:hover {
  color: var(--color-brand-hover, #b45309);
}

/* ── Admin Main ───────────────────────────────────────────────────────────── */
.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

/* Header */
.admin-header {
  height: var(--admin-header-height, 56px);
  background-color: var(--color-bg-surface, #ffffff);
  border-bottom: 1px solid var(--color-border-subtle, #e7e0d8);
  display: flex;
  align-items: center;
  padding: 0 var(--space-4, 1rem);
  gap: var(--space-3, 0.75rem);
  position: sticky;
  top: 0;
  z-index: 30;
  box-shadow: var(--shadow-sm);
}

.admin-header__toggle {
  background: transparent;
  border: none;
  color: var(--color-text-muted, #78716c);
  cursor: pointer;
  padding: var(--space-2, 0.5rem);
  border-radius: var(--radius-sm, 6px);
  display: flex;
  align-items: center;
  transition: color var(--duration-fast);
}

.admin-header__toggle:hover {
  color: var(--color-text-primary, #1c1917);
  background-color: var(--color-bg-subtle, #f4efeb);
}

.admin-header__title {
  font-family: var(--font-heading);
  font-size: var(--text-lg, 1.125rem);
  font-weight: 700;
  color: var(--color-text-primary);
  flex: 1;
}

.admin-header__actions {
  display: flex;
  gap: var(--space-2, 0.5rem);
}

.admin-header__upload-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1-5, 0.375rem);
  padding: var(--space-1-5, 0.375rem) var(--space-3, 0.75rem);
  background-color: var(--color-brand-primary, #d97706);
  color: #fff;
  border-radius: var(--radius-sm, 6px);
  font-size: var(--text-sm, 0.875rem);
  font-weight: 600;
  text-decoration: none;
  transition: background-color var(--duration-fast);
}

.admin-header__upload-btn:hover {
  background-color: var(--color-brand-hover, #b45309);
  text-decoration: none;
}

/* Content */
.admin-content {
  flex: 1;
  padding: var(--space-6, 1.5rem);
  overflow-y: auto;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--duration-fast, 150ms);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
