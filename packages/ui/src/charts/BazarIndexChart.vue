<script setup lang="ts">
import { ref, computed } from 'vue';
import './echarts-setup.js';
import VChart from 'vue-echarts';
import { formatBnDate } from '@ajkerbazardor/shared';
import DataGrid from '../primitives/DataGrid.vue';
import Skeleton from '../primitives/Skeleton.vue';
import EmptyState from '../primitives/EmptyState.vue';
import Button from '../primitives/Button.vue';

export interface CategoryIndexSeries {
  categorySlug: string;
  categoryNameBn: string;
  data: Array<{ date: string; index: number | null }>;
}

export interface BazarIndexChartProps {
  series: CategoryIndexSeries[];
  dates: string[];
  activeRange?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<BazarIndexChartProps>(), {
  activeRange: '30d',
  loading: false,
});

const emit = defineEmits<{
  (e: 'range-change', range: string): void;
}>();

const showTable = ref(false);

const PALETTE = ['#D97706', '#2563EB', '#059669', '#DC2626', '#7C3AED', '#DB2777', '#EA580C', '#4B5563'];

const chartOption = computed(() => {
  const chartSeries = props.series.map((s, idx) => ({
    name: s.categoryNameBn,
    type: 'line',
    data: s.data.map((d) => d.index),
    itemStyle: { color: PALETTE[idx % PALETTE.length] },
    lineStyle: { width: 2 },
    symbol: 'circle',
    symbolSize: 4,
  }));

  return {
    animation: true,
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#FFFFFF',
      borderColor: '#E7E0D8',
      textStyle: { color: '#1C1917', fontFamily: 'Hind Siliguri, sans-serif' },
      formatter: (params: Array<{ seriesName: string; value: number; axisValue: string; color: string }>) => {
        const [first] = params;
        if (!first) return '';
        const dateStr = formatBnDate(first.axisValue);
        const rows = params
          .map(
            (p) => `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin:2px 0;">
            <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px;"></span>${p.seriesName}</span>
            <b>${p.value !== null && p.value !== undefined ? p.value : '—'}</b>
          </div>
        `,
          )
          .join('');
        return `<div style="font-weight:600;margin-bottom:6px;">${dateStr} (Base: ১০০)</div>${rows}`;
      },
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#57534E', fontFamily: 'Hind Siliguri, sans-serif' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '8%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: props.dates,
      axisLabel: {
        color: '#78716C',
        formatter: (val: string) => val.slice(5),
      },
      axisLine: { lineStyle: { color: '#E7E0D8' } },
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLabel: {
        color: '#78716C',
      },
      splitLine: { lineStyle: { color: '#F4EFEB', type: 'dashed' } },
    },
    series: chartSeries,
  };
});

const tableColumns = computed(() => {
  const cols = [
    {
      key: 'date',
      label: 'তারিখ',
      formatter: (row: unknown) => formatBnDate(String((row as Record<string, unknown>).date)),
    },
  ];
  for (const s of props.series) {
    cols.push({
      key: s.categorySlug,
      label: s.categoryNameBn,
      formatter: (row: unknown) => String((row as Record<string, unknown>)[s.categorySlug] ?? '—'),
    });
  }
  return cols;
});

const tableData = computed(() => {
  return props.dates.map((d) => {
    const row: Record<string, unknown> = { date: d };
    for (const s of props.series) {
      const match = s.data.find((pt) => pt.date === d);
      row[s.categorySlug] = match?.index ?? null;
    }
    return row;
  });
});
</script>

<template>
  <div class="ui-chart-card">
    <div class="ui-chart-card__header">
      <div class="ui-chart-card__takeaway">
        <p class="ui-chart-takeaway-text">Bazar Index (ক্যাটাগরি ভিত্তিক মূল্য সূচক)</p>
        <span class="ui-chart-sub"> * এটি একটি সরল গড় সূচক (বেস: ১০০), কোনো সরকারি মূল্যস্ফীতির পরিসংখ্যান নয়। </span>
      </div>

      <div class="ui-chart-card__actions">
        <!-- Range Toggles -->
        <div class="ui-chart-range-group">
          <button
            v-for="r in ['7d', '30d', '90d', '1y']"
            :key="r"
            type="button"
            class="ui-range-btn"
            :class="{ 'ui-range-btn--active': activeRange === r }"
            @click="emit('range-change', r)"
          >
            {{ r }}
          </button>
        </div>

        <Button variant="outline" size="sm" :aria-pressed="showTable" @click="showTable = !showTable">
          {{ showTable ? 'চার্ট দেখুন' : 'টেবিল দেখুন' }}
        </Button>
      </div>
    </div>

    <div class="ui-chart-card__body">
      <Skeleton v-if="loading" variant="rect" height="320px" />

      <EmptyState
        v-else-if="series.length === 0"
        title="কোনো সূচক তথ্য নেই"
        description="নির্বাচিত সময়সীমার জন্য ক্যাটাগরি সূচক তৈরি করা সম্ভব হয়নি।"
      />

      <div v-else-if="showTable" class="ui-chart-table-wrap">
        <DataGrid :columns="tableColumns" :data="tableData" caption="ক্যাটাগরি ভিত্তিক বাজার সূচক ডেটা" />
      </div>

      <div v-else class="ui-chart-container">
        <VChart class="ui-echarts" :option="chartOption" autoresize />
      </div>
    </div>
  </div>
</template>

<style scoped>
.ui-chart-card {
  background-color: var(--color-bg-surface, #ffffff);
  border: 1px solid var(--color-border-subtle, #e7e0d8);
  border-radius: var(--radius-lg, 14px);
  padding: var(--space-4, 1rem);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 0.75rem);
}

.ui-chart-card__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 0.5rem);
}

@media (min-width: 640px) {
  .ui-chart-card__header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.ui-chart-takeaway-text {
  font-family: var(--font-body);
  font-size: var(--text-sm, 0.875rem);
  font-weight: 600;
  color: var(--color-text-primary, #1c1917);
  margin: 0;
}

.ui-chart-sub {
  font-family: var(--font-body);
  font-size: var(--text-xs, 0.75rem);
  color: var(--color-text-muted, #78716c);
}

.ui-chart-card__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2, 0.5rem);
}

.ui-chart-range-group {
  display: inline-flex;
  border: 1px solid var(--color-border-subtle, #e7e0d8);
  border-radius: var(--radius-sm, 6px);
  overflow: hidden;
}

.ui-range-btn {
  background: transparent;
  border: none;
  border-right: 1px solid var(--color-border-subtle, #e7e0d8);
  padding: 0.25rem 0.5rem;
  font-family: var(--font-body);
  font-size: var(--text-xs, 0.75rem);
  font-weight: 500;
  color: var(--color-text-secondary, #57534e);
  cursor: pointer;
  transition: all var(--duration-fast, 150ms);
}

.ui-range-btn:last-child {
  border-right: none;
}

.ui-range-btn--active {
  background-color: var(--color-brand-subtle, #fef3c7);
  color: var(--color-brand-ink, #78350f);
  font-weight: 600;
}

.ui-chart-card__body {
  min-height: 320px;
}

.ui-chart-container {
  width: 100%;
  height: 320px;
}

.ui-echarts {
  width: 100%;
  height: 100%;
}

.ui-chart-table-wrap {
  max-height: 320px;
  overflow-y: auto;
}
</style>
