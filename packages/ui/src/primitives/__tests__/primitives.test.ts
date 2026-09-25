import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import Button from '../Button.vue';
import IconButton from '../IconButton.vue';
import Badge from '../Badge.vue';
import Chip from '../Chip.vue';
import Card from '../Card.vue';
import Field from '../Field.vue';
import NumberInput from '../NumberInput.vue';
import Select from '../Select.vue';
import Skeleton from '../Skeleton.vue';
import EmptyState from '../EmptyState.vue';
import Toast from '../Toast.vue';
import DataGrid from '../DataGrid.vue';
import Carousel from '../Carousel.vue';
import FileDropzone from '../FileDropzone.vue';

describe('Base Primitives', () => {
  it('renders Button and emits click event', async () => {
    const wrapper = mount(Button, {
      props: { variant: 'primary', size: 'md' },
      slots: { default: 'বাজারদর' },
    });
    expect(wrapper.text()).toContain('বাজারদর');
    expect(wrapper.classes()).toContain('ui-button--primary');

    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('renders IconButton with required aria-label', () => {
    const wrapper = mount(IconButton, {
      props: { ariaLabel: 'খুঁজুন' },
      slots: { default: '🔍' },
    });
    expect(wrapper.attributes('aria-label')).toBe('খুঁজুন');
    expect(wrapper.classes()).toContain('ui-icon-button');
  });

  it('renders Badge with variants', () => {
    const wrapper = mount(Badge, {
      props: { variant: 'success' },
      slots: { default: 'কমেছে' },
    });
    expect(wrapper.classes()).toContain('ui-badge--success');
    expect(wrapper.text()).toBe('কমেছে');
  });

  it('renders Chip with active state and emits click', async () => {
    const wrapper = mount(Chip, {
      props: { active: true },
      slots: { default: 'সবজি' },
    });
    expect(wrapper.classes()).toContain('ui-chip--active');
    expect(wrapper.attributes('aria-pressed')).toBe('true');

    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('renders Card with interactive elevation class', () => {
    const wrapper = mount(Card, {
      props: { interactive: true, padding: 'lg' },
      slots: { default: 'কার্ড কনটেন্ট' },
    });
    expect(wrapper.classes()).toContain('ui-card--interactive');
    expect(wrapper.classes()).toContain('ui-card--pad-lg');
  });

  it('renders Field with label and required marker', () => {
    const wrapper = mount(Field, {
      props: { id: 'price-input', label: 'দাম', required: true, hint: 'টাকায় লিখুন' },
      slots: {
        default: `<template #default="{ id }"><input :id="id" /></template>`,
      },
    });
    expect(wrapper.find('label').text()).toContain('দাম');
    expect(wrapper.find('.ui-field__required').exists()).toBe(true);
    expect(wrapper.find('.ui-field__hint').text()).toBe('টাকায় লিখুন');
  });

  it('translates Bangla digits in NumberInput correctly', async () => {
    const wrapper = mount(NumberInput, {
      props: { modelValue: 50 },
    });
    const input = wrapper.find('input');
    expect(input.element.value).toBe('50');

    // Type Bangla digits '১২০'
    await input.setValue('১২০');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([120]);
  });

  it('renders Select with options and handles change', async () => {
    const wrapper = mount(Select, {
      props: {
        modelValue: 'rice',
        options: [
          { value: 'rice', label: 'চাল' },
          { value: 'oil', label: 'তেল' },
        ],
      },
    });
    expect(wrapper.findAll('option')).toHaveLength(2);
    await wrapper.find('select').setValue('oil');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['oil']);
  });

  it('renders Skeleton with variant', () => {
    const wrapper = mount(Skeleton, {
      props: { variant: 'card', width: '200px' },
    });
    expect(wrapper.classes()).toContain('ui-skeleton--card');
    expect(wrapper.attributes('aria-hidden')).toBe('true');
  });

  it('renders EmptyState with title and description', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'কিছু মেলেনি', description: 'অন্য নাম লিখে চেষ্টা করুন' },
    });
    expect(wrapper.find('.ui-empty-state__title').text()).toBe('কিছু মেলেনি');
  });

  it('renders Toast and auto-dismisses after duration', async () => {
    vi.useFakeTimers();
    const wrapper = mount(Toast, {
      props: { message: 'আপলোড সম্পন্ন', duration: 1000 },
    });
    expect(wrapper.text()).toContain('আপলোড সম্পন্ন');
    vi.advanceTimersByTime(1000);
    expect(wrapper.emitted('dismiss')).toHaveLength(1);
    vi.useRealTimers();
  });

  it('renders DataGrid with columns and row slots', () => {
    const wrapper = mount(DataGrid, {
      props: {
        columns: [
          { key: 'name', label: 'পণ্য' },
          { key: 'price', label: 'দাম' },
        ],
        data: [{ name: 'পেঁয়াজ', price: '৳১২০' }],
      },
    });
    expect(wrapper.find('th').text()).toBe('পণ্য');
    expect(wrapper.find('td').text()).toBe('পেঁয়াজ');
  });

  it('renders Carousel with track and controls', () => {
    const wrapper = mount(Carousel, {
      slots: { default: '<div>আইটেম ১</div><div>আইটেম ২</div>' },
    });
    expect(wrapper.find('.ui-carousel__track').exists()).toBe(true);
    expect(wrapper.findAll('.ui-carousel__btn')).toHaveLength(2);
  });

  it('renders FileDropzone and emits file-selected on file input change', async () => {
    const wrapper = mount(FileDropzone, {
      props: { accept: '.xlsx' },
    });
    const file = new File(['content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const input = wrapper.find('input[type="file"]');
    Object.defineProperty(input.element, 'files', {
      value: [file],
    });
    await input.trigger('change');
    expect(wrapper.emitted('file-selected')?.[0]).toEqual([file]);
  });
});
