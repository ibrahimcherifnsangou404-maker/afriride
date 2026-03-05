# 🎨 Guide de Design - AfriRide

## Système de couleurs premium

### Palette primaire
- **Primary-600** : `#16A34A` - Couleur principale AfriRide
- **Primary-700** : `#15803D` - Variante foncée pour les interactions
- **Secondary-600** : `#D97706` - Couleur d'accent (or)

### Palette neutre
- **Slate-50** : `#F8FAFC` - Arrière-plans clairs
- **Slate-900** : `#0F172A` - Texte principal
- **Slate-600** : `#475569` - Texte secondaire

## Typographie

### Familles de polices
- **UI** : Inter (sans-serif, 300-900)
- **Titres** : Poppins (sans-serif, 500-900)

### Hiérarchie typographique
- **H1** : 3rem (48px) - Héros, titres principaux
- **H2** : 1.875rem (30px) - Titres de section
- **H3** : 1.25rem (20px) - Sous-titres
- **Body** : 1rem (16px) - Texte normal
- **Small** : 0.875rem (14px) - Texte secondaire

## Composants

### Card
- Border : `border-slate-200`
- Radius : `rounded-xl` (12px)
- Shadow : `shadow-md` (hover: `shadow-lg`)
- Transition : `duration-300`

### Button
**Variantes :**
1. **Primary** - Gradient vert (action principale)
2. **Secondary** - Gris clair (actions secondaires)
3. **Danger** - Rouge (destructives)
4. **Outline** - Bordure verte (alternative)

**Tailles :**
- `xs` : 12px padding
- `sm` : 14px padding
- `md` : 16px padding
- `lg` : 18px padding

### Input
- Border : `border-slate-300`
- Focus ring : `ring-2 ring-primary-500`
- Radius : `rounded-lg`
- Padding : `px-4 py-3`

### Badge
- Fond : Couleur primaire 100
- Texte : Couleur primaire 800
- Radius : `rounded-full`

## Espacement

### Grid Gap
- Petit : `gap-4` (16px)
- Moyen : `gap-6` (24px)
- Large : `gap-8` (32px)

### Padding/Margin
- Petit : `p-4` / `m-4` (16px)
- Moyen : `p-6` / `m-6` (24px)
- Large : `p-8` / `m-8` (32px)

## Shadows

- **xs** : `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- **sm** : `0 1px 3px 0 rgba(0, 0, 0, 0.1)`
- **md** : `0 4px 6px -1px rgba(0, 0, 0, 0.1)`
- **lg** : `0 10px 15px -3px rgba(0, 0, 0, 0.1)`
- **premium** : `0 20px 25px -5px rgba(22, 163, 74, 0.15)`

## Animations

### Transitions
- Défaut : `transition-all duration-200`
- Lente : `transition-all duration-300`
- Rapide : `transition-all duration-100`

### Animations
- `animate-fade-in` : Fondu d'entrée
- `animate-slide-in-right` : Glissement par la droite
- `animate-pulse-soft` : Pulsation douce

## Breakpoints

- **xs** : Mobile (0px)
- **sm** : Tablette petit (640px)
- **md** : Tablette (768px)
- **lg** : Desktop (1024px)
- **xl** : Desktop large (1280px)
- **2xl** : Desktop très large (1536px)

## Best Practices

1. **Cohérence** : Utilisez les couleurs, espacements et composants définis
2. **Accessibilité** : Maintenir un contraste de couleur suffisant (WCAG AA)
3. **Performance** : Optimiser les images, utiliser des CDN
4. **Responsive** : Tester sur tous les breakpoints
5. **Animations** : Garder les animations fluides (60fps)

## Exemple d'utilisation

```jsx
import { Card, Button, Badge, InputField } from './components/UI';

export function Example() {
  return (
    <Card hover className="p-8">
      <Badge variant="primary">Premium</Badge>
      <h2 className="text-2xl font-bold text-slate-900 my-4">
        Titre premium
      </h2>
      <InputField 
        label="Email" 
        placeholder="votre@email.com"
      />
      <Button variant="primary" size="md" className="mt-4">
        Soumettre
      </Button>
    </Card>
  );
}
```
