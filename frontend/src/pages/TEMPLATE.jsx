import { Header } from '../components/Layout/Header';
import { Footer } from '../components/Layout/Footer';
import { Card, Button, Badge } from '../components/UI';

/**
 * Template de page premium AfriRide
 * 
 * Utilise la structure uniforme:
 * - Header fixe avec navigation
 * - Main avec contenu
 * - Footer premium
 * - Composants réutilisables
 */

function TemplatePageExample() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header Premium Navigation */}
      <Header />

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-6 py-12 max-w-6xl">
          {/* Hero Section */}
          <section className="mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Titre principal
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl">
              Description ou sous-titre de votre page
            </p>
          </section>

          {/* Content Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Card Example */}
            <Card hover className="p-6">
              <Badge variant="primary" size="sm" className="mb-4">Tag</Badge>
              <h3 className="text-lg font-bold text-slate-900 mb-3">
                Titre de la card
              </h3>
              <p className="text-slate-600 mb-6">
                Description courte du contenu
              </p>
              <Button size="sm" variant="outline" className="w-full">
                Action
              </Button>
            </Card>

            {/* Repeat for other cards */}
          </section>

          {/* CTA Section */}
          <section className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl text-white p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Appel à l'action</h2>
            <p className="text-primary-100 mb-8 max-w-xl mx-auto">
              Description motivante pour inciter l'utilisateur
            </p>
            <Button variant="secondary" size="lg">
              Cliquez ici
            </Button>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default TemplatePageExample;

/**
 * BONNES PRATIQUES:
 * 
 * 1. STRUCTURE
 *    - Toujours wrapper dans <div className="min-h-screen...">
 *    - Header en haut, Footer en bas
 *    - Main au milieu avec flex-1
 * 
 * 2. COULEURS
 *    - Primaire: from-primary-600 to-primary-700
 *    - Texte clair: text-slate-50 sur dark
 *    - Texte foncé: text-slate-900 sur light
 * 
 * 3. ESPACEMENTS
 *    - Section gap: gap-8 (32px)
 *    - Cards padding: p-6 (24px)
 *    - Container max: max-w-6xl
 * 
 * 4. COMPOSANTS
 *    - Toujours utiliser Card pour les conteneurs
 *    - Button avec variante appropriée
 *    - Badge pour les tags/statuts
 * 
 * 5. RESPONSIVE
 *    - Mobile-first: grid-cols-1
 *    - Tablette: md:grid-cols-2
 *    - Desktop: lg:grid-cols-3
 * 
 * 6. ANIMATIONS
 *    - Hover: hover:shadow-lg sur Card
 *    - Transition: transition-all duration-300
 *    - Gradients: smooth et naturels
 */

