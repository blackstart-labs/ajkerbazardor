<script setup lang="ts">
import { ref, computed } from 'vue';
import './echarts-setup.js';
import VChart from 'vue-echarts';
import { formatTaka, formatBnDate, formatBnInt } from '@ajkerbazardor/shared';
import DataGrid from '../primitives/DataGrid.vue';
import Skeleton from '../primitives/Skeleton.vue';
import EmptyState from '../primitives/EmptyState.vue';
import Button from '../primitives/Button.vue';

export interface PriceHistoryPoint {
  date: string;
  min: number | null;
  max: number | null;
  mid: number | null;
}

export interface PriceHistoryChartProps {
  data: PriceHistoryPoint[];
  loading?: boolean;
  takeaway?: string | undefined;
  activeRange?: string;
}

const props = withDefaults(defineProps<PriceHistoryChartProps>(), {
  loading: false,
  activeRange: '30d',
});

const emit = defineEmits<{
  (e: 'range-change', range: string): void;
}>();

const showTable = ref(false);

const validPoints = computed(() => {
  return props.data.filter((d) => d.mid !== null);
});

const defaultTakeaway = computed(() => {
  if (props.takeaway) return props.takeaway;
  if (validPoints.value.length < 2) return 'পর্যবেক্ষণ করার মতো পর্যাপ্ত তথ্য নেই।';

  const mids = validPoints.value.map((d) => d.mid as number);
  const min = Math.min(...mids);
  const max = Math.max(...mids);
  return `গত ${formatBnInt(props.data.length)} দিনে ${formatTaka(min)} থেকে ${formatTaka(max)}-এর মধ্যেই ঘুরেছে।`;
});

const chartOption = computed(() => {
  const dates = props.data.map((d) => d.date);
  const minPrices = props.data.map((d) => d.min ?? d.mid);
  const maxPrices = props.data.map((d) => d.max ?? d.mid);
  const midPrices = props.data.map((d) => d.mid);

  return {
    animation: true,
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#FFFFFF',
      borderColor: '#E7E0D8',
      textStyle: { color: '#1C1917', fontFamily: 'Hind Siliguri, sans-serif' },
      formatter: (params: Array<{ axisValue: string; value: number; seriesName: string }>) => {
        const [first] = params;
        if (!first) return '';
        const d = props.data.find((p) => p.date === first.axisValue);
        if (!d) return '';
        return `
          <div style="font-weight:600;margin-bottom:4px;">${formatBnDate(d.date)}</div>
          <div>সর্বনিম্ন: <b>${formatTaka(d.min)}</b></div>
          <div>সর্বোচ্চ: <b>${formatTaka(d.max)}</b></div>
          <div>গড়: <b>${formatTaka(d.mid)}</b></div>
        `;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '12%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        color: '#78716C',
        formatter: (val: string) => val.slice(5), // MM-DD
      },
      axisLine: { lineStyle: { color: '#E7E0D8' } },
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLabel: {
        color: '#78716C',
        formatter: (val: number) => formatTaka(val),
      },
      splitLine: { lineStyle: { color: '#F4EFEB', type: 'dashed' } },
    },
    series: [
      // Lower min bound (transparent)
      {
        name: 'Min',
        type: 'line',
        data: minPrices,
        lineStyle: { opacity: 0 },
        stack: 'confidence-band',
        symbol: 'none',
      },
      // Band height (max - min)
      {
        name: 'Band',
        type: 'line',
        data: maxPrices.map((max, idx) =>
          max !== null && minPrices[idx] !== null ? (max as number) - (minPrices[idx] as number) : 0,
        ),
        lineStyle: { opacity: 0 },
        areaStyle: { color: 'rgba(217, 119, 6, 0.12)' },
        stack: 'confidence-band',
        symbol: 'none',
      },
      // Middle average line
      {
        name: 'গড় দাম',
        type: 'line',
        data: midPrices,
        itemStyle: { color: '#D97706' },
        lineStyle: { width: 2.5 },
        symbol: 'circle',
        symbolSize: 4,
      },
    ],
  };
});

const tableColumns = [
  { key: 'date', label: 'তারিখ', formatter: (row: unknown) => formatBnDate((row as PriceHistoryPoint).date) },
  { key: 'min', label: 'সর্বনিম্ন', formatter: (row: unknown) => formatTaka((row as PriceHistoryPoint).min) },
  { key: 'max', label: 'সর্বোচ্চ', formatter: (row: unknown) => formatTaka((row as PriceHistoryPoint).max) },
  { key: 'mid', label: 'গড় দাম', formatter: (row: unknown) => formatTaka((row as PriceHistoryPoint).mid) },
];
</script>

<template>
  <div class="ui-chart-card">
    <div class="ui-chart-card__header">
      <div class="ui-chart-card__takeaway">
        <p class="ui-chart-takeaway-text">{{ defaultTakeaway }}</p>
      </div>

      <div class="ui-chart-card__actions">
        <!-- Range Selectors -->
        <div class="ui-chart-range-group">
          <button
            v-for="r in ['7d', '30d', '90d', '1y', 'all']"
            :key="r"
            type="button"
            class="ui-range-btn"
            :class="{ 'ui-range-btn--active': activeRange === r }"
            @click="emit('range-change', r)"
          >
            {{ r }}
          </button>
        </div>

        <!-- Table View Toggle -->
        <Button variant="outline" size="sm" :aria-pressed="showTable" @click="showTable = !showTable">
          {{ showTable ? 'চার্ট দেখুন' : 'টেবিল দেখুন' }}
        </Button>
      </div>
    </div>

    <!-- Content area -->
    <div class="ui-chart-card__body">
      <Skeleton v-if="loading" variant="rect" height="260px" />

      <EmptyState
        v-else-if="validPoints.length === 0"
        title="কোনো হিস্ট্রি পাওয়া যায়নি"
        description="এই পণ্যটির জন্য নির্বাচিত সময়ের কোনো তথ্যের রেকর্ড নেই।"
      />

      <div v-else-if="showTable" class="ui-chart-table-wrap">
        <DataGrid :columns="tableColumns" :data="data" caption="দৈনিক বাজারদরের ইতিহাস" />
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
  line-height: var(--leading-normal, 1.6);
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
  min-height: 260px;
  position: relative;
}

.ui-chart-container {
  width: 100%;
  height: 260px;
}

.ui-echarts {
  width: 100%;
  height: 100%;
}

.ui-chart-table-wrap {
  max-height: 260px;
  overflow-y: auto;
}
</style>
