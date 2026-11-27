import { baseApi } from "@/app/api/baseApi";
import type { ResourceQuery, ResourceResponse } from "@/shared/api/resource";
import type {
  AddInventoryItemUnitRequest,
  AddProductVariantRequest,
  ConversionPreviewRequest,
  ConversionPreviewResponse,
  CreateInventoryItemRequest,
  CreateProductRequest,
  CreateUnitRequest,
  InventoryItem,
  InventoryItemFilterQuery,
  PreviewItemConversionRequest,
  PreviewItemConversionResponse,
  Product,
  ProductFilterQuery,
  ProductVariant,
  Unit,
  UnitFilterQuery,
  UpdateInventoryItemRequest,
  UpdateProductRequest,
  UpdateProductVariantRequest,
  UpdateUnitRequest,
} from "./types";

const catalogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCatalogRecords: builder.query<ResourceResponse, ResourceQuery>({
      query: ({ resource }) => ({ url: `/${resource}` }),
      providesTags: (_result, _error, arg) => [{ type: "Resource", id: arg.resource }],
    }),
    getUnits: builder.query<Unit[], UnitFilterQuery | void>({
      query: (params) => {
        const queryParams: Record<string, string> = {};
        if (params?.dimension) queryParams.dimension = params.dimension;
        if (params?.status) queryParams.status = params.status;
        return {
          url: "/units",
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Unit" as const, id })),
              { type: "Unit", id: "LIST" },
            ]
          : [{ type: "Unit", id: "LIST" }],
    }),
    getUnitById: builder.query<Unit, string>({
      query: (id) => ({ url: `/units/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "Unit", id }],
    }),
    createUnit: builder.mutation<Unit, CreateUnitRequest>({
      query: (body) => ({
        url: "/units",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Unit", id: "LIST" }],
    }),
    updateUnit: builder.mutation<Unit, { id: string; body: UpdateUnitRequest }>({
      query: ({ id, body }) => ({
        url: `/units/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Unit", id: "LIST" },
        { type: "Unit", id },
      ],
    }),
    activateUnit: builder.mutation<Unit, string>({
      query: (id) => ({
        url: `/units/${id}/activate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Unit", id: "LIST" },
        { type: "Unit", id },
      ],
    }),
    deactivateUnit: builder.mutation<Unit, string>({
      query: (id) => ({
        url: `/units/${id}/deactivate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Unit", id: "LIST" },
        { type: "Unit", id },
      ],
    }),
    previewConversion: builder.mutation<ConversionPreviewResponse, ConversionPreviewRequest>({
      query: (body) => ({
        url: "/unit-conversions/preview",
        method: "POST",
        body,
      }),
    }),

    // ----------------------------------------------------
    // Inventory Items Endpoints (009)
    // ----------------------------------------------------
    getInventoryItems: builder.query<InventoryItem[], InventoryItemFilterQuery | void>({
      query: (params) => {
        const queryParams: Record<string, string> = {};
        if (params?.type) queryParams.type = params.type;
        if (params?.status) queryParams.status = params.status;
        if (params?.search) queryParams.search = params.search;
        return {
          url: "/inventory-items",
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "InventoryItem" as const, id })),
              { type: "InventoryItem", id: "LIST" },
            ]
          : [{ type: "InventoryItem", id: "LIST" }],
    }),
    getInventoryItemById: builder.query<InventoryItem, string>({
      query: (id) => ({ url: `/inventory-items/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "InventoryItem", id }],
    }),
    createInventoryItem: builder.mutation<InventoryItem, CreateInventoryItemRequest>({
      query: (body) => ({
        url: "/inventory-items",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "InventoryItem", id: "LIST" }],
    }),
    updateInventoryItem: builder.mutation<
      InventoryItem,
      { id: string; body: UpdateInventoryItemRequest }
    >({
      query: ({ id, body }) => ({
        url: `/inventory-items/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "InventoryItem", id: "LIST" },
        { type: "InventoryItem", id },
      ],
    }),
    activateInventoryItem: builder.mutation<InventoryItem, string>({
      query: (id) => ({
        url: `/inventory-items/${id}/activate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "InventoryItem", id: "LIST" },
        { type: "InventoryItem", id },
      ],
    }),
    deactivateInventoryItem: builder.mutation<InventoryItem, string>({
      query: (id) => ({
        url: `/inventory-items/${id}/deactivate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "InventoryItem", id: "LIST" },
        { type: "InventoryItem", id },
      ],
    }),
    addPackagingUnit: builder.mutation<
      InventoryItem,
      { itemId: string; body: AddInventoryItemUnitRequest }
    >({
      query: ({ itemId, body }) => ({
        url: `/inventory-items/${itemId}/units`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { itemId }) => [
        { type: "InventoryItem", id: "LIST" },
        { type: "InventoryItem", id: itemId },
      ],
    }),
    removePackagingUnit: builder.mutation<void, { itemId: string; unitId: string }>({
      query: ({ itemId, unitId }) => ({
        url: `/inventory-items/${itemId}/units/${unitId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { itemId }) => [
        { type: "InventoryItem", id: "LIST" },
        { type: "InventoryItem", id: itemId },
      ],
    }),
    previewItemConversion: builder.mutation<
      PreviewItemConversionResponse,
      { itemId: string; body: PreviewItemConversionRequest }
    >({
      query: ({ itemId, body }) => ({
        url: `/inventory-items/${itemId}/preview-conversion`,
        method: "POST",
        body,
      }),
    }),

    // ----------------------------------------------------
    // Products & Sellable Variants Endpoints (010)
    // ----------------------------------------------------
    getProducts: builder.query<Product[], ProductFilterQuery | void>({
      query: (params) => {
        const queryParams: Record<string, string> = {};
        if (params?.status) queryParams.status = params.status;
        if (params?.search) queryParams.search = params.search;
        return {
          url: "/products",
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Product" as const, id })),
              { type: "Product", id: "LIST" },
            ]
          : [{ type: "Product", id: "LIST" }],
    }),
    getProductById: builder.query<Product, string>({
      query: (id) => ({ url: `/products/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "Product", id }],
    }),
    createProduct: builder.mutation<Product, CreateProductRequest>({
      query: (body) => ({
        url: "/products",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),
    updateProduct: builder.mutation<Product, { id: string; body: UpdateProductRequest }>({
      query: ({ id, body }) => ({
        url: `/products/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Product", id: "LIST" },
        { type: "Product", id },
      ],
    }),
    activateProduct: builder.mutation<Product, string>({
      query: (id) => ({
        url: `/products/${id}/activate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Product", id: "LIST" },
        { type: "Product", id },
      ],
    }),
    deactivateProduct: builder.mutation<Product, string>({
      query: (id) => ({
        url: `/products/${id}/deactivate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Product", id: "LIST" },
        { type: "Product", id },
      ],
    }),
    addProductVariant: builder.mutation<
      ProductVariant,
      { productId: string; body: AddProductVariantRequest }
    >({
      query: ({ productId, body }) => ({
        url: `/products/${productId}/variants`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "Product", id: "LIST" },
        { type: "Product", id: productId },
      ],
    }),
    updateProductVariant: builder.mutation<
      ProductVariant,
      { productId: string; variantId: string; body: UpdateProductVariantRequest }
    >({
      query: ({ productId, variantId, body }) => ({
        url: `/products/${productId}/variants/${variantId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "Product", id: "LIST" },
        { type: "Product", id: productId },
      ],
    }),
    activateProductVariant: builder.mutation<
      ProductVariant,
      { productId: string; variantId: string }
    >({
      query: ({ productId, variantId }) => ({
        url: `/products/${productId}/variants/${variantId}/activate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "Product", id: "LIST" },
        { type: "Product", id: productId },
      ],
    }),
    deactivateProductVariant: builder.mutation<
      ProductVariant,
      { productId: string; variantId: string }
    >({
      query: ({ productId, variantId }) => ({
        url: `/products/${productId}/variants/${variantId}/deactivate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "Product", id: "LIST" },
        { type: "Product", id: productId },
      ],
    }),
  }),
});

export const {
  useGetCatalogRecordsQuery,
  useGetUnitsQuery,
  useGetUnitByIdQuery,
  useCreateUnitMutation,
  useUpdateUnitMutation,
  useActivateUnitMutation,
  useDeactivateUnitMutation,
  usePreviewConversionMutation,
  useGetInventoryItemsQuery,
  useGetInventoryItemByIdQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useActivateInventoryItemMutation,
  useDeactivateInventoryItemMutation,
  useAddPackagingUnitMutation,
  useRemovePackagingUnitMutation,
  usePreviewItemConversionMutation,
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useActivateProductMutation,
  useDeactivateProductMutation,
  useAddProductVariantMutation,
  useUpdateProductVariantMutation,
  useActivateProductVariantMutation,
  useDeactivateProductVariantMutation,
} = catalogApi;
