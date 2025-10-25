# Architecture du projet Plansitter

> 📖 **À qui s'adresse ce document ?**
>
> - **👶 Débutants** : Tu découvres l'architecture logicielle ? Commence par les sections avec 🍔 et 👶
> - **🎓 Intermédiaires** : Tu connais les bases ? Lis les descriptions détaillées de chaque couche
> - **🚀 Seniors** : Tu veux les détails techniques ? Consulte les exemples de code et les flux complets
>
> **Conseil** : Lis d'abord l'analogie du restaurant 🍔, puis le schéma, puis reviens aux détails qui t'intéressent !

---

## 🏗️ Vue d'ensemble

Plansitter utilise une **Architecture Hexagonale (Clean Architecture)** qui sépare clairement les responsabilités en 4 couches principales.

**En une phrase** : On sépare notre code en "étages" pour que chacun ait un rôle précis, comme dans un bâtiment bien organisé.

---

## 📑 Table des matières

### 🌟 Pour débuter (recommandé)
1. [🍔 Analogie : L'architecture comme un restaurant](#-analogie--larchitecture-comme-un-restaurant)
2. [👶 Pour les débutants : Concepts de base](#-pour-les-débutants--concepts-de-base)
3. [📊 Schéma de l'Architecture](#-schéma-de-larchitecture)

### 📚 Comprendre en détail
4. [Description détaillée des couches](#-description-détaillée-des-couches)
   - UI Layer
   - Application Layer
   - Domain Layer
   - Infrastructure Layer
5. [🔗 Flux complet d'une action](#-flux-complet-dune-action)
6. [🎯 Configuration de l'Injection de Dépendances](#-configuration-de-linjection-de-dépendances)

### 🚀 Aller plus loin
7. [🌟 Avantages de cette architecture](#-avantages-de-cette-architecture)
8. [🚀 En pratique : Ajouter une nouvelle fonctionnalité](#-en-pratique--ajouter-une-nouvelle-fonctionnalité)
9. [❓ Questions fréquentes](#-questions-fréquentes)

### 📖 Aide-mémoire
10. [🎓 Cheat Sheet pour débutants](#-cheat-sheet-pour-débutants)
11. [🚨 Erreurs courantes à éviter](#-erreurs-courantes-à-éviter)
12. [💬 Glossaire](#-glossaire-pour-les-débutants)
13. [🎯 Résumé ultra-rapide](#-résumé-ultra-rapide)

---

## 🍔 Analogie : L'architecture comme un restaurant

> **Pour mieux comprendre**, imagine notre application comme un **restaurant** :

### 🎨 **UI Layer** = La Salle du Restaurant
- C'est ce que **voient les clients** : tables, décoration, serveurs
- Les serveurs **prennent les commandes** et **apportent les plats**
- Ils ne cuisinent PAS, ils font juste l'interface entre clients et cuisine

### 🎯 **Application Layer** = Le Chef de Cuisine
- Le chef **coordonne** toute la cuisine
- Il **gère l'état** : combien de plats en cours, qui fait quoi
- Il **délègue** les tâches aux cuisiniers spécialisés
- Il ne cultive pas les légumes lui-même !

### 🏛️ **Domain Layer** = Les Recettes et Règles du Restaurant
- Ce sont les **recettes** : définition des plats, ingrédients nécessaires
- Les **règles** : "Un burger = pain + viande + salade"
- Ces recettes sont **universelles** : elles marchent que tu cuisines au gaz, à l'électrique, ou au feu de bois
- **Aucune mention de la technologie utilisée** (four, frigo, etc.)

### ⚙️ **Infrastructure Layer** = Les Équipements et Fournisseurs
- Le **four** (Supabase) : l'équipement pour cuire
- Les **fournisseurs** de légumes (API externes)
- La **chambre froide** (stockage de données)
- On peut **changer de four** sans changer les recettes !

**Le flux complet** :
```
Client commande un burger (UI)
  → Serveur transmet au Chef (Application/Store)
    → Chef consulte la recette "Burger" (Domain/Entity)
      → Chef demande au cuisinier de préparer (Domain/Repository interface)
        → Le cuisinier utilise le four Supabase (Infrastructure/Repository)
          → Le four cuit la viande (Supabase Cloud)
        → Le plat remonte jusqu'au client
```

---

## 👶 Pour les débutants : Concepts de base

### Qu'est-ce qu'une "couche" (Layer) ?
Une **couche** est comme un **étage d'un bâtiment** :
- Chaque étage a un rôle spécifique
- Les étages communiquent entre eux par des escaliers
- Un étage ne doit pas "sauter" directement à un autre étage (pas de téléportation !)

### Qu'est-ce qu'une "interface" ?
Une **interface** est comme un **contrat** ou un **menu de restaurant** :
- Le menu dit : "Nous servons des burgers" (la promesse)
- Mais il ne dit PAS comment le burger est fait (l'implémentation)
- Le client s'en fiche que ce soit cuit au gaz ou à l'électrique !

**Exemple** :
```typescript
// Interface = Le contrat
interface IClientRepository {
  getById(id: string): Observable<Client>;  // ← Promesse : "Je peux récupérer un client"
}

// Implémentation Supabase = Une façon de tenir la promesse
class ClientSupabaseRepository implements IClientRepository {
  getById(id: string): Observable<Client> {
    return this.supabase.from('clients')...  // ← Comment c'est fait avec Supabase
  }
}

// Implémentation Firebase = Une autre façon de tenir la même promesse
class ClientFirebaseRepository implements IClientRepository {
  getById(id: string): Observable<Client> {
    return this.firebase.collection('clients')...  // ← Comment c'est fait avec Firebase
  }
}
```

Le reste du code ne voit que **l'interface** (le menu), pas l'implémentation (la cuisine).

### Qu'est-ce que l'Injection de Dépendances (DI) ?
Imagine que tu es un serveur au restaurant. Au lieu de :
- ❌ Aller chercher les ingrédients toi-même dans le frigo
- ❌ Choisir quel four utiliser
- ❌ Décider comment cuire

Tu fais :
- ✅ Demander au restaurant : "Donne-moi un cuisinier qualifié"
- ✅ Le restaurant te donne automatiquement le bon cuisinier

**En code** :
```typescript
// ❌ MAUVAIS : Tu crées toi-même tes dépendances
export class ClientStore {
  private repo = new ClientSupabaseRepository(); // ← Couplage fort !
}

// ✅ BON : Tu demandes au framework de te fournir ce dont tu as besoin
export class ClientStore {
  private repo = inject(CLIENT_REPOSITORY); // ← Angular te donne automatiquement le bon repository
}
```

**Avantage** : Demain, si on change de Supabase à Firebase, on change juste la configuration, pas ton code !

---

## 📊 Schéma de l'Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           UI LAYER (Interface)                          │
│                       src/ui/ - Angular Components                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐           │
│  │ ClientsPage    │  │ ServicesPage   │  │ DashboardPage  │           │
│  │  Component     │  │   Component    │  │   Component    │           │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘           │
│           │                   │                    │                    │
└───────────┼───────────────────┼────────────────────┼────────────────────┘
            │                   │                    │
            │  inject()         │  inject()          │  inject()
            ▼                   ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER (Orchestration)                  │
│                   src/application/ - Services & Stores                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  stores/                    services/                           │   │
│  │  ┌──────────────┐          ┌──────────────┐                    │   │
│  │  │ ClientStore  │          │ AuthService  │                    │   │
│  │  │ (signals)    │          │ LanguageServ │                    │   │
│  │  │ ServiceStore │          │ BreadcrumbSrv│                    │   │
│  │  │ SubjectStore │          └──────┬───────┘                    │   │
│  │  └──────┬───────┘                 │                            │   │
│  │         │                         │                            │   │
│  │         │  inject(TOKEN)          │  inject(TOKEN)             │   │
│  │         └─────────┬───────────────┘                            │   │
│  └───────────────────┼──────────────────────────────────────────────┐ │
│                      ▼                                              │ │
│  ┌──────────────────────────────────────────────────────────────┐  │ │
│  │            INJECTION VIA TOKENS (Inversion de contrôle)      │  │ │
│  │  CLIENT_REPOSITORY, SERVICE_REPOSITORY, SUBJECT_REPOSITORY   │  │ │
│  └──────────────────────────────────────────────────────────────┘  │ │
└────────────────────────┼───────────────────────────────────────────┘ │
                         │                                              │
                         ▼                                              │
┌─────────────────────────────────────────────────────────────────────────┐
│                    DOMAIN LAYER (Business Logic)                       │
│                 src/domain/ - Pure TypeScript, NO Angular              │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  entities/                    repositories/                      │ │
│  │  ┌──────────────┐            ┌─────────────────────┐            │ │
│  │  │ Client       │            │ IClientRepository   │            │ │
│  │  │ Service      │            │ (interface)         │            │ │
│  │  │ Subject      │            │ + TOKEN             │            │ │
│  │  │ Booking      │            │                     │            │ │
│  │  │ (User via    │            │ IServiceRepository  │            │ │
│  │  │  Supabase)   │            │ ISubjectRepository  │            │ │
│  │  └──────────────┘            │ IBookingRepository  │            │ │
│  │                              └─────────────────────┘            │ │
│  │                                                                  │ │
│  │  use-cases/ (optionnel pour logique complexe)                   │ │
│  │  ┌────────────────────────────────────┐                         │ │
│  │  │ ValidateBookingUseCase             │                         │ │
│  │  │ CalculatePriceUseCase              │                         │ │
│  │  └────────────────────────────────────┘                         │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                         ▲
                         │ implements (via DI)
                         │
┌─────────────────────────────────────────────────────────────────────────┐
│              INFRASTRUCTURE LAYER (Technical Implementation)            │
│                    src/infrastructure/ - Détails techniques             │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  supabase/                                                       │ │
│  │  ┌──────────────────────┐    ┌───────────────────────┐          │ │
│  │  │ supabase.client.ts   │◄───┤ repositories/         │          │ │
│  │  │ (Supabase SDK)       │    │ ClientSupabaseRepo    │          │ │
│  │  │                      │    │ ServiceSupabaseRepo   │          │ │
│  │  │ from$()              │    │ SubjectSupabaseRepo   │          │ │
│  │  │ auth API             │    │                       │          │ │
│  │  └──────────────────────┘    │ implements            │          │ │
│  │                              │ IClientRepository     │          │ │
│  │                              └───────────────────────┘          │ │
│  │                                                                  │ │
│  │  i18n/                     environment/                         │ │
│  │  ┌──────────────────┐     ┌──────────────────┐                 │ │
│  │  │ transloco.config │     │ environment.ts   │                 │ │
│  │  │ transloco-loader │     │ environment.dev  │                 │ │
│  │  └──────────────────┘     └──────────────────┘                 │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                         │
                         ▼
                ┌────────────────────┐
                │   SUPABASE CLOUD   │
                │   (Database + Auth)│
                └────────────────────┘
```

---

## 📚 Description détaillée des couches

### 🎨 1. UI Layer (`src/ui/`)

**Rôle** : Interface utilisateur - Angular Components

**En termes simples** : C'est la **vitrine** de ton application. Tout ce que l'utilisateur voit et touche.

**📖 Analogie** : Imagine un **distributeur automatique de boissons**
- Les **boutons** que tu appuies (Components)
- L'**écran** qui affiche le menu (Pages)
- Le distributeur ne fabrique PAS les boissons, il les affiche juste et transmet ta demande !

**Contenu** :
- **Components** : Composants réutilisables (boutons, formulaires, cartes, etc.)
- **Pages** : Pages complètes (ClientsPage, ServicesPage, DashboardPage)
- **Responsabilité** : Affichage et interactions utilisateur uniquement
- **Dépend de** : Application Layer (Stores & Services)

**Exemple** :
```typescript
// src/ui/pages/clients/clients.component.ts
export class ClientsComponent {
  readonly store = inject(ClientStore); // ← Injecte depuis Application Layer

  deleteClient(client: Client): void {
    this.store.delete(client.id); // ← Appelle le store
  }
}
```

**Règle** : Les composants UI ne connaissent JAMAIS Supabase ou les repositories directement.

---

### 🎯 2. Application Layer (`src/application/`)

**Rôle** : Orchestration - Gérer l'état et coordonner les actions

**En termes simples** : C'est le **chef d'orchestre** de ton application. Il coordonne tout le monde.

**📖 Analogie** : Imagine le **contrôleur aérien** d'un aéroport
- Il **suit l'état** de tous les avions (loading, error, data)
- Il **coordonne** les décollages et atterrissages
- Il **transmet** les ordres aux pilotes (repositories)
- Mais il ne pilote PAS les avions lui-même !

Cette couche fait le lien entre l'UI et le Domain. Elle contient deux types d'éléments :

#### 2a. `application/stores/`

**Stores avec @ngrx/signals** :
- **ClientStore**, **ServiceStore**, **SubjectStore**
- Gèrent l'**état local** avec des **signals** (réactivité)
- Font le pont entre UI et Domain
- Injectent les repositories via **InjectionTokens**

**Exemple** :
```typescript
// src/application/stores/client.store.ts
export const ClientStore = signalStore(
  withState({ clients: [], loading: false, error: null }),
  withMethods((store, repo = inject<IClientRepository>(CLIENT_REPOSITORY)) => ({
    loadAll: rxMethod<void>(
      pipe(
        switchMap(() => {
          const userId = authService.currentUser()?.id;
          return repo.getByUserId(userId).pipe( // ← Appelle le repository
            tap(clients => patchState(store, { clients }))
          );
        })
      )
    )
  }))
);
```

**Caractéristiques** :
- État réactif (signals)
- Appelle les repositories via les tokens
- Gère le loading/error
- Expose des méthodes simples pour l'UI

#### 2b. `application/services/`

**Services Angular classiques** :
- **AuthService** : Authentification Supabase (gère directement les Users via Supabase Auth, pas de UserRepository)
- **LanguageService** : Internationalisation
- **BreadcrumbService** : Navigation fil d'Ariane
- **ClientManagementService** : Gestion des clients

**Exemple** :
```typescript
// src/application/services/auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);

  private currentUserSignal = signal<User | null>(null);
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  // Computed signal pour l'affichage du nom avec fallback
  readonly userDisplayName = computed(() => {
    const user = this.currentUser();
    if (!user) return 'User';
    return user.user_metadata?.['full_name'] || user.email?.split('@')[0] || 'User';
  });

  signOut(): Observable<void> {
    return this.supabase.signOut().pipe(
      tap(() => this.updateAuthState(null))
    );
  }
}
```

---

### 🏛️ 3. Domain Layer (`src/domain/`)

**Rôle** : Cœur métier - **100% indépendant de toute technologie**

**En termes simples** : Ce sont les **règles du jeu**. Peu importe si tu joues aux échecs sur un échiquier en bois, en plastique, ou sur ton téléphone, **les règles restent les mêmes** !

**📖 Analogie** : Imagine les **règles du football**
- "Un match = 2 équipes de 11 joueurs" (Entity)
- "Un but = le ballon doit franchir la ligne" (Business Rule)
- "L'arbitre peut donner des cartons" (Repository interface)
- Ces règles sont **universelles** : que tu joues sur gazon, synthétique, ou sable !
- **Aucune mention** du type de ballon, de chaussures, ou de stade utilisé

**💡 Règle d'or** : Si tu mentionnes "Angular", "Supabase", "HTTP", ou "Firebase" dans le Domain → C'EST FAUX !

Cette couche est le **cœur** de l'application. Elle ne contient que du TypeScript pur, **AUCUNE dépendance Angular ou Supabase**.

#### 3a. `domain/entities/`

**Interfaces des entités métier** :
- **Client**, **Service**, **Subject**, **Booking**
- Définissent la structure des données métier
- TypeScript pur (pas d'Angular, pas de décorateurs)
- **Note** : Pas d'entité User custom - on utilise le type `User` de `@supabase/supabase-js`

**Exemple** :
```typescript
// src/domain/entities/client.entity.ts
export interface Client {
  id: string;
  userId: string;
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  country: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3b. `domain/repositories/`

**Interfaces (contrats) des repositories** :
- Définissent **ce qu'on peut faire** avec les données (CRUD)
- **InjectionTokens** pour l'injection de dépendances
- **Ne contiennent AUCUNE implémentation** !

**Exemple** :
```typescript
// src/domain/repositories/client.repository.ts
export interface IClientRepository {
  getById(id: string, userId: string): Observable<Client | null>;
  getByUserId(userId: string): Observable<Client[]>;
  create(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Observable<Client>;
  update(id: string, userId: string, client: Partial<Client>): Observable<Client>;
  delete(id: string, userId: string): Observable<void>;
}

// Token pour l'injection de dépendances
export const CLIENT_REPOSITORY = new InjectionToken<IClientRepository>('IClientRepository');
```

**Pourquoi des interfaces ?**
- Permet de changer facilement d'implémentation (Supabase → Firebase)
- Facilite les tests (on peut mocker)
- Principe SOLID : Dependency Inversion

#### 3c. `domain/use-cases/` (optionnel)

**Logique métier complexe** :
- Utilisé uniquement pour de la logique métier qui dépasse le simple CRUD
- Exemples : `ValidateBookingUseCase`, `CalculatePriceUseCase`

**Exemple** :
```typescript
// src/domain/use-cases/calculate-booking-price.use-case.ts
export class CalculateBookingPriceUseCase {
  execute(booking: Booking, service: Service): number {
    const hours = calculateHours(booking.startDate, booking.endDate);
    const basePrice = service.pricePerHour * hours;
    const discount = this.calculateDiscount(hours);
    return basePrice - discount;
  }

  private calculateDiscount(hours: number): number {
    // Logique métier complexe
    if (hours > 10) return 20;
    return 0;
  }
}
```

---

### ⚙️ 4. Infrastructure Layer (`src/infrastructure/`)

**Rôle** : Détails techniques - **Implémentations concrètes**

**En termes simples** : Ce sont les **outils concrets** qu'on utilise. C'est la "plomberie" de l'application.

**📖 Analogie** : Imagine que tu veux **écouter de la musique**
- Le **Domain** dit : "Je veux écouter de la musique" (interface)
- L'**Infrastructure** dit : "OK, voici comment on le fait concrètement :"
  - Avec un **vinyle** → InfrastructureVinylePlayer
  - Avec **Spotify** → InfrastructureSpotifyPlayer
  - Avec un **CD** → InfrastructureCDPlayer
- La musique (les données) reste la même, seul le **lecteur** change !

**💡 C'est ici et SEULEMENT ici** qu'on peut parler de technologies : Supabase, HTTP, localStorage, Firebase, etc.

Cette couche contient tous les détails d'implémentation technique. C'est ici qu'on parle de Supabase, de Transloco, etc.

#### 4a. `infrastructure/supabase/repositories/`

**Implémentations concrètes des repositories** :
- **ClientSupabaseRepository**, **ServiceSupabaseRepository**, **SubjectSupabaseRepository**
- **Implémentent** les interfaces du Domain Layer
- Communiquent avec Supabase via `supabase.client.ts`
- Transforment les données : `ClientRow` (DB snake_case) ↔️ `Client` (Entity camelCase)

**Exemple** :
```typescript
// src/infrastructure/supabase/repositories/client-supabase.repository.ts
type ClientRow = {
  id: string;
  user_id: string;    // ← snake_case (DB)
  name: string;
  created_at: string;
};

@Injectable()
export class ClientSupabaseRepository implements IClientRepository {
  private supabase = inject(SupabaseService);

  getById(id: string, userId: string): Observable<Client | null> {
    return this.supabase.from$('clients', q =>
      q.eq('id', id).eq('user_id', userId).single()
    ).pipe(
      map(res => this.extractData(res)),
      map(row => this.mapToEntity(row)) // ← Transforme en entité
    );
  }

  create(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Observable<Client> {
    const payload = this.toDbPayload(client); // ← Transforme en DB format
    return this.supabase.from$('clients', q => q.insert(payload).select().single()).pipe(
      map(res => this.extractData(res)),
      map(row => this.mapToEntity(row))
    );
  }

  // Transforme ClientRow (DB) → Client (Entity)
  private mapToEntity(row: ClientRow): Client {
    return {
      id: row.id,
      userId: row.user_id,     // ← camelCase pour l'entité
      name: row.name,
      createdAt: new Date(row.created_at),
      // ...
    };
  }

  // Transforme Client (Entity) → ClientRow (DB)
  private toDbPayload(client: Partial<Client>): Partial<ClientRow> {
    return {
      user_id: client.userId,  // ← snake_case pour la DB
      name: client.name,
      // ...
    };
  }
}
```

#### 4b. `infrastructure/supabase/supabase.client.ts`

**Wrapper autour du Supabase SDK** :
- Centralise la connexion Supabase
- Méthode `from$()` : convertit les Promises Supabase → Observables RxJS
- Méthodes d'authentification

**Exemple** :
```typescript
// src/infrastructure/supabase/supabase.client.ts
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabaseClient: SupabaseClient;

  from$<T>(
    table: string,
    query: (q: any) => any
  ): Observable<PostgrestResponse<T>> {
    const queryBuilder = this.supabaseClient.from(table);
    const builtQuery = query(queryBuilder);
    return from(builtQuery); // ← Convertit Promise → Observable
  }

  signInWithOtp(email: string): Observable<AuthOtpResponse> {
    return from(this.supabaseClient.auth.signInWithOtp({ email }));
  }
}
```

#### 4c. `infrastructure/i18n/`

**Configuration internationalisation** :
- `transloco.config.ts` : Configuration Transloco
- `transloco-loader.ts` : Chargement des fichiers de traduction

#### 4d. `infrastructure/environment/`

**Variables d'environnement** :
- `environment.ts` : Config production
- `environment.dev.ts` : Config développement

---

## 🔗 Flux complet d'une action

### Exemple concret : Supprimer un client

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER CLICKS "Delete" button in UI                           │
└──────────────────────┬──────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. ClientsComponent.deleteClient(id)                            │
│    → Calls: this.store.delete(id)                               │
└──────────────────────┬──────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. ClientStore (Application Layer)                              │
│    → Injects: CLIENT_REPOSITORY (InjectionToken)                │
│    → Calls: repo.delete(id, userId)                             │
└──────────────────────┬──────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. IClientRepository (Domain Layer - Interface)                 │
│    → Contract: delete(id: string, userId: string): Observable   │
└──────────────────────┬──────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. ClientSupabaseRepository (Infrastructure Layer)              │
│    → Implements: IClientRepository                              │
│    → Calls: supabase.from$('clients', q => q.delete()...)       │
└──────────────────────┬──────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. SupabaseService.from$()                                      │
│    → Converts: Promise → Observable                             │
│    → Calls: Supabase SDK                                        │
└──────────────────────┬──────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. SUPABASE CLOUD (Database)                                    │
│    → Executes: DELETE FROM clients WHERE id = ? AND user_id = ? │
│    → Returns: Success/Error                                     │
└──────────────────────┬──────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. Observable flows back up to ClientStore                      │
│    → ClientStore updates signal: clients                        │
│    → Removes deleted client from the list                       │
└──────────────────────┬──────────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. UI automatically updates (Signal reactivity)                 │
│    → Client disappears from the list                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Configuration de l'Injection de Dépendances

Dans `src/app/app.config.ts` :

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    // ... autres providers

    // ⚡ C'EST ICI QUE TOUT SE CONNECTE !
    // On dit à Angular : "Quand quelqu'un demande CLIENT_REPOSITORY,
    // donne-lui une instance de ClientSupabaseRepository"
    { provide: CLIENT_REPOSITORY, useClass: ClientSupabaseRepository },
    { provide: SERVICE_REPOSITORY, useClass: ServiceSupabaseRepository },
    { provide: SUBJECT_REPOSITORY, useClass: SubjectSupabaseRepository },
    { provide: BOOKING_REPOSITORY, useClass: BookingSupabaseRepository },

    // Note: Pas de USER_REPOSITORY - on utilise directement Supabase Auth via AuthService
  ]
};
```

**Comment ça marche** :
1. Un Store fait `inject(CLIENT_REPOSITORY)`
2. Angular regarde dans `app.config.ts`
3. Il trouve : `{ provide: CLIENT_REPOSITORY, useClass: ClientSupabaseRepository }`
4. Il retourne une instance de `ClientSupabaseRepository`

**Le pouvoir de l'inversion de contrôle** :
- Le code ne dépend que de l'**interface** (`IClientRepository`)
- Il ne connaît PAS l'implémentation concrète
- On peut facilement changer d'implémentation sans toucher au reste du code

---

## 🌟 Avantages de cette architecture

### ✅ 1. Testabilité maximale

En test, on peut facilement mocker les repositories :

```typescript
// test/mocks/mock-client.repository.ts
export class MockClientRepository implements IClientRepository {
  getById(id: string): Observable<Client | null> {
    return of({ id, name: 'Test Client', /* ... */ });
  }
  // ... autres méthodes mockées
}

// test/client-store.spec.ts
TestBed.configureTestingModule({
  providers: [
    { provide: CLIENT_REPOSITORY, useClass: MockClientRepository } // ← Mock
  ]
});
```

### ✅ 2. Changement de technologie facile

Demain, si vous voulez passer de Supabase à Firebase :

```typescript
// Créer FirebaseClientRepository qui implémente IClientRepository
export class FirebaseClientRepository implements IClientRepository {
  // Implémentation avec Firebase
}

// Dans app.config.ts, changer UNE SEULE LIGNE :
{ provide: CLIENT_REPOSITORY, useClass: FirebaseClientRepository }
// ← Tout le reste du code fonctionne sans modification !
```

### ✅ 3. Séparation des responsabilités claire

| Couche | Responsabilité | Peut dépendre de |
|--------|----------------|------------------|
| **UI** | Affichage uniquement | Application |
| **Application** | État et orchestration | Domain |
| **Domain** | Règles métier | **RIEN** (pur TypeScript) |
| **Infrastructure** | Détails techniques | Domain |

### ✅ 4. Indépendance du framework

Le **Domain Layer** n'a **AUCUNE dépendance Angular** :
- Pas de `@Injectable`
- Pas de `inject()`
- Juste du TypeScript pur

**Avantage** : On pourrait réutiliser les entités et interfaces dans :
- Un backend Node.js
- Une app React
- Un worker background

### ✅ 5. Code maintenable et évolutif

- **Chaque couche a un rôle précis**
- **Les dépendances vont toujours vers le centre** (vers Domain)
- **Facile à comprendre** pour les nouveaux développeurs
- **Facile à faire évoluer** sans casser l'existant

---

## 📝 Résumé en une phrase par couche

| Couche | Question | Réponse |
|--------|----------|---------|
| **UI** | Qu'est-ce que je fais ? | "J'affiche des données et je capture les actions utilisateur" |
| **Application** | Qu'est-ce que je fais ? | "Je coordonne les actions et je gère l'état de l'application" |
| **Domain** | Qu'est-ce que je fais ? | "Je définis les règles métier et les contrats, indépendamment de toute techno" |
| **Infrastructure** | Qu'est-ce que je fais ? | "J'implémente concrètement avec Supabase, HTTP, etc." |

---

## 🚀 En pratique : Ajouter une nouvelle fonctionnalité

### Exemple : Ajouter une entité "Invoice"

#### 1. Domain Layer

```typescript
// src/domain/entities/invoice.entity.ts
export interface Invoice {
  id: string;
  bookingId: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: Date;
}

// src/domain/repositories/invoice.repository.ts
export interface IInvoiceRepository {
  getById(id: string): Observable<Invoice | null>;
  getByBookingId(bookingId: string): Observable<Invoice[]>;
  create(invoice: Omit<Invoice, 'id' | 'createdAt'>): Observable<Invoice>;
  updateStatus(id: string, status: string): Observable<Invoice>;
}

export const INVOICE_REPOSITORY = new InjectionToken<IInvoiceRepository>('IInvoiceRepository');
```

#### 2. Infrastructure Layer

```typescript
// src/infrastructure/supabase/repositories/invoice-supabase.repository.ts
@Injectable()
export class InvoiceSupabaseRepository implements IInvoiceRepository {
  private supabase = inject(SupabaseService);

  getById(id: string): Observable<Invoice | null> {
    return this.supabase.from$('invoices', q => q.eq('id', id).single()).pipe(
      map(res => this.mapToEntity(res.data))
    );
  }
  // ... autres méthodes
}
```

#### 3. Application Layer

```typescript
// src/application/stores/invoice.store.ts
export const InvoiceStore = signalStore(
  withState({ invoices: [], loading: false }),
  withMethods((store, repo = inject(INVOICE_REPOSITORY)) => ({
    loadByBooking: rxMethod<string>(
      pipe(
        switchMap(bookingId => repo.getByBookingId(bookingId))
      )
    )
  }))
);
```

#### 4. UI Layer

```typescript
// src/ui/pages/invoices/invoices.component.ts
@Component({
  providers: [InvoiceStore]
})
export class InvoicesComponent {
  readonly store = inject(InvoiceStore);

  ngOnInit() {
    this.store.loadByBooking('booking-123');
  }
}
```

#### 5. Configuration DI

```typescript
// src/app/app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    // ...
    { provide: INVOICE_REPOSITORY, useClass: InvoiceSupabaseRepository },
  ]
};
```

**Et voilà !** Tout est connecté et fonctionne. 🎉

---

## 📖 Références

- [Clean Architecture (Uncle Bob)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Angular Architecture Best Practices](https://angular.dev/best-practices)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

---

## ❓ Questions fréquentes

### Pourquoi pas mettre le code Supabase directement dans les Stores ?

**Mauvais** ❌ :
```typescript
export const ClientStore = signalStore(
  withMethods((store) => ({
    loadAll: rxMethod(pipe(
      switchMap(() => from(supabase.from('clients').select('*'))) // ← Couplage fort !
    ))
  }))
);
```

**Problèmes** :
- Impossible de tester sans Supabase
- Impossible de changer de technologie facilement
- Pas de réutilisation du code
- Violation du principe de responsabilité unique

**Bon** ✅ :
```typescript
export const ClientStore = signalStore(
  withMethods((store, repo = inject(CLIENT_REPOSITORY)) => ({
    loadAll: rxMethod(pipe(
      switchMap(() => repo.getAll()) // ← Découplage !
    ))
  }))
);
```

### Pourquoi des Observables partout et pas des Promises ?

**Raisons** :
- **Cohérence** : Angular est basé sur RxJS
- **Puissance** : Opérateurs RxJS (retry, debounce, switchMap, etc.)
- **Annulation** : On peut annuler des requêtes (unsubscribe)
- **Composition** : Facile de combiner plusieurs flux

### C'est pas trop complexe pour une petite app ?

Au début, ça peut sembler lourd, mais :
- **Scalabilité** : L'app va grandir
- **Maintenabilité** : Beaucoup plus facile à maintenir à long terme
- **Équipe** : Facile d'onboarder de nouveaux développeurs
- **Confiance** : Modifications sans peur de tout casser

**Règle** : Investir dans une bonne architecture au début = gagner du temps plus tard.

---

## 🎓 Cheat Sheet pour débutants

### Où mettre mon code ? Guide rapide

#### ✅ J'ai un bouton qui affiche une liste de clients
→ **UI Layer** (`src/ui/pages/clients/`)

#### ✅ Je dois gérer l'état "loading" pendant le chargement des données
→ **Application Layer** - Store (`src/application/stores/`)

#### ✅ Je définis ce qu'est un "Client" (id, name, email, etc.)
→ **Domain Layer** - Entity (`src/domain/entities/client.entity.ts`)

#### ✅ Je dis "Je veux pouvoir créer/lire/modifier/supprimer des clients"
→ **Domain Layer** - Repository Interface (`src/domain/repositories/client.repository.ts`)

#### ✅ J'écris le code pour appeler Supabase et sauvegarder un client
→ **Infrastructure Layer** - Repository Implementation (`src/infrastructure/supabase/repositories/`)

#### ✅ Je calcule le prix d'une réservation avec des règles métier complexes
→ **Domain Layer** - Use Case (`src/domain/use-cases/`)

---

## 🚨 Erreurs courantes à éviter

### ❌ Erreur 1 : Mettre du code Supabase dans un Component UI

```typescript
// ❌ TRÈS MAUVAIS !
@Component(...)
export class ClientsComponent {
  loadClients() {
    // Ne JAMAIS appeler Supabase directement depuis l'UI !
    this.supabase.from('clients').select('*').then(...)
  }
}

// ✅ BON
@Component(...)
export class ClientsComponent {
  readonly store = inject(ClientStore);

  ngOnInit() {
    this.store.loadAll(); // ← Délègue au Store
  }
}
```

**Pourquoi c'est grave** : Impossible de tester, impossible de changer de base de données, code non réutilisable.

---

### ❌ Erreur 2 : Importer Angular dans le Domain Layer

```typescript
// ❌ TRÈS MAUVAIS !
// src/domain/entities/client.entity.ts
import { Injectable } from '@angular/core'; // ← NON !!!

@Injectable()
export interface Client {
  id: string;
  name: string;
}

// ✅ BON - TypeScript pur
// src/domain/entities/client.entity.ts
export interface Client {
  id: string;
  name: string;
}
```

**Pourquoi c'est grave** : Le Domain doit être réutilisable partout (backend, mobile, etc.).

---

### ❌ Erreur 3 : Créer des dépendances avec "new"

```typescript
// ❌ MAUVAIS
export class ClientStore {
  private repo = new ClientSupabaseRepository(); // ← Couplage fort !
}

// ✅ BON
export class ClientStore {
  private repo = inject(CLIENT_REPOSITORY); // ← Injection de dépendances
}
```

**Pourquoi c'est grave** : Impossible de changer l'implémentation ou de mocker en test.

---

## 💬 Glossaire pour les débutants

| Terme | Définition simple | Analogie |
|-------|-------------------|----------|
| **Entity** | La définition d'un objet métier (Client, Service, etc.) | La fiche technique d'une voiture (marque, modèle, couleur) |
| **Repository** | Le contrat pour accéder aux données | Le menu d'un restaurant (liste des plats disponibles) |
| **Store** | La mémoire de l'application | Le tableau de bord d'un avion (affiche l'état actuel) |
| **Observable** | Un flux de données dans le temps | Une chaîne YouTube (tu t'abonnes et reçois des vidéos) |
| **Injection Token** | Un "ticket" pour demander un service | Un ticket restaurant échangeable dans différents restos |
| **Interface** | Un contrat (promesse) sans implémentation | Un permis de conduire (prouve que tu sais conduire, mais pas quelle voiture) |
| **Dependency Injection** | Le framework fournit les dépendances automatiquement | Un restaurant qui fournit les ingrédients au chef |
| **Use Case** | Logique métier complexe | La recette complète d'un plat (étapes détaillées) |

---

## 🎯 Résumé ultra-rapide

```
┌──────────────────────────────────────────────────────────────┐
│  "Je veux afficher quelque chose"                            │
│  → UI Layer                                                  │
└──────────────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────┐
│  "Je coordonne et je gère l'état"                            │
│  → Application Layer (Store)                                 │
└──────────────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────┐
│  "Voici les règles métier (sans technologie)"                │
│  → Domain Layer (Entities + Interfaces)                      │
└──────────────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────┐
│  "J'implémente concrètement avec Supabase/Firebase/etc."     │
│  → Infrastructure Layer (Implementations)                    │
└──────────────────────────────────────────────────────────────┘
```

**La règle d'or** : Les dépendances vont toujours **vers l'intérieur** (vers le Domain).
- UI dépend de Application ✅
- Application dépend de Domain ✅
- Infrastructure dépend de Domain ✅
- Domain ne dépend de RIEN ✅

**Interdit** :
- Domain dépend de Infrastructure ❌
- Domain dépend de Application ❌
- Infrastructure dépend de UI ❌

---

**Règle** : Investir dans une bonne architecture au début = gagner du temps plus tard.

---

Créé le : 2025-10-11
Dernière mise à jour : 2025-10-11
