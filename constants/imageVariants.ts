import mongoose, { Schema, model, models } from "mongoose";


export const IMAGE_VARIANTS = {
  SQUARE: {
    dimensions: { width: 1200, height: 1200 },
    label: "Square (1:1)",
    aspectRatio: "1:1",
  },
  WIDE: {
    dimensions: { width: 1920, height: 1080 },
    label: "Widescreen (16:9)",
    aspectRatio: "16:9",
  },
  PORTRAIT: {
    dimensions: { width: 1080, height: 1440 },
    label: "Portrait (3:4)",
    aspectRatio: "3:4",
  },
} as const;

export interface ImageVariant {
  type: ImageVariantType;
  price: number;
  license: "personal" | "commercial";
}

export interface IProduct {
  _id?: mongoose.Types.ObjectId;
  name: string;
  description: string;
  imageUrl: string;
  variants: ImageVariant[];
}


export type ImageVariantType = keyof typeof IMAGE_VARIANTS;

export interface ImageVariant {
  type: ImageVariantType;
  price: number;
  license: "personal" | "commercial";
}
