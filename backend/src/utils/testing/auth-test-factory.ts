import { 
  TestUser, 
  TestOrganization, 
  createTestUser, 
  createTestOrganization,
  createTestUsers,
  cleanupTestUsers,
  cleanupTestOrganizations
} from './auth-test-utils'

/**
 * Factory for creating different authentication test scenarios
 */
export class AuthTestFactory {
  private createdUsers: TestUser[] = []
  private createdOrganizations: TestOrganization[] = []

  /**
   * Creates a complete authentication test scenario
   */
  async createAuthScenario(scenario: 'basic' | 'multi-user' | 'multi-org' | 'role-based' = 'basic') {
    switch (scenario) {
      case 'basic':
        return this.createBasicScenario()
      case 'multi-user':
        return this.createMultiUserScenario()
      case 'multi-org':
        return this.createMultiOrgScenario()
      case 'role-based':
        return this.createRoleBasedScenario()
      default:
        throw new Error(`Unknown scenario: ${scenario}`)
    }
  }

  /**
   * Basic scenario: One organization, one user
   */
  private async createBasicScenario() {
    const organization = await createTestOrganization({
      name: 'Basic Test Org',
      type: 'restaurant',
      industry: 'food_service'
    })
    this.createdOrganizations.push(organization)

    const user = await createTestUser({
      organizationId: organization.id,
      role: 'sales_rep',
      email: `basic.user.${Date.now()}@example.com`
    })
    this.createdUsers.push(user)

    return {
      organization,
      user,
      users: [user]
    }
  }

  /**
   * Multi-user scenario: One organization, multiple users with different roles
   */
  private async createMultiUserScenario() {
    const organization = await createTestOrganization({
      name: 'Multi User Test Org',
      type: 'catering',
      industry: 'food_service'
    })
    this.createdOrganizations.push(organization)

    const users = await createTestUsers(organization.id)
    this.createdUsers.push(users.admin, users.manager, users.salesRep)

    return {
      organization,
      users: [users.admin, users.manager, users.salesRep],
      admin: users.admin,
      manager: users.manager,
      salesRep: users.salesRep
    }
  }

  /**
   * Multi-org scenario: Multiple organizations with users
   */
  private async createMultiOrgScenario() {
    const organizations = await Promise.all([
      createTestOrganization({
        name: 'Restaurant Group A',
        type: 'restaurant',
        industry: 'fine_dining'
      }),
      createTestOrganization({
        name: 'Catering Company B',
        type: 'catering',
        industry: 'institutional'
      }),
      createTestOrganization({
        name: 'Food Distributor C',
        type: 'distributor',
        industry: 'distribution'
      })
    ])
    this.createdOrganizations.push(...organizations)

    const userSets = await Promise.all(
      organizations.map(org => createTestUsers(org.id))
    )

    const allUsers = userSets.flatMap(set => [set.admin, set.manager, set.salesRep])
    this.createdUsers.push(...allUsers)

    return {
      organizations,
      userSets,
      users: allUsers,
      orgA: {
        organization: organizations[0],
        users: userSets[0]
      },
      orgB: {
        organization: organizations[1],
        users: userSets[1]
      },
      orgC: {
        organization: organizations[2],
        users: userSets[2]
      }
    }
  }

  /**
   * Role-based scenario: Focus on different role permissions
   */
  private async createRoleBasedScenario() {
    const organization = await createTestOrganization({
      name: 'Role Test Organization',
      type: 'restaurant',
      industry: 'food_service'
    })
    this.createdOrganizations.push(organization)

    // Create multiple users for each role to test role-based permissions
    const adminUsers = await Promise.all([
      createTestUser({
        organizationId: organization.id,
        role: 'admin',
        email: `admin1.${Date.now()}@example.com`,
        firstName: 'Admin',
        lastName: 'One'
      }),
      createTestUser({
        organizationId: organization.id,
        role: 'admin',
        email: `admin2.${Date.now()}@example.com`,
        firstName: 'Admin',
        lastName: 'Two'
      })
    ])

    const managerUsers = await Promise.all([
      createTestUser({
        organizationId: organization.id,
        role: 'manager',
        email: `manager1.${Date.now()}@example.com`,
        firstName: 'Manager',
        lastName: 'One'
      }),
      createTestUser({
        organizationId: organization.id,
        role: 'manager',
        email: `manager2.${Date.now()}@example.com`,
        firstName: 'Manager',
        lastName: 'Two'
      })
    ])

    const salesRepUsers = await Promise.all([
      createTestUser({
        organizationId: organization.id,
        role: 'sales_rep',
        email: `salesrep1.${Date.now()}@example.com`,
        firstName: 'Sales',
        lastName: 'Rep One'
      }),
      createTestUser({
        organizationId: organization.id,
        role: 'sales_rep',
        email: `salesrep2.${Date.now()}@example.com`,
        firstName: 'Sales',
        lastName: 'Rep Two'
      })
    ])

    const allUsers = [...adminUsers, ...managerUsers, ...salesRepUsers]
    this.createdUsers.push(...allUsers)

    return {
      organization,
      users: allUsers,
      admins: adminUsers,
      managers: managerUsers,
      salesReps: salesRepUsers,
      roleGroups: {
        admin: adminUsers,
        manager: managerUsers,
        sales_rep: salesRepUsers
      }
    }
  }

  /**
   * Creates test data for authentication flow testing
   */
  async createAuthFlowTestData() {
    const organization = await createTestOrganization({
      name: 'Auth Flow Test Org',
      type: 'restaurant',
      industry: 'food_service'
    })
    this.createdOrganizations.push(organization)

    // Create users for different auth flow scenarios
    const activeUser = await createTestUser({
      organizationId: organization.id,
      role: 'sales_rep',
      email: `active.user.${Date.now()}@example.com`
    })

    const adminUser = await createTestUser({
      organizationId: organization.id,
      role: 'admin',
      email: `admin.user.${Date.now()}@example.com`
    })

    this.createdUsers.push(activeUser, adminUser)

    return {
      organization,
      activeUser,
      adminUser,
      credentials: {
        validLogin: {
          email: activeUser.email,
          password: activeUser.password
        },
        adminLogin: {
          email: adminUser.email,
          password: adminUser.password
        },
        invalidLogin: {
          email: 'invalid@example.com',
          password: 'wrongpassword'
        },
        malformedLogin: {
          email: 'not-an-email',
          password: '123'
        }
      }
    }
  }

  /**
   * Creates test data for token testing
   */
  async createTokenTestData() {
    const organization = await createTestOrganization()
    this.createdOrganizations.push(organization)

    const user = await createTestUser({
      organizationId: organization.id
    })
    this.createdUsers.push(user)

    return {
      organization,
      user,
      tokens: {
        valid: user.accessToken!,
        refresh: user.refreshToken!
      }
    }
  }

  /**
   * Creates test data for permission testing
   */
  async createPermissionTestData() {
    const scenario = await this.createRoleBasedScenario()

    const permissionTests = {
      adminOnly: {
        allowedUsers: scenario.admins,
        deniedUsers: [...scenario.managers, ...scenario.salesReps]
      },
      managerOrAdmin: {
        allowedUsers: [...scenario.admins, ...scenario.managers],
        deniedUsers: scenario.salesReps
      },
      anyRole: {
        allowedUsers: scenario.users,
        deniedUsers: []
      }
    }

    return {
      ...scenario,
      permissionTests
    }
  }

  /**
   * Creates test data for registration flow
   */
  async createRegistrationTestData() {
    const organization = await createTestOrganization()
    this.createdOrganizations.push(organization)

    const validRegistrationData = {
      email: `new.user.${Date.now()}@example.com`,
      password: 'ValidPassword123!',
      firstName: 'New',
      lastName: 'User',
      role: 'sales_rep' as const,
      organizationId: organization.id
    }

    const invalidRegistrationData = [
      {
        ...validRegistrationData,
        email: 'invalid-email',
        _error: 'Invalid email format'
      },
      {
        ...validRegistrationData,
        password: '123',
        _error: 'Password too short'
      },
      {
        ...validRegistrationData,
        firstName: '',
        _error: 'First name required'
      },
      {
        ...validRegistrationData,
        organizationId: 'invalid-uuid',
        _error: 'Invalid organization ID'
      }
    ]

    return {
      organization,
      validRegistrationData,
      invalidRegistrationData
    }
  }

  /**
   * Clean up all created test data
   */
  async cleanup() {
    if (this.createdUsers.length > 0) {
      await cleanupTestUsers(this.createdUsers)
      this.createdUsers = []
    }

    if (this.createdOrganizations.length > 0) {
      await cleanupTestOrganizations(this.createdOrganizations)
      this.createdOrganizations = []
    }
  }

  /**
   * Get all created test data for manual cleanup if needed
   */
  getCreatedData() {
    return {
      users: [...this.createdUsers],
      organizations: [...this.createdOrganizations]
    }
  }
}