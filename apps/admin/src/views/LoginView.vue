<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { getApiTargetMode, setApiTargetMode, getApiBase, type ApiTargetMode } from '../api/client';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const form = reactive({ email: '', password: '' });
const showPassword = ref(false);
const currentMode = ref<ApiTargetMode>(getApiTargetMode());

const currentBaseUrl = computed(() => getApiBase());

function switchMode(mode: ApiTargetMode) {
  currentMode.value = mode;
  setApiTargetMode(mode);
}

function fillLocalCredentials() {
  form.email = 'admin@ajkerbazardor.com';
  form.password = '@jkerb@2@rd0r';
}

async function handleLogin() {
  const ok = await auth.login(form.email, form.password);
  if (ok) {
    const redirect = (route.query['redirect'] as string) ?? '/';
    router.push(redirect);
  }
}
</script>

<template>
  <div class="login-page">
    <!-- Background decorative warm ambient circles -->
    <div class="login-page__bg" aria-hidden="true">
      <div class="login-page__blob login-page__blob--1" />
      <div class="login-page__blob login-page__blob--2" />
    </div>

    <main class="login-card" aria-labelledby="login-heading">
      <!-- Brand & Badge -->
      <div class="login-card__brand">
        <div class="brand-badge-wrap">
          <div class="brand-icon-pill">
            <span class="brand-emoji">🛒</span>
          </div>
        </div>
        <span class="portal-badge">অ্যাডমিন কন্ট্রোল পোর্টাল</span>
        <h1 id="login-heading" class="login-card__title">আজকের বাজার দর</h1>
        <p class="login-card__subtitle">টিসিবি বাজারদর মনিটরিং ও কন্ট্রোল প্যানেলে প্রবেশ করুন</p>
      </div>

      <!-- ── Local vs Live Target Control Switcher ── -->
      <div class="server-control-card">
        <span class="server-control-label">সার্ভার টার্গেট নির্বাচন করুন:</span>
        <div class="server-pills" role="tablist">
          <button
            type="button"
            class="server-pill"
            :class="{ 'server-pill--active': currentMode === 'local' }"
            @click="switchMode('local')"
          >
            <span class="mode-dot mode-dot--local" />
            <span class="mode-text">💻 লোকাল API (Local:3000)</span>
          </button>
          <button
            type="button"
            class="server-pill"
            :class="{ 'server-pill--active': currentMode === 'live' }"
            @click="switchMode('live')"
          >
            <span class="mode-dot mode-dot--live" />
            <span class="mode-text">🌐 লাইভ API (Vercel)</span>
          </button>
        </div>
        <div class="active-endpoint-wrap">
          <span class="endpoint-label">কানেক্টেড URL:</span>
          <code class="endpoint-url font-mono">{{ currentBaseUrl }}</code>
        </div>
      </div>

      <!-- Error Banner -->
      <div v-if="auth.error" class="login-card__error" role="alert" aria-live="polite">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{{ auth.error }}</span>
      </div>

      <!-- Login Form -->
      <form class="login-form" novalidate @submit.prevent="handleLogin">
        <div class="login-form__field">
          <div class="field-label-row">
            <label for="login-email" class="login-form__label">অ্যাডমিন ইমেইল</label>
            <button
              type="button"
              class="autofill-btn font-bn"
              title="ডিফল্ট অ্যাডমিন ক্রেডেনশিয়াল পূরণ করুন"
              @click="fillLocalCredentials"
            >
              ⚡ অটো-ফিল ক্রেডেনশিয়াল
            </button>
          </div>
          <div class="input-wrap">
            <svg
              class="field-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <input
              id="login-email"
              v-model="form.email"
              type="email"
              class="login-form__input"
              placeholder="admin@ajkerbazardor.com"
              autocomplete="email"
              required
              :disabled="auth.loggingIn"
            />
          </div>
        </div>

        <div class="login-form__field">
          <label for="login-password" class="login-form__label">পাসওয়ার্ড</label>
          <div class="input-wrap">
            <svg
              class="field-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              id="login-password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="login-form__input has-eye-btn"
              placeholder="••••••••"
              autocomplete="current-password"
              required
              :disabled="auth.loggingIn"
            />
            <button
              type="button"
              class="login-form__eye-btn"
              :aria-label="showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'"
              @click="showPassword = !showPassword"
            >
              <svg
                v-if="!showPassword"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg
                v-else
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path
                  d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </button>
          </div>
        </div>

        <button type="submit" class="login-form__submit" :disabled="auth.loggingIn" :aria-busy="auth.loggingIn">
          <span v-if="auth.loggingIn" class="login-form__spinner" aria-hidden="true" />
          <span>{{ auth.loggingIn ? 'লগইন যাচাই হচ্ছে…' : 'লগইন করুন' }}</span>
        </button>
      </form>

      <div class="login-card__footer">
        <span class="secure-dot" />
        <p class="login-card__note">লোকাল ও লাইভ উভয় মোড সমর্থিত • সুরক্ষিত প্রমাণীকরণ</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-canvas);
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

/* Decorative ambient blobs */
.login-page__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.login-page__blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.18;
}

.login-page__blob--1 {
  width: 450px;
  height: 450px;
  background: var(--color-coral-primary);
  top: -120px;
  right: -100px;
}

.login-page__blob--2 {
  width: 400px;
  height: 400px;
  background: var(--color-accent-green);
  bottom: -100px;
  left: -80px;
}

/* ── Card ─────────────────────────────────────────────────────────────────── */
.login-card {
  width: 100%;
  max-width: 460px;
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: 28px;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.05),
    0 2px 8px rgba(0, 0, 0, 0.02);
  padding: 2.5rem 2.25rem;
  position: relative;
  z-index: 1;
  animation: cardFadeIn 0.3s ease-out;
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.login-card__brand {
  text-align: center;
  margin-bottom: 1.5rem;
}

.brand-badge-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.brand-icon-pill {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  background: var(--color-coral-subtle);
  border: 1.5px solid var(--color-coral-border);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(255, 107, 74, 0.12);
}

.brand-emoji {
  font-size: 1.75rem;
}

.portal-badge {
  display: inline-block;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-coral-primary);
  background: var(--color-coral-subtle);
  border: 1px solid var(--color-coral-border);
  padding: 0.2rem 0.85rem;
  border-radius: 9999px;
  margin-bottom: 0.5rem;
}

.login-card__title {
  font-family: var(--font-heading);
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-text-primary);
  margin-bottom: 0.3rem;
  letter-spacing: -0.01em;
}

.login-card__subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.45;
}

/* ── Server Control Card ──────────────────────────────────────────────────── */
.server-control-card {
  background: var(--color-bg-canvas);
  border: 1.5px solid var(--color-border-subtle);
  border-radius: 18px;
  padding: 1rem 1.15rem;
  margin-bottom: 1.5rem;
}

.server-control-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.65rem;
}

.server-pills {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  background: var(--color-bg-surface);
  padding: 4px;
  border-radius: 9999px;
  border: 1px solid var(--color-border-strong);
}

.server-pill {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.45rem 0.75rem;
  border-radius: 9999px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
}

.server-pill:hover {
  color: var(--color-text-primary);
}

.server-pill--active {
  background: var(--color-coral-gradient) !important;
  color: #fff !important;
  box-shadow: 0 4px 14px rgba(244, 68, 46, 0.28);
}

.mode-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.mode-dot--local {
  background: var(--color-accent-green);
}

.mode-dot--live {
  background: var(--color-accent-cyan);
}

.server-pill--active .mode-dot {
  background: #fff;
}

.active-endpoint-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.65rem;
  font-size: 0.75rem;
}

.endpoint-label {
  color: var(--color-text-muted);
}

.endpoint-url {
  color: var(--color-coral-primary);
  background: var(--color-bg-surface);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--color-border-subtle);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Error ────────────────────────────────────────────────────────────────── */
.login-card__error {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  background-color: var(--color-trend-up-bg);
  color: var(--color-trend-up);
  border: 1px solid var(--color-trend-up-border);
  border-radius: 14px;
  padding: 0.85rem 1rem;
  font-size: var(--text-sm);
  font-weight: 600;
  margin-bottom: 1.25rem;
}

.login-card__error svg {
  flex-shrink: 0;
}

/* ── Form ─────────────────────────────────────────────────────────────────── */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.login-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.field-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.login-form__label {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--color-text-primary);
}

.autofill-btn {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-coral-primary);
  background: var(--color-coral-subtle);
  border: 1px solid var(--color-coral-border);
  padding: 2px 8px;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.autofill-btn:hover {
  background: var(--color-coral-primary);
  color: #fff;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.field-icon {
  position: absolute;
  left: 1.15rem;
  color: var(--color-text-muted);
  pointer-events: none;
}

.login-form__input {
  width: 100%;
  height: 48px;
  padding-left: 2.85rem;
  padding-right: 1.25rem;
  border-radius: 9999px;
  border: 1.5px solid var(--color-border-strong);
  background-color: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-size: var(--text-base);
  outline: none;
  transition: all 0.2s ease;
}

.login-form__input.has-eye-btn {
  padding-right: 3.25rem;
}

.login-form__input:focus {
  border-color: var(--color-coral-primary);
  box-shadow: 0 0 0 3px rgba(255, 107, 74, 0.18);
}

.login-form__input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-form__eye-btn {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.35rem;
  display: flex;
  align-items: center;
  transition: color 0.15s ease;
}

.login-form__eye-btn:hover {
  color: var(--color-coral-primary);
}

.login-form__submit {
  height: 50px;
  border-radius: 9999px;
  background: var(--color-coral-gradient);
  color: #fff;
  font-size: var(--text-base);
  font-weight: 800;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  box-shadow: var(--color-coral-glow);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  margin-top: 0.5rem;
}

.login-form__submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 28px rgba(244, 68, 46, 0.38);
}

.login-form__submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-form__spinner {
  width: 20px;
  height: 20px;
  border: 2.5px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.login-card__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.secure-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-accent-green);
  box-shadow: 0 0 0 3px var(--color-accent-green-subtle);
}

.login-card__note {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-muted);
}
</style>
