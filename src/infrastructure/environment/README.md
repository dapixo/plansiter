# Environment Configuration

This directory contains environment-specific configuration files for the Plansitter application.

## Setup

1. **Copy the example files to create your local configuration:**

```bash
# From the project root
cp src/infrastructure/environment/environment.example.ts src/infrastructure/environment/environment.ts
cp src/infrastructure/environment/environment.prod.example.ts src/infrastructure/environment/environment.prod.ts
```

2. **Get your Supabase credentials:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Go to Settings > API
   - Copy the `Project URL` and `anon public` key

3. **Update the files with your credentials:**
   - Open `environment.ts` (for development)
   - Open `environment.prod.ts` (for production)
   - Replace the empty strings with your actual Supabase URL and anon key

## Files

- **`environment.example.ts`** - Template for development environment (versioned in git)
- **`environment.prod.example.ts`** - Template for production environment (versioned in git)
- **`environment.ts`** - Actual development configuration (NOT in git, created from example)
- **`environment.prod.ts`** - Actual production configuration (NOT in git, created from example)

## Security Note

⚠️ The `environment.ts` and `environment.prod.ts` files are **gitignored** and should **never be committed** to version control. They contain your project-specific credentials.

Only the `.example.ts` files should be versioned in git as templates for other developers.

## Alternative: Using .env file

You can also store your credentials in a `.env` file at the project root:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

Then reference them in your environment files if you set up a build-time replacement system.
