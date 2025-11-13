import type * as types from './types'
import { search } from './notion'
import { searchWithIntegration } from './notion-integration'

export async function handleSearchRequest(
  searchParams: types.SearchParams
): Promise<types.SearchResults> {
  try {
    const results = process.env.NOTION_TOKEN && !process.env.NOTION_TOKEN_V2
      ? await searchWithIntegration(searchParams)
      : await search(searchParams)

    return results
  } catch (error: any) {
    console.error('Search error:', error)
    
    // Check if it's an authentication error
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      const authError = new Error('Authentication failed. Please check your NOTION_TOKEN_V2 or NOTION_TOKEN environment variable.')
      authError.name = 'AuthenticationError'
      throw authError
    }
    
    // For non-auth errors (for example the unofficial search endpoint returning 500),
    // return an empty results set instead of failing the whole request so the UI
    // can continue to function. We still log the error for debugging.
    console.error('Search failed (returning empty results):', error?.message || error)

    const emptyResults: types.SearchResults = {
      recordMap: {
        block: {},
        collection: {},
        collection_view: {},
        notion_user: {}
      } as any,
      results: [],
      total: 0
    }

    return emptyResults
  }
}
