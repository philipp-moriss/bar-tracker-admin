import { useState, useEffect } from 'react'
import { AdminLayout } from '@/core/components/layout/AdminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card'
import { Button } from '@/core/components/ui/button'
import { Badge } from '@/core/components/ui/badge'
import { collection, getDocs, getFirestore } from 'firebase/firestore'
import { firebaseApp } from '@/modules/firebase/config'
import { Database, Users, FileText, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'

interface CollectionInfo {
  name: string
  count: number
  sampleDocs: any[]
  hasUserData: boolean
}

export default function AdminDebugPage() {
  const [collections, setCollections] = useState<CollectionInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Common collection names to check
  const commonCollections = [
    'users', 'userProfiles', 'profiles', 'userData', 'accounts',
    'events', 'tickets', 'ticketGroups', 'payments', 'transactions',
    'notifications', 'settings', 'analytics', 'logs',
    // Additional possible user collections
    'customers', 'members', 'clients', 'participants', 'attendees',
    'userAccounts', 'userInfo', 'userDetails', 'userSettings'
  ]

  const scanCollections = async () => {
    setLoading(true)
    setError(null)
    const foundCollections: CollectionInfo[] = []

    try {
      const db = getFirestore(firebaseApp)

      // First, try to get all collections (this might not work in client SDK)
      // For now, we'll scan the predefined list
      for (const collectionName of commonCollections) {
        try {
          const collectionRef = collection(db, collectionName)
          const snapshot = await getDocs(collectionRef)
          
          if (!snapshot.empty) {
            const sampleDocs = snapshot.docs.slice(0, 3).map(doc => ({
              id: doc.id,
              data: doc.data()
            }))

            // Check if this collection contains user data (more specific check)
            const hasUserData = sampleDocs.some(doc => {
              const data = doc.data
              // Look for specific user-related fields
              return (
                (data.email && typeof data.email === 'string' && data.email.includes('@')) ||
                (data.userId && typeof data.userId === 'string') ||
                (data.uid && typeof data.uid === 'string') ||
                (data.phoneNumber && typeof data.phoneNumber === 'string') ||
                (data.role && ['user', 'bartender', 'admin'].includes(data.role)) ||
                (data.status && ['active', 'inactive', 'blocked'].includes(data.status)) ||
                // Check for user profile fields
                (data.bio || data.preferences || data.socialLinks)
              )
            })

            foundCollections.push({
              name: collectionName,
              count: snapshot.docs.length,
              sampleDocs,
              hasUserData
            })
          }
        } catch (err) {
          console.warn(`Could not access collection ${collectionName}:`, err)
        }
      }

      // If no collections found, try some additional common names
      if (foundCollections.length === 0) {
        const additionalCollections = ['user', 'member', 'customer', 'client', 'participant']
        for (const collectionName of additionalCollections) {
          try {
            const collectionRef = collection(db, collectionName)
            const snapshot = await getDocs(collectionRef)
            
            if (!snapshot.empty) {
              const sampleDocs = snapshot.docs.slice(0, 3).map(doc => ({
                id: doc.id,
                data: doc.data()
              }))

              const hasUserData = sampleDocs.some(doc => {
                const data = doc.data
                return (
                  (data.email && typeof data.email === 'string' && data.email.includes('@')) ||
                  (data.userId && typeof data.userId === 'string') ||
                  (data.uid && typeof data.uid === 'string') ||
                  (data.phoneNumber && typeof data.phoneNumber === 'string') ||
                  (data.role && ['user', 'bartender', 'admin'].includes(data.role)) ||
                  (data.status && ['active', 'inactive', 'blocked'].includes(data.status))
                )
              })

              foundCollections.push({
                name: collectionName,
                count: snapshot.docs.length,
                sampleDocs,
                hasUserData
              })
            }
          } catch (err) {
            // Ignore errors for additional collections
          }
        }
      }

      setCollections(foundCollections)
    } catch (err) {
      setError('Failed to scan collections')
      console.error('Error scanning collections:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    scanCollections()
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Firebase Debug</h1>
            <p className="text-muted-foreground">
              Scan Firebase collections to find user data
            </p>
          </div>
          <Button
            onClick={scanCollections}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Scanning...' : 'Rescan Collections'}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Collections Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Firebase Collections
            </CardTitle>
            <CardDescription>
              Found {collections.length} collections with data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {collections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No collections found. Click "Rescan Collections" to scan Firebase.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {collections.map((collection) => (
                  <Card key={collection.name} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{collection.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          {collection.hasUserData && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Users
                            </Badge>
                          )}
                          <Badge variant="outline">
                            {collection.count} docs
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Sample documents:
                        </p>
                        {collection.sampleDocs.map((doc, index) => (
                          <div key={doc.id} className="text-xs bg-gray-50 p-2 rounded">
                            <div className="font-mono text-gray-600">ID: {doc.id}</div>
                            <div className="mt-1">
                              {Object.keys(doc.data).slice(0, 3).map(key => (
                                <div key={key} className="text-gray-500">
                                  {key}: {typeof doc.data[key] === 'object' ? 
                                    JSON.stringify(doc.data[key]).slice(0, 30) + '...' : 
                                    String(doc.data[key]).slice(0, 30)
                                  }
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Data Summary */}
        {collections.some(c => c.hasUserData) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Data Found
              </CardTitle>
              <CardDescription>
                Collections that contain user information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {collections
                  .filter(c => c.hasUserData)
                  .map(collection => (
                    <div key={collection.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="font-medium">{collection.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {collection.count} documents
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // This would trigger sync for this specific collection
                          console.log(`Sync users from ${collection.name}`)
                        }}
                      >
                        Sync Users
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>1. <strong>Check the collections above</strong> - look for collections with user data</p>
            <p>2. <strong>Click "Sync Users"</strong> on collections that contain user information</p>
            <p>3. <strong>Go back to Users page</strong> to see the synced users</p>
            <p>4. <strong>If no user data found</strong>, check your mobile app's Firebase structure</p>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-800 font-medium">💡 Tip: Check Firebase Console</p>
              <p className="text-blue-700 text-xs mt-1">
                Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline">Firebase Console</a> → 
                Your Project → Firestore Database → Data tab to see all collections
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
