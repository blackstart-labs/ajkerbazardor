// All Bangla UI copy lives here. Never inline in templates.
// Usage: import { copy } from '@ajkerbazardor/shared';

export const copy = {
  // ── Homepage / hero ──────────────────────────────────────────────────────
  heroTagline: 'ঢাকার বাজারে আজ কোনটার কত দাম, এক নজরে।',
  searchPlaceholder: 'Search করুন — যেমন: পেঁয়াজ, ডিম, সয়াবিন',
  sourceLabel: 'সোর্স: TCB (ট্রেডিং কর্পোরেশন অব বাংলাদেশ)',

  // ── Price change labels ───────────────────────────────────────────────────
  priceUp: (taka: string, pct: string) => `গত সপ্তাহের চেয়ে ${taka} বেশি · ${pct}`,
  priceDown: (taka: string, pct: string) => `${taka} কমেছে · ${pct}`,
  priceUnchanged: 'আগের দামেই আছে',
  noData: 'আজ বাজারে মেলেনি',

  // ── Last updated ─────────────────────────────────────────────────────────
  lastUpdated: (time: string) => `Last updated: ${time}`,

  // ── Carousels ────────────────────────────────────────────────────────────
  carouselPriceDown: 'আজ যেগুলোর দাম কমল',
  carouselPriceUp: 'আজ যেগুলোর দাম বাড়ল',

  // ── Dashboard ─────────────────────────────────────────────────────────────
  dashboardTitle: 'বাজারের মুড',
  dashboardChanges: 'কোনটা কতটা বদলাল',
  bazarIndex: 'Bazar Index',

  // ── Chart takeaways (templates) ───────────────────────────────────────────
  chartTakeawayRange: (low: string, high: string, days: number) =>
    `গত ${days} দিনে ${low} থেকে ${high}-এর মধ্যেই ঘুরেছে।`,
  chartNoData: 'এই সময়ের জন্য পর্যাপ্ত তথ্য নেই।',

  // ── Watchlist / list ──────────────────────────────────────────────────────
  watchlistAdd: 'Watchlist-এ রাখুন',
  watchlistRemove: 'Watchlist থেকে সরান',
  listTitle: 'বাজারের ফর্দ',
  listEstimate: (today: string, lastWeek: string) => `আজকের হিসাবে আনুমানিক খরচ ${today}; গত সপ্তাহে লাগত ${lastWeek}`,

  // ── Search results ────────────────────────────────────────────────────────
  searchEmpty: 'এই নামে কিছু খুঁজে পেলাম না। অন্য কিছু লিখে দেখুন তো?',

  // ── Upload / import (admin) ───────────────────────────────────────────────
  uploadSuccess: (updated: number, added: number) =>
    `আজকের ফাইল আপলোড হয়ে গেছে। ${updated}টা প্রোডাক্ট আপডেট হয়েছে, ${added}টা নতুন।`,
  uploadDuplicate: 'এই ফাইল আগেই আপলোড করা হয়েছে। আবার দিলেও কিছু বদলাবে না।',
  uploadBadFile: 'এটা TCB-র বাজারদরের ফাইল মনে হচ্ছে না। ফাইলটা আরেকবার চেক করবেন?',
  uploadUndo: 'Undo করুন — আগের দামগুলো ফিরে আসবে',

  // ── Product / admin warnings ──────────────────────────────────────────────
  productMissing: 'আজ বাজারে মেলেনি',
  productNeedsReview: 'নতুন প্রোডাক্ট — Review করুন',

  // ── Admin delete ──────────────────────────────────────────────────────────
  archiveConfirm: 'Delete করবেন? এটা Archive হবে, পুরনো দামের হিস্ট্রি থাকবে।',

  // ── Generic error ────────────────────────────────────────────────────────
  genericError: 'কিছু একটা গড়বড় হয়েছে। আবার চেষ্টা করুন।',

  // ── About page ────────────────────────────────────────────────────────────
  aboutTitle: 'Method ও Source',
  aboutTCBNote: 'এটা TCB-র অফিসিয়াল সাইট না — ডেটা TCB-র প্রতিদিনের বুলেটিন থেকে নেওয়া।',
  aboutIndexDisclaimer: 'Bazar Index একটি সরল গড়, কোনো সরকারি মূল্যস্ফীতির সংখ্যা না।',

  // ── Direction labels (used in badges and copy) ────────────────────────────
  directionUp: 'বেড়েছে',
  directionDown: 'কমেছে',
  directionSame: 'একই আছে',
} as const;
