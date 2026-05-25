# Solara — Conciergerie Immobilière Espagne

Plateforme complète de location de villas et propriétés de luxe en Espagne.

## Structure des fichiers

```
solara-realestate/
├── index.html          ← Page d'accueil (Hero, search, destinations, avis, dons)
├── listings.html       ← Liste des propriétés avec filtres avancés
├── property.html       ← Détail propriété (galerie, calendrier, réservation)
├── booking.html        ← Tunnel de réservation + paiement (style Stripe)
├── admin.html          ← Dashboard administrateur complet
├── css/
│   └── style.css       ← Système de design complet (variables, composants)
└── js/
    ├── app.js          ← Logique partagée (charts, toasts, modals, nav)
    └── data.js         ← Données mock (propriétés, réservations)
```

## Lancement en local

### Option 1 — Python (recommandé, aucune installation requise)

```bash
# Python 3
cd solara-realestate
python3 -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```
Ouvrez ensuite : http://localhost:8080

### Option 2 — Node.js / npx

```bash
cd solara-realestate
npx serve .
# ou
npx http-server . -p 8080
```

### Option 3 — VS Code Live Server
Installez l'extension **Live Server** dans VS Code, puis clic droit sur `index.html` → *Open with Live Server*.

### Option 4 — PHP

```bash
cd solara-realestate
php -S localhost:8080
```

---

## Pages disponibles

| Page | URL | Description |
|------|-----|-------------|
| Accueil | `/index.html` | Hero, recherche, destinations, avis, dons |
| Propriétés | `/listings.html` | Grille filtrée par type, région, prix |
| Détail | `/property.html?id=1` | Galerie, calendrier, booking widget |
| Réservation | `/booking.html` | Infos voyageur + paiement Stripe-style |
| Admin | `/admin.html` | Dashboard complet avec charts |

---

## Palette de couleurs

| Variable | Hex | Usage |
|----------|-----|-------|
| `--terra` | `#C4714A` | Couleur principale (terracotta espagnol) |
| `--ocean` | `#2A6478` | Accent secondaire (bleu méditerranée) |
| `--beige` | `#F5EFE6` | Fond doux |
| `--cream` | `#FDFAF6` | Fond pages |
| `--charcoal` | `#2C2C2C` | Texte principal |

## Fonctionnalités UI

- **Hero animé** : zoom CSS sur fond photographique
- **Barre de recherche flottante** : date picker + destination + filtre invités
- **Filtres sidebar** : type, région, prix (slider), chambres, équipements
- **Galerie lightbox** : navigation clavier + swipe
- **Calendrier de disponibilités** : sélection de plage de dates
- **Calcul de réservation** : total dynamique + montant de don calculé
- **Checkout Stripe-style** : formatage carte en temps réel
- **Admin dashboard** :
  - KPI cards avec indicateurs de tendance
  - Graphiques linéaires et barres (canvas natif)
  - Donut chart taux d'occupation
  - Calendrier Google-style des réservations
  - Table de réservations filtrable
  - Gestion CRUD des propriétés
  - Suivi des dons par association
- **Toasts de notification** : feedback utilisateur
- **Modals animées** : formulaire d'ajout de propriété
- **Responsive** : mobile-first sur toutes les pages
- **Animations** : hover, transitions, page-enter, scroll reveal

## Notes techniques

- Zéro dépendances — HTML/CSS/JS vanilla pur
- Données mock via `js/data.js` (remplaçable par une vraie API)
- Les images viennent d'Unsplash (CDN, requiert internet)
- Les graphiques utilisent l'API Canvas native (aucune lib externe)
- Paiement simulé (aucune vraie transaction)
