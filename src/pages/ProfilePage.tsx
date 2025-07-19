import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  Trophy, 
  Star, 
  Crown,
  Edit,
  Save,
  X,
  TrendingUp,
  Calendar,
  Globe,
  Award,
  Target,
  Gamepad2
} from 'lucide-react'

interface User {
  id: string
  email: string
  displayName?: string
  avatar?: string
  isPremium?: boolean
  rating?: number
}

interface UserProfile {
  id: string
  userId: string
  displayName: string
  bio?: string
  avatar?: string
  country?: string
  preferredVariant?: string
  gamesPlayed: number
  gamesWon: number
  currentStreak: number
  bestStreak: number
  rating: number
  isPremium: boolean
  createdAt?: string
  settings: {
    soundEnabled: boolean
    videoEnabled: boolean
    autoSort: boolean
    showHints: boolean
  }
  achievements: Array<{
    id: string
    name: string
    description: string
    unlockedAt: string
    icon: string
  }>
  statistics: {
    totalPlayTime: number
    averageGameTime: number
    favoriteTimeToPlay: string
    winRate: number
  }
}

export function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Removed Blink auth and database logic - will be replaced with Supabase
  useEffect(() => {
    // Placeholder for Supabase auth and profile loading
    setLoading(false)
  }, [])

  const handleSaveProfile = async () => {
    if (!profile) return
    
    setSaving(true)
    try {
      // Removed Blink database operations - will be replaced with Supabase
      console.log('Profile save functionality will be restored with Supabase')
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save profile:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-4 mx-auto animate-pulse">
            <div className="w-8 h-8 bg-primary-foreground rounded opacity-50" />
          </div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Unable to load profile data</p>
            <Button onClick={() => {}} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="bg-card/50 mb-8">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
                  <div className="relative">
                    <Avatar className="w-32 h-32">
                      <AvatarImage src={profile.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                                                 {(profile.displayName || user?.email || 'A').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {profile.isPremium && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                        <Crown className="w-5 h-5 text-accent-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="displayName">Display Name</Label>
                          <Input
                            id="displayName"
                            value={profile.displayName}
                            onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                            placeholder="Enter your display name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={profile.bio || ''}
                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                            placeholder="Tell us about yourself..."
                            rows={3}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="country">Country</Label>
                            <Input
                              id="country"
                              value={profile.country || ''}
                              onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                              placeholder="Enter your country"
                            />
                          </div>
                          <div>
                            <Label htmlFor="preferredVariant">Preferred Variant</Label>
                            <Input
                              id="preferredVariant"
                              value={profile.preferredVariant || ''}
                              onChange={(e) => setProfile({ ...profile, preferredVariant: e.target.value })}
                              placeholder="Enter your preferred variant"
                            />
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button onClick={handleSaveProfile} disabled={saving}>
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? 'Saving...' : 'Save Changes'}
                          </Button>
                          <Button variant="outline" onClick={() => setIsEditing(false)}>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center space-x-4 mb-4">
                          <h1 className="text-3xl font-bold">{profile.displayName || 'Anonymous Player'}</h1>
                          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Profile
                          </Button>
                        </div>
                        
                        {profile.bio && (
                          <p className="text-muted-foreground mb-4">{profile.bio}</p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          {profile.country && (
                            <div className="flex items-center space-x-1">
                              <Globe className="w-4 h-4 text-muted-foreground" />
                              <span>{profile.country}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>Joined {new Date(profile.createdAt || '').toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="w-4 h-4 text-muted-foreground" />
                            <span>Prefers {profile.preferredVariant}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card className="bg-card/50 mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Statistics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Trophy className="w-8 h-8 text-primary" />
                      </div>
                      <div className="text-2xl font-bold">{profile.rating}</div>
                      <div className="text-sm text-muted-foreground">Rating</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-accent/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Gamepad2 className="w-8 h-8 text-accent" />
                      </div>
                      <div className="text-2xl font-bold">{profile.gamesPlayed}</div>
                      <div className="text-sm text-muted-foreground">Games Played</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Star className="w-8 h-8 text-green-500" />
                      </div>
                      <div className="text-2xl font-bold">{profile.gamesWon}</div>
                      <div className="text-sm text-muted-foreground">Games Won</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <TrendingUp className="w-8 h-8 text-blue-500" />
                      </div>
                      <div className="text-2xl font-bold">{profile.statistics.winRate.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Win Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="w-5 h-5" />
                    <span>Achievements</span>
                    <Badge variant="secondary">{profile.achievements.length}/0</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.achievements.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 text-green-400">Unlocked</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {profile.achievements.map(achievement => (
                            <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-background/50 rounded-lg border border-green-500/30">
                              <div className="text-2xl">{achievement.icon}</div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h5 className="font-medium">{achievement.name}</h5>
                                  <Badge variant="secondary" className="text-xs">
                                    Unlocked
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{achievement.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {profile.achievements.length === 0 && (
                      <div className="text-center text-muted-foreground">
                        No achievements unlocked yet.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Premium Status */}
              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Crown className="w-5 h-5" />
                    <span>Membership</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.isPremium ? (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-accent/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Crown className="w-8 h-8 text-accent" />
                      </div>
                      <h3 className="font-semibold text-accent mb-2">Premium Member</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Enjoy video chat, exclusive tournaments, and premium features
                      </p>
                      <Button variant="outline" className="w-full">
                        Manage Subscription
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-muted/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Crown className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold mb-2">Free Member</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Upgrade to premium for video chat and exclusive features
                      </p>
                      <Button className="w-full bg-accent hover:bg-accent/90">
                        Upgrade to Premium
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rank</span>
                    <span className="font-medium">#{Math.floor(Math.random() * 1000) + 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Best Streak</span>
                    <span className="font-medium">{Math.floor(Math.random() * 10) + 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tournaments</span>
                    <span className="font-medium">{Math.floor(Math.random() * 5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg. Game Time</span>
                    <span className="font-medium">{Math.floor(Math.random() * 20) + 15}m</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}