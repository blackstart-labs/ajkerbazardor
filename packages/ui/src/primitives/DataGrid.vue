<script setup lang="ts">
export interface Column {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right' | undefined;
  width?: string | undefined;
  formatter?: ((row: unknown) => string | number) | undefined;
}

export interface DataGridProps {
  columns: Column[];
  data: unknown[];
  caption?: string | undefined;
}

defineProps<DataGridProps>();

function getVal(row: unknown, key: string): unknown {
  if (typeof row === 'object' && row !== null) {
    return (row as Record<string, unknown>)[key];
  }
  return undefined;
}
</script>

<template>
  <div class="ui-data-grid-wrapper">
    <table class="ui-data-grid">
      <caption v-if="caption" class="ui-data-grid__caption">
        {{
          caption
        }}
      </caption>
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :style="{ textAlign: col.align || 'left', width: col.width }"
            scope="col"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in data" :key="idx">
          <td v-for="col in columns" :key="col.key" :style="{ textAlign: col.align || 'left' }">
            <slot :name="col.key" :row="row" :value="getVal(row, col.key)">
              {{ col.formatter ? col.formatter(row) : getVal(row, col.key) }}
            </slot>
          </td>
        </tr>
        <tr v-if="data.length === 0">
          <td :colspan="columns.length" class="ui-data-grid__empty">
            <slot name="empty"> কোনো তথ্য পাওয়া যায়নি। </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.ui-data-grid-wrapper {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--color-border-subtle, #e7e0d8);
  border-radius: var(--radius-lg, 14px);
  background-color: var(--color-bg-surface, #ffffff);
}

.ui-data-grid {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-body);
  font-size: var(--text-sm, 0.875rem);
  text-align: left;
}

.ui-data-grid__caption {
  font-family: var(--font-heading);
  font-weight: 600;
  padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
  text-align: left;
  border-bottom: 1px solid var(--color-border-subtle, #e7e0d8);
}

th {
  background-color: var(--color-bg-subtle, #f4efeb);
  color: var(--color-text-secondary, #57534e);
  font-weight: 600;
  padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
  border-bottom: 1px solid var(--color-border-subtle, #e7e0d8);
  white-space: nowrap;
}

td {
  padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
  border-bottom: 1px solid var(--color-border-subtle, #e7e0d8);
  color: var(--color-text-primary, #1c1917);
  line-height: var(--leading-normal, 1.6);
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr:hover {
  background-color: var(--color-bg-subtle, #f4efeb);
}

.ui-data-grid__empty {
  text-align: center;
  color: var(--color-text-muted, #78716c);
  padding: var(--space-8, 2rem) var(--space-4, 1rem);
}
</style>
