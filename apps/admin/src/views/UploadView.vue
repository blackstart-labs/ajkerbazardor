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
    const res = await apiGet<{ ok: boolean; data: any[] }>('/admin/imports?limit=20');
    const raw = Array.isArray(res.data) ? res.data : [];
    revisions.value = raw.map((r: any) => {
      let statsObj: any = {};
      try {
        statsObj = typeof r.stats === 'string' ? JSON.parse(r.stats) : (r.stats ?? {});
      } catch {
        statsObj = {};
      }
      let warnArr: any = [];
      try {
        warnArr = typeof r.warnings === 'string' ? JSON.parse(r.warnings) : (r.warnings ?? []);
      } catch {
        warnArr = [];
      }
      return {
        id: r.id,
        reportId: r.reportId,
        date: r.date ?? r.reportDate ?? '',
        productCount: statsObj.productCount ?? statsObj.parsed ?? r.productCount ?? 0,
        warnings: Array.isArray(warnArr) ? warnArr.length : typeof warnArr === 'number' ? warnArr : 0,
        uploadedBy: r.uploadedBy ?? 'Admin',
        createdAt: r.createdAt ?? '',
      };
    });
  } catch {
    // non-fatal
  } finally {
    revsLoading.value = false;
  }
}

function getWarningCount(warnings: unknown): number {
  if (typeof warnings === 'number') return warnings;
  if (Array.isArray(warnings)) return warnings.length;
  return 0;
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

    <ol class="import-stepper" aria-label="ইমপোর্ট ধাপ">
      <li class="import-stepper__item import-stepper__item--active">1. Upload</li>
      <li class="import-stepper__item">2. Parse</li>
      <li class="import-stepper__item">3. Validate</li>
      <li class="import-stepper__item">4. Review</li>
      <li class="import-stepper__item">5. Publish</li>
    </ol>

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

    <section v-if="uploadResult" class="validation-preview" aria-label="ইমপোর্ট প্রিভিউ">
      <h3>Validation summary</h3>
      <div class="validation-preview__grid">
        <div><strong>✓</strong><span>Valid products</span></div>
        <div><strong>✓</strong><span>Valid markets</span></div>
        <div><strong>✓</strong><span>Valid prices</span></div>
        <div><strong>⚠</strong><span>Warnings review</span></div>
      </div>
      <p>পূর্ণ edit-before-publish workflow backend preview endpoint যুক্ত হলে এখানে সক্রিয় হবে।</p>
    </section>

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
            <td class="font-bn">{{ formatBnDate(rev.date || (rev as any).reportDate) }}</td>
            <td class="font-bn">{{ formatBnInt(rev.productCount ?? (rev as any).stats?.productCount ?? 0) }}</td>
            <td>
              <span v-if="getWarningCount(rev.warnings) > 0" class="badge badge--warn">
                {{ getWarningCount(rev.warnings) }} সতর্কতা
              </span>
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
  max-width: 960px;
}

.page-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 20px;
}

.import-stepper {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
}

.import-stepper__item {
  padding: 8px 16px;
  border-radius: 9999px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.import-stepper__item--active {
  color: #fff !important;
  background: var(--color-coral-gradient) !important;
  border-color: transparent !important;
  box-shadow: var(--color-coral-glow);
}

.validation-preview {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--card-radius, 22px);
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--card-shadow);
}

.validation-preview h3 {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  margin-bottom: 14px;
}

.validation-preview__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.validation-preview__grid div {
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  padding: 12px;
  background: var(--color-bg-canvas);
}

.validation-preview__grid strong,
.validation-preview__grid span {
  display: block;
}

/* ── Drop Zone ────────────────────────────────────────────────────────────── */
.drop-zone {
  border: 2px dashed var(--color-border-strong);
  border-radius: var(--card-radius, 22px);
  background: var(--color-bg-surface);
  cursor: pointer;
  transition: all 0.2s var(--ease-smooth);
  margin-bottom: 20px;
  box-shadow: var(--card-shadow);
}

.drop-zone--drag,
.drop-zone:has(label:hover) {
  border-color: var(--color-coral-primary);
  background: var(--color-coral-subtle);
}

.drop-zone--has-file {
  border-color: var(--color-accent-green);
  background: var(--color-accent-green-subtle);
}

.drop-zone__label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 44px 20px;
  cursor: pointer;
  text-align: center;
}

.drop-zone__icon {
  color: var(--color-coral-primary);
}

.drop-zone__hint {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
}

.drop-zone__hint strong {
  color: var(--color-coral-primary);
}

.drop-zone__ext {
  display: block;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin-top: 4px;
}

.drop-zone__file-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: var(--text-base);
  color: var(--color-accent-green);
}

.drop-zone__file-icon {
  font-size: 1.4rem;
}

.drop-zone__file-size {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-weight: 500;
}

/* Alerts */
.alert {
  padding: 12px 18px;
  border-radius: 12px;
  margin-bottom: 16px;
  font-size: var(--text-sm);
  font-weight: 600;
}

.alert--error {
  background: var(--color-trend-up-bg);
  color: var(--color-trend-up);
  border: 1px solid var(--color-trend-up-border);
}

.alert--success {
  background: var(--color-accent-green-subtle);
  color: var(--color-accent-green);
  border: 1px solid var(--color-trend-down-border);
}

/* ── Upload Button ───────────────────────────────────────────────────────── */
.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0 28px;
  background: var(--color-coral-gradient);
  color: #fff;
  border: none;
  border-radius: 9999px;
  font-size: var(--text-base);
  font-weight: 700;
  font-family: var(--font-body);
  cursor: pointer;
  box-shadow: var(--color-coral-glow);
  transition:
    transform 0.18s var(--ease-spring),
    box-shadow 0.18s ease;
  margin-bottom: 32px;
}

.upload-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(244, 68, 46, 0.35);
}

.upload-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
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
  margin-bottom: 16px;
  color: var(--color-text-primary);
}

.revisions-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
  background: var(--color-bg-surface);
  border-radius: var(--card-radius, 22px);
  overflow: hidden;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--color-border-subtle);
}

.revisions-table th {
  text-align: left;
  background: var(--color-bg-canvas);
  padding: 14px 18px;
  color: var(--color-text-muted);
  font-weight: 600;
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1.5px solid var(--color-border-subtle);
}

.revisions-table td {
  padding: 14px 18px;
  border-bottom: 1px solid var(--color-border-subtle);
  color: var(--color-text-primary);
  vertical-align: middle;
}

.revisions-table tr:hover td {
  background-color: var(--color-bg-subtle);
}

.revisions-table tr:last-child td {
  border-bottom: none;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: var(--text-xs);
  font-weight: 700;
}

.badge--warn {
  background: var(--color-coral-subtle);
  color: var(--color-coral-primary);
  border: 1px solid var(--color-coral-border);
}

.badge--ok {
  background: var(--color-accent-green-subtle);
  color: var(--color-accent-green);
}

.undo-btn {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-trend-up-border);
  color: var(--color-trend-up);
  border-radius: 9999px;
  font-size: var(--text-xs);
  font-weight: 700;
  padding: 5px 14px;
  cursor: pointer;
  transition: all 0.15s ease;
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
