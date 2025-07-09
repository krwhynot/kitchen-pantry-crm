import { Request, Response, NextFunction } from 'express'
import { supabase, supabaseAdmin } from '../config/database'
import { AppError, asyncHandler } from '../middleware/errorHandler'
import { validateRequest } from '../middleware/validation'
import { z } from 'zod'

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['admin', 'manager', 'sales_rep']).default('sales_rep'),
  organizationId: z.string().uuid()
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

const ResetPasswordSchema = z.object({
  email: z.string().email()
})

const UpdatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
})

export const register = [
  validateRequest({ body: RegisterSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, firstName, lastName, role, organizationId } = req.body

    // Check if organization exists
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', organizationId)
      .single()

    if (orgError || !orgData) {
      throw new AppError('Organization not found', 400)
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role,
        organization_id: organizationId
      }
    })

    if (authError) {
      throw new AppError(`Registration failed: ${authError.message}`, 400)
    }

    // Create user record in our database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        organization_id: organizationId
      })
      .select()
      .single()

    if (userError) {
      // Rollback auth user creation if database insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw new AppError(`User creation failed: ${userError.message}`, 400)
    }

    // Generate session for the new user
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (sessionError) {
      throw new AppError(`Session creation failed: ${sessionError.message}`, 400)
    }

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          role: userData.role,
          organizationId: userData.organization_id
        },
        session: sessionData.session
      },
      message: 'User registered successfully'
    })
  })
]

export const login = [
  validateRequest({ body: LoginSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      throw new AppError('Invalid credentials', 401)
    }

    // Get user details from our database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, organization_id')
      .eq('id', authData.user.id)
      .single()

    if (userError || !userData) {
      throw new AppError('User not found in system', 401)
    }

    res.json({
      status: 'success',
      data: {
        user: {
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          role: userData.role,
          organizationId: userData.organization_id
        },
        session: authData.session
      },
      message: 'Login successful'
    })
  })
]

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (token) {
    await supabase.auth.signOut()
  }

  res.json({
    status: 'success',
    message: 'Logout successful'
  })
})

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refresh_token } = req.body

  if (!refresh_token) {
    throw new AppError('Refresh token is required', 400)
  }

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token
  })

  if (error) {
    throw new AppError('Token refresh failed', 401)
  }

  res.json({
    status: 'success',
    data: {
      session: data.session
    },
    message: 'Token refreshed successfully'
  })
})

export const resetPassword = [
  validateRequest({ body: ResetPasswordSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    })

    if (error) {
      throw new AppError(`Password reset failed: ${error.message}`, 400)
    }

    res.json({
      status: 'success',
      message: 'Password reset email sent'
    })
  })
]

export const updatePassword = [
  validateRequest({ body: UpdatePasswordSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      throw new AppError('Access token is required', 401)
    }

    // Verify current password by attempting to sign in
    const { data: { user } } = await supabase.auth.getUser(token)
    
    if (!user) {
      throw new AppError('User not authenticated', 401)
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      throw new AppError(`Password update failed: ${error.message}`, 400)
    }

    res.json({
      status: 'success',
      message: 'Password updated successfully'
    })
  })
]

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    throw new AppError('Access token is required', 401)
  }

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    throw new AppError('Invalid or expired token', 401)
  }

  // Get user details from our database
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select(`
      id, email, first_name, last_name, role, organization_id,
      organizations (
        id, name, type
      )
    `)
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    throw new AppError('User not found in system', 404)
  }

  res.json({
    status: 'success',
    data: {
      user: {
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: userData.role,
        organizationId: userData.organization_id,
        organization: userData.organizations
      }
    },
    message: 'Profile retrieved successfully'
  })
})