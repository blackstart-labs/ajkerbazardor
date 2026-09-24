<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiUpload, apiGet, apiPost } from '../api/client';
import { formatBnDate, formatBnInt } from '@ajkerbazardor/shared';

// ── Upload State ────────────────────────────────────────────────────────────
const file = ref<File | null>(null);
const uploading = ref(false);
const uploadResult = ref<unknown | null>(null);
const uploadError = ref<string | null>(null);
const dragOver = ref(false);

// ── Revision History ────────────────────────────────────────────────────────
interface Revision {
  id: number;
  reportId: number;
  date: string;
  productCount: number;
  warnings: number;
  uploadedBy: string;
  createdAt: string;
}

const revisions = ref<Revision[]>([]);
const revsLoading = ref(true);
const undoingId = ref<number | null>(null);

onMounted(async () => {
  await loadRevisions();
});

async function loadRevisions() {
  revsLoading.value = true;
  try {
    const res = await apiGet<{ ok: boolean; data: Revision[] }>('/admin/imports?limit=20');
    revisions.value = res.data ?? [];
  } catch {
    // non-fatal
  } finally {
    revsLoading.value = false;
  }
}

// ── File Selection ──────────────────────────────────────────────────────────
function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files?.[0]) selectFile(input.files[0]);
}

function onDrop(event: DragEvent) {
  dragOver.value = false;
  const f = event.dataTransfer?.files?.[0];
  if (f) selectFile(f);
}

function selectFile(f: File) {
  if (!f.name.endsWith('.xlsx')) {
    uploadError.value = 'শুধুমাত্র .xlsx ফাইল সমর্থিত।';
    return;
  }
  file.value = f;
  uploadError.value = null;
  uploadResult.value = null;
}

// ── Upload ──────────────────────────────────────────────────────────────────
async function handleUpload() {
  if (!file.value) return;
  uploading.value = true;
  uploadError.value = null;
  uploadResult.value = null;

  const formData = new FormData();
  formData.append('file', file.value);

  try {
    const res = await apiUpload<{ ok: boolean; data: unknown }>('/admin/imports', formData);
    uploadResult.value = res.data;
    file.value = null;
    await loadRevisions();
  } catch (err: unknown) {
    uploadError.value = (err as { data?: { message?: string } })?.data?.message ?? 'আপলোড ব্যর্থ হয়েছে।';
  } finally {
    uploading.value = false;
  }
}

// ── Undo ────────────────────────────────────────────────────────────────────
async function undoRevision(revisionId: number) {
  if (!confirm('এই আপলোড বাতিল করবেন?')) return;
  undoingId.value = revisionId;
  try {
    await apiPost(`/admin/imports/${revisionId}/undo`);
    await loadRevisions();
  } catch {
    alert('undo ব্যর্থ হয়েছে।');
  } finally {
    undoingId.value = null;
  }
}
</script>

<template>
  <div class="upload-page">
    <h2 class="page-title">TCB ফাইল আপলোড</h2>

    <!-- ── Drop Zone ────────────────────────────────────────────────── -->
    <div
      class="drop-zone"
      :class="{ 'drop-zone--drag': dragOver, 'drop-zone--has-file': !!file }"
      role="region"
      aria-label="ফাইল আপলোড এলাকা"
      @dragover.prevent="dragOver = true"
      @dragleave="dragOver = false"
      @drop.prevent="onDrop"
    >
      <label for="file-input" class="drop-zone__label">
        <div class="drop-zone__icon" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <div v-if="file" class="drop-zone__file-name">
          <span class="drop-zone__file-icon" aria-hidden="true">📊</span>
          {{ file.name }}
          <span class="drop-zone__file-size">({{ (file.size / 1024).toFixed(1) }} KB)</span>
        </div>
        <div v-else class="drop-zone__hint">
          <strong>ফাইল টেনে আনুন</strong> বা এখানে ক্লিক করুন <span class="drop-zone__ext">.xlsx</span> ফাইল সমর্থিত
        </div>
      </label>
      <input id="file-input" type="file" accept=".xlsx" class="sr-only" :disabled="uploading" @change="onFileChange" />
    </div>

    <!-- Error -->
    <div v-if="uploadError" class="alert alert--error" role="alert">{{ uploadError }}</div>

    <!-- Success -->
    <div v-if="uploadResult" class="alert alert--success" role="status">✅ সফলভাবে আপলোড হয়েছে!</div>

    <!-- Upload Button -->
    <button
      type="button"
      class="upload-btn"
      :disabled="!file || uploading"
      :aria-busy="uploading"
      @click="handleUpload"
    >
      <span v-if="uploading" class="spinner" aria-hidden="true" />
      {{ uploading ? 'আপলোড হচ্ছে…' : 'আপলোড করুন' }}
    </button>

    <!-- ── Revision History ──────────────────────────────────────── -->
    <section class="revisions-section">
      <h3 class="revisions-section__title">আপলোড ইতিহাস</h3>

      <div v-if="revsLoading" class="revisions-skeleton">
        <div v-for="n in 3" :key="n" class="skeleton-row" />
      </div>

      <table v-else class="revisions-table" aria-label="আপলোড ইতিহাস">
        <thead>
          <tr>
            <th>তারিখ</th>
            <th>পণ্য সংখ্যা</th>
            <th>সতর্কতা</th>
            <th>আপলোড সময়</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rev in revisions" :key="rev.id">
            <td class="font-bn">{{ formatBnDate(rev.date) }}</td>
            <td class="font-bn">{{ formatBnInt(rev.productCount) }}</td>
            <td>
              <span v-if="rev.warnings > 0" class="badge badge--warn">{{ rev.warnings }} সতর্কতা</span>
              <span v-else class="badge badge--ok">✓</span>
            </td>
            <td class="text-muted text-sm">{{ new Date(rev.createdAt).toLocaleString('bn-BD') }}</td>
            <td>
              <button type="button" class="undo-btn" :disabled="undoingId === rev.id" @click="undoRevision(rev.id)">
                {{ undoingId === rev.id ? 'বাতিল হচ্ছে…' : 'বাতিল করুন' }}
              </button>
            </td>
          </tr>
          <tr v-if="revisions.length === 0">
            <td colspan="5" class="empty-row">কোনো আপলোড পাওয়া যায়নি।</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.upload-page {
  max-width: 800px;
}

.page-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--space-6);
}

/* ── Drop Zone ────────────────────────────────────────────────────────────── */
.drop-zone {
  border: 2px dashed var(--color-border-strong);
  border-radius: var(--radius-lg);
  background: var(--color-bg-subtle);
  cursor: pointer;
  transition: all var(--duration-normal);
  margin-bottom: var(--space-4);
}

.drop-zone--drag,
.drop-zone:has(label:hover) {
  border-color: var(--color-brand-primary);
  background: var(--color-brand-subtle);
}

.drop-zone--has-file {
  border-color: var(--color-trend-down);
  background: var(--color-trend-down-bg);
}

.drop-zone__label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-10) var(--space-4);
  cursor: pointer;
  text-align: center;
}

.drop-zone__icon {
  color: var(--color-brand-primary);
}

.drop-zone__hint {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
}

.drop-zone__hint strong {
  color: var(--color-brand-primary);
}

.drop-zone__ext {
  display: block;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}

.drop-zone__file-name {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-body);
  font-weight: 600;
  color: var(--color-trend-down-text);
}

.drop-zone__file-icon {
  font-size: 1.5rem;
}

.drop-zone__file-size {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-weight: 400;
}

/* ── Alerts ──────────────────────────────────────────────────────────────── */
.alert {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
  font-size: var(--text-sm);
  font-family: var(--font-body);
}

.alert--error {
  background: var(--color-trend-up-bg);
  color: var(--color-trend-up-text);
  border: 1px solid var(--color-trend-up-border);
}

.alert--success {
  background: var(--color-trend-down-bg);
  color: var(--color-trend-down-text);
  border: 1px solid var(--color-trend-down-border);
}

/* ── Upload Button ───────────────────────────────────────────────────────── */
.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: 48px;
  padding: 0 var(--space-8);
  background: var(--color-brand-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: 700;
  font-family: var(--font-body);
  cursor: pointer;
  transition:
    background-color var(--duration-fast),
    opacity var(--duration-fast);
  margin-bottom: var(--space-8);
}

.upload-btn:hover:not(:disabled) {
  background: var(--color-brand-hover);
}

.upload-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
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

/* ── Revisions ───────────────────────────────────────────────────────────── */
.revisions-section__title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: 700;
  margin-bottom: var(--space-4);
}

.revisions-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  background: var(--color-bg-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.revisions-table th {
  text-align: left;
  background: var(--color-bg-subtle);
  padding: var(--space-2-5) var(--space-3);
  color: var(--color-text-muted);
  font-weight: 600;
  border-bottom: 1px solid var(--color-border-subtle);
}

.revisions-table td {
  padding: var(--space-2-5) var(--space-3);
  border-bottom: 1px solid var(--color-border-subtle);
  color: var(--color-text-primary);
}

.revisions-table tr:last-child td {
  border-bottom: none;
}

.badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
}

.badge--warn {
  background: var(--color-brand-subtle);
  color: var(--color-brand-ink);
}

.badge--ok {
  background: var(--color-trend-down-bg);
  color: var(--color-trend-down-text);
}

.undo-btn {
  background: transparent;
  border: 1px solid var(--color-trend-up-border);
  color: var(--color-trend-up);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.undo-btn:hover:not(:disabled) {
  background: var(--color-trend-up-bg);
}

.undo-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.revisions-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.skeleton-row {
  height: 48px;
  border-radius: var(--radius-md);
  background: linear-gradient(90deg, var(--color-bg-muted) 25%, var(--color-bg-subtle) 50%, var(--color-bg-muted) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.empty-row {
  text-align: center;
  padding: var(--space-6) !important;
  color: var(--color-text-muted);
}

.text-muted {
  color: var(--color-text-muted);
}
.text-sm {
  font-size: var(--text-sm);
}
.font-bn {
  font-family: var(--font-body);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
</style>
