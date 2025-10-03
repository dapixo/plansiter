# Plansitter

Application de gestion de baby-sitting construite avec Angular 20, PrimeNG et Supabase.

## Architecture du projet

Ce projet suit une **architecture hexagonale (Clean Architecture)** qui sépare clairement les responsabilités et facilite la maintenabilité et les tests.

### Structure des dossiers

```
src/
├── domain/              # Couche Domaine (Business Logic)
│   ├── entities/        # Entités métier (User, Client, Booking, Service, Subject)
│   ├── repositories/    # Interfaces des repositories + Injection Tokens
│   └── use-cases/       # Cas d'usage métier
│       ├── booking/     # Use cases liés aux réservations
│       └── user/        # Use cases liés aux utilisateurs
│
├── application/         # Couche Application
│   └── services/        # Services Angular (orchestration des use cases)
│
├── infrastructure/      # Couche Infrastructure (Détails d'implémentation)
│   ├── supabase/        # Implémentation Supabase
│   │   ├── repositories/  # Implémentations concrètes des repositories
│   │   ├── adapters/      # Adaptateurs pour transformer les données
│   │   └── supabase.client.ts  # Configuration du client Supabase
│   └── environment/     # Configuration d'environnement
│
├── ui/                  # Couche Présentation
│   ├── pages/           # Pages de l'application
│   │   ├── login/       # Page de connexion
│   │   └── auth-callback/  # Callback OAuth
│   ├── components/      # Composants réutilisables
│   └── shared/          # Éléments partagés
│
└── app/                 # Configuration Angular
    ├── app.ts           # Composant racine
    ├── app.html         # Template racine
    ├── app.config.ts    # Configuration (providers, DI)
    └── app.routes.ts    # Définition des routes
```

### Explication de l'architecture

#### 🎯 Domain (Couche Domaine)
Le cœur de l'application, **indépendant de tout framework**.

- **entities/** : Modèles de données métier (User, Client, Booking, etc.)
- **repositories/** : Interfaces définissant les contrats d'accès aux données + Injection Tokens Angular
- **use-cases/** : Logique métier pure (créer un utilisateur, récupérer des bookings, etc.)

#### 🔧 Application (Couche Application)
Orchestration et coordination.

- **services/** : Services Angular qui utilisent les use cases et gèrent l'état avec signals

#### 🔌 Infrastructure (Couche Infrastructure)
Implémentations techniques et détails d'infrastructure.

- **supabase/repositories/** : Implémentations concrètes utilisant Supabase
- **supabase/adapters/** : Transformation des données entre Supabase et le domaine
- **environment/** : Variables d'environnement

#### 🎨 UI (Couche Présentation)
Interface utilisateur Angular.

- **pages/** : Pages complètes de l'application
- **components/** : Composants réutilisables
- **shared/** : Utilitaires partagés

### Principe d'injection de dépendances

Le projet utilise les **Injection Tokens** d'Angular pour l'inversion de dépendance :

1. Les interfaces de repositories sont définies dans `domain/repositories/`
2. Chaque interface expose un `InjectionToken` (ex: `USER_REPOSITORY`)
3. Les implémentations concrètes sont dans `infrastructure/supabase/repositories/`
4. La configuration DI se fait dans `app.config.ts`
5. Les services injectent les repositories via `inject(TOKEN)`

Exemple :
```typescript
// domain/repositories/user.repository.ts
export const USER_REPOSITORY = new InjectionToken<IUserRepository>('IUserRepository');

// app.config.ts
{ provide: USER_REPOSITORY, useClass: UserSupabaseRepository }

// application/services/user.service.ts
private userRepository = inject<IUserRepository>(USER_REPOSITORY);
```

### Technologies utilisées

- **Angular 20** - Framework frontend avec signals
- **PrimeNG** - Bibliothèque de composants UI
- **Tailwind CSS** - Framework CSS utility-first
- **Supabase** - Backend as a Service (authentification, base de données)
- **RxJS** - Programmation réactive
- **TypeScript** - Typage statique

## Installation

```bash
pnpm install
```

## Développement

```bash
pnpm start
```

L'application sera accessible sur `http://localhost:4200/`

## Build

```bash
pnpm run build
```

## Tests

```bash
pnpm test
```

## Configuration Supabase

Créer un fichier `.env` à la racine avec :

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```
