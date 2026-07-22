import axios from "./axios";

export const getDashboardStats = async () => {
 const company_id = 1; // change later to logged-in company id

const productsResponse = await axios.get(
  `/products/?company_id=${company_id}`
);

const categoriesResponse = await axios.get(
  `/categories/?company_id=${company_id}`
);

  const products = Array.isArray(productsResponse.data)
  ? productsResponse.data
  : [];

const categories = Array.isArray(categoriesResponse.data)
  ? categoriesResponse.data
  : [];
console.log("Products:", products);
console.log("Categories:", categories);

  const totalProducts = products.length;

  const totalCategories = categories.length;

  const totalStock = products.reduce(
    (sum: number, product: any) =>
      sum + (product.quantity || 0),
    0
  );

  const lowStockItems = products.filter(
    (product: any) =>
      (product.quantity || 0) < 10
  ).length;


  return {
    totalProducts,
    totalCategories,
    totalStock,
    lowStockItems,
  };
};