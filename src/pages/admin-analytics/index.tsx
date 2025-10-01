import { AdminLayout } from '@/core/components/layout/AdminLayout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/core/components/ui/card';
import { AnalyticsService } from '@/core/services/analyticsService';
import { Activity, BarChart3, Calendar, DollarSign, Eye, Users, Star, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/modules/firebase/config';

interface RatingStats {
  totalRatings: number;
  averageRating: number;
  topRatedEvents: Array<{
    eventId: string;
    eventName: string;
    averageRating: number;
    totalRatings: number;
  }>;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export const AdminAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);

  useEffect(() => {
    AnalyticsService.logPageView('Admin Analytics');
    loadRatingStats();
    setLoading(false);
  }, []);

  const loadRatingStats = async () => {
    try {
      // Get all ratings
      const ratingsQuery = query(collection(db, 'eventRatings'));
      const ratingsSnapshot = await getDocs(ratingsQuery);

      // Get all events
      const eventsQuery = query(collection(db, 'events'));
      const eventsSnapshot = await getDocs(eventsQuery);

      const eventsMap = new Map();
      eventsSnapshot.docs.forEach(doc => {
        eventsMap.set(doc.id, { id: doc.id, ...doc.data() });
      });

      // Calculate stats
      const ratings = ratingsSnapshot.docs.map(doc => doc.data());
      const totalRatings = ratings.length;

      if (totalRatings === 0) {
        setRatingStats({
          totalRatings: 0,
          averageRating: 0,
          topRatedEvents: [],
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        });
        return;
      }

      const averageRating = ratings.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings;

      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings.forEach(rating => {
        ratingDistribution[rating.rating as keyof typeof ratingDistribution]++;
      });

      // Calculate per-event stats
      const eventStats = new Map();
      ratings.forEach(rating => {
        const eventId = rating.eventId;
        if (!eventStats.has(eventId)) {
          eventStats.set(eventId, { ratings: [], total: 0 });
        }
        eventStats.get(eventId).ratings.push(rating.rating);
        eventStats.get(eventId).total += rating.rating;
      });

      const topRatedEvents = Array.from(eventStats.entries())
        .map(([eventId, stats]) => {
          const event = eventsMap.get(eventId);
          return {
            eventId,
            eventName: event?.name || 'Unknown Event',
            averageRating: stats.total / stats.ratings.length,
            totalRatings: stats.ratings.length
          };
        })
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 5);

      setRatingStats({
        totalRatings,
        averageRating: Math.round(averageRating * 10) / 10,
        topRatedEvents,
        ratingDistribution
      });
    } catch (error) {
      console.error('Error loading rating stats:', error);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600">Reports and statistics overview</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                +0% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                +0% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ratings</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ratingStats?.totalRatings || 0}</div>
              <p className="text-xs text-muted-foreground">
                Average: {ratingStats?.averageRating || 0}/5
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ratingStats?.averageRating || 0}</div>
              <p className="text-xs text-muted-foreground">
                Out of 5 stars
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Rated Events</CardTitle>
            </CardHeader>
            <CardContent>
              {ratingStats?.topRatedEvents.length ? (
                <div className="space-y-4">
                  {ratingStats.topRatedEvents.map((event, index) => (
                    <div key={event.eventId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{event.eventName}</p>
                          <p className="text-xs text-gray-500">{event.totalRatings} ratings</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">{event.averageRating.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <Star className="h-12 w-12 mx-auto mb-4" />
                    <p>No ratings available</p>
                    <p className="text-sm">Event ratings will appear here</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {ratingStats ? (
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = ratingStats.ratingDistribution[rating as keyof typeof ratingStats.ratingDistribution];
                    const percentage = ratingStats.totalRatings > 0 ? (count / ratingStats.totalRatings) * 100 : 0;

                    return (
                      <div key={rating} className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1 w-8">
                          <span className="text-sm font-medium">{rating}</span>
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 w-12">{count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                    <p>No data available</p>
                    <p className="text-sm">Rating distribution will appear here</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Analytics Service</span>
                <span className="text-sm text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Data Collection</span>
                <span className="text-sm text-green-600">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Update</span>
                <span className="text-sm text-gray-500">Just now</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};
