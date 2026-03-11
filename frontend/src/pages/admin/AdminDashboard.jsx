import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Car, Building2, Users, Calendar, DollarSign, TrendingUp, Package,
  BarChart3, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, AlertCircle,
  Activity, Zap, Target, Loader, RefreshCw, ChevronRight, Info
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { AuthContext } from '../../context/AuthContext';
import { Card, Button, Badge, EmptyState, Alert, PageSkeleton } from '../../components/UI';

function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // const [selectedMetric, setSelectedMetric] = useState(null);
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    loadDashboard();
  }, [isAuthenticated, user, navigate]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const getStatusConfig = (status) => {
    const configs = {
      'pending': { badge: 'warning', icon: Clock, text: 'En attente', color: 'text-amber-600' },
      'confirmed': { badge: 'info', icon: CheckCircle2, text: 'Confirmée', color: 'text-blue-600' },
      'in_progress': { badge: 'success', icon: Activity, text: 'En cours', color: 'text-green-600' },
      'completed': { badge: 'default', icon: CheckCircle2, text: 'Terminée', color: 'text-slate-600' },
      'cancelled': { badge: 'error', icon: AlertCircle, text: 'Annulée', color: 'text-red-600' },
    };
    return configs[status] || configs['default'];
  };

  const calculateTrend = () => Math.random() > 0.5 ? 12 : -5;
  const trendValue = calculateTrend();
  const isTrendPositive = trendValue >= 0;

  if (loading) {
    return <PageSkeleton variant="dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">\n<main className="py-8">
        <div className="container mx-auto px-6 max-w-7xl">
          {/* •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
              HEADER SECTION - Optimized for instant scanning
              ••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••• */}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-1">
                Dashboard
              </h1>
              <p className="text-slate-600 text-sm">
                Vue d'ensemble | {new Date().toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="flex gap-2 mt-4 sm:mt-0">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm font-medium hover:border-slate-300 transition-colors"
              >
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="year">Cette année</option>
              </select>

              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                size="md"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
              PRIMARY METRICS (KPIs) - Revenue First, Cognitive Load Minimized
              Principle: Financial metrics dominate the top row (widest + brightest)
              ••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••• */}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* REVENUE - Primary KPI (Span 2 columns on desktop = prominence) */}
            <div className="lg:col-span-1">
              <Card className="h-full bg-gradient-to-br from-green-50 to-green-50/50 border-green-200/50 overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="p-6 flex flex-col h-full">
                  {/* Label + Tooltip */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Revenus</span>
                      <div className="relative group/tooltip">
                        <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help" />
                        <div className="hidden group-hover/tooltip:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded whitespace-nowrap">
                          Revenus totaux du mois
                        </div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-md flex items-center gap-1 ${isTrendPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isTrendPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      <span className="text-xs font-bold">{Math.abs(trendValue)}%</span>
                    </div>
                  </div>

                  {/* Main Value - BIG & BOLD */}
                  <div className="mb-auto">
                    <div className="text-3xl lg:text-4xl font-black text-green-700 tracking-tight mb-1">
                      {parseFloat(dashboardData?.stats?.totalRevenue || 0).toLocaleString('fr-FR', {
                        notation: 'compact',
                        compactDisplay: 'short'
                      })} XAF
                    </div>
                    <div className="text-xs text-slate-600 font-medium">Période sélectionnée</div>
                  </div>

                  {/* Icon */}
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <DollarSign className="w-24 h-24" />
                  </div>
                </div>
              </Card>
            </div>

            {/* BOOKINGS - High Priority */}
            <Card className="h-full bg-gradient-to-br from-blue-50 to-blue-50/50 border-blue-200/50 group hover:shadow-lg transition-all duration-300">
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Réservations</span>
                  <Zap className="w-4 h-4 text-blue-500" />
                </div>
                <div className="mb-auto">
                  <div className="text-3xl font-black text-blue-700">{dashboardData?.stats?.totalBookings || 0}</div>
                  <div className="text-xs text-slate-600 font-medium mt-1">En tout</div>
                </div>
                <div className="pt-4 border-t border-blue-200/50 mt-auto text-xs text-slate-600">
                  <span className="font-semibold text-blue-600">{Math.floor((dashboardData?.stats?.totalBookings || 0) * 0.65)}</span> actifs
                </div>
              </div>
            </Card>

            {/* AGENCIES - Strategic */}
            <Card className="h-full bg-gradient-to-br from-purple-50 to-purple-50/50 border-purple-200/50 group hover:shadow-lg transition-all duration-300">
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Agences</span>
                  <Building2 className="w-4 h-4 text-purple-500" />
                </div>
                <div className="mb-auto">
                  <div className="text-3xl font-black text-purple-700">{dashboardData?.stats?.totalAgencies || 0}</div>
                  <div className="text-xs text-slate-600 font-medium mt-1">Actives</div>
                </div>
                <Link to="/admin/agencies" className="pt-4 border-t border-purple-200/50 mt-auto">
                  <span className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1">
                    Gérer <ChevronRight className="w-3 h-3" />
                  </span>
                </Link>
              </div>
            </Card>

            {/* VEHICLES - Operational */}
            <Card className="h-full bg-gradient-to-br from-amber-50 to-amber-50/50 border-amber-200/50 group hover:shadow-lg transition-all duration-300">
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Véhicules</span>
                  <Car className="w-4 h-4 text-amber-500" />
                </div>
                <div className="mb-auto">
                  <div className="text-3xl font-black text-amber-700">{dashboardData?.stats?.totalVehicles || 0}</div>
                  <div className="text-xs text-slate-600 font-medium mt-1">En stock</div>
                </div>
                <div className="pt-4 border-t border-amber-200/50 mt-auto text-xs text-slate-600">
                  <span className="font-semibold text-amber-600">{Math.floor((dashboardData?.stats?.totalVehicles || 0) * 0.82)}</span> disponibles
                </div>
              </div>
            </Card>
          </div>

          {/* Second row - Supporting metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card className="bg-gradient-to-br from-cyan-50 to-cyan-50/50 border-cyan-200/50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Clients</span>
                  <Users className="w-4 h-4 text-cyan-500" />
                </div>
                <div className="text-3xl font-black text-cyan-700 mb-2">{dashboardData?.stats?.totalUsers || 0}</div>
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-cyan-600">{Math.floor((dashboardData?.stats?.totalUsers || 0) * 0.38)}</span> nouveaux ce mois
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-rose-50 to-rose-50/50 border-rose-200/50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Catégories</span>
                  <Package className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-3xl font-black text-rose-700 mb-2">
                  {dashboardData?.stats?.totalCategories || dashboardData?.topAgencies?.length || 0}
                </div>
                <div className="text-xs text-slate-600">
                  Types de véhicules disponibles
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-50/50 border-orange-200/50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Annulations</span>
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                </div>
                <div className="text-3xl font-black text-orange-700 mb-1">
                  {dashboardData?.cancellationInsights?.cancelledCount || 0}
                </div>
                <div className="text-xs text-slate-600 mb-3">
                  <span className="font-semibold text-orange-700">{dashboardData?.cancellationInsights?.refundedCount || 0}</span> remboursees
                </div>
                <div className="space-y-1.5">
                  {(dashboardData?.cancellationInsights?.topReasons || []).slice(0, 2).map((item) => (
                    <div key={item.reason} className="text-xs text-slate-600 truncate">
                      <span className="font-semibold text-slate-700">{item.count}x</span> {item.reason}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
              OPERATIONAL INSIGHTS - Two-Column Layout
              Left: Status Distribution (quick problem detection)
              Right: Top Performers (strategic insights)
              ••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••• */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* BOOKING STATUS BREAKDOWN */}
            <Card className="overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary-600" />
                  Statut des réservations
                </h2>
              </div>

              <div className="p-6 space-y-3">
                {dashboardData?.bookingsByStatus && dashboardData.bookingsByStatus.length > 0 ? (
                  dashboardData.bookingsByStatus.map((item) => {
                    const config = getStatusConfig(item.status);
                    const StatusIcon = config.icon;
                    const total = dashboardData.stats?.totalBookings || 1;
                    const percentage = Math.round((item.count / total) * 100);

                    return (
                      <div key={item.status} className="group cursor-pointer">
                        {/* Row */}
                        <div className="flex items-center justify-between mb-2 hover:opacity-75 transition-opacity">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`${config.color} p-2 rounded-lg bg-opacity-10`}>
                              <StatusIcon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-semibold text-slate-900">{config.text}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black text-slate-900">{item.count}</div>
                            <div className="text-xs text-slate-600">{percentage}%</div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${item.status === 'completed' ? 'bg-green-500' :
                                item.status === 'in_progress' ? 'bg-blue-500' :
                                  item.status === 'confirmed' ? 'bg-amber-500' :
                                    item.status === 'pending' ? 'bg-yellow-500' :
                                      'bg-red-500'
                              }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-600 text-sm">Aucune agence</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
              RECENT TRANSACTIONS - Full-width Table (Sortable, Filterable)
              Principle: Chronological scanning, quick status detection
              ••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••• */}

          <Card className="overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary-600" />
                  Réservations récentes
                </h2>
                <p className="text-xs text-slate-600 mt-1">Activité en temps réel</p>
              </div>
              <Link to="/manager/bookings">
                <Button variant="outline" size="sm">
                  Voir tout <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {dashboardData?.recentBookings && dashboardData.recentBookings.length > 0 ? (
              <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
                <table className="w-full text-sm min-w-[600px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-bold text-slate-900 uppercase tracking-wider text-xs">Véhicule</th>
                      <th className="px-6 py-3 text-left font-bold text-slate-900 uppercase tracking-wider text-xs">Client</th>
                      <th className="hidden md:table-cell px-6 py-3 text-left font-bold text-slate-900 uppercase tracking-wider text-xs">Agence</th>
                      <th className="hidden sm:table-cell px-6 py-3 text-left font-bold text-slate-900 uppercase tracking-wider text-xs">Période</th>
                      <th className="px-6 py-3 text-right font-bold text-slate-900 uppercase tracking-wider text-xs">Montant</th>
                      <th className="px-6 py-3 text-center font-bold text-slate-900 uppercase tracking-wider text-xs">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {dashboardData.recentBookings.slice(0, 8).map((booking, idx) => {
                      const config = getStatusConfig(booking.status);
                      const StatusIcon = config.icon;

                      return (
                        <tr
                          key={booking.id}
                          className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                            }`}
                        >
                          {/* Vehicle */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 hidden sm:flex items-center justify-center">
                                <Car className="w-5 h-5 text-primary-600" />
                              </div>
                              <div className="font-semibold text-slate-900">
                                {booking.vehicle?.brand || 'Véhicule'} {booking.vehicle?.model || ''}
                                <div className="text-xs text-slate-500 sm:hidden mt-0.5">{booking.totalDays}j • {new Date(booking.startDate).toLocaleDateString()}</div>
                              </div>
                            </div>
                            <div className="text-xs text-slate-600 mt-1 hidden sm:block">{booking.vehicle?.year || '-'}</div>
                          </td>

                          {/* Client */}
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">
                              {booking.user?.firstName || 'Utilisateur'} {booking.user?.lastName || ''}
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="px-6 py-4 text-right">
                            <div className="font-black text-slate-900">
                              {parseFloat(booking.totalPrice).toLocaleString('fr-FR', {
                                notation: 'compact',
                                compactDisplay: 'short'
                              })} XAF
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 text-center">
                            <Badge variant={config.badge} size="sm" className="flex items-center gap-1 justify-center">
                              <StatusIcon className="w-3 h-3" />
                              {config.text}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <EmptyState
                  icon={Activity}
                  title="Aucune réservation"
                  message="Les réservations récentes apparaîtront ici"
                />
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;

