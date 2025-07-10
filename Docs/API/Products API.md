# Products API

**Kitchen Pantry CRM Product Catalog Management Endpoints**

This module handles product catalog management, pricing, inventory tracking, and quote generation for food service suppliers.

---

## Product Overview

**Resource:** Product catalog with detailed specifications, pricing, and availability  
**Categories:** Hierarchical product categorization for food service items  
**Features:** Dynamic pricing, inventory tracking, nutritional information, supplier management  

---

## Get All Products

### GET /products

**Purpose:** Retrieve paginated list of products with filtering, search, and category navigation.

**Request Parameters:**
```typescript
interface GetProductsParams {
  page?: number;           // Page number (default: 1)
  limit?: number;          // Items per page (default: 20, max: 100)
  search?: string;         // Search in name, description, SKU
  categoryId?: string;     // Filter by category
  supplierId?: string;     // Filter by supplier
  status?: 'active' | 'inactive' | 'discontinued';
  inStock?: boolean;       // Filter by availability
  minPrice?: number;       // Minimum price filter
  maxPrice?: number;       // Maximum price filter
  tags?: string[];         // Filter by tags (organic, local, etc.)
  allergens?: string[];    // Filter by allergen information
  sort?: 'name' | 'price' | 'category' | 'popularity' | 'margin';
  order?: 'asc' | 'desc';
}
```

**Response Format:**
```typescript
interface GetProductsResponse {
  success: true;
  data: Product[];
  meta: PaginationMeta & {
    categories: CategorySummary[];
    priceRange: {
      min: number;
      max: number;
    };
    totalValue: number;
  };
}

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: ProductCategory;
  supplier: Supplier;
  pricing: ProductPricing;
  inventory: InventoryInfo;
  specifications: ProductSpecs;
  nutritional?: NutritionalInfo;
  allergens: string[];
  certifications: string[];
  images: ProductImage[];
  status: 'active' | 'inactive' | 'discontinued';
  tags: string[];
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface ProductCategory {
  id: string;
  name: string;
  path: string[];          // Full category path
  level: number;
}

interface Supplier {
  id: string;
  name: string;
  contactInfo: {
    email: string;
    phone: string;
  };
  leadTime: number;        // Days
  minimumOrder: number;
}

interface ProductPricing {
  basePrice: number;
  currency: string;
  unit: string;            // 'lb', 'case', 'each', etc.
  tierPricing: Array<{
    minQuantity: number;
    price: number;
    discount: number;
  }>;
  costPrice: number;
  margin: number;
  lastUpdated: string;
}

interface InventoryInfo {
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderPoint: number;
  maxStock: number;
  lastRestocked: string;
  location: string;
}

interface ProductSpecs {
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  shelfLife?: number;      // Days
  storageTemp?: {
    min: number;
    max: number;
    unit: 'F' | 'C';
  };
  packaging: string;
}

interface NutritionalInfo {
  servingSize: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
}

interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/products?categoryId=cat_vegetables&inStock=true&tags=organic&sort=name', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const { data, meta } = await response.json();
console.log(`Found ${meta.total} products`);
console.log(`Price range: $${meta.priceRange.min} - $${meta.priceRange.max}`);
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_1234567890",
      "sku": "ORG-VEG-001",
      "name": "Organic Spring Mix Lettuce",
      "description": "Fresh organic spring mix lettuce blend with baby spinach, arugula, and mixed greens. Perfect for salads and garnishes.",
      "category": {
        "id": "cat_vegetables",
        "name": "Vegetables",
        "path": ["Fresh Produce", "Vegetables", "Leafy Greens"],
        "level": 3
      },
      "supplier": {
        "id": "sup_1234567890",
        "name": "Green Valley Farms",
        "contactInfo": {
          "email": "orders@greenvalleyfarms.com",
          "phone": "+1-555-0300"
        },
        "leadTime": 2,
        "minimumOrder": 50
      },
      "pricing": {
        "basePrice": 24.50,
        "currency": "USD",
        "unit": "case",
        "tierPricing": [
          {
            "minQuantity": 10,
            "price": 23.50,
            "discount": 4.1
          },
          {
            "minQuantity": 25,
            "price": 22.00,
            "discount": 10.2
          }
        ],
        "costPrice": 18.00,
        "margin": 36.1,
        "lastUpdated": "2025-01-10T08:00:00Z"
      },
      "inventory": {
        "currentStock": 150,
        "reservedStock": 25,
        "availableStock": 125,
        "reorderPoint": 50,
        "maxStock": 300,
        "lastRestocked": "2025-01-12T14:00:00Z",
        "location": "Cooler A-3"
      },
      "specifications": {
        "weight": 5,
        "dimensions": {
          "length": 18,
          "width": 12,
          "height": 8,
          "unit": "inches"
        },
        "shelfLife": 7,
        "storageTemp": {
          "min": 32,
          "max": 38,
          "unit": "F"
        },
        "packaging": "24 x 5oz containers per case"
      },
      "nutritional": {
        "servingSize": "2 cups (85g)",
        "calories": 20,
        "protein": 2,
        "carbohydrates": 4,
        "fat": 0,
        "fiber": 2,
        "sodium": 25,
        "sugar": 2
      },
      "allergens": [],
      "certifications": ["USDA Organic", "Non-GMO", "Good Agricultural Practices"],
      "images": [
        {
          "id": "img_1234567890",
          "url": "https://images.kitchenpantrycrm.com/products/org-spring-mix-001.jpg",
          "alt": "Organic Spring Mix Lettuce Case",
          "isPrimary": true,
          "order": 1
        }
      ],
      "status": "active",
      "tags": ["organic", "local", "fresh", "salad"],
      "customFields": {
        "seasonality": "year-round",
        "origin": "California",
        "harvestMethod": "hand-picked"
      },
      "createdAt": "2024-08-15T10:00:00Z",
      "updatedAt": "2025-01-12T14:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasMore": true,
    "categories": [
      {
        "id": "cat_vegetables",
        "name": "Vegetables",
        "count": 45
      }
    ],
    "priceRange": {
      "min": 12.50,
      "max": 89.99
    },
    "totalValue": 125000
  }
}
```

**Error Handling:**
- **400:** Invalid query parameters
- **401:** Authentication required
- **403:** Insufficient permissions

---

## Get Product by ID

### GET /products/{id}

**Purpose:** Retrieve detailed information for a specific product including full specifications and history.

**Request Parameters:**
```typescript
interface GetProductParams {
  id: string;              // Product ID
  include?: string[];      // Optional: ['pricing_history', 'inventory_history', 'related_products']
}
```

**Response Format:**
```typescript
interface GetProductResponse {
  success: true;
  data: ProductDetail;
}

interface ProductDetail extends Product {
  pricingHistory?: PriceChange[];
  inventoryHistory?: InventoryChange[];
  relatedProducts?: Product[];
  salesStats: {
    totalSold: number;
    revenue: number;
    averageOrderQuantity: number;
    topCustomers: Array<{
      customerId: string;
      customerName: string;
      totalOrdered: number;
    }>;
  };
}

interface PriceChange {
  id: string;
  oldPrice: number;
  newPrice: number;
  reason: string;
  changedBy: string;
  changedAt: string;
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/products/prod_1234567890?include=pricing_history,related_products', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const { data } = await response.json();
console.log('Product:', data.name);
console.log('Current stock:', data.inventory.availableStock);
console.log('Total sold:', data.salesStats.totalSold);
```

**Error Handling:**
- **404:** Product not found
- **403:** No access to this product

---

## Create Product

### POST /products

**Purpose:** Add a new product to the catalog with complete specifications and pricing.

**Request Parameters:**
```typescript
interface CreateProductRequest {
  sku: string;             // Required: Unique SKU
  name: string;            // Required: Product name
  description: string;
  categoryId: string;      // Required: Category ID
  supplierId: string;      // Required: Supplier ID
  pricing: {
    basePrice: number;
    unit: string;
    costPrice: number;
    tierPricing?: Array<{
      minQuantity: number;
      price: number;
    }>;
  };
  inventory?: {
    currentStock?: number;
    reorderPoint?: number;
    maxStock?: number;
    location?: string;
  };
  specifications?: Partial<ProductSpecs>;
  nutritional?: Partial<NutritionalInfo>;
  allergens?: string[];
  certifications?: string[];
  imageUrls?: string[];
  tags?: string[];
  customFields?: Record<string, any>;
}
```

**Response Format:**
```typescript
interface CreateProductResponse {
  success: true;
  data: Product;
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sku: 'PREM-HERB-001',
    name: 'Premium Herb Collection',
    description: 'Artisanal herb collection featuring basil, oregano, thyme, and rosemary. Locally sourced and hand-picked.',
    categoryId: 'cat_herbs',
    supplierId: 'sup_2234567890',
    pricing: {
      basePrice: 45.00,
      unit: 'bundle',
      costPrice: 32.00,
      tierPricing: [
        {
          minQuantity: 5,
          price: 42.00
        },
        {
          minQuantity: 10,
          price: 38.00
        }
      ]
    },
    inventory: {
      currentStock: 75,
      reorderPoint: 20,
      maxStock: 150,
      location: 'Herb Cooler B-1'
    },
    specifications: {
      weight: 2,
      shelfLife: 14,
      storageTemp: {
        min: 35,
        max: 40,
        unit: 'F'
      },
      packaging: '4 x 2oz containers per bundle'
    },
    allergens: [],
    certifications: ['Organic', 'Local'],
    tags: ['herbs', 'premium', 'local', 'fresh'],
    customFields: {
      origin: 'Local farms within 50 miles',
      harvestDate: '2025-01-14'
    }
  })
});

const { data } = await response.json();
console.log('Created product:', data.id);
```

**Error Handling:**
- **400:** Invalid request data, duplicate SKU
- **404:** Category or supplier not found
- **422:** Validation errors

---

## Update Product Pricing

### PATCH /products/{id}/pricing

**Purpose:** Update product pricing with tier pricing and margin calculations.

**Request Parameters:**
```typescript
interface UpdatePricingRequest {
  basePrice?: number;
  costPrice?: number;
  tierPricing?: Array<{
    minQuantity: number;
    price: number;
  }>;
  reason?: string;         // Reason for price change
  effectiveDate?: string;  // ISO date string
}
```

**Response Format:**
```typescript
interface UpdatePricingResponse {
  success: true;
  data: {
    product: Product;
    priceChange: PriceChange;
    marginImpact: {
      oldMargin: number;
      newMargin: number;
      marginChange: number;
    };
  };
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/products/prod_1234567890/pricing', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    basePrice: 26.00,
    costPrice: 19.00,
    tierPricing: [
      {
        minQuantity: 10,
        price: 25.00
      },
      {
        minQuantity: 25,
        price: 23.50
      }
    ],
    reason: 'Supplier cost increase',
    effectiveDate: '2025-02-01T00:00:00Z'
  })
});

const { data } = await response.json();
console.log('New margin:', data.marginImpact.newMargin);
```

**Error Handling:**
- **404:** Product not found
- **400:** Invalid pricing data
- **403:** No permission to update pricing

---

## Update Inventory

### PATCH /products/{id}/inventory

**Purpose:** Update product inventory levels and location information.

**Request Parameters:**
```typescript
interface UpdateInventoryRequest {
  adjustment: number;      // Positive for additions, negative for reductions
  reason: 'received' | 'sold' | 'damaged' | 'expired' | 'adjustment';
  location?: string;
  notes?: string;
  referenceNumber?: string; // PO number, invoice number, etc.
}
```

**Response Format:**
```typescript
interface UpdateInventoryResponse {
  success: true;
  data: {
    product: Product;
    inventoryChange: {
      id: string;
      oldStock: number;
      newStock: number;
      adjustment: number;
      reason: string;
      changedBy: string;
      changedAt: string;
    };
    alerts?: string[];      // Low stock, reorder point alerts
  };
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/products/prod_1234567890/inventory', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    adjustment: 100,
    reason: 'received',
    notes: 'Weekly delivery from Green Valley Farms',
    referenceNumber: 'PO-2025-001234'
  })
});

const { data } = await response.json();
console.log('New stock level:', data.product.inventory.currentStock);
if (data.alerts?.length) {
  console.log('Alerts:', data.alerts);
}
```

**Error Handling:**
- **404:** Product not found
- **400:** Invalid adjustment amount
- **409:** Insufficient stock for negative adjustment

---

## Product Categories

### GET /products/categories

**Purpose:** Retrieve hierarchical product category structure.

**Request Parameters:**
```typescript
interface GetCategoriesParams {
  parentId?: string;       // Get children of specific category
  level?: number;          // Maximum depth level
  includeProductCount?: boolean;
}
```

**Response Format:**
```typescript
interface GetCategoriesResponse {
  success: true;
  data: ProductCategoryTree[];
}

interface ProductCategoryTree {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  level: number;
  path: string[];
  productCount?: number;
  children: ProductCategoryTree[];
  metadata: {
    averagePrice: number;
    totalProducts: number;
    topTags: string[];
  };
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/products/categories?includeProductCount=true', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const { data } = await response.json();
console.log('Categories:', data.length);
```

**Error Handling:**
- **404:** Parent category not found
- **400:** Invalid level parameter

---

## Product Search

### GET /products/search

**Purpose:** Advanced product search with full-text search, filters, and suggestions.

**Request Parameters:**
```typescript
interface SearchProductsParams {
  q: string;               // Search query
  filters?: {
    categories?: string[];
    suppliers?: string[];
    priceMin?: number;
    priceMax?: number;
    inStock?: boolean;
    tags?: string[];
    allergens?: string[];
    certifications?: string[];
  };
  suggestions?: boolean;   // Include search suggestions
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}
```

**Response Format:**
```typescript
interface SearchProductsResponse {
  success: true;
  data: {
    products: Product[];
    highlights: Record<string, string[]>;
    suggestions?: string[];
    facets: {
      categories: Array<{ id: string; name: string; count: number; }>;
      suppliers: Array<{ id: string; name: string; count: number; }>;
      tags: Array<{ name: string; count: number; }>;
      priceRanges: Array<{ min: number; max: number; count: number; }>;
    };
  };
  meta: PaginationMeta;
}
```

**Example Usage:**
```typescript
const searchParams = new URLSearchParams({
  q: 'organic vegetables',
  'filters[inStock]': 'true',
  'filters[tags]': 'organic,fresh',
  suggestions: 'true',
  page: '1',
  limit: '20'
});

const response = await fetch(`/api/v1/products/search?${searchParams}`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const { data } = await response.json();
console.log('Found products:', data.products.length);
console.log('Suggestions:', data.suggestions);
```

**Error Handling:**
- **400:** Invalid search parameters
- **429:** Search rate limit exceeded

---

## Generate Product Quote

### POST /products/quote

**Purpose:** Generate a quote for multiple products with quantity-based pricing.

**Request Parameters:**
```typescript
interface GenerateQuoteRequest {
  customerId: string;
  products: Array<{
    productId: string;
    quantity: number;
    notes?: string;
  }>;
  validUntil?: string;     // ISO date string
  discountPercent?: number;
  notes?: string;
  deliveryDate?: string;
}
```

**Response Format:**
```typescript
interface GenerateQuoteResponse {
  success: true;
  data: {
    quote: {
      id: string;
      quoteNumber: string;
      customerId: string;
      items: Array<{
        product: Product;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        discount: number;
      }>;
      subtotal: number;
      discountAmount: number;
      tax?: number;
      total: number;
      validUntil: string;
      deliveryDate?: string;
      status: 'draft' | 'sent' | 'accepted' | 'expired';
      url: string;
      createdAt: string;
    };
  };
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/products/quote', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    customerId: 'cust_1234567890',
    products: [
      {
        productId: 'prod_1234567890',
        quantity: 20,
        notes: 'Weekly delivery preferred'
      },
      {
        productId: 'prod_2234567890',
        quantity: 10
      }
    ],
    validUntil: '2025-02-15T23:59:59Z',
    discountPercent: 5,
    notes: 'Volume discount applied for regular customer',
    deliveryDate: '2025-01-25T08:00:00Z'
  })
});

const { data } = await response.json();
console.log('Quote generated:', data.quote.quoteNumber);
console.log('Total amount:', data.quote.total);
console.log('Quote URL:', data.quote.url);
```

**Error Handling:**
- **404:** Customer or product not found
- **400:** Invalid quote data
- **422:** Insufficient inventory for requested quantities

This product management system provides comprehensive catalog management, dynamic pricing, inventory tracking, and quote generation capabilities optimized for food service suppliers and distributors.

