<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import SidebarIcon from '../components/SidebarIcon.vue';
import { formatBnDate } from '@ajkerbazardor/shared';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const sidebarOpen = ref(true);
const showJumpToTop = ref(false);
const todayDateStr = ref(new Date().toISOString().split('T')[0]);

function onScroll() {
  showJumpToTop.value = window.scrollY > 240;
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
});

async function logout() {
  await auth.logout();
  router.push({ name: 'Login' });
}

const navItems = [
  { to: '/', label: 'ড্যাশবোর্ড', icon: 'grid' },
  { to: '/products', label: 'পণ্য ও দর ধারা', icon: 'package' },
  { to: '/upload', label: 'ডেইলি আপলোড', icon: 'upload' },
  { to: '/prices', label: 'বাজারের মূল্য তালিকা', icon: 'activity' },
  { to: '/markets', label: 'বাজারসমূহ', icon: 'grid' },
  { to: '/imports', label: 'আমদানি ইতিহাস', icon: 'file-text' },
  { to: '/reports', label: 'প্রকাশিত বুলেটিন', icon: 'file-text' },
  { to: '/settings', label: 'সিস্টেম সেটিংস', icon: 'grid' },
  { to: '/audit', label: 'অডিট লগ', icon: 'activity' },
];

function isActive(path: string) {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
}

import { getApiTargetMode, setApiTargetMode, type ApiTargetMode } from '../api/client';

const apiTarget = ref<ApiTargetMode>(getApiTargetMode());

function toggleApiTarget() {
  const next: ApiTargetMode = apiTarget.value === 'local' ? 'live' : 'local';
  apiTarget.value = next;
  setApiTargetMode(next);
  window.location.reload();
}

const userInitials = computed(() => {
  const email = auth.user?.email || 'Admin';
  return email.slice(0, 2).toUpperCase();
});

const userDisplayName = computed(() => {
  if (!auth.user?.email) return 'অ্যাডমিন ইউজার';
  return auth.user.email.split('@')[0];
});

onMounted(() => {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<ApiTargetMode>).detail;
    if (detail) apiTarget.value = detail;
  };
  window.addEventListener('admin_api_target_changed', handler);
});
</script>

<template>
  <div class="admin-shell" :class="{ 'admin-shell--sidebar-closed': !sidebarOpen }">
    <!-- ── Floating Sidebar ─────────────────────────────────────────── -->
    <aside class="sidebar" :class="{ 'sidebar--closed': !sidebarOpen }" aria-label="প্রধান মেনু">
      <!-- Brand Header -->
      <div class="sidebar__brand">
        <div class="sidebar__brand-icon" aria-hidden="true">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </div>
        <Transition name="fade">
          <div v-if="sidebarOpen" class="sidebar__brand-info">
            <span class="sidebar__brand-title">আজকের বাজার</span>
            <span class="sidebar__brand-badge">অ্যাডমিন</span>
          </div>
        </Transition>
      </div>

      <!-- Navigation Links -->
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
            <span v-if="sidebarOpen" class="sidebar__nav-label font-bn">{{ item.label }}</span>
          </Transition>
        </RouterLink>
      </nav>

      <!-- Sidebar Footer (User Profile & Logout) -->
      <div class="sidebar__footer">
        <div class="sidebar__user">
          <div class="sidebar__user-avatar font-bn" aria-hidden="true">
            {{ userInitials }}
          </div>
          <Transition name="fade">
            <div v-if="sidebarOpen" class="sidebar__user-info">
              <span class="sidebar__user-name font-bn">{{ userDisplayName }}</span>
              <span class="sidebar__user-role font-bn">সুপার অ্যাডমিন</span>
            </div>
          </Transition>
          <Transition name="fade">
            <button
              v-if="sidebarOpen"
              type="button"
              class="sidebar__logout-icon-btn"
              title="লগআউট"
              aria-label="লগআউট করুন"
              @click="logout"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </Transition>
        </div>
      </div>
    </aside>

    <!-- ── Main Workspace ───────────────────────────────────────────── -->
    <div class="admin-main">
      <!-- Top Navigation Bar -->
      <header class="admin-header">
        <!-- Sidebar Toggle -->
        <button
          type="button"
          class="admin-header__toggle"
          :aria-label="sidebarOpen ? 'সাইডবার বন্ধ করুন' : 'সাইডবার খুলুন'"
          @click="sidebarOpen = !sidebarOpen"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <!-- Center Search Pill -->
        <div class="admin-header__search-wrap">
          <svg
            class="search-pill-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            class="search-pill-input font-bn"
            placeholder="পণ্য, ক্যাটাগরি, বাজার বা রিপোর্ট খুঁজুন…"
            @keydown.enter="router.push('/products')"
          />
        </div>

        <!-- Right Quick Actions -->
        <div class="admin-header__actions">
          <!-- API Target Switcher Pill -->
          <button
            type="button"
            class="target-pill font-bn"
            :class="apiTarget === 'local' ? 'target-pill--local' : 'target-pill--live'"
            :title="
              apiTarget === 'local'
                ? 'কানেক্টেড: লোকাল API (localhost:3000) • ক্লিক করে লাইভ সার্ভারে স্যুইচ করুন'
                : 'কানেক্টেড: লাইভ API (Vercel) • ক্লিক করে লোকাল সার্ভারে স্যুইচ করুন'
            "
            @click="toggleApiTarget"
          >
            <span class="target-indicator-dot" />
            <span>{{ apiTarget === 'local' ? '💻 Local (3000)' : '🌐 Live Cloud' }}</span>
          </button>

          <!-- Live Date Pill -->
          <div class="date-pill font-bn">
            <span class="live-dot" />
            {{ todayDateStr ? formatBnDate(todayDateStr) : 'আজকের বাজার' }}
          </div>

          <!-- Notification Bell -->
          <button type="button" class="icon-pill-btn" aria-label="বিজ্ঞপ্তি" title="বিজ্ঞপ্তি">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span class="notification-badge" />
          </button>

          <!-- Export Report Button -->
          <RouterLink to="/reports" class="export-btn font-bn"> এক্সপোর্ট রিপোর্ট </RouterLink>

          <!-- Upload New Bulletin Button (Coral Pill) -->
          <RouterLink to="/upload" class="new-action-btn font-bn">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            নতুন বুলেটিন আপলোড
          </RouterLink>
        </div>
      </header>

      <!-- Sub-banner greeting -->
      <div class="admin-subbanner font-bn">
        বাজার মনিটরিং সক্রিয় — <strong>৬০টি নিত্যপণ্যের</strong> নির্ভরযোগ্য খুচরা ও পাইকারি বাজার দর পর্যালোচনা করা
        হচ্ছে।
      </div>

      <!-- Main Page Content -->
      <main id="admin-main-content" class="admin-content">
        <RouterView />
      </main>

      <!-- Floating Jump to Top -->
      <Transition name="fade">
        <button
          v-if="showJumpToTop"
          type="button"
          class="jump-to-top"
          aria-label="উপরে যান"
          title="উপরে যান"
          @click="scrollToTop"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
/* ── Layout Shell ─────────────────────────────────────────────────────────── */
.admin-shell {
  display: flex;
  min-height: 100dvh;
  background-color: var(--color-bg-canvas);
  padding: 16px 16px 16px 0;
  gap: 16px;
}

/* ── Floating Sidebar ─────────────────────────────────────────────────────── */
.sidebar {
  width: var(--admin-sidebar-width, 250px);
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--card-radius, 22px);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition:
    width 0.25s var(--ease-spring),
    padding 0.25s ease;
  overflow: hidden;
  position: sticky;
  top: 16px;
  height: calc(100dvh - 32px);
  margin-left: 16px;
  box-shadow: var(--card-shadow);
  z-index: 40;
}

.sidebar--closed {
  width: 72px;
}

/* Brand */
.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 18px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.sidebar__brand-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--color-coral-gradient);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--color-coral-glow);
}

.sidebar__brand-info {
  display: flex;
  flex-direction: column;
}

.sidebar__brand-title {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.sidebar__brand-badge {
  font-size: 0.72rem;
  color: var(--color-coral-primary);
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Nav */
.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 12px;
  flex: 1;
  overflow-y: auto;
}

.sidebar__nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
  text-decoration: none;
  transition: all 0.18s var(--ease-smooth);
  white-space: nowrap;
}

.sidebar__nav-item:hover {
  background-color: var(--color-bg-subtle);
  color: var(--color-text-primary);
}

.sidebar__nav-item--active {
  background: var(--color-coral-gradient) !important;
  color: #ffffff !important;
  font-weight: 600;
  box-shadow: var(--color-coral-glow);
}

.sidebar__nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* User Footer */
.sidebar__footer {
  padding: 14px 12px;
  border-top: 1px solid var(--color-border-subtle);
}

.sidebar__user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px;
  border-radius: 12px;
  background: var(--color-bg-canvas);
  border: 1px solid var(--color-border-subtle);
}

.sidebar__user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--color-coral-subtle);
  color: var(--color-coral-primary);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: var(--text-xs);
  border: 1.5px solid var(--color-coral-border);
}

.sidebar__user-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex: 1;
}

.sidebar__user-name {
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__user-role {
  font-size: 0.72rem;
  color: var(--color-text-muted);
}

.sidebar__logout-icon-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.sidebar__logout-icon-btn:hover {
  color: var(--color-coral-primary);
  background: var(--color-coral-subtle);
}

/* ── Main Section ─────────────────────────────────────────────────────────── */
.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* Header */
.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.admin-header__toggle {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  padding: 10px;
  cursor: pointer;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: all 0.15s ease;
}

.admin-header__toggle:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text-primary);
}

/* Center Pill Search */
.admin-header__search-wrap {
  position: relative;
  flex: 1;
  max-width: 480px;
  display: flex;
  align-items: center;
}

.search-pill-icon {
  position: absolute;
  left: 16px;
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-pill-input {
  width: 100%;
  height: 44px;
  padding: 0 20px 0 46px;
  border-radius: 9999px;
  border: 1.5px solid var(--color-border-subtle);
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  outline: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
  transition: all 0.2s var(--ease-smooth);
}

.search-pill-input:focus {
  border-color: var(--color-coral-primary);
  box-shadow: 0 0 0 3px var(--color-coral-subtle);
  background: #ffffff;
}

/* Right Actions */
.admin-header__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.target-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border-radius: 9999px;
  background: var(--color-bg-surface);
  border: 1.5px solid var(--color-border-subtle);
  font-size: var(--text-xs);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.target-pill:hover {
  transform: translateY(-1px);
}

.target-pill--local {
  color: #065f46;
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.target-pill--local:hover {
  background: #d1fae5;
  border-color: #6ee7b7;
}

.target-pill--local .target-indicator-dot {
  background: var(--color-accent-green);
  box-shadow: 0 0 0 2px var(--color-accent-green-subtle);
}

.target-pill--live {
  color: #1e40af;
  background: #eff6ff;
  border-color: #bfdbfe;
}

.target-pill--live:hover {
  background: #dbeafe;
  border-color: #93c5fd;
}

.target-pill--live .target-indicator-dot {
  background: #2563eb;
  box-shadow: 0 0 0 2px #dbeafe;
}

.target-indicator-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.date-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 9999px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-accent-green);
  box-shadow: 0 0 0 2px var(--color-accent-green-subtle);
}

.icon-pill-btn {
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-secondary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  transition: all 0.15s ease;
}

.icon-pill-btn:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text-primary);
}

.notification-badge {
  position: absolute;
  top: 9px;
  right: 9px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-coral-primary);
}

.export-btn {
  padding: 8px 16px;
  border-radius: 9999px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-primary);
  font-size: var(--text-xs);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  transition: all 0.15s ease;
}

.export-btn:hover {
  background: var(--color-bg-subtle);
  border-color: var(--color-border-strong);
  text-decoration: none;
}

.new-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 9999px;
  background: var(--color-coral-gradient);
  color: #ffffff !important;
  font-size: var(--text-xs);
  font-weight: 600;
  box-shadow: var(--color-coral-glow);
  transition:
    transform 0.18s var(--ease-spring),
    box-shadow 0.18s ease;
}

.new-action-btn:hover {
  transform: translateY(-1.5px);
  box-shadow: 0 10px 24px rgba(244, 68, 46, 0.35);
  text-decoration: none;
}

/* Sub-banner */
.admin-subbanner {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: 20px;
  padding-left: 4px;
}

/* Main Content Area */
.admin-content {
  flex: 1;
}

@media (max-width: 960px) {
  .admin-shell {
    padding: 12px;
    gap: 12px;
  }
  .sidebar {
    position: fixed;
    top: 12px;
    bottom: 12px;
    margin-left: 0;
    height: calc(100dvh - 24px);
  }
}
</style>
