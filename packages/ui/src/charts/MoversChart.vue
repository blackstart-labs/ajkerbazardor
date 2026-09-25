<script setup lang="ts">
import { ref, computed } from 'vue';
import './echarts-setup.js';
import VChart from 'vue-echarts';
import { formatTakaDelta, formatChangePct } from '@ajkerbazardor/shared';
import DataGrid from '../primitives/DataGrid.vue';
import Skeleton from '../primitives/Skeleton.vue';
import EmptyState from '../primitives/EmptyState.vue';
import Button from '../primitives/Button.vue';

export interface MoverItem {
  id: number;
  slug: string;
  nameBn: string;
  delta: number | null;
  changePct: number | null;
}

export interface MoversChartProps {
  risers: MoverItem[];
  fallers: MoverItem[];
  period?: 'day' | 'week' | 'month';
  loading?: boolean;
}

const props = withDefaults(defineProps<MoversChartProps>(), {
  period: 'day',
  loading: false,
});

const emit = defineEmits<{
  (e: 'period-change', period: 'day' | 'week' | 'month'): void;
}>();

const showTable = ref(false);

const periodLabel = computed(() => {
  if (props.period === 'day') return 'আজকের';
  if (props.period === 'week') return 'গত সপ্তাহের তুলনায়';
  return 'গত মাসের তুলনায়';
});

const chartOption = computed(() => {
  // Combine fallers (negative) and risers (positive)
  const combined = [
    ...props.fallers.map((f) => ({ ...f, val: f.changePct ?? 0, type: 'faller' })),
    ...props.risers.map((r) => ({ ...r, val: r.changePct ?? 0, type: 'riser' })),
  ].sort((a, b) => a.val - b.val);

  const names = combined.map((c) => c.nameBn);
  const values = combined.map((c) => ({
    value: c.val,
    itemStyle: {
      color: c.val > 0 ? '#B91C1C' : '#15803D',
    },
  }));

  return {
    animation: true,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#FFFFFF',
      borderColor: '#E7E0D8',
      textStyle: { color: '#1C1917', fontFamily: 'Hind Siliguri, sans-serif' },
      formatter: (params: Array<{ name: string; value: number }>) => {
        const [first] = params;
        if (!first) return '';
        const item = combined.find((c) => c.nameBn === first.name);
        if (!item) return '';
        const sign = item.delta && item.delta > 0 ? '+' : '';
        return `
          <div style="font-weight:600;">${item.nameBn}</div>
          <div>পরিবর্তন: <b>${formatChangePct(item.changePct)}</b> (${sign}${formatTakaDelta(item.delta)})</div>
        `;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '5%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        color: '#78716C',
        formatter: (val: number) => `${val > 0 ? '+' : ''}${val}%`,
      },
      splitLine: { lineStyle: { color: '#F4EFEB' } },
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        color: '#1C1917',
        fontFamily: 'Hind Siliguri, sans-serif',
      },
      axisLine: { lineStyle: { color: '#E7E0D8' } },
    },
    series: [
      {
        name: 'শতাংশ পরিবর্তন',
        type: 'bar',
        data: values,
        barMaxWidth: 16,
        itemStyle: { borderRadius: 4 },
      },
    ],
  };
});

const tableData = computed(() => {
  return [
    ...props.risers.map((r) => ({ ...r, category: 'বৃদ্ধি' })),
    ...props.fallers.map((f) => ({ ...f, category: 'হ্রাস' })),
  ];
});

const tableColumns = [
  { key: 'category', label: 'ধরণ' },
  { key: 'nameBn', label: 'পণ্য' },
  { key: 'delta', label: 'টাকায় তারতম্য', formatter: (row: unknown) => formatTakaDelta((row as MoverItem).delta) },
  { key: 'changePct', label: 'শতাংশ', formatter: (row: unknown) => formatChangePct((row as MoverItem).changePct) },
];
</script>

<template>
  <div class="ui-chart-card">
    <div class="ui-chart-card__header">
      <div class="ui-chart-card__takeaway">
        <p class="ui-chart-takeaway-text">কোনটা কতটা বদলাল (শীর্ষ হ্রাস ও বৃদ্ধি)</p>
        <span class="ui-chart-sub">{{ periodLabel }} দর পরিবর্তনের শীর্ষে থাকা পণ্যসমূহ</span>
      </div>

      <div class="ui-chart-card__actions">
        <!-- Period Toggles -->
        <div class="ui-chart-range-group">
          <button
            type="button"
            class="ui-range-btn"
            :class="{ 'ui-range-btn--active': period === 'day' }"
            @click="emit('period-change', 'day')"
          >
            ১ দিন
          </button>
          <button
            type="button"
            class="ui-range-btn"
            :class="{ 'ui-range-btn--active': period === 'week' }"
            @click="emit('period-change', 'week')"
          >
            ১ সপ্তাহ
          </button>
          <button
            type="button"
            class="ui-range-btn"
            :class="{ 'ui-range-btn--active': period === 'month' }"
            @click="emit('period-change', 'month')"
          >
            ১ মাস
          </button>
        </div>

        <Button variant="outline" size="sm" :aria-pressed="showTable" @click="showTable = !showTable">
          {{ showTable ? 'চার্ট দেখুন' : 'টেবিল দেখুন' }}
        </Button>
      </div>
    </div>

    <div class="ui-chart-card__body">
      <Skeleton v-if="loading" variant="rect" height="300px" />

      <EmptyState
        v-else-if="risers.length === 0 && fallers.length === 0"
        title="কোনো পরিবর্তন মেলেনি"
        description="নির্বাচিত সময়কালে কোনো পণ্যের মূল্যে উল্লেখযোগ্য পরিবর্তন হয়নি।"
      />

      <div v-else-if="showTable" class="ui-chart-table-wrap">
        <DataGrid :columns="tableColumns" :data="tableData" caption="শীর্ষ পরিবর্তনশীল পণ্যের তালিকা" />
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
  padding: 0.25rem 0.625rem;
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
  min-height: 300px;
}

.ui-chart-container {
  width: 100%;
  height: 300px;
}

.ui-echarts {
  width: 100%;
  height: 100%;
}
</style>
