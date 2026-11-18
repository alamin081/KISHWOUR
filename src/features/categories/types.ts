export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  productCount: number;
};

export type CategoryDetail = CategorySummary & {
  seoTitle: string | null;
  seoDescription: string | null;
};
