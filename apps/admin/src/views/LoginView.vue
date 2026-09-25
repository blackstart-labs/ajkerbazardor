<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const form = reactive({ email: '', password: '' });
const showPassword = ref(false);

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
    <!-- Background decorative blobs -->
    <div class="login-page__bg" aria-hidden="true">
      <div class="login-page__blob login-page__blob--1" />
      <div class="login-page__blob login-page__blob--2" />
    </div>

    <main class="login-card" aria-labelledby="login-heading">
      <!-- Brand -->
      <div class="login-card__brand">
        <span class="login-card__logo" aria-hidden="true">🛒</span>
        <h1 id="login-heading" class="login-card__title">আজকের বাজার দর</h1>
        <p class="login-card__subtitle">অ্যাডমিন প্যানেল</p>
      </div>

      <!-- Error Banner -->
      <div v-if="auth.error" class="login-card__error" role="alert" aria-live="polite">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {{ auth.error }}
      </div>

      <!-- Login Form -->
      <form class="login-form" novalidate @submit.prevent="handleLogin">
        <div class="login-form__field">
          <label for="login-email" class="login-form__label">ইমেইল</label>
          <input
            id="login-email"
            v-model="form.email"
            type="email"
            class="login-form__input"
            placeholder="admin@example.com"
            autocomplete="email"
            required
            :disabled="auth.loggingIn"
          />
        </div>

        <div class="login-form__field">
          <label for="login-password" class="login-form__label">পাসওয়ার্ড</label>
          <div class="login-form__input-wrap">
            <input
              id="login-password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="login-form__input"
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
                width="16"
                height="16"
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
                width="16"
                height="16"
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
          {{ auth.loggingIn ? 'লগইন হচ্ছে…' : 'লগইন করুন' }}
        </button>
      </form>

      <p class="login-card__note">অ্যাডমিন অ্যাকাউন্ট প্রয়োজন</p>
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
  padding: var(--space-4);
  position: relative;
  overflow: hidden;
}

/* Decorative blobs */
.login-page__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.login-page__blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
}

.login-page__blob--1 {
  width: 400px;
  height: 400px;
  background: var(--color-brand-primary);
  top: -100px;
  right: -100px;
}

.login-page__blob--2 {
  width: 300px;
  height: 300px;
  background: var(--color-trend-down);
  bottom: -80px;
  left: -80px;
}

/* ── Card ─────────────────────────────────────────────────────────────────── */
.login-card {
  width: 100%;
  max-width: 400px;
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-dropdown);
  padding: var(--space-8);
  position: relative;
  z-index: 1;
}

.login-card__brand {
  text-align: center;
  margin-bottom: var(--space-6);
}

.login-card__logo {
  font-size: 2.5rem;
  display: block;
  margin-bottom: var(--space-2);
}

.login-card__title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
}

.login-card__subtitle {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

/* ── Error ────────────────────────────────────────────────────────────────── */
.login-card__error {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background-color: var(--color-trend-up-bg);
  color: var(--color-trend-up-text);
  border: 1px solid var(--color-trend-up-border);
  border-radius: var(--radius-md);
  padding: var(--space-2-5) var(--space-3);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  margin-bottom: var(--space-4);
}

/* ── Form ─────────────────────────────────────────────────────────────────── */
.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.login-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1-5);
}

.login-form__label {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.login-form__input {
  width: 100%;
  height: 44px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  border: 1.5px solid var(--color-border-strong);
  background-color: var(--color-bg-canvas);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  outline: none;
  transition:
    border-color var(--duration-fast),
    box-shadow var(--duration-fast);
}

.login-form__input:focus {
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 3px var(--color-brand-subtle);
}

.login-form__input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-form__input-wrap {
  position: relative;
}

.login-form__input-wrap .login-form__input {
  padding-right: 44px;
}

.login-form__eye-btn {
  position: absolute;
  right: var(--space-2-5);
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: var(--space-1);
  display: flex;
  align-items: center;
  transition: color var(--duration-fast);
}

.login-form__eye-btn:hover {
  color: var(--color-brand-primary);
}

.login-form__submit {
  height: 48px;
  border-radius: var(--radius-md);
  background-color: var(--color-brand-primary);
  color: #fff;
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: 700;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  transition:
    background-color var(--duration-fast),
    opacity var(--duration-fast);
  margin-top: var(--space-2);
}

.login-form__submit:hover:not(:disabled) {
  background-color: var(--color-brand-hover);
}

.login-form__submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-form__spinner {
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.login-card__note {
  text-align: center;
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin-top: var(--space-4);
}
</style>
