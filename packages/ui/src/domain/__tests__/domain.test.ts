import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PriceRange from '../PriceRange.vue';
import PriceDelta from '../PriceDelta.vue';
import TrendBadge from '../TrendBadge.vue';
import Sparkline from '../Sparkline.vue';
import StatTile from '../StatTile.vue';
import CategoryNav from '../CategoryNav.vue';
import ProductCard from '../ProductCard.vue';

describe('Domain Components', () => {
  describe('PriceRange', () => {
    it('formats a min-max price range with Bangla numerals', () => {
      const wrapper = mount(PriceRange, {
        props: { min: 120, max: 140 },
      });
      // Should format min and max e.g. "৳১২০ – ১৪০"
      expect(wrapper.text()).toContain('১২০');
      expect(wrapper.text()).toContain('১৪০');
    });

    it('formats single price when min equals max', () => {
      const wrapper = mount(PriceRange, {
        props: { min: 50, max: 50 },
      });
      expect(wrapper.text()).toContain('৫০');
      expect(wrapper.text()).not.toContain('–');
    });

    it('returns em-dash when both min and max are null', () => {
      const wrapper = mount(PriceRange, {
        props: { min: null, max: null },
      });
      expect(wrapper.text()).toBe('—');
    });
  });

  describe('PriceDelta', () => {
    it('renders positive price delta with up arrow and red styling', () => {
      const wrapper = mount(PriceDelta, {
        props: { delta: 5, changePctVal: 4.2, direction: 'up' },
      });
      expect(wrapper.classes()).toContain('ui-price-delta--up');
      expect(wrapper.text()).toContain('▲');
      expect(wrapper.text()).toContain('৫');
    });

    it('renders negative price delta with down arrow and green styling', () => {
      const wrapper = mount(PriceDelta, {
        props: { delta: -3, changePctVal: -2.5, direction: 'down' },
      });
      expect(wrapper.classes()).toContain('ui-price-delta--down');
      expect(wrapper.text()).toContain('▼');
      expect(wrapper.text()).toContain('৩');
    });
  });

  describe('TrendBadge', () => {
    it('renders up state with brick red color and percent change', () => {
      const wrapper = mount(TrendBadge, {
        props: { direction: 'up', delta: 5, changePctVal: 4.2 },
      });
      expect(wrapper.classes()).toContain('ui-trend-badge--up');
      expect(wrapper.text()).toContain('▲');
      expect(wrapper.attributes('aria-label')).toContain('দাম বেড়েছে');
    });

    it('renders down state with leaf green color', () => {
      const wrapper = mount(TrendBadge, {
        props: { direction: 'down', delta: -3, changePctVal: -2.5 },
      });
      expect(wrapper.classes()).toContain('ui-trend-badge--down');
      expect(wrapper.text()).toContain('▼');
      expect(wrapper.attributes('aria-label')).toContain('দাম কমেছে');
    });

    it('renders same state with neutral color', () => {
      const wrapper = mount(TrendBadge, {
        props: { direction: 'same' },
      });
      expect(wrapper.classes()).toContain('ui-trend-badge--same');
      expect(wrapper.text()).toContain('●');
      expect(wrapper.attributes('aria-label')).toBe('দাম অপরিবর্তিত');
    });

    it('renders no_data state with hatched pattern text', () => {
      const wrapper = mount(TrendBadge, {
        props: { direction: 'no_data' },
      });
      expect(wrapper.classes()).toContain('ui-trend-badge--no_data');
      expect(wrapper.text()).toContain('আজ বাজারে মেলেনি');
    });
  });

  describe('Sparkline', () => {
    it('generates SVG line and area path for valid points', () => {
      const wrapper = mount(Sparkline, {
        props: { points: [100, 105, 102, 110, 115], direction: 'up' },
      });
      expect(wrapper.find('path.ui-sparkline__line').exists()).toBe(true);
      expect(wrapper.find('path.ui-sparkline__area').exists()).toBe(true);
      expect(wrapper.classes()).toContain('ui-sparkline--up');
    });

    it('handles empty points gracefully', () => {
      const wrapper = mount(Sparkline, {
        props: { points: [] },
      });
      expect(wrapper.find('path.ui-sparkline__line').exists()).toBe(false);
    });
  });

  describe('StatTile', () => {
    it('formats number and share', () => {
      const wrapper = mount(StatTile, {
        props: { title: 'মোট পণ্য', value: 60, share: 100, variant: 'brand' },
      });
      expect(wrapper.find('.ui-stat-tile__title').text()).toBe('মোট পণ্য');
      expect(wrapper.find('.ui-stat-tile__value').text()).toBe('৬০');
      expect(wrapper.classes()).toContain('ui-stat-tile--brand');
    });
  });

  describe('CategoryNav', () => {
    it('renders category pills and emits selection', async () => {
      const wrapper = mount(CategoryNav, {
        props: {
          categories: [
            { id: 1, slug: 'rice', nameBn: 'চাল' },
            { id: 2, slug: 'dal', nameBn: 'ডাল' },
          ],
          activeSlug: 'rice',
        },
      });
      const pills = wrapper.findAll('.ui-category-nav__pill');
      expect(pills).toHaveLength(3); // All products + 2 categories

      await pills[2]?.trigger('click');
      expect(wrapper.emitted('select')?.[0]).toEqual(['dal']);
    });
  });

  describe('ProductCard', () => {
    it('renders complete product card with price, unit, and trend badge', () => {
      const wrapper = mount(ProductCard, {
        props: {
          id: 1,
          slug: 'onion-local',
          nameBn: 'পেঁয়াজ (দেশি)',
          unitLabel: 'প্রতি কেজি',
          minPrice: 110,
          maxPrice: 120,
          delta: 5,
          changePct: 4.3,
          direction: 'up',
          sparkline: [100, 105, 110, 115],
        },
      });
      expect(wrapper.find('.ui-product-card__name').text()).toBe('পেঁয়াজ (দেশি)');
      expect(wrapper.find('.ui-product-card__unit').text()).toBe('প্রতি কেজি');
      expect(wrapper.findComponent(PriceRange).exists()).toBe(true);
      expect(wrapper.findComponent(TrendBadge).exists()).toBe(true);
      expect(wrapper.findComponent(Sparkline).exists()).toBe(true);
    });

    it('toggles watchlist when heart button is clicked', async () => {
      const wrapper = mount(ProductCard, {
        props: {
          id: 42,
          slug: 'egg',
          nameBn: 'ডিম (ফার্ম)',
          unitLabel: '৪ টি (হালি)',
          minPrice: 50,
          maxPrice: 52,
          isWatched: false,
        },
      });
      const watchBtn = wrapper.find('.ui-product-card__watch');
      await watchBtn.trigger('click');
      expect(wrapper.emitted('watch')?.[0]).toEqual([42, true]);
    });

    it('displays "আজ বাজারে মেলেনি" when product has no data today', () => {
      const wrapper = mount(ProductCard, {
        props: {
          id: 99,
          slug: 'rare-item',
          nameBn: 'বিলুপ্ত পণ্য',
          unitLabel: 'প্রতি কেজি',
          minPrice: null,
          maxPrice: null,
          direction: 'no_data',
        },
      });
      expect(wrapper.classes()).toContain('ui-product-card--no-data');
      expect(wrapper.find('.ui-product-card__no-price').text()).toBe('আজ বাজারে মেলেনি');
    });
  });
});
