import ProductForm from "../product-form";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <h1 className="gradient-text text-2xl font-bold">New Product</h1>
      <ProductForm />
    </div>
  );
}
