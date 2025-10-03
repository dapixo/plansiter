# Contexte du projet Plansitter

## Vue d'ensemble
Plansitter est une application de gestion de baby-sitting construite avec Angular 20, PrimeNG et Supabase.

## Architecture
Le projet suit une **architecture hexagonale (Clean Architecture)** avec séparation stricte des couches :

### Couches
1. **Domain** (`src/domain/`) - Logique métier pure, indépendante du framework
   - `entities/` - Modèles de données (User, Client, Booking, Service, Subject)
   - `repositories/` - Interfaces + InjectionTokens pour l'inversion de dépendance
   - `use-cases/` - Cas d'usage métier

2. **Application** (`src/application/`) - Orchestration
   - `services/` - Services Angular utilisant les use cases, gestion d'état avec signals

3. **Infrastructure** (`src/infrastructure/`) - Implémentations techniques
   - `supabase/` - Implémentations concrètes des repositories + client Supabase
   - `environment/` - Configuration environnement

4. **UI** (`src/ui/`) - Interface utilisateur
   - `pages/` - Pages complètes
   - `components/` - Composants réutilisables
   - `shared/` - Utilitaires

5. **App** (`src/app/`) - Configuration Angular
   - `app.ts` - Composant racine
   - `app.config.ts` - Configuration DI avec providers
   - `app.routes.ts` - Routes

## Principes de développement

### Injection de dépendances
- Les repositories sont injectés via **InjectionToken** (pas directement les interfaces)
- Pattern :
  ```typescript
  // Dans domain/repositories/*.repository.ts
  export const XXX_REPOSITORY = new InjectionToken<IXxxRepository>('IXxxRepository');

  // Dans app.config.ts
  { provide: XXX_REPOSITORY, useClass: XxxSupabaseRepository }

  // Dans les services
  private xxxRepo = inject<IXxxRepository>(XXX_REPOSITORY);
  ```

### État et réactivité
- Utilisation des **signals** Angular pour la gestion d'état
- **RxJS Observables** pour les opérations asynchrones (retour des repositories)

### Style
- **PrimeNG** pour les composants UI
- **Tailwind CSS** pour le styling
- Thème Aura de PrimeNG configuré

## Entités métier

### User
- Représente un utilisateur (peut être client ou baby-sitter)
- Propriétés : id, email, firstName, lastName, phone, role, createdAt, updatedAt

### Client
- Information client liée à un utilisateur
- Propriétés : id, userId, address, preferences, createdAt, updatedAt

### Subject
- Enfant à garder
- Propriétés : id, clientId, firstName, lastName, birthDate, medicalInfo, createdAt, updatedAt

### Service
- Type de service proposé (garde ponctuelle, régulière, etc.)
- Propriétés : id, name, description, basePrice, isActive, createdAt, updatedAt

### Booking
- Réservation de baby-sitting
- Propriétés : id, clientId, sitterId, subjectIds, serviceId, startDate, endDate, status, totalPrice, notes, createdAt, updatedAt

## Stack technique
- **Angular 20** - Framework avec standalone components et signals
- **PrimeNG** - Composants UI
- **Tailwind CSS v3** - Styling utility-first
- **Supabase** - Backend (auth + database)
- **RxJS** - Programmation réactive
- **TypeScript** - Typage statique
- **pnpm** - Package manager

## Configuration importante
- Tailwind CSS v3 (pas v4) pour compatibilité Angular
- Routes définies dans `app.routes.ts` (actuellement vides)
- Authentification Supabase avec pages login et auth-callback
- Variables d'environnement dans `.env` (gitignored)

## Commandes
- `pnpm start` - Démarrer le serveur de dev (localhost:4200)
- `pnpm run build` - Build production
- `pnpm test` - Tests

## État actuel
- Architecture mise en place
- Entités et repositories définis
- Services de base créés (UserService, BookingService, AuthService)
- Use cases de base implémentés
- Page de login créée
- **Aucune route configurée** - Les routes sont à définir
- Application démarre sans erreur sur port 4200
