<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiGet } from '../api/client';

interface AnalyticsReport {
  reportDate: string;
  titleBn: string;
  executiveSummaryBn: string;
  keyFindingsBn: string[];
  marketCoverage: { marketCount: number; productCount: number; markets: string[] };
  movement: {
    upCount: number;
    downCount: number;
    sameCount: number;
    shareUp: number;
    shareDown: number;
    shareSame: number;
    averageChangePct: number;
  };
  categoryBreakdown: Array<{
    categorySlug: string;
    categoryNameBn: string;
    productCount: number;
    availableCount: number;
    missingCount: number;
    averageMid: number | null;
  }>;
  historicalTrend: Array<{ date: string; averageMid: number | null; availableCount: number }>;
  analysisBn: {
    marketMood: string;
    strongestCategory: string | null;
    weakestDataCategory: string | null;
    volatilityNote: string;
  };
  dataQuality: { missingCurrentPrices: number; productsNeedingReview: number; sparseHistoryNoteBn: string };
}

const report = ref<AnalyticsReport | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

async function loadReport() {
  loading.value = true;
  error.value = null;
  try {
    const res = await apiGet<{ ok: boolean; data: AnalyticsReport }>('/dashboard/analytics-report');
    report.value = res.data;
  } catch {
    error.value = 'অ্যানালিটিক্স রিপোর্ট লোড করা যায়নি।';
  } finally {
    loading.value = false;
  }
}

onMounted(loadReport);
</script>

<template>
  <div class="analytics-admin">
    <header class="page-head">
      <p>Operational analytics</p>
      <h2>বাংলা বাজার রিপোর্ট</h2>
      <span>পাবলিক রিপোর্টের সঙ্গে একই ডেটা, কিন্তু অ্যাডমিন কোয়ালিটি সিগন্যালসহ।</span>
    </header>

    <div v-if="loading" class="panel">রিপোর্ট লোড হচ্ছে…</div>
    <div v-else-if="error" class="alert alert--error" role="alert">
      {{ error }} <button type="button" @click="loadReport">আবার চেষ্টা করুন</button>
    </div>

    <template v-else-if="report">
      <section class="panel panel--hero">
        <span class="date">{{ report.reportDate }}</span>
        <h3>{{ report.titleBn }}</h3>
        <p>{{ report.executiveSummaryBn }}</p>
      </section>

      <section class="stat-grid">
        <article>
          <span>Products</span><strong>{{ report.marketCoverage.productCount }}</strong>
        </article>
        <article>
          <span>Markets</span><strong>{{ report.marketCoverage.marketCount }}</strong>
        </article>
        <article class="up">
          <span>Up</span><strong>↑ {{ report.movement.upCount }}</strong>
        </article>
        <article class="down">
          <span>Down</span><strong>↓ {{ report.movement.downCount }}</strong>
        </article>
        <article>
          <span>Missing prices</span><strong>{{ report.dataQuality.missingCurrentPrices }}</strong>
        </article>
        <article>
          <span>Needs review</span><strong>{{ report.dataQuality.productsNeedingReview }}</strong>
        </article>
      </section>

      <section class="panel">
        <h3>Real data analysis</h3>
        <p>{{ report.analysisBn.marketMood }}</p>
        <p v-if="report.analysisBn.strongestCategory">
          Highest average category: <strong>{{ report.analysisBn.strongestCategory }}</strong>
        </p>
        <p v-if="report.analysisBn.weakestDataCategory">
          Weakest data category: <strong>{{ report.analysisBn.weakestDataCategory }}</strong>
        </p>
        <p class="muted">{{ report.analysisBn.volatilityNote }}</p>
      </section>

      <section class="panel">
        <h3>Key findings</h3>
        <ul>
          <li v-for="finding in report.keyFindingsBn" :key="finding">{{ finding }}</li>
        </ul>
      </section>

      <section class="panel">
        <h3>Recent average trend</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Average mid</th>
              <th>Available products</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="point in report.historicalTrend" :key="point.date">
              <td>{{ point.date }}</td>
              <td>{{ point.averageMid ?? '—' }}</td>
              <td>{{ point.availableCount }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="panel">
        <h3>Category quality table</h3>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Total</th>
              <th>Available</th>
              <th>Missing</th>
              <th>Average mid</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in report.categoryBreakdown" :key="cat.categorySlug">
              <td>{{ cat.categoryNameBn }}</td>
              <td>{{ cat.productCount }}</td>
              <td>{{ cat.availableCount }}</td>
              <td>{{ cat.missingCount }}</td>
              <td>{{ cat.averageMid ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>

<style scoped>
.page-head p {
  color: var(--color-brand-primary);
  font-weight: 900;
}
.page-head h2 {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  margin: 0.2rem 0;
}
.page-head span,
.muted {
  color: var(--color-text-muted);
}
.panel {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-card);
  margin-top: var(--space-4);
}
.panel--hero {
  background: var(--color-brand-subtle);
}
.panel h3 {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  margin-bottom: var(--space-2);
}
.date {
  color: var(--color-brand-primary);
  font-weight: 900;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-3);
  margin: var(--space-4) 0;
}
.stat-grid article {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-card);
}
.stat-grid span {
  display: block;
  color: var(--color-text-muted);
  font-size: var(--text-xs);
}
.stat-grid strong {
  font-size: var(--text-2xl);
}
.up strong {
  color: var(--color-trend-up);
}
.down strong {
  color: var(--color-trend-down);
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  text-align: left;
  padding: var(--space-2);
  border-bottom: 1px solid var(--color-border-subtle);
}
th {
  color: var(--color-text-muted);
}
.alert--error {
  background: var(--color-trend-up-bg);
  color: var(--color-trend-up-text);
  border: 1px solid var(--color-trend-up-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  margin-top: var(--space-4);
}
.alert button {
  margin-left: var(--space-2);
  border: 0;
  border-radius: var(--radius-full);
  background: var(--color-brand-primary);
  color: white;
  padding: 0.35rem 0.75rem;
  font-weight: 700;
}
</style>
