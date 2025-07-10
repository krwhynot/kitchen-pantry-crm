# Organizations API

**Kitchen Pantry CRM Organization Management Endpoints**

This module handles organization hierarchy, multi-location management, and corporate structure for enterprise food service clients.

---

## Organization Overview

**Resource:** Organization records representing corporate entities with multiple locations  
**Hierarchy:** Parent-child relationships for corporate structures  
**Features:** Location management, contact assignment, revenue aggregation  

---

## Get All Organizations

### GET /organizations

**Purpose:** Retrieve paginated list of organizations with hierarchy and filtering options.

**Request Parameters:**
```typescript
interface GetOrganizationsParams {
  page?: number;           // Page number (default: 1)
  limit?: number;          // Items per page (default: 20, max: 100)
  search?: string;         // Search in name, industry, location
  type?: 'corporate' | 'franchise' | 'independent' | 'chain';
  industry?: string;       // Industry filter
  parentId?: string;       // Filter by parent organization
  hasLocations?: boolean;  // Filter organizations with locations
  minRevenue?: number;     // Minimum annual revenue filter
  maxRevenue?: number;     // Maximum annual revenue filter
  sort?: 'name' | 'revenue' | 'locations' | 'createdAt';
  order?: 'asc' | 'desc';
}
```

**Response Format:**
```typescript
interface GetOrganizationsResponse {
  success: true;
  data: Organization[];
  meta: PaginationMeta;
}

interface Organization {
  id: string;
  name: string;
  type: 'corporate' | 'franchise' | 'independent' | 'chain';
  industry: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  headquarters: Address;
  parentId?: string;
  parentName?: string;
  children: OrganizationChild[];
  locations: Location[];
  primaryContact?: Contact;
  stats: {
    totalLocations: number;
    totalRevenue: number;
    totalEmployees?: number;
    activeOpportunities: number;
    lastInteractionAt?: string;
  };
  customFields: Record<string, any>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface OrganizationChild {
  id: string;
  name: string;
  type: string;
  locationCount: number;
}

interface Location {
  id: string;
  name: string;
  type: 'restaurant' | 'warehouse' | 'office' | 'kitchen';
  address: Address;
  manager?: Contact;
  status: 'active' | 'inactive' | 'planned';
  revenue?: number;
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/organizations?type=chain&hasLocations=true&sort=revenue&order=desc', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const { data, meta } = await response.json();
console.log(`Found ${meta.total} organizations`);
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "org_1234567890",
      "name": "Global Restaurant Group",
      "type": "corporate",
      "industry": "Quick Service Restaurant",
      "description": "Leading QSR chain with 500+ locations nationwide",
      "website": "https://globalrestaurants.com",
      "phone": "+1-555-0100",
      "email": "corporate@globalrestaurants.com",
      "headquarters": {
        "street": "100 Corporate Blvd",
        "city": "Chicago",
        "state": "IL",
        "zipCode": "60601",
        "country": "US"
      },
      "children": [
        {
          "id": "org_1234567891",
          "name": "Global Restaurants - West Coast",
          "type": "franchise",
          "locationCount": 150
        }
      ],
      "locations": [
        {
          "id": "loc_1234567890",
          "name": "Downtown Chicago Flagship",
          "type": "restaurant",
          "address": {
            "street": "123 Michigan Ave",
            "city": "Chicago",
            "state": "IL",
            "zipCode": "60611"
          },
          "status": "active",
          "revenue": 2500000
        }
      ],
      "primaryContact": {
        "id": "cont_1234567890",
        "name": "Sarah Wilson",
        "title": "VP of Operations",
        "email": "sarah.wilson@globalrestaurants.com",
        "phone": "+1-555-0101"
      },
      "stats": {
        "totalLocations": 523,
        "totalRevenue": 125000000,
        "totalEmployees": 15000,
        "activeOpportunities": 8,
        "lastInteractionAt": "2025-01-14T16:30:00Z"
      },
      "customFields": {
        "franchiseModel": "area_development",
        "averageUnitVolume": 1200000,
        "growthTarget": 50
      },
      "tags": ["enterprise", "qsr", "high-growth"],
      "createdAt": "2024-03-15T10:00:00Z",
      "updatedAt": "2025-01-14T16:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasMore": true
  }
}
```

**Error Handling:**
- **400:** Invalid query parameters
- **401:** Authentication required
- **403:** Insufficient permissions

---

## Get Organization by ID

### GET /organizations/{id}

**Purpose:** Retrieve detailed information for a specific organization including hierarchy and locations.

**Request Parameters:**
```typescript
interface GetOrganizationParams {
  id: string;              // Organization ID
  include?: string[];      // Optional: ['children', 'locations', 'contacts', 'opportunities']
}
```

**Response Format:**
```typescript
interface GetOrganizationResponse {
  success: true;
  data: OrganizationDetail;
}

interface OrganizationDetail extends Organization {
  parent?: Organization;
  allChildren?: Organization[];
  allLocations?: LocationDetail[];
  contacts?: Contact[];
  opportunities?: Opportunity[];
  revenueHistory?: RevenueData[];
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/organizations/org_1234567890?include=children,locations,contacts', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const { data } = await response.json();
console.log('Organization:', data.name);
console.log('Locations:', data.allLocations?.length);
```

**Error Handling:**
- **404:** Organization not found
- **403:** No access to this organization

---

## Create Organization

### POST /organizations

**Purpose:** Create a new organization with corporate structure and location information.

**Request Parameters:**
```typescript
interface CreateOrganizationRequest {
  name: string;            // Required: Organization name
  type: 'corporate' | 'franchise' | 'independent' | 'chain';
  industry: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  headquarters: Address;
  parentId?: string;       // Parent organization ID
  primaryContactId?: string;
  customFields?: Record<string, any>;
  tags?: string[];
}
```

**Response Format:**
```typescript
interface CreateOrganizationResponse {
  success: true;
  data: Organization;
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/organizations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Metro Food Services',
    type: 'independent',
    industry: 'Food Distribution',
    description: 'Regional food distributor serving 200+ restaurants',
    website: 'https://metrofoodservices.com',
    phone: '+1-555-0200',
    email: 'info@metrofoodservices.com',
    headquarters: {
      street: '500 Industrial Way',
      city: 'Atlanta',
      state: 'GA',
      zipCode: '30309'
    },
    customFields: {
      deliveryRadius: 150,
      specialties: ['organic', 'local', 'seafood'],
      certifications: ['HACCP', 'SQF']
    },
    tags: ['distributor', 'regional', 'organic']
  })
});

const { data } = await response.json();
console.log('Created organization:', data.id);
```

**Error Handling:**
- **400:** Invalid request data, duplicate organization name
- **422:** Validation errors
- **404:** Parent organization not found

---

## Add Location to Organization

### POST /organizations/{id}/locations

**Purpose:** Add a new location to an existing organization.

**Request Parameters:**
```typescript
interface AddLocationRequest {
  name: string;            // Location name
  type: 'restaurant' | 'warehouse' | 'office' | 'kitchen';
  address: Address;
  managerId?: string;      // Contact ID for location manager
  phone?: string;
  email?: string;
  status?: 'active' | 'inactive' | 'planned';
  customFields?: Record<string, any>;
}
```

**Response Format:**
```typescript
interface AddLocationResponse {
  success: true;
  data: Location;
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/organizations/org_1234567890/locations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Downtown Atlanta Location',
    type: 'restaurant',
    address: {
      street: '200 Peachtree St',
      city: 'Atlanta',
      state: 'GA',
      zipCode: '30303'
    },
    status: 'active',
    customFields: {
      seatingCapacity: 180,
      hasDelivery: true,
      openingHours: '6:00 AM - 11:00 PM'
    }
  })
});
```

**Error Handling:**
- **404:** Organization not found
- **400:** Invalid location data
- **409:** Location already exists

---

## Get Organization Hierarchy

### GET /organizations/{id}/hierarchy

**Purpose:** Retrieve complete organizational hierarchy including parent and all children.

**Request Parameters:**
```typescript
interface GetHierarchyParams {
  id: string;              // Organization ID
  depth?: number;          // Maximum depth to retrieve (default: 3)
}
```

**Response Format:**
```typescript
interface GetHierarchyResponse {
  success: true;
  data: {
    root: Organization;
    hierarchy: HierarchyNode[];
    stats: {
      totalOrganizations: number;
      totalLocations: number;
      maxDepth: number;
    };
  };
}

interface HierarchyNode {
  organization: Organization;
  children: HierarchyNode[];
  depth: number;
  path: string[];
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/organizations/org_1234567890/hierarchy?depth=2', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const { data } = await response.json();
console.log('Hierarchy depth:', data.stats.maxDepth);
```

**Error Handling:**
- **404:** Organization not found
- **400:** Invalid depth parameter

---

## Update Organization

### PUT /organizations/{id}

**Purpose:** Update existing organization information and structure.

**Request Parameters:**
```typescript
interface UpdateOrganizationRequest {
  name?: string;
  type?: 'corporate' | 'franchise' | 'independent' | 'chain';
  industry?: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  headquarters?: Address;
  parentId?: string;
  primaryContactId?: string;
  customFields?: Record<string, any>;
  tags?: string[];
}
```

**Response Format:**
```typescript
interface UpdateOrganizationResponse {
  success: true;
  data: Organization;
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/organizations/org_1234567890', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    description: 'Leading QSR chain with 550+ locations nationwide',
    customFields: {
      franchiseModel: 'area_development',
      averageUnitVolume: 1350000,
      growthTarget: 75
    }
  })
});
```

**Error Handling:**
- **404:** Organization not found
- **403:** No permission to update
- **409:** Conflict with existing data

---

## Organization Revenue Analytics

### GET /organizations/{id}/analytics

**Purpose:** Get revenue analytics and performance metrics for an organization.

**Request Parameters:**
```typescript
interface GetAnalyticsParams {
  id: string;              // Organization ID
  period?: 'month' | 'quarter' | 'year';
  startDate?: string;      // ISO date string
  endDate?: string;        // ISO date string
  includeLocations?: boolean;
}
```

**Response Format:**
```typescript
interface GetAnalyticsResponse {
  success: true;
  data: {
    summary: {
      totalRevenue: number;
      revenueGrowth: number;
      averageOrderValue: number;
      customerCount: number;
    };
    revenueByPeriod: Array<{
      period: string;
      revenue: number;
      growth: number;
    }>;
    locationPerformance?: Array<{
      locationId: string;
      locationName: string;
      revenue: number;
      growth: number;
      rank: number;
    }>;
    trends: {
      bestPerformingMonth: string;
      seasonalityIndex: number;
      growthTrend: 'increasing' | 'decreasing' | 'stable';
    };
  };
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/organizations/org_1234567890/analytics?period=quarter&includeLocations=true', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const { data } = await response.json();
console.log('Total revenue:', data.summary.totalRevenue);
console.log('Growth rate:', data.summary.revenueGrowth);
```

**Error Handling:**
- **404:** Organization not found
- **403:** No access to analytics data
- **400:** Invalid date range

This organization management system provides comprehensive corporate structure management, location tracking, and performance analytics optimized for enterprise food service clients.

