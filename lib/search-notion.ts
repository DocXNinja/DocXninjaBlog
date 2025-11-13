import ExpiryMap from 'expiry-map'
import pMemoize from 'p-memoize'

import type * as types from './types'
import { api } from './config'

export const searchNotion = pMemoize(searchNotionImpl, {
  cacheKey: (args) => args[0]?.query,
  cache: new ExpiryMap(10_000)
})

async function searchNotionImpl(
  params: types.SearchParams
): Promise<types.SearchResults> {
  const res = await fetch(api.searchNotion, {
    method: 'POST',
    body: JSON.stringify(params),
    headers: {
      'content-type': 'application/json'
    }
  })

  if (res.ok) {
    return (await res.json()) as types.SearchResults
  }

  // Try to read JSON error details from the server and throw a helpful message
  let errMsg = `Search request failed with status ${res.status}`
  try {
    const json: any = await res.json()
    if (json) {
      if (typeof json === 'string') errMsg = json
      else if (json.error) errMsg = json.error
      else if (json.details) errMsg = json.details
    }
  } catch {
    // ignore JSON parse errors and fall back to statusText
    errMsg = res.statusText || errMsg
  }

  const error: any = new Error(errMsg)
  error.response = res
  throw error

  // return ky
  //   .post(api.searchNotion, {
  //     json: params
  //   })
  //   .json()
}
