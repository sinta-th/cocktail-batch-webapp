export const HOST_CODE = "mm001";

export const ROLES = {
  HOST: "host",
  HEADBAR: "headbar",
  SN_BARTENDER: "sn_bartender",
};

export const ROLE_LABELS = {
  [ROLES.HOST]: "Host",
  [ROLES.HEADBAR]: "HeadBar",
  [ROLES.SN_BARTENDER]: "Senior Bartender",
};

export const BOTTLE_SIZES = [700, 750, 1000, 1500];

export const CATEGORIES = [
  { key: "signature_cocktail", label: "Signature Cocktail" },
  { key: "signature_mocktail", label: "Signature Mocktail" },
  { key: "beach_vibe", label: "Beach Vibe" },
  { key: "classic_cocktail", label: "Classic Cocktail" },
];

export const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.label]));

export const COMPONENT_TYPES = [
  { key: "liquor", label: "Liquor Batch" },
  { key: "cordial", label: "Cordial Batch" },
  { key: "syrup", label: "Syrup Batch" },
  { key: "pre_mixed", label: "Pre-mixed" },
];

export const COMPONENT_TYPE_LABEL = Object.fromEntries(COMPONENT_TYPES.map((c) => [c.key, c.label]));

// which menu items each role sees, in order
export const MENU_BY_ROLE = {
  [ROLES.HOST]: ["recipes", "members", "calculator"],
  [ROLES.HEADBAR]: ["recipes", "calculator"],
  [ROLES.SN_BARTENDER]: ["recipes"],
};

export const MENU_META = {
  recipes: { title: "ดูสูตร batching", desc: "เรียกดูสูตรที่บันทึกไว้ แยกตามหมวดหมู่" },
  members: { title: "สมาชิก", desc: "เพิ่ม/ลบสมาชิก และดูประวัติการเข้าใช้งาน" },
  calculator: { title: "Calculator batching", desc: "เพิ่มส่วนผสมและคำนวณ batching ใหม่" },
};
