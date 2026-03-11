import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car, Gift, TrendingUp, Calendar, Award, ArrowLeft,
  CreditCard, Star, ChevronRight, Crown, Sparkles, History, Shield
} from 'lucide-react';
import { loyaltyService } from '../services/loyaltyService';
import { AuthContext } from '../context/AuthContext';
import { Button, Card, Badge, TableSkeleton } from '../components/UI';
import { Footer } from '../components/Layout/Footer';

function MyLoyaltyPoints() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [history, setHistory] = useState([]);
  const [redeemValue, setRedeemValue] = useState(100);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadPoints();
    window.scrollTo(0, 0);
  }, [isAuthenticated, navigate]);

  const loadPoints = async () => {
    try {
      setLoading(true);
      const response = await loyaltyService.getMyPoints();
      setTotalPoints(response.data.totalPoints);
      setHistory(response.data.history);
    } catch (error) {
      console.error('Erreur chargement points:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    try {
      setRedeemLoading(true);
      setRedeemMessage('');
      const response = await loyaltyService.redeemPoints(Number(redeemValue));
      const discount = response?.data?.discountAmount || 0;
      setRedeemMessage(`Échange réussi: ${Number(redeemValue)} points = ${discount.toLocaleString('fr-FR')} FCFA`);
      await loadPoints();
    } catch (error) {
      setRedeemMessage(error?.response?.data?.message || 'Impossible d’échanger les points');
    } finally {
      setRedeemLoading(false);
    }
  };

  const getTierInfo = (points) => {
    if (points >= 5000) return { name: 'Platinum', color: 'from-slate-700 to-slate-900', text: 'text-slate-100', icon: Crown, next: null, limit: 5000 };
    if (points >= 2000) return { name: 'Gold', color: 'from-amber-300 to-amber-500', text: 'text-amber-900', icon: Star, next: 5000, limit: 2000 };
    if (points >= 500) return { name: 'Silver', color: 'from-slate-300 to-slate-400', text: 'text-slate-900', icon: Shield, next: 2000, limit: 500 };
    return { name: 'Bronze', color: 'from-orange-700 to-orange-900', text: 'text-orange-100', icon: Award, next: 500, limit: 0 };
  };

  const tier = getTierInfo(totalPoints);
  const progress = tier.next ? ((totalPoints - tier.limit) / (tier.next - tier.limit)) * 100 : 100;

  // Composant Carte Virtuelle
  const VirtualCard = () => (
    <div className={`aspect-video w-full max-w-sm mx-auto rounded-2xl p-6 shadow-2xl relative overflow-hidden bg-gradient-to-br ${tier.color} transition-all duration-500 transform hover:scale-105`}>
      {/* Texture de fond */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>

      <div className="relative z-10 flex flex-col justify-between h-full text-white">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg tracking-wider uppercase opacity-90">AfriRide Elite</h3>
            <p className="text-xs opacity-75">Member Card</p>
          </div>
          <tier.icon className="w-8 h-8 opacity-90" />
        </div>

        <div className="flex items-center gap-4 my-4">
          <div className="w-12 h-8 bg-yellow-200/20 rounded border border-yellow-200/30 backdrop-blur-sm"></div>
          <Sparkles className="w-6 h-6 animate-pulse opacity-75" />
        </div>

        <div>
          <p className="font-mono text-lg tracking-widest mb-2 drop-shadow-md">
            **** **** {user?.phone ? user.phone.slice(-4) : '0000'}
          </p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] uppercase opacity-75">Titulaire</p>
              <p className="font-bold uppercase text-sm tracking-wide">{user?.firstName} {user?.lastName}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase opacity-75">Niveau</p>
              <p className="font-black italic text-lg">{tier.name}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">

      {/* Hero Section */}
      <div className="bg-slate-900 text-white min-h-[400px] relative overflow-hidden pb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/90 z-0"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600 rounded-full filter blur-[100px] opacity-20 animate-pulse"></div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          <button onClick={() => navigate(-1)} className="flex items-center text-slate-400 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-5 h-5 mr-2" /> Retour
          </button>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-center lg:text-left">
              <Badge variant="primary" className="bg-primary-500/20 text-primary-300 border-primary-500/30 backdrop-blur">
                Programme de Fidélité
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-black tracking-tight mb-2">
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Vos points,</span>
                <span className="block text-primary-400">Votre liberté.</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-lg mx-auto lg:mx-0">
                Gagnez des points à chaque trajet et débloquez des récompenses exclusives. Plus vous roulez, plus vous gagnez.
              </p>

              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 max-w-md mx-auto lg:mx-0">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-slate-400 text-sm mb-1 uppercase tracking-wider font-bold">Solde actuel</p>
                    <p className="text-5xl font-black text-white tracking-tighter">{totalPoints.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary-400 font-bold text-xl">{tier.name}</p>
                    <p className="text-xs text-slate-500">Statut actuel</p>
                  </div>
                </div>

                {/* Progress Bar */}
                {tier.next && (
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
                      <span>Progression</span>
                      <span>{Math.round(progress)}% vers {tier.next >= 5000 ? 'Platinum' : tier.next >= 2000 ? 'Gold' : tier.next >= 500 ? 'Silver' : ''}</span>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 text-center">
                      Encore <span className="text-white font-bold">{tier.next - totalPoints} points</span> pour passer au niveau supérieur
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center lg:justify-end perspective-1000">
              <VirtualCard />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl -mt-16 relative z-20">

        {/* Avantages Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { title: 'Gagnez des points', desc: '100 points par réservation complétée + Bonus spéciaux', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
            { title: 'Échangez vos points', desc: 'Convertissez vos points en réductions directes sur vos trajets', icon: Gift, color: 'text-purple-500', bg: 'bg-purple-50' },
            { title: 'Devenez VIP', desc: 'Accès prioritaire, surclassements et support dédié', icon: Crown, color: 'text-amber-500', bg: 'bg-amber-50' },
          ].map((item, i) => (
            <Card key={i} className="p-6 flex items-start gap-4 hover:shadow-xl transition-shadow border-t-4 border-t-primary-500">
              <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
                <item.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Historique et Récompenses */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Section Historique */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
              <History className="w-6 h-6 mr-2 text-slate-400" />
              Historique des transactions
            </h2>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {loading ? (
                <div className="p-6">
                  <TableSkeleton rows={5} columns={3} />
                </div>
              ) : history.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 font-medium">Aucune activité récente.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {history.map((item) => (
                    <div key={item.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.points > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {item.points > 0 ? <TrendingUp className="w-5 h-5" /> : <Gift className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 mb-0.5">
                            {item.reason === 'booking_completed' ? 'Réservation terminée' :
                              item.reason === 'referral' ? 'Parrainage' :
                                item.reason === 'redeemed' ? 'Points utilisés' : 'Bonus'}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className={`font-black text-lg ${item.points > 0 ? 'text-green-600' : 'text-slate-900'}`}>
                        {item.points > 0 ? '+' : ''}{item.points}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Convertisseur Rapide */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
              <Gift className="w-6 h-6 mr-2 text-slate-400" />
              Récompenses
            </h2>

            <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden mb-6">
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-2">Convertir vos points</h3>
                <p className="text-primary-100 text-sm mb-6">Échangez vos points contre des coupons de réduction immédiats.</p>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-4 border border-white/10">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium">Points à échanger</span>
                    <span className="font-bold text-lg">{(Number(redeemValue) * 10).toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={redeemValue}
                    onChange={(e) => setRedeemValue(e.target.value)}
                    className="w-full rounded-lg bg-white text-slate-900 px-3 py-2 text-sm font-semibold outline-none"
                  />
                  <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-full opacity-50"></div>
                  </div>
                  <p className="text-xs text-primary-100 mt-2">Minimum 100 points, par pas de 100</p>
                </div>

                <Button
                  onClick={handleRedeem}
                  disabled={redeemLoading || Number(redeemValue) > totalPoints}
                  className="w-full bg-white text-primary-900 hover:bg-primary-50 border-none font-bold shadow-lg disabled:opacity-60"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {redeemLoading ? 'Conversion...' : 'Convertir maintenant'}
                </Button>
                {redeemMessage && (
                  <p className="text-xs mt-3 text-primary-100">{redeemMessage}</p>
                )}
              </div>

              {/* Decorative circles */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full"></div>
              <div className="absolute top-10 left-10 w-20 h-20 bg-primary-400 opacity-20 rounded-full blur-xl"></div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-900 mb-4">Statut VIP</h4>
              <ul className="space-y-3">
                <li className="flex items-center text-sm text-slate-600">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  Support prioritaire 24/7
                </li>
                <li className="flex items-center text-sm text-slate-600">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  Annulation flexible gratuite
                </li>
                <li className={`flex items-center text-sm ${totalPoints >= 2000 ? 'text-slate-600' : 'text-slate-400 opacity-50'}`}>
                  <CheckCircleIcon className={`w-4 h-4 mr-2 ${totalPoints >= 2000 ? 'text-green-500' : 'text-slate-300'}`} />
                  Surclassement offert (Gold+)
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}

// Petit helper interne pour les icônes manquantes
const CheckCircleIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);

export default MyLoyaltyPoints;
