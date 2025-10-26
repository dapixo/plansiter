/**
 * Base class for all Supabase repositories
 * Provides common utilities for handling Supabase responses
 */
export abstract class BaseSupabaseRepository {
  /**
   * Generic Supabase response handler
   * @param response - The Supabase response object
   * @param strict - If true, throws error on failure. If false, returns empty array or null
   * @returns The data from the response
   */
  protected extractData<T>(response: any, strict = true): T {
    if (response.error) {
      console.error('Supabase error:', response.error);
      if (strict) throw response.error;
      return Array.isArray(response.data) ? [] as any : null as any;
    }
    return response.data;
  }
}
