import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, Timestamp, query, where } from 'firebase/firestore';
import { db } from '@/modules/firebase/config';
import { AdminLayout } from '@/core/components/layout/AdminLayout';
import { Button } from '@/core/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/inputs/input';

export default function AdminDebugPage() {
  const [ticketsCount, setTicketsCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [userTicketsLoading, setUserTicketsLoading] = useState(false);
  const [allCollections, setAllCollections] = useState<Array<{name: string, count: number, sample?: any}>>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Check tickets collection
      const ticketsSnapshot = await getDocs(collection(db, 'tickets'));
      setTicketsCount(ticketsSnapshot.size);
      
      // Check other possible ticket collections
      const possibleCollections = ['ticket', 'ticketGroups', 'purchases', 'userTickets', 'myTickets', 'profiles'];
      console.log('Checking all collections...');
      
      const collectionsData: Array<{name: string, count: number, sample?: any}> = [];
      
      for (const collectionName of possibleCollections) {
        try {
          const snapshot = await getDocs(collection(db, collectionName));
          console.log(`Collection '${collectionName}': ${snapshot.size} documents`);
          
          const collectionInfo = {
            name: collectionName,
            count: snapshot.size,
            sample: snapshot.size > 0 ? snapshot.docs[0].data() : undefined
          };
          
          collectionsData.push(collectionInfo);
          
          if (snapshot.size > 0) {
            console.log(`Found data in '${collectionName}':`, snapshot.docs[0].data());
          }
        } catch (error) {
          console.log(`Collection '${collectionName}' does not exist or no access`);
          collectionsData.push({ name: collectionName, count: 0 });
        }
      }
      
      setAllCollections(collectionsData);
      
      // Check events collection
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      setEventsCount(eventsSnapshot.size);
      
      // Check users collection
      const usersSnapshot = await getDocs(collection(db, 'users'));
      setUsersCount(usersSnapshot.size);
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('Error loading data:', message)
    } finally {
      setLoading(false);
    }
  };

  const createTestTicket = async () => {
    try {
      setLoading(true);
      
      const testTicket = {
        eventId: 'test-event-1',
        userId: 'test-user-1',
        inviteCode: `TEST-${Date.now()}`,
        qrCode: `QR-${Date.now()}`,
        status: 'active',
        purchaseDate: Timestamp.fromDate(new Date()),
        price: 2500, 
        eventName: 'Test Event',
        eventDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days from now
        eventLocation: 'Test Location',
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      };
      
      await addDoc(collection(db, 'tickets'), testTicket);
      await loadData();
      
      console.log('Test ticket created successfully in tickets collection');
      alert('Test ticket created successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('Error creating test ticket:', message)
      alert('Error creating test ticket: ' + message)
    } finally {
      setLoading(false);
    }
  };

  const createTestTicketInOtherCollection = async (collectionName: string) => {
    try {
      setLoading(true);
      
      const testTicket = {
        eventId: 'test-event-1',
        userId: 'test-user-1',
        inviteCode: `TEST-${Date.now()}`,
        qrCode: `QR-${Date.now()}`,
        status: 'active',
        purchaseDate: Timestamp.fromDate(new Date()),
        price: 2500,
        currency: 'GBP',
        eventName: 'Test Event',
        eventDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        eventLocation: 'Test Location',
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      };
      
      await addDoc(collection(db, collectionName), testTicket);
      await loadData();
      
      console.log(`Test ticket created successfully in ${collectionName} collection`);
      alert(`Test ticket created successfully in ${collectionName} collection!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`Error creating test ticket in ${collectionName}:`, message)
      alert(`Error creating test ticket in ${collectionName}: ` + message)
    } finally {
      setLoading(false);
    }
  };

  const createTestEvent = async () => {
    try {
      setLoading(true);
      
      const testEvent = {
        name: 'Test Event',
        price: '25.00',
        description: 'This is a test event for debugging',
        imageURL: 'https://via.placeholder.com/300x200',
        rating: 4.5,
        startLocation: {
          latitude: 40.7128,
          longitude: -74.0060
        },
        startTime: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        country: 'USA',
        includedDescription: 'Test event includes everything',
        startLocationName: 'New York, NY',
        status: 'active',
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      };
      
      await addDoc(collection(db, 'events'), testEvent);
      await loadData();
      
      console.log('Test event created successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('Error creating test event:', message)
    } finally {
      setLoading(false);
    }
  };

  const checkUserTickets = async () => {
    if (!userId.trim()) return;
    
    try {
      setUserTicketsLoading(true);
      
      const q = query(collection(db, 'tickets'), where('userId', '==', userId.trim()));
      const snapshot = await getDocs(q);
      
      const tickets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUserTickets(tickets);
      console.log(`Found ${tickets.length} tickets for user ${userId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('Error checking user tickets:', message)
    } finally {
      setUserTicketsLoading(false);
    }
  };

  return (
    <AdminLayout title="Firebase Debug" subtitle="Check Firebase collections and create test data">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Collection Status */}
        <Card>
          <CardHeader>
            <CardTitle>Firebase Collections Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800">Tickets</h3>
                <p className="text-2xl font-bold text-blue-600">{ticketsCount}</p>
                <p className="text-sm text-blue-600">documents</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800">Events</h3>
                <p className="text-2xl font-bold text-green-600">{eventsCount}</p>
                <p className="text-sm text-green-600">documents</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-800">Users</h3>
                <p className="text-2xl font-bold text-purple-600">{usersCount}</p>
                <p className="text-sm text-purple-600">documents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Data Creation */}
        <Card>
          <CardHeader>
            <CardTitle>Create Test Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={createTestEvent}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Create Test Event
                </Button>
                <Button 
                  onClick={createTestTicket}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Create Test Ticket
                </Button>
                <Button 
                  onClick={loadData}
                  disabled={loading}
                  variant="outline"
                >
                  Refresh Data
                </Button>
              </div>
              
              {loading && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Loading...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* All Collections */}
        <Card>
          <CardHeader>
            <CardTitle>All Firebase Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allCollections.map((collection, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{collection.name}</p>
                    {collection.sample && (
                      <p className="text-xs text-gray-500">
                        Sample: {JSON.stringify(collection.sample, null, 2).substring(0, 100)}...
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{collection.count}</p>
                      <p className="text-xs text-gray-500">documents</p>
                    </div>
                    {(collection.name === 'tickets' || collection.name === 'ticketGroups' || collection.name === 'purchases') && (
                      <Button
                        size="sm"
                        onClick={() => createTestTicketInOtherCollection(collection.name)}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Add Test
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Tickets Check */}
        <Card>
          <CardHeader>
            <CardTitle>Check User Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Input
                  placeholder="Enter User ID to check tickets..."
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={checkUserTickets}
                  disabled={userTicketsLoading || !userId.trim()}
                >
                  Check Tickets
                </Button>
              </div>
              
              {userTicketsLoading && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Checking tickets...</span>
                </div>
              )}
              
              {userTickets.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Found {userTickets.length} tickets:</h4>
                  <div className="space-y-2">
                    {userTickets.map((ticket, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">Invite Code: {ticket.inviteCode}</p>
                            <p className="text-sm text-gray-600">Event: {ticket.eventName || 'Unknown'}</p>
                            <p className="text-sm text-gray-600">Status: {ticket.status}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Price: £{(ticket.price / 100).toFixed(2)}</p>
                            <p className="text-xs text-gray-500">
                              {ticket.purchaseDate?.toDate?.()?.toLocaleDateString() || 'No date'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {userTickets.length === 0 && userId && !userTicketsLoading && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">No tickets found for user ID: {userId}</p>
                  <p className="text-yellow-600 text-sm mt-1">
                    This might explain why tickets don't show in mobile app
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting Info */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Mobile App Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Possible Issues:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Mobile app might be looking for tickets in a different collection</li>
                  <li>User authentication mismatch between admin panel and mobile app</li>
                  <li>Mobile app might be filtering tickets by user ID</li>
                  <li>Different Firebase project configuration</li>
                  <li>Mobile app might be using different field names</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Solutions:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Check mobile app Firebase configuration</li>
                  <li>Verify user ID matches between admin and mobile app</li>
                  <li>Check mobile app ticket query filters</li>
                  <li>Ensure mobile app has proper Firestore permissions</li>
                  <li>Check mobile app console for error messages</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}