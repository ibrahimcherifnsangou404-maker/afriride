# 🎨 Guide Complet du Design AfriRide

## 📋 Vue d'ensemble

**AfriRide** a été complètement refondée avec un design **ultra professionnel et qualitatif**. Chaque pixel, couleur et interaction a été pensé pour offrir une expérience premium.

## 🎯 Principes de design

### 1. **Clarté**
- Hiérarchie typographique claire
- Espacements généreux
- Couleurs significatives

### 2. **Cohérence**
- Composants réutilisables
- Styles uniformes
- Patterns répétables

### 3. **Performance**
- Animations fluides (60fps)
- Chargement rapide
- Responsive au premier pixel

### 4. **Accessibilité**
- Contraste WCAG AA+
- Focus states visibles
- Navigation accessible

---

## 🎨 Palette de couleurs

### Primaire (Vert premium)
```
primary-50:   #F0FDF4  (très clair)
primary-100:  #DCFCE7
primary-200:  #BBF7D0
primary-300:  #86EFAC
primary-400:  #4ADE80
primary-500:  #22C55E
primary-600:  #16A34A  ← COULEUR PRINCIPALE
primary-700:  #15803D  ← HOVER
primary-800:  #166534
primary-900:  #145231  (très foncé)
```

### Secondaire (Or premium)
```
secondary-50:   #FFFBEB
secondary-600:  #D97706  ← ACCENT
secondary-900:  #78350F
```

### Neutre (Gris professionnel)
```
slate-50:   #F8FAFC  (arrière-plan)
slate-600:  #475569  (texte secondaire)
slate-900:  #0F172A  (texte principal)
```

---

## 🔤 Typographie

### Polices
- **Inter**: Corps de texte (300-900)
- **Poppins**: Titres (500-900)

### Hiérarchie
```
H1: 48px (3rem)   - Titres héros
H2: 30px (1.875)  - Titres sections
H3: 20px (1.25)   - Sous-titres
Body: 16px (1rem) - Texte normal
Small: 14px (0.875) - Texte secondaire
```

### Usage
```jsx
<h1 className="text-4xl md:text-5xl font-bold">
  Titre principal
</h1>

<h2 className="text-2xl md:text-3xl font-bold">
  Titre de section
</h2>

<p className="text-base text-slate-600">
  Texte normal avec couleur secondaire
</p>
```

---

## 🧩 Composants

### Card (Conteneur premium)
```jsx
<Card hover className="p-6">
  <h3 className="font-bold">Titre</h3>
  <p>Contenu</p>
  <Button>Action</Button>
</Card>
```

**Propriétés:**
- `hover`: Active l'effet hover
- `p-6`: Padding 24px
- Bordure subtle (1px slate-200)
- Ombre med/lg au hover
- Transition smooth (300ms)

### Button (Action primaire)
```jsx
<Button variant="primary" size="md">
  Texte du bouton
</Button>
```

**Variantes:**
- `primary`: Gradient vert (actions principales)
- `secondary`: Gris clair (alternatives)
- `danger`: Rouge (destructrices)
- `outline`: Bordure verte (tertiaires)

**Tailles:**
- `xs`: Petits (12px padding)
- `sm`: Normaux (14px padding)
- `md`: Grands (16px padding)
- `lg`: Très grands (18px padding)

### Badge (Tags/Statuts)
```jsx
<Badge variant="primary" size="sm">
  Premium
</Badge>
```

### Alert (Notifications)
```jsx
<Alert type="error" message="Erreur!" />
<Alert type="success" message="Succès!" />
<Alert type="warning" message="Attention!" />
<Alert type="info" message="Info" />
```

### InputField (Formulaires)
```jsx
<InputField
  label="Email"
  type="email"
  icon={Mail}
  placeholder="votre@email.com"
  error="Email invalide"
/>
```

---

## 🎯 Patterns de layout

### Page simple (Hero + Contenu)
```jsx
<div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
  <Header />
  
  <main className="flex-1">
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      {/* Contenu */}
    </div>
  </main>
  
  <Footer />
</div>
```

### Grille de cartes
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  {items.map(item => (
    <Card key={item.id} hover>
      {/* Contenu */}
    </Card>
  ))}
</div>
```

### Section CTA
```jsx
<section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl p-12 text-center">
  <h2 className="text-3xl font-bold mb-4">Titre</h2>
  <p className="text-primary-100 mb-8">Description</p>
  <Button variant="secondary">Action</Button>
</section>
```

---

## 📱 Responsive Design

### Breakpoints
```
xs (default)  : < 640px   (mobile)
sm            : ≥ 640px   (mobile grand)
md            : ≥ 768px   (tablette)
lg            : ≥ 1024px  (desktop)
xl            : ≥ 1280px  (desktop grand)
2xl           : ≥ 1536px  (desktop très grand)
```

### Grille responsive
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Automatiquement responsive */}
</div>
```

### Text responsive
```jsx
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Redimensionne selon l'écran
</h1>
```

---

## ✨ Animations & Interactions

### Transitions
```jsx
<button className="transition-all duration-300">
  Transition smooth 300ms
</button>
```

### Hover Effects
```jsx
<Card hover className="hover:shadow-lg">
  Ombre amplifiée au hover
</Card>

<div className="hover:-translate-y-2">
  Remonte de 8px au hover
</div>
```

### Animations CSS
```jsx
<div className="animate-fade-in">
  Fondu d'entrée
</div>

<div className="animate-pulse-soft">
  Pulsation douce infinie
</div>
```

---

## 🔍 Exemples pratiques

### Carte produit
```jsx
<Card hover className="overflow-hidden">
  <div className="w-full h-48 bg-primary-100">
    <img src="..." alt="Product" />
  </div>
  
  <div className="p-6">
    <Badge variant="primary" size="sm">Premium</Badge>
    
    <h3 className="text-lg font-bold text-slate-900 my-4">
      Titre du produit
    </h3>
    
    <p className="text-slate-600 mb-6">
      Description courte
    </p>
    
    <div className="flex justify-between items-center">
      <p className="text-2xl font-bold text-primary-600">
        $99.99
      </p>
      <Button size="sm">Commander</Button>
    </div>
  </div>
</Card>
```

### Formulaire multi-étapes
```jsx
<div className="flex gap-2 mb-8">
  {[1, 2, 3].map(step => (
    <div key={step} className="flex-1">
      <div className={`h-1 rounded-full ${
        step <= currentStep 
          ? 'bg-primary-600' 
          : 'bg-slate-200'
      }`} />
    </div>
  ))}
</div>

<Card className="p-8">
  {currentStep === 1 && <Step1 />}
  {currentStep === 2 && <Step2 />}
  {currentStep === 3 && <Step3 />}
</Card>
```

### Hero avec CTA
```jsx
<section className="relative h-screen bg-gradient-to-br from-slate-900 to-primary-900 text-white overflow-hidden">
  <div className="relative container mx-auto px-6 h-full flex items-center">
    <div className="max-w-2xl">
      <h1 className="text-5xl md:text-7xl font-bold mb-6">
        Titre héroïque
      </h1>
      
      <p className="text-xl text-slate-300 mb-8">
        Sous-titre descriptif
      </p>
      
      <div className="flex gap-4">
        <Button size="lg">Action primaire</Button>
        <Button variant="outline" size="lg">
          Action secondaire
        </Button>
      </div>
    </div>
  </div>
</section>
```

---

## 🚀 Checklist pour nouvelles pages

- [ ] Importer `Header` et `Footer`
- [ ] Wrapper avec gradient background
- [ ] Layout: `flex flex-col min-h-screen`
- [ ] Utiliser `Container` pour le contenu
- [ ] Utiliser `Card` pour les conteneurs
- [ ] Utiliser `Button` pour les actions
- [ ] Responsive: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- [ ] Tester sur mobile/tablette/desktop
- [ ] Vérifier le contraste (WCAG AA)
- [ ] Valider les animations (60fps)

---

## 📚 Ressources

### Documentation Tailwind
- https://tailwindcss.com/docs

### Icônes (Lucide React)
- https://lucide.dev

### Couleurs
- https://chir.mmazzarello.com/

### Typographie
- Inter: https://fonts.google.com/specimen/Inter
- Poppins: https://fonts.google.com/specimen/Poppins

---

## 🎓 Conseils pro

1. **Toujours utiliser les composants**
   - Ne pas écrire de CSS personnalisé
   - Réutiliser les patterns existants

2. **Respecter l'espacement**
   - Gap entre items: `gap-8` (32px)
   - Padding conteneur: `p-6` (24px)
   - Margin vertical: `my-8` (32px)

3. **Cohérence des couleurs**
   - Primaire pour actions
   - Gris pour texte
   - Rouges pour erreurs

4. **Tester responsive**
   - Mobile d'abord (xs)
   - Puis tablette (md)
   - Puis desktop (lg+)

5. **Performance**
   - Optimiser les images
   - Pas d'animations lourdes
   - Lazy load les contenus

---

**Créé avec ❤️ pour AfriRide**
**Dernière mise à jour: 14 janvier 2026**
