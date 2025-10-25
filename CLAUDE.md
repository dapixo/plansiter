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
- **TOUJOURS utiliser `inject()` au lieu de `constructor()`**
- Les repositories sont injectés via **InjectionToken** (pas directement les interfaces)
- Pattern :
  ```typescript
  // Dans domain/repositories/*.repository.ts
  export const XXX_REPOSITORY = new InjectionToken<IXxxRepository>('IXxxRepository');

  // Dans app.config.ts
  { provide: XXX_REPOSITORY, useClass: XxxSupabaseRepository }

  // Dans les services/components - TOUJOURS utiliser inject()
  private xxxRepo = inject<IXxxRepository>(XXX_REPOSITORY);
  ```

### État et réactivité
- Utilisation des **signals** Angular pour la gestion d'état
- **RxJS Observables** pour les opérations asynchrones (retour des repositories)

### Gestion d'erreurs et asynchronisme
- **TOUJOURS utiliser RxJS** pour les opérations asynchrones
- **PAS de try/catch** - utiliser les opérateurs RxJS (catchError, etc.)
- **PAS de async/await** - utiliser les Observables et les opérateurs RxJS
- **PAS de logique dans subscribe()** - utiliser les opérateurs RxJS (tap, map, switchMap, etc.)
- **TOUJOURS utiliser takeUntilDestroyed()** pour éviter les fuites mémoire
  - Injecter `DestroyRef` avec `inject(DestroyRef)`
  - Ajouter `takeUntilDestroyed(this.destroyRef)` en dernier opérateur du pipe
- Pattern préféré :
  ```typescript
  // ✅ BON - Opérateurs RxJS + takeUntilDestroyed
  private destroyRef = inject(DestroyRef);

  loadUser(id: string): void {
    this.userRepo.getById(id).pipe(
      tap(user => this.currentUser.set(user)),
      catchError(error => {
        console.error('Error:', error);
        this.errorMessage.set(error.message);
        return EMPTY; // ou of(null) selon le besoin
      }),
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  // ❌ MAUVAIS - Logique dans subscribe + pas de gestion destroy
  loadUser(id: string): void {
    this.userRepo.getById(id).pipe(
      catchError(error => {
        console.error('Error:', error);
        return of(null);
      })
    ).subscribe(user => {
      // ❌ Logique dans subscribe
      if (user) {
        this.currentUser.set(user);
      }
      this.isLoading.set(false);
    });
    // ❌ Pas de takeUntilDestroyed = fuite mémoire
  }

  // ❌ MAUVAIS - async/await
  async getUserById(id: string): Promise<User | null> {
    try {
      return await this.userRepo.getById(id).toPromise();
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  }
  ```

### Formulaires
- **TOUJOURS utiliser Reactive Forms** (ReactiveFormsModule) pour tous les formulaires
- **PAS de ngModel** sauf cas très simple (binding one-way)
- Utiliser `FormBuilder` avec `inject()` pour créer les formulaires
- Pattern préféré :
  ```typescript
  // ✅ BON - Reactive Forms
  private fb = inject(FormBuilder);

  myForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    name: ['', Validators.required]
  });

  onSubmit() {
    if (this.myForm.invalid) return;
    const values = this.myForm.value;
    // ...
  }
  ```
  ```html
  <form [formGroup]="myForm" (ngSubmit)="onSubmit()">
    <input formControlName="email" />
    <button type="submit" [disabled]="myForm.invalid">Submit</button>
  </form>
  ```

  ```typescript
  // ❌ MAUVAIS - ngModel
  email = signal('');
  ```
  ```html
  <input [(ngModel)]="email" />
  ```

### Accessibilité numérique
- **TOUJOURS respecter les standards WCAG 2.1** (niveau AA minimum)
- Utiliser les attributs ARIA appropriés :
  - `aria-label` / `aria-labelledby` pour les éléments interactifs
  - `aria-describedby` pour les descriptions et messages d'aide
  - `aria-invalid` pour les champs en erreur
  - `role` pour définir le rôle sémantique
  - `aria-live` pour les notifications dynamiques
- Structure HTML sémantique :
  - Utiliser les balises appropriées (`<main>`, `<nav>`, `<section>`, `<article>`, etc.)
  - Hiérarchie de titres cohérente (`<h1>` → `<h2>` → `<h3>`)
  - Labels associés aux champs de formulaire
- Navigation au clavier :
  - Tous les éléments interactifs doivent être accessibles au clavier
  - Ordre de tabulation logique
  - Focus visible
- Contraste des couleurs suffisant (ratio 4.5:1 minimum pour le texte)
- Messages d'erreur clairs et associés aux champs concernés

### Style
- **PrimeNG** pour les composants UI
- **Tailwind CSS** pour le styling
- Thème Aura de PrimeNG configuré

### Supabase et authentification
- **TOUJOURS retourner des Observables** depuis SupabaseService (pas de Promise/async/await)
- Utiliser `from()` pour convertir les Promises Supabase en Observables
- **Typage strict** avec les types Supabase (`User`, `Session`, `AuthOtpResponse`, etc.)
- Pattern SupabaseService :
  ```typescript
  // ✅ BON - Observable avec typage
  signInWithOtp(email: string): Observable<AuthOtpResponse> {
    return from(
      this.supabaseClient.auth.signInWithOtp({ email })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response;
      }),
      catchError((error: AuthError) => throwError(() => error))
    );
  }

  // ❌ MAUVAIS - async/await
  async signInWithOtp(email: string) {
    const { data, error } = await this.supabaseClient.auth.signInWithOtp({ email });
    if (error) throw error;
    return data;
  }
  ```

- **Bug connu NavigatorLockManager** avec Angular :
  - Erreur `NavigatorLockAcquireTimeoutError` avec `@supabase/auth-js@2.62.0+`
  - Solution : Utiliser pnpm overrides pour forcer la version 2.61.0
  - Configuration dans `package.json` :
    ```json
    "pnpm": {
      "overrides": {
        "@supabase/supabase-js>@supabase/auth-js": "2.61.0"
      }
    }
    ```

- **AuthService** :
  - Utiliser signals pour l'état d'authentification (`isAuthenticated`, `currentUser`)
  - Centraliser la mise à jour de l'état dans une méthode `updateAuthState()`
  - Utiliser `onAuthStateChange()` pour la synchronisation multi-onglets
  - Appeler `checkSession()` dans le constructor pour restaurer la session

### Internationalisation (i18n)
- **Transloco** pour la gestion des traductions
- **4 langues supportées** : Français (fr), Anglais (en), Espagnol (es), Italien (it)
- Langue par défaut : Français
- Configuration :
  - Loader HTTP personnalisé : `src/infrastructure/i18n/transloco-loader.ts`
  - Configuration Transloco : `src/infrastructure/i18n/transloco.config.ts`
  - Fichiers de traduction : `public/assets/i18n/{lang}.json`

- **Pas de typage strict des traductions** :
  - Les clés de traduction sont des strings simples
  - Plus flexible pour faire évoluer rapidement les traductions
  - Pas de maintenance d'interface TypeScript en parallèle

- **Utilisation dans les composants** :
  ```typescript
  // ✅ BON - Import TranslocoModule et TranslocoService
  import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

  @Component({
    imports: [TranslocoModule, ...]
  })
  export class MyComponent {
    private transloco = inject(TranslocoService);

    // Dans le code TypeScript
    getMessage(): void {
      const msg = this.transloco.translate('auth.login.title');
      console.log(msg);
    }
  }
  ```

  ```html
  <!-- ✅ BON - Pipe transloco dans le template -->
  <h1>{{ 'dashboard.title' | transloco }}</h1>
  <p-button [label]="'auth.login.sendCodeButton' | transloco" />

  <!-- Avec paramètres -->
  <h2>{{ 'dashboard.welcome' | transloco: { name: userName } }}</h2>
  ```

- **Gestion de la langue par URL** :
  - Format des URLs : `/:lang/page` (ex: `/fr/dashboard`, `/en/login`)
  - Langues valides : `fr`, `en`, `es`, `it`
  - Service `LanguageService` pour la gestion centralisée
  - Guard `languageGuard` qui valide et active la langue depuis l'URL
  - Redirection automatique vers la langue préférée si URL invalide

- **Détection de la langue préférée** :
  1. localStorage (clé: `selectedLanguage`) - priorité haute
  2. Langue du navigateur (`navigator.language`) - priorité moyenne
  3. Langue par défaut (français) - fallback

- **Changement de langue** :
  - Via le composant `LanguageSwitcherComponent` dans le dashboard
  - Appel à `languageService.changeLanguage(lang)` qui :
    - Change l'URL (ex: `/fr/dashboard` → `/en/dashboard`)
    - Active la nouvelle langue dans Transloco
    - Sauvegarde dans localStorage
  - Le `languageGuard` synchronise automatiquement Transloco avec l'URL

- **Navigation et guards** :
  - `authGuard` et `guestGuard` préservent le préfixe de langue lors des redirections
  - Route racine `/` redirige vers `/:lang/dashboard` avec langue préférée
  - Wildcard `**` redirige aussi vers la langue préférée

- **Structure des traductions** :
  ```json
  {
    "common": { ... },      // Termes communs (appName, loading, error, success)
    "auth": {
      "login": { ... },     // Formulaire de login
      "otp": { ... },       // Vérification OTP
      "signOut": "..."
    },
    "dashboard": { ... }    // Page dashboard
  }
  ```

## Entités métier

### User
- **Important** : On utilise directement le type `User` de Supabase Auth (`@supabase/supabase-js`)
- Pas de table `users` custom, pas de UserRepository ni UserService
- Les informations utilisateur sont gérées via `user_metadata` dans Supabase Auth
- Principales propriétés utilisées :
  - `id` : UUID de l'utilisateur
  - `email` : Email de l'utilisateur
  - `user_metadata.full_name` : Nom complet (initialisé automatiquement depuis l'email lors du premier login)
  - `created_at` : Date de création du compte
- AuthService expose un `userDisplayName` computed signal pour l'affichage avec fallback

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
- **Transloco** - Internationalisation (i18n) avec 4 langues
- **pnpm** - Package manager

## Configuration importante
- Tailwind CSS v3 (pas v4) pour compatibilité Angular
- Routes définies dans `app.routes.ts` avec guards d'authentification
- Authentification Supabase avec OTP (6 digits)
- Internationalisation avec Transloco - fichiers JSON dans `public/assets/i18n/`
- Variables d'environnement dans `.env` (gitignored)
- Langue préférée stockée dans localStorage

## Commandes
- `pnpm start` - Démarrer le serveur de dev (localhost:4200)
- `pnpm run build` - Build production
- `pnpm test` - Tests

## État actuel
- Architecture mise en place
- Entités et repositories définis (Client, Subject, Service, Booking)
- Services de base créés (AuthService, BookingService, ClientManagementService, LanguageService, BreadcrumbService)
- Use cases de base implémentés
- Authentification complète avec OTP (login + guards) utilisant directement Supabase Auth
- Internationalisation (i18n) complète avec Transloco (fr, en, es, it)
- Pages créées : Login, Dashboard, Account, Planning, Clients, Client Detail, Client Form
- Guards : authGuard (routes protégées), guestGuard (redirection si authentifié), languageGuard
- Application démarre sans erreur sur port 4200
