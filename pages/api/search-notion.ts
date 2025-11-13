import { type NextApiRequest, type NextApiResponse } from 'next'

import type * as types from '../../lib/types'
import { handleSearchRequest } from '../../lib/search-api'

export default async function searchNotion(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'method not allowed' })
  }

  const searchParams: types.SearchParams = req.body

  try {
    const results = await handleSearchRequest(searchParams)

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=60, max-age=60, stale-while-revalidate=60'
    )
    res.status(200).json(results)
  } catch (error: any) {
    if (error.name === 'AuthenticationError') {
      return res.status(500).json({ 
        error: error.message
      })
    }
    
    return res.status(500).json({ 
      error: 'Search failed', 
      details: error?.message || 'Unknown error'
    })
  }
}
