<script setup lang="ts">
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

const api = useApi();
const { data, pending, error, refresh } = await useAsyncData('public-analytics-report', async () => {
  const res = await api.get<{ ok: boolean; data: AnalyticsReport }>('/dashboard/analytics-report');
  return res.data;
});
useHead({ title: 'বাজার বিশ্লেষণ — আজকের বাজারদর' });
</script>

<template>
  <div>
    <SiteHeader />
    <main class="page">
      <header class="head">
        <p>বাস্তব ডেটা বিশ্লেষণ</p>
        <h1>বাজার বিশ্লেষণ</h1>
        <span>প্রকাশিত TCB বুলেটিনের actual price entries থেকে তৈরি বাংলা রিপোর্ট।</span>
      </header>

      <div v-if="pending" class="state">রিপোর্ট লোড হচ্ছে…</div>
      <div v-else-if="error" class="state state--error">
        <strong>রিপোর্ট লোড করা যাচ্ছে না।</strong>
        <button type="button" @click="refresh()">আবার চেষ্টা করুন</button>
      </div>

      <template v-else-if="data">
        <section class="panel hero-report">
          <p class="date">{{ data.reportDate }}</p>
          <h2>{{ data.titleBn }}</h2>
          <p>{{ data.executiveSummaryBn }}</p>
        </section>

        <section class="metrics" aria-label="মূল সূচক">
          <article>
            <span>পণ্য</span><strong>{{ data.marketCoverage.productCount }}</strong>
          </article>
          <article>
            <span>বাজার</span><strong>{{ data.marketCoverage.marketCount }}</strong>
          </article>
          <article class="up">
            <span>দাম বেড়েছে</span><strong>↑ {{ data.movement.upCount }}</strong>
          </article>
          <article class="down">
            <span>দাম কমেছে</span><strong>↓ {{ data.movement.downCount }}</strong>
          </article>
          <article>
            <span>অপরিবর্তিত</span><strong>— {{ data.movement.sameCount }}</strong>
          </article>
          <article>
            <span>গড় পরিবর্তন</span><strong>{{ data.movement.averageChangePct }}%</strong>
          </article>
        </section>

        <section class="grid">
          <article class="panel">
            <h2>মূল পর্যবেক্ষণ</h2>
            <ul>
              <li v-for="finding in data.keyFindingsBn" :key="finding">{{ finding }}</li>
            </ul>
          </article>
          <article class="panel">
            <h2>ডেটা থেকে পাঠ</h2>
            <p>{{ data.analysisBn.marketMood }}</p>
            <p v-if="data.analysisBn.strongestCategory">
              উচ্চ গড়দামের ক্যাটাগরি: <strong>{{ data.analysisBn.strongestCategory }}</strong>
            </p>
            <p v-if="data.analysisBn.weakestDataCategory">
              ডেটা ঘাটতি বেশি: <strong>{{ data.analysisBn.weakestDataCategory }}</strong>
            </p>
            <p class="muted">{{ data.analysisBn.volatilityNote }}</p>
          </article>
        </section>

        <section class="grid">
          <article class="panel">
            <h2>সাম্প্রতিক গড়দামের ট্রেন্ড</h2>
            <div class="trend-list">
              <div v-for="point in data.historicalTrend" :key="point.date">
                <span>{{ point.date }}</span>
                <strong>{{ point.averageMid ?? '—' }}</strong>
              </div>
            </div>
          </article>
          <article class="panel">
            <h2>ডেটা কোয়ালিটি</h2>
            <p>
              অনুপস্থিত বর্তমান দাম: <strong>{{ data.dataQuality.missingCurrentPrices }}</strong>
            </p>
            <p>
              রিভিউ প্রয়োজন: <strong>{{ data.dataQuality.productsNeedingReview }}</strong>
            </p>
            <p class="muted">{{ data.dataQuality.sparseHistoryNoteBn }}</p>
          </article>
        </section>

        <section class="panel">
          <h2>ক্যাটাগরি ব্রেকডাউন</h2>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ক্যাটাগরি</th>
                  <th>পণ্য</th>
                  <th>ডেটা আছে</th>
                  <th>অনুপস্থিত</th>
                  <th>গড় দাম</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cat in data.categoryBreakdown" :key="cat.categorySlug">
                  <td>{{ cat.categoryNameBn }}</td>
                  <td>{{ cat.productCount }}</td>
                  <td>{{ cat.availableCount }}</td>
                  <td>{{ cat.missingCount }}</td>
                  <td>{{ cat.averageMid ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

<style scoped>
.page {
  max-width: 1180px;
  margin: auto;
  padding: 2rem 1rem;
}
.head p {
  color: var(--color-brand-primary);
  font-weight: 900;
}
.head h1 {
  font-family: var(--font-heading);
  font-size: clamp(2.5rem, 6vw, 5rem);
  margin: 0.2rem 0;
}
.head span,
.muted {
  color: var(--color-text-muted);
}
.panel {
  background: white;
  border: 1px solid var(--color-border-subtle);
  border-radius: 24px;
  padding: 1.25rem;
  box-shadow: var(--shadow-card);
  margin-top: 1rem;
}
.hero-report {
  background: #fef3c7;
}
.date {
  color: var(--color-brand-primary);
  font-weight: 900;
}
.panel h2 {
  font-family: var(--font-heading);
  font-size: 1.8rem;
}
.metrics {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.75rem;
  margin: 1rem 0;
}
.metrics article {
  background: white;
  border: 1px solid var(--color-border-subtle);
  border-radius: 18px;
  padding: 1rem;
}
.metrics span {
  display: block;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}
.metrics strong {
  display: block;
  font-size: 1.6rem;
}
.up strong {
  color: var(--color-trend-up);
}
.down strong {
  color: var(--color-trend-down);
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.trend-list {
  display: grid;
  gap: 0.35rem;
}
.trend-list div {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border-subtle);
  padding: 0.5rem 0;
}
.table-wrap {
  overflow: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  text-align: left;
  padding: 0.75rem;
  border-bottom: 1px solid var(--color-border-subtle);
}
th {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}
.state {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  margin-top: 1rem;
}
.state--error {
  background: #fff1f2;
  color: #7f1d1d;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}
.state button {
  border: 0;
  background: var(--color-brand-primary);
  color: white;
  border-radius: 999px;
  padding: 0.6rem 1rem;
  font-weight: 900;
}
@media (max-width: 850px) {
  .metrics {
    grid-template-columns: repeat(2, 1fr);
  }
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
