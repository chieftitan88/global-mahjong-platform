import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  displayName?: string
  avatar?: string
  isPremium?: boolean
  rating?: number
}

export interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  session: Session | null
}

class AuthService {
  private listeners: Array<(state: AuthState) => void> = []
  private currentState: AuthState = {
    user: null,
    isLoading: true,
    session: null
  }

  constructor() {
    this.initialize()
  }

  private async initialize() {
    // Get initial session
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
    }

    this.updateState({
      user: session?.user ? this.mapSupabaseUser(session.user) : null,
      isLoading: false,
      session: session
    })

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      this.updateState({
        user: session?.user ? this.mapSupabaseUser(session.user) : null,
        isLoading: false,
        session: session
      })
    })
  }

  private mapSupabaseUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email || '',
      displayName: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
      avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      isPremium: false, // Will be determined from profile data later
      rating: 1500 // Default rating
    }
  }

  private updateState(newState: Partial<AuthState>) {
    this.currentState = { ...this.currentState, ...newState }
    this.listeners.forEach(listener => listener(this.currentState))
  }

  // Subscribe to auth state changes
  onAuthStateChanged(callback: (state: AuthState) => void): () => void {
    this.listeners.push(callback)
    
    // Immediately call with current state
    callback(this.currentState)
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  // Sign in with Google
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })

    if (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }

    return data
  }

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  // Get current user
  getCurrentUser(): AuthUser | null {
    return this.currentState.user
  }

  // Get current session
  getCurrentSession(): Session | null {
    return this.currentState.session
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.currentState.user
  }
}

// Create singleton instance
export const authService = new AuthService() 