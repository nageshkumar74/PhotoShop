export const IMAGE_VARIANTS = {
  SQUARE: {
    type:"SQUARE",
    label:"Square",
    dimensions: { width: 1200, height: 1200 },
  },
  WIDE: {
    type:"WIDE",label:"label",
    dimensions: { width: 1920, height: 1080 },
  },
  PORTRAIT: {
    type:"PORTRAIT",label:"Portrait",
    dimensions: { width: 1080, height: 1440 },
  },
} as const;

export type ImageVariantType = keyof typeof IMAGE_VARIANTS;

export interface ImageVariant {
  type: ImageVariantType;
  price: number;
  license: "personal" | "commercial";
}

export interface IProduct {
  _id?: string; // 👈 IMPORTANT (not mongoose type)
  name: string;
  description: string;
  imageUrl: string;
  variants: ImageVariant[];
}