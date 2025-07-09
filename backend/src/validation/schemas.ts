import { z } from 'zod'

// Common validation schemas
export const commonSchemas = {
  id: z.string().uuid('Invalid UUID format'),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format').optional(),
  url: z.string().url('Invalid URL format').optional(),
  positiveInteger: z.number().int().positive('Must be a positive integer'),
  nonNegativeInteger: z.number().int().min(0, 'Must be non-negative'),
  currency: z.number().multipleOf(0.01, 'Currency must have at most 2 decimal places'),
  percentage: z.number().min(0).max(100, 'Percentage must be between 0 and 100'),
  dateString: z.string().datetime('Invalid ISO date format'),
  nonEmptyString: z.string().min(1, 'Cannot be empty'),
  optionalString: z.string().optional(),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }),
  address: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(1, 'Country is required').default('US')
  })
}

// User validation schemas
export const userSchemas = {
  create: z.object({
    email: commonSchemas.email,
    password: z.string().min(8, 'Password must be at least 8 characters'),
    fullName: z.string().min(1, 'Full name is required'),
    role: z.enum(['admin', 'sales_rep', 'manager', 'viewer']),
    territory: z.string().optional(),
    phone: commonSchemas.phone,
    isActive: z.boolean().default(true)
  }),
  
  update: z.object({
    email: commonSchemas.email.optional(),
    fullName: z.string().min(1).optional(),
    role: z.enum(['admin', 'sales_rep', 'manager', 'viewer']).optional(),
    territory: z.string().optional(),
    phone: commonSchemas.phone,
    isActive: z.boolean().optional()
  }),
  
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string()
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }),
  
  login: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, 'Password is required')
  })
}

// Organization validation schemas
export const organizationSchemas = {
  create: z.object({
    name: z.string().min(1, 'Organization name is required'),
    type: z.enum(['restaurant', 'distributor', 'supplier', 'chain', 'other']),
    industry: z.string().optional(),
    website: commonSchemas.url,
    phone: commonSchemas.phone,
    email: commonSchemas.email.optional(),
    address: commonSchemas.address,
    parentOrganizationId: commonSchemas.id.optional(),
    priority: z.enum(['high', 'medium', 'low']).default('medium'),
    segment: z.enum(['enterprise', 'mid_market', 'small_business']).optional(),
    annualRevenue: commonSchemas.currency.optional(),
    employeeCount: commonSchemas.positiveInteger.optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    isActive: z.boolean().default(true)
  }),
  
  update: z.object({
    name: z.string().min(1).optional(),
    type: z.enum(['restaurant', 'distributor', 'supplier', 'chain', 'other']).optional(),
    industry: z.string().optional(),
    website: commonSchemas.url,
    phone: commonSchemas.phone,
    email: commonSchemas.email.optional(),
    address: commonSchemas.address.optional(),
    parentOrganizationId: commonSchemas.id.optional(),
    priority: z.enum(['high', 'medium', 'low']).optional(),
    segment: z.enum(['enterprise', 'mid_market', 'small_business']).optional(),
    annualRevenue: commonSchemas.currency.optional(),
    employeeCount: commonSchemas.positiveInteger.optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isActive: z.boolean().optional()
  }),
  
  search: z.object({
    query: z.string().optional(),
    type: z.enum(['restaurant', 'distributor', 'supplier', 'chain', 'other']).optional(),
    priority: z.enum(['high', 'medium', 'low']).optional(),
    segment: z.enum(['enterprise', 'mid_market', 'small_business']).optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    isActive: z.boolean().optional(),
    limit: commonSchemas.positiveInteger.max(100).default(10),
    offset: commonSchemas.nonNegativeInteger.default(0)
  })
}

// Contact validation schemas
export const contactSchemas = {
  create: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: commonSchemas.email.optional(),
    phone: commonSchemas.phone,
    title: z.string().optional(),
    department: z.string().optional(),
    organizationId: commonSchemas.id,
    isPrimary: z.boolean().default(false),
    role: z.enum(['decision_maker', 'influencer', 'user', 'gatekeeper', 'other']).optional(),
    preferredContactMethod: z.enum(['email', 'phone', 'text', 'in_person']).default('email'),
    notes: z.string().optional(),
    socialProfiles: z.object({
      linkedin: commonSchemas.url,
      twitter: commonSchemas.url,
      facebook: commonSchemas.url
    }).optional(),
    isActive: z.boolean().default(true)
  }),
  
  update: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: commonSchemas.email.optional(),
    phone: commonSchemas.phone,
    title: z.string().optional(),
    department: z.string().optional(),
    organizationId: commonSchemas.id.optional(),
    isPrimary: z.boolean().optional(),
    role: z.enum(['decision_maker', 'influencer', 'user', 'gatekeeper', 'other']).optional(),
    preferredContactMethod: z.enum(['email', 'phone', 'text', 'in_person']).optional(),
    notes: z.string().optional(),
    socialProfiles: z.object({
      linkedin: commonSchemas.url,
      twitter: commonSchemas.url,
      facebook: commonSchemas.url
    }).optional(),
    isActive: z.boolean().optional()
  }),
  
  search: z.object({
    query: z.string().optional(),
    organizationId: commonSchemas.id.optional(),
    role: z.enum(['decision_maker', 'influencer', 'user', 'gatekeeper', 'other']).optional(),
    department: z.string().optional(),
    isActive: z.boolean().optional(),
    limit: commonSchemas.positiveInteger.max(100).default(10),
    offset: commonSchemas.nonNegativeInteger.default(0)
  })
}

// Interaction validation schemas
export const interactionSchemas = {
  create: z.object({
    type: z.enum(['call', 'email', 'meeting', 'demo', 'proposal', 'follow_up', 'other']),
    subject: z.string().min(1, 'Subject is required'),
    description: z.string().optional(),
    contactId: commonSchemas.id.optional(),
    organizationId: commonSchemas.id,
    opportunityId: commonSchemas.id.optional(),
    userId: commonSchemas.id,
    scheduledAt: commonSchemas.dateString.optional(),
    completedAt: commonSchemas.dateString.optional(),
    duration: commonSchemas.positiveInteger.optional(), // in minutes
    outcome: z.enum(['positive', 'neutral', 'negative', 'no_response']).optional(),
    nextSteps: z.string().optional(),
    location: z.string().optional(),
    attendees: z.array(z.string()).default([]),
    attachments: z.array(z.object({
      name: z.string(),
      url: z.string(),
      type: z.string()
    })).default([]),
    isCompleted: z.boolean().default(false)
  }),
  
  update: z.object({
    type: z.enum(['call', 'email', 'meeting', 'demo', 'proposal', 'follow_up', 'other']).optional(),
    subject: z.string().min(1).optional(),
    description: z.string().optional(),
    contactId: commonSchemas.id.optional(),
    organizationId: commonSchemas.id.optional(),
    opportunityId: commonSchemas.id.optional(),
    scheduledAt: commonSchemas.dateString.optional(),
    completedAt: commonSchemas.dateString.optional(),
    duration: commonSchemas.positiveInteger.optional(),
    outcome: z.enum(['positive', 'neutral', 'negative', 'no_response']).optional(),
    nextSteps: z.string().optional(),
    location: z.string().optional(),
    attendees: z.array(z.string()).optional(),
    attachments: z.array(z.object({
      name: z.string(),
      url: z.string(),
      type: z.string()
    })).optional(),
    isCompleted: z.boolean().optional()
  }),
  
  search: z.object({
    query: z.string().optional(),
    type: z.enum(['call', 'email', 'meeting', 'demo', 'proposal', 'follow_up', 'other']).optional(),
    contactId: commonSchemas.id.optional(),
    organizationId: commonSchemas.id.optional(),
    opportunityId: commonSchemas.id.optional(),
    userId: commonSchemas.id.optional(),
    outcome: z.enum(['positive', 'neutral', 'negative', 'no_response']).optional(),
    startDate: commonSchemas.dateString.optional(),
    endDate: commonSchemas.dateString.optional(),
    isCompleted: z.boolean().optional(),
    limit: commonSchemas.positiveInteger.max(100).default(10),
    offset: commonSchemas.nonNegativeInteger.default(0)
  })
}

// Opportunity validation schemas
export const opportunitySchemas = {
  create: z.object({
    name: z.string().min(1, 'Opportunity name is required'),
    description: z.string().optional(),
    organizationId: commonSchemas.id,
    contactId: commonSchemas.id.optional(),
    userId: commonSchemas.id,
    stage: z.enum(['prospecting', 'qualifying', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).default('prospecting'),
    value: commonSchemas.currency.optional(),
    probability: commonSchemas.percentage.default(0),
    expectedCloseDate: commonSchemas.dateString.optional(),
    actualCloseDate: commonSchemas.dateString.optional(),
    source: z.enum(['website', 'referral', 'cold_call', 'trade_show', 'advertising', 'other']).optional(),
    competitorNotes: z.string().optional(),
    lossReason: z.string().optional(),
    products: z.array(z.object({
      productId: commonSchemas.id,
      quantity: commonSchemas.positiveInteger,
      unitPrice: commonSchemas.currency,
      discount: commonSchemas.percentage.default(0)
    })).default([]),
    tags: z.array(z.string()).default([]),
    isActive: z.boolean().default(true)
  }),
  
  update: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    contactId: commonSchemas.id.optional(),
    stage: z.enum(['prospecting', 'qualifying', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).optional(),
    value: commonSchemas.currency.optional(),
    probability: commonSchemas.percentage.optional(),
    expectedCloseDate: commonSchemas.dateString.optional(),
    actualCloseDate: commonSchemas.dateString.optional(),
    source: z.enum(['website', 'referral', 'cold_call', 'trade_show', 'advertising', 'other']).optional(),
    competitorNotes: z.string().optional(),
    lossReason: z.string().optional(),
    products: z.array(z.object({
      productId: commonSchemas.id,
      quantity: commonSchemas.positiveInteger,
      unitPrice: commonSchemas.currency,
      discount: commonSchemas.percentage.default(0)
    })).optional(),
    tags: z.array(z.string()).optional(),
    isActive: z.boolean().optional()
  }),
  
  search: z.object({
    query: z.string().optional(),
    organizationId: commonSchemas.id.optional(),
    userId: commonSchemas.id.optional(),
    stage: z.enum(['prospecting', 'qualifying', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).optional(),
    source: z.enum(['website', 'referral', 'cold_call', 'trade_show', 'advertising', 'other']).optional(),
    minValue: commonSchemas.currency.optional(),
    maxValue: commonSchemas.currency.optional(),
    expectedCloseStart: commonSchemas.dateString.optional(),
    expectedCloseEnd: commonSchemas.dateString.optional(),
    isActive: z.boolean().optional(),
    limit: commonSchemas.positiveInteger.max(100).default(10),
    offset: commonSchemas.nonNegativeInteger.default(0)
  })
}

// Product validation schemas
export const productSchemas = {
  create: z.object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().optional(),
    sku: z.string().min(1, 'SKU is required'),
    category: z.string().min(1, 'Category is required'),
    subcategory: z.string().optional(),
    brand: z.string().optional(),
    unitPrice: commonSchemas.currency,
    costPrice: commonSchemas.currency.optional(),
    unitOfMeasure: z.string().min(1, 'Unit of measure is required'),
    weight: z.number().positive().optional(),
    dimensions: z.object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
      unit: z.enum(['in', 'cm', 'ft', 'm']).default('in')
    }).optional(),
    nutritionalInfo: z.object({
      calories: commonSchemas.nonNegativeInteger.optional(),
      protein: z.number().min(0).optional(),
      carbs: z.number().min(0).optional(),
      fat: z.number().min(0).optional(),
      fiber: z.number().min(0).optional(),
      sodium: z.number().min(0).optional()
    }).optional(),
    allergens: z.array(z.string()).default([]),
    certifications: z.array(z.string()).default([]),
    shelfLife: commonSchemas.positiveInteger.optional(), // in days
    storageRequirements: z.string().optional(),
    minimumOrderQuantity: commonSchemas.positiveInteger.default(1),
    isActive: z.boolean().default(true),
    imageUrls: z.array(z.string().url()).default([]),
    tags: z.array(z.string()).default([])
  }),
  
  update: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    sku: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    subcategory: z.string().optional(),
    brand: z.string().optional(),
    unitPrice: commonSchemas.currency.optional(),
    costPrice: commonSchemas.currency.optional(),
    unitOfMeasure: z.string().min(1).optional(),
    weight: z.number().positive().optional(),
    dimensions: z.object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
      unit: z.enum(['in', 'cm', 'ft', 'm']).default('in')
    }).optional(),
    nutritionalInfo: z.object({
      calories: commonSchemas.nonNegativeInteger.optional(),
      protein: z.number().min(0).optional(),
      carbs: z.number().min(0).optional(),
      fat: z.number().min(0).optional(),
      fiber: z.number().min(0).optional(),
      sodium: z.number().min(0).optional()
    }).optional(),
    allergens: z.array(z.string()).optional(),
    certifications: z.array(z.string()).optional(),
    shelfLife: commonSchemas.positiveInteger.optional(),
    storageRequirements: z.string().optional(),
    minimumOrderQuantity: commonSchemas.positiveInteger.optional(),
    isActive: z.boolean().optional(),
    imageUrls: z.array(z.string().url()).optional(),
    tags: z.array(z.string()).optional()
  }),
  
  search: z.object({
    query: z.string().optional(),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    brand: z.string().optional(),
    minPrice: commonSchemas.currency.optional(),
    maxPrice: commonSchemas.currency.optional(),
    allergens: z.array(z.string()).optional(),
    certifications: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
    limit: commonSchemas.positiveInteger.max(100).default(10),
    offset: commonSchemas.nonNegativeInteger.default(0)
  })
}