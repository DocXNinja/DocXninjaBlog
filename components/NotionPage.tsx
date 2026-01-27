import cs from 'classnames'
import dynamic from 'next/dynamic'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { type PageBlock } from 'notion-types'
import { formatDate, getBlockTitle, getPageProperty } from 'notion-utils'
import * as React from 'react'
import BodyClassName from 'react-body-classname'
import {
  type NotionComponents,
  NotionRenderer,
  useNotionContext
} from 'react-notion-x'
import { getPageTableOfContents } from 'notion-utils'
import { EmbeddedTweet, TweetNotFound, TweetSkeleton } from 'react-tweet'
import { useSearchParam } from 'react-use'

import type * as types from '@/lib/types'
import * as config from '@/lib/config'
import { mapImageUrl } from '@/lib/map-image-url'
import { getCanonicalPageUrl, mapPageUrl } from '@/lib/map-page-url'
import { searchNotion } from '@/lib/search-notion'
import { useDarkMode } from '@/lib/use-dark-mode'

import { Footer } from './Footer'
import { Loading } from './Loading'
import { NotionPageHeader } from './NotionPageHeader'
import { Page404 } from './Page404'
import { PageAside } from './PageAside'
import { PageHead } from './PageHead'
import styles from './styles.module.css'

// -----------------------------------------------------------------------------
// dynamic imports for optional components
// -----------------------------------------------------------------------------

const Code = dynamic(() =>
  import('react-notion-x/build/third-party/code').then(async (m) => {
    // add / remove any prism syntaxes here
    await Promise.allSettled([
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-markup-templating.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-markup.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-bash.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-c.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-cpp.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-csharp.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-docker.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-java.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-js-templates.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-coffeescript.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-diff.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-git.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-go.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-graphql.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-handlebars.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-less.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-makefile.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-markdown.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-objectivec.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-ocaml.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-python.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-reason.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-rust.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-sass.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-scss.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-solidity.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-sql.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-stylus.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-swift.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-wasm.js'),
      // @ts-expect-error Ignore prisma types
      import('prismjs/components/prism-yaml.js')
    ])
    return m.Code
  })
)

const Collection = dynamic(() =>
  import('react-notion-x/build/third-party/collection').then(
    (m) => m.Collection
  )
)
const Equation = dynamic(() =>
  import('react-notion-x/build/third-party/equation').then((m) => m.Equation)
)
const Pdf = dynamic(
  () => import('react-notion-x/build/third-party/pdf').then((m) => m.Pdf),
  {
    ssr: false
  }
)
const Modal = dynamic(
  () =>
    import('react-notion-x/build/third-party/modal').then((m) => {
      m.Modal.setAppElement('.notion-viewport')
      return m.Modal
    }),
  {
    ssr: false
  }
)

function Tweet({ id }: { id: string }) {
  const { recordMap } = useNotionContext()
  const tweet = (recordMap as types.ExtendedTweetRecordMap)?.tweets?.[id]

  return (
    <React.Suspense fallback={<TweetSkeleton />}>
      {tweet ? <EmbeddedTweet tweet={tweet} /> : <TweetNotFound />}
    </React.Suspense>
  )
}

const propertyLastEditedTimeValue = (
  { block, pageHeader }: any,
  defaultFn: () => React.ReactNode
) => {
  if (pageHeader && block?.last_edited_time) {
    return `Last updated ${formatDate(block?.last_edited_time, {
      month: 'long'
    })}`
  }

  return defaultFn()
}

const propertyDateValue = (
  { data, schema, pageHeader }: any,
  defaultFn: () => React.ReactNode
) => {
  if (pageHeader && schema?.name?.toLowerCase() === 'published') {
    const publishDate = data?.[0]?.[1]?.[0]?.[1]?.start_date

    if (publishDate) {
      return `${formatDate(publishDate, {
        month: 'long'
      })}`
    }
  }

  return defaultFn()
}

const propertyTextValue = (
  { schema, pageHeader }: any,
  defaultFn: () => React.ReactNode
) => {
  if (pageHeader && schema?.name?.toLowerCase() === 'author') {
    return <b>{defaultFn()}</b>
  }

  return defaultFn()
}


export function NotionPage({
  site,
  recordMap,
  error,
  pageId
}: types.PageProps) {
  const router = useRouter()
  const lite = useSearchParam('lite')

  const components = React.useMemo<Partial<NotionComponents>>(
    () => ({
      nextLegacyImage: Image,
      nextLink: Link,
      Code,
      Collection,
      Equation,
      Pdf,
      Modal,
      Tweet,
      Header: NotionPageHeader,
      propertyLastEditedTimeValue,
      propertyTextValue,
      propertyDateValue
    }),
    []
  )

  // lite mode is for oembed
  const isLiteMode = lite === 'true'

  const { isDarkMode } = useDarkMode()
  const [hasMounted, setHasMounted] = React.useState(false)
  const [isTocCollapsed, setIsTocCollapsed] = React.useState(false)

  // Prevent hydration mismatch by only applying dark mode after mounting
  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  const handleToggleToc = React.useCallback(() => {
    setIsTocCollapsed((prev) => !prev)
  }, [])

  const getHeaderHeight = React.useCallback(() => {
    const rootStyle = getComputedStyle(document.documentElement)
    const cssVar = rootStyle.getPropertyValue('--notion-header-height').trim()
    const cssVarPx = cssVar ? parseInt(cssVar, 10) : 0

    const headerMain = document.querySelector('.notion-header') as HTMLElement | null
    const headerNav = document.querySelector('.notion-nav-header') as HTMLElement | null
    const h1 = headerMain?.offsetHeight || 0
    const h2 = headerNav?.offsetHeight || 0
    return Math.max(cssVarPx, h1, h2)
  }, [])

  const handleTocItemClick = React.useCallback((event: React.MouseEvent, id: string) => {
    event.preventDefault()

    const target =
      (document.getElementById(id) as HTMLElement | null) ||
      (document.querySelector(`[data-id="${id}"]`) as HTMLElement | null)

    if (target) {
      const headerHeight = getHeaderHeight()

      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 8
      window.scrollTo({ top, behavior: 'smooth' })
      window.history.replaceState(null, '', `#${id}`)
    }
  }, [])

  React.useEffect(() => {
    if (config.isServer) return

    const pageEl = document.querySelector('.notion-page')
    if (!pageEl) return

    pageEl.classList.toggle('toc-collapsed', isTocCollapsed)

    return () => {
      pageEl.classList.remove('toc-collapsed')
    }
  }, [isTocCollapsed])

  // Use a safe dark mode value that prevents hydration mismatch
  const safeDarkMode = hasMounted ? isDarkMode : false

  const siteMapPageUrl = React.useMemo(() => {
    const params: any = {}
    if (lite) params.lite = lite

    const searchParams = new URLSearchParams(params)
    return site ? mapPageUrl(site, recordMap!, searchParams) : undefined
  }, [site, recordMap, lite])

  const keys = Object.keys(recordMap?.block || {})
  const block = recordMap?.block?.[keys[0]!]?.value

  // const isRootPage =
  //   parsePageId(block?.id) === parsePageId(site?.rootNotionPageId)
  const isBlogPost =
    block?.type === 'page' && block?.parent_table === 'collection'

  const showTableOfContents = !!isBlogPost
  const minTableOfContentsItems = 3

  const tableOfContents = React.useMemo(
    () => {
      if (!block || !recordMap) return []
      try {
        return getPageTableOfContents(block as PageBlock, recordMap)
      } catch (e) {
        console.warn('Failed to generate table of contents:', e)
        return []
      }
    },
    [block, recordMap]
  )

  const hasToc = showTableOfContents && tableOfContents.length >= minTableOfContentsItems

  const footer = React.useMemo(() => <Footer isBlogPost={isBlogPost} />, [isBlogPost])

  // Ensure headings have anchor IDs matching TOC ids for reliable scrolling
  React.useEffect(() => {
    if (!hasToc || config.isServer) return

    const assignIds = () => {
      tableOfContents.forEach((item) => {
        const id = item.id
        if (!id) return

        if (document.getElementById(id)) return

        let el: HTMLElement | null = null

        el = document.querySelector(`[data-id="${id}"]`) as HTMLElement | null
        if (!el) {
          el = document.querySelector(`[data-block-id="${id}"]`) as HTMLElement | null
        }

        if (!el) {
          const titleEls = Array.from(
            document.querySelectorAll('.notion-page .notion-h-title')
          ) as HTMLElement[]
          const match = titleEls.find(
            (e) => e.textContent?.trim() === item.text.trim()
          )
          if (match) {
            el = (match.closest('.notion-h, .notion-h1, .notion-h2, .notion-h3') as HTMLElement) || match.parentElement
          }
        }

        if (el) {
          try {
            el.id = id
            // Ensure heading remains visible beneath sticky header
            const headerHeight = getHeaderHeight()
            el.style.scrollMarginTop = `${headerHeight + 12}px`
          } catch {
            // no-op
          }
        }
      })
    }

    // run after NotionRenderer has flushed the DOM
    const t = setTimeout(assignIds, 0)
    return () => clearTimeout(t)
  }, [hasToc, tableOfContents, recordMap, getHeaderHeight])

  // Inject Utterances comments into .notion-page container after render
  React.useEffect(() => {
    if (!isBlogPost || !hasMounted || config.isServer) return

    // Find the .notion-page container
    const notionPage = document.querySelector('.notion-page')
    if (!notionPage) {
      // If not found, try again after a short delay (page might still be rendering)
      const timeout = setTimeout(() => {
        const retryPage = document.querySelector('.notion-page')
        if (retryPage) {
          injectComments(retryPage)
        }
      }, 300)
      return () => clearTimeout(timeout)
    }

    injectComments(notionPage)

    function injectComments(container: Element) {
      // Check if comments are already injected
      if (container.querySelector('.utterances-comments-wrapper')) {
        return
      }

      // Create wrapper for comments
      const commentsWrapper = document.createElement('div')
      commentsWrapper.className = 'utterances-comments-wrapper'

      // Create container div with proper styling classes
      const commentsContainer = document.createElement('div')
      commentsContainer.className = 'comments-container'
      commentsWrapper.append(commentsContainer)

      // Append to notion-page container
      container.append(commentsWrapper)

      // Initialize Utterances
      const repo = config.github ? `${config.github}/DocXninjaBlog` : 'docXNinja/DocXninjaBlog'
      const script = document.createElement('script')
      script.src = 'https://utteranc.es/client.js'
      script.setAttribute('repo', repo)
      script.setAttribute('issue-term', 'pathname')
      script.setAttribute('label', 'comments')
      script.setAttribute('theme', isDarkMode ? 'github-dark' : 'github-light')
      script.setAttribute('crossorigin', 'anonymous')
      script.async = true
      commentsContainer.append(script)
    }

    // Cleanup function to remove comments if component unmounts or page changes
    return () => {
      const notionPage = document.querySelector('.notion-page')
      if (notionPage) {
        const wrapper = notionPage.querySelector('.utterances-comments-wrapper')
        if (wrapper) {
          wrapper.remove()
        }
      }
    }
  }, [isBlogPost, hasMounted, isDarkMode])

  // React Hooks must be called before any early returns
  React.useEffect(() => {
    if (!config.isServer && block) {
      // add important objects to the window global for easy debugging
      const g = window as any
      g.pageId = pageId
      g.recordMap = recordMap
      g.block = block
    }
  }, [pageId, recordMap, block])

  if (router.isFallback) {
    return <Loading />
  }

  if (error || !site || !block) {
    return <Page404 site={site} pageId={pageId} error={error} />
  }

  const title = getBlockTitle(block, recordMap) || site.name

  console.log('notion page', {
    isDev: config.isDev,
    title,
    pageId,
    rootNotionPageId: site.rootNotionPageId,
    recordMap
  })

  const canonicalPageUrl = config.isDev
    ? undefined
    : getCanonicalPageUrl(site, recordMap)(pageId)

  const socialImage = mapImageUrl(
    getPageProperty<string>('Social Image', block, recordMap) ||
    (block as PageBlock).format?.page_cover ||
    config.defaultPageCover,
    block
  )

  const socialDescription =
    getPageProperty<string>('Description', block, recordMap) ||
    config.description

  return (
    <>
      <PageHead
        pageId={pageId}
        site={site}
        title={title}
        description={socialDescription}
        image={socialImage}
        url={canonicalPageUrl}
        isBlogPost={isBlogPost}
      />

      {isLiteMode && <BodyClassName className='notion-lite' />}
      {safeDarkMode && <BodyClassName className='dark-mode' />}

      <NotionRenderer
        bodyClassName={cs(
          styles.notion,
          pageId === site.rootNotionPageId && 'index-page'
        )}
        darkMode={safeDarkMode}
        components={components}
        recordMap={recordMap}
        rootPageId={site.rootNotionPageId}
        rootDomain={site.domain}
        fullPage={!isLiteMode}
        previewImages={!!recordMap.preview_images}
        showCollectionViewDropdown={false}
        showTableOfContents={false}
        minTableOfContentsItems={minTableOfContentsItems}
        defaultPageCover={config.defaultPageCover}
        defaultPageCoverPosition={config.defaultPageCoverPosition}
        mapPageUrl={siteMapPageUrl}
        mapImageUrl={mapImageUrl}
        searchNotion={config.isSearchEnabled ? searchNotion : undefined}
        footer={footer}
      />

      {hasToc && (
        <>
          <button
            type='button'
            className={cs('notion-toc-toggle', isTocCollapsed && 'collapsed')}
            aria-label={isTocCollapsed ? 'Show table of contents' : 'Hide table of contents'}
            aria-pressed={!isTocCollapsed}
            title='Table of Contents'
            onClick={handleToggleToc}
          >
            <svg
              aria-hidden='true'
              focusable='false'
              viewBox='0 0 24 24'
              width='20'
              height='20'
            >
              <path
                d='M10 6l6 6-6 6'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </button>

          {!isTocCollapsed && (
            <aside className='notion-page-aside'>
              <div className='notion-aside-table-of-contents'>
                <div className='notion-aside-table-of-contents-header'>Table of Contents</div>
                {tableOfContents.map((tocItem) => (
                  <a
                    key={tocItem.id}
                    href={`#${tocItem.id}`}
                    onClick={(event) => handleTocItemClick(event, tocItem.id)}
                    className={cs(
                      'notion-table-of-contents-item',
                      `notion-table-of-contents-item-indent-level-${tocItem.indentLevel}`
                    )}
                  >
                    <span
                      className='notion-table-of-contents-item-body'
                      style={{
                        display: 'inline-block',
                        marginLeft: tocItem.indentLevel * 16
                      }}
                    >
                      {tocItem.text}
                    </span>
                  </a>
                ))}
              </div>
              <PageAside
                block={block!}
                recordMap={recordMap!}
                isBlogPost={isBlogPost}
              />
            </aside>
          )}
        </>
      )}
    </>
  )
}
