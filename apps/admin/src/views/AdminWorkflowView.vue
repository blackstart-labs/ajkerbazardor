<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute();
interface WorkflowConfig {
  title: string;
  subtitle: string;
  cards: string[];
}

const fallbackConfig: WorkflowConfig = {
  title: 'System',
  subtitle: 'Environment, publishing status, deploy notes এবং rollback checklist।',
  cards: ['Production', 'Staging', 'Turso DB', 'Rollback'],
};

const config = computed<WorkflowConfig>(() => {
  const name = String(route.name ?? 'System');
  const map: Record<string, WorkflowConfig> = {
    Imports: {
      title: 'Import History',
      subtitle: 'ফাইল, বুলেটিন তারিখ, স্ট্যাটাস ও আপলোডকারী দেখার অপারেশনাল টেবিল।',
      cards: ['Processing', 'Validated', 'Published', 'Failed'],
    },
    PriceData: {
      title: 'Manual Price Editor',
      subtitle: 'Product, market, date, price, source এবং notes সহ manual correction workflow।',
      cards: ['Imported source', 'Manual edits', 'Audit trail', 'Publish queue'],
    },
    Markets: {
      title: 'Market Management',
      subtitle: 'পাঁচটি প্রাথমিক বাজার, display order এবং active status ম্যানেজ করুন।',
      cards: ['Mirpur-6', 'Mohammadpur Town Hall', 'New Market', 'Rampura', 'Mohakhali'],
    },
    Validation: {
      title: 'Data Quality Dashboard',
      subtitle: 'Missing prices, jumps, duplicates, unknown products এবং invalid units পর্যবেক্ষণ।',
      cards: ['Missing prices', 'Unexpected jumps', 'Duplicate products', 'Unknown products'],
    },
    Settings: fallbackConfig,
  };
  return map[name] ?? fallbackConfig;
});
</script>
<template>
  <div>
    <header class="head">
      <p>Admin workflow</p>
      <h2>{{ config.title }}</h2>
      <span>{{ config.subtitle }}</span>
    </header>
    <section class="cards">
      <article v-for="card in config.cards" :key="card">
        <strong>{{ card }}</strong
        ><span>Ready for connected workflow</span>
      </article>
    </section>
    <section class="panel">
      <h3>Next operational step</h3>
      <p>
        এই স্ক্রিনটি production workflow-এর জন্য সংরক্ষিত। Backend entity/API যুক্ত হলে এখানেই full edit/validation
        table বসবে।
      </p>
    </section>
  </div>
</template>
<style scoped>
.head p {
  color: var(--color-brand-primary);
  font-weight: 900;
}
.head h2 {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  margin: 0.2rem 0;
}
.head span {
  color: var(--color-text-muted);
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}
.cards article,
.panel {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: 1rem;
  box-shadow: var(--shadow-card);
}
.cards strong,
.cards span {
  display: block;
}
.cards span {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  margin-top: 0.35rem;
}
.panel h3 {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
}
</style>
