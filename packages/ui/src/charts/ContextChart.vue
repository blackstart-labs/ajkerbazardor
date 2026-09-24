<script setup lang="ts">
import { ref, computed } from 'vue';
import './echarts-setup.js';
import VChart from 'vue-echarts';
import { formatTaka } from '@ajkerbazardor/shared';
import DataGrid from '../primitives/DataGrid.vue';
import Skeleton from '../primitives/Skeleton.vue';
import Button from '../primitives/Button.vue';

export interface ContextPoint {
  label: string; // 'আজ' | '১ সপ্তাহ আগে' | '১ মাস আগে' | '১ বছর আগে'
  date: string | null;
  min: number | null;
  max: number | null;
  mid: number | null;
}

export interface ContextChartProps {
  points: ContextPoint[];
  loading?: boolean;
}

const props = withDefaults(defineProps<ContextChartProps>(), {
  loading: false,
});

const showTable = ref(false);

const chartOption = computed(() => {
  const categories = props.points.map((p) => p.label);
  const midValues = props.points.map((p) => p.mid);

  return {
    animation: true,
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#FFFFFF',
      borderColor: '#E7E0D8',
      textStyle: { color: '#1C1917', fontFamily: 'Hind Siliguri, sans-serif' },
      formatter: (params: Array<{ axisValue: string; value: number }>) => {
        const [first] = params;
        if (!first) return '';
        const pt = props.points.find((p) => p.label === first.axisValue);
        if (!pt) return '';
        return `
          <div style="font-weight:600;margin-bottom:4px;">${pt.label} (${pt.date ?? 'তারিখ অপ্রাপ্য'})</div>
          <div>সর্বনিম্ন: <b>${formatTaka(pt.min)}</b></div>
          <div>সর্বোচ্চ: <b>${formatTaka(pt.max)}</b></div>
          <div>গড়: <b>${formatTaka(pt.mid)}</b></div>
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
      data: categories,
      axisLabel: {
        color: '#57534E',
        fontFamily: 'Hind Siliguri, sans-serif',
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
      {
        name: 'ঐতিহাসিক তুলনা (TCB রিপোর্টকৃত)',
        type: 'line',
        data: midValues,
        itemStyle: { color: '#D97706' },
        lineStyle: {
          width: 2,
          type: 'dashed', // Dashed line to mark "reported by source"
        },
        symbol: 'circle',
        symbolSize: 8,
      },
    ],
  };
});

const tableColumns = [
  { key: 'label', label: 'সময়কাল' },
  { key: 'date', label: 'তারিখ', formatter: (row: unknown) => (row as ContextPoint).date ?? '—' },
  { key: 'min', label: 'সর্বনিম্ন', formatter: (row: unknown) => formatTaka((row as ContextPoint).min) },
  { key: 'max', label: 'সর্বোচ্চ', formatter: (row: unknown) => formatTaka((row as ContextPoint).max) },
  { key: 'mid', label: 'গড় দাম', formatter: (row: unknown) => formatTaka((row as ContextPoint).mid) },
];
</script>

<template>
  <div class="ui-chart-card">
    <div class="ui-chart-card__header">
      <div class="ui-chart-card__takeaway">
        <p class="ui-chart-takeaway-text">বুলেটিন সোর্স তুলনা (আজ, ১ সপ্তাহ, ১ মাস ও ১ বছর)</p>
        <span class="ui-chart-sub">ড্যাশ লাইন দিয়ে TCB বুলেটিনে রিপোর্টকৃত ঐতিহাসিক ডেটা নির্দেশ করা হয়েছে।</span>
      </div>

      <div class="ui-chart-card__actions">
        <Button variant="outline" size="sm" :aria-pressed="showTable" @click="showTable = !showTable">
          {{ showTable ? 'চার্ট দেখুন' : 'টেবিল দেখুন' }}
        </Button>
      </div>
    </div>

    <div class="ui-chart-card__body">
      <Skeleton v-if="loading" variant="rect" height="220px" />

      <div v-else-if="showTable" class="ui-chart-table-wrap">
        <DataGrid :columns="tableColumns" :data="points" caption="বুলেটিনের ৪-বিন্দু ঐতিহাসিক তুলনা" />
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
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2, 0.5rem);
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

.ui-chart-card__body {
  min-height: 220px;
}

.ui-chart-container {
  width: 100%;
  height: 220px;
}

.ui-echarts {
  width: 100%;
  height: 100%;
}
</style>
