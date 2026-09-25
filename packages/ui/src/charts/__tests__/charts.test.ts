import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PriceHistoryChart from '../PriceHistoryChart.vue';
import ContextChart from '../ContextChart.vue';
import MoversChart from '../MoversChart.vue';
import BazarIndexChart from '../BazarIndexChart.vue';
import DistributionChart from '../DistributionChart.vue';

// Mock vue-echarts component to avoid Canvas DOM dependencies in happy-dom
vi.mock('vue-echarts', () => ({
  default: {
    name: 'VChart',
    template: '<div class="mock-echarts" />',
    props: ['option'],
  },
}));

describe('Chart Wrappers', () => {
  describe('PriceHistoryChart', () => {
    const mockData = [
      { date: '2026-09-01', min: 100, max: 110, mid: 105 },
      { date: '2026-09-02', min: 105, max: 115, mid: 110 },
    ];

    it('renders takeaway text and toggles table view', async () => {
      const wrapper = mount(PriceHistoryChart, {
        props: { data: mockData, activeRange: '30d' },
      });
      const takeaway = wrapper.find('.ui-chart-takeaway-text').text();
      expect(takeaway).toContain('১০৫');
      expect(takeaway).toContain('১১০');
      expect(takeaway).toContain('এর মধ্যেই ঘুরেছে');

      const toggleBtn = wrapper.findAll('button').find((b) => b.text().includes('টেবিল দেখুন'));
      expect(toggleBtn).toBeDefined();

      await toggleBtn?.trigger('click');
      expect(wrapper.find('.ui-data-grid').exists()).toBe(true);
    });

    it('emits range-change when range button clicked', async () => {
      const wrapper = mount(PriceHistoryChart, {
        props: { data: mockData, activeRange: '30d' },
      });
      const btn7d = wrapper.findAll('.ui-range-btn').find((b) => b.text().includes('7d'));
      await btn7d?.trigger('click');
      expect(wrapper.emitted('range-change')?.[0]).toEqual(['7d']);
    });
  });

  describe('ContextChart', () => {
    it('renders context points and supports table view', async () => {
      const points = [
        { label: 'আজ', date: '2026-09-24', min: 110, max: 120, mid: 115 },
        { label: '১ সপ্তাহ আগে', date: '2026-09-17', min: 105, max: 115, mid: 110 },
      ];
      const wrapper = mount(ContextChart, {
        props: { points },
      });
      expect(wrapper.text()).toContain('বুলেটিন সোর্স তুলনা');

      const toggleBtn = wrapper.findAll('button').find((b) => b.text().includes('টেবিল দেখুন'));
      await toggleBtn?.trigger('click');
      expect(wrapper.find('.ui-data-grid').exists()).toBe(true);
      expect(wrapper.text()).toContain('১ সপ্তাহ আগে');
    });
  });

  describe('MoversChart', () => {
    it('renders risers and fallers and emits period change', async () => {
      const wrapper = mount(MoversChart, {
        props: {
          risers: [{ id: 1, slug: 'onion', nameBn: 'পেঁয়াজ', delta: 5, changePct: 4.2 }],
          fallers: [{ id: 2, slug: 'potato', nameBn: 'আলু', delta: -3, changePct: -2.5 }],
          period: 'day',
        },
      });
      expect(wrapper.text()).toContain('শীর্ষ হ্রাস ও বৃদ্ধি');

      const weekBtn = wrapper.findAll('.ui-range-btn').find((b) => b.text().includes('১ সপ্তাহ'));
      await weekBtn?.trigger('click');
      expect(wrapper.emitted('period-change')?.[0]).toEqual(['week']);
    });
  });

  describe('BazarIndexChart', () => {
    it('renders category index disclaimer and supports table view', async () => {
      const wrapper = mount(BazarIndexChart, {
        props: {
          series: [
            {
              categorySlug: 'rice',
              categoryNameBn: 'চাল',
              data: [{ date: '2026-09-01', index: 100 }],
            },
          ],
          dates: ['2026-09-01'],
        },
      });
      expect(wrapper.text()).toContain('Bazar Index');
      expect(wrapper.text()).toContain('সরল গড় সূচক');

      const toggleBtn = wrapper.findAll('button').find((b) => b.text().includes('টেবিল দেখুন'));
      await toggleBtn?.trigger('click');
      expect(wrapper.find('.ui-data-grid').exists()).toBe(true);
    });
  });

  describe('DistributionChart', () => {
    it('calculates shares and formats counts in Bangla', () => {
      const wrapper = mount(DistributionChart, {
        props: {
          upCount: 10,
          downCount: 20,
          sameCount: 30,
          totalTracked: 60,
        },
      });
      expect(wrapper.text()).toContain('১০'); // Bangla digits for 10
      expect(wrapper.text()).toContain('২০'); // Bangla digits for 20
      expect(wrapper.text()).toContain('৩০'); // Bangla digits for 30
      expect(wrapper.findAll('.ui-distribution__seg')).toHaveLength(3);
    });
  });
});
