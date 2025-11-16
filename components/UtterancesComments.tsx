import * as React from 'react'

import * as config from '@/lib/config'
import { useDarkMode } from '@/lib/use-dark-mode'

import styles from './UtterancesComments.module.css'

/**
 * Utterances Comments Component
 * 
 * Utterances is a lightweight comments widget built on GitHub issues.
 * Comments are stored as GitHub issues in the same repository as the site.
 * 
 * @see https://utteranc.es/
 */
export function UtterancesComments() {
  const commentsRef = React.useRef<HTMLDivElement>(null)
  const { isDarkMode } = useDarkMode()
  const [hasMounted, setHasMounted] = React.useState(false)

  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  React.useEffect(() => {
    if (!commentsRef.current || !hasMounted) return

    // Get the repository from config
    // Use the format: owner/repo (based on GitHub username and repo name)
    const repo = config.github ? `${config.github}/DocXninjaBlog` : 'docXNinja/DocXninjaBlog'

    // Determine theme based on dark mode state
    // Utterances supports: 'github-light', 'github-dark', 'preferred-color-scheme', 
    // 'boxy-light', 'boxy-dark', 'icy-dark', 'dark-blue', 'photon-dark', 'gruvbox-dark'
    const theme = hasMounted && isDarkMode ? 'github-dark' : 'github-light'

    // Create and configure the Utterances script
    const script = document.createElement('script')
    script.src = 'https://utteranc.es/client.js'
    script.setAttribute('repo', repo)
    script.setAttribute('issue-term', 'pathname')
    script.setAttribute('label', 'comments')
    script.setAttribute('theme', theme)
    script.setAttribute('crossorigin', 'anonymous')
    script.async = true

    // Clear any existing content and append the script
    // Capture the ref value at the time of effect to use in cleanup
    const currentRef = commentsRef.current
    if (!currentRef) return

    currentRef.innerHTML = ''
    currentRef.append(script)

    // Cleanup function to remove script when component unmounts
    // Use the captured ref value from the effect to avoid stale closure warnings
    return () => {
      if (currentRef) {
        currentRef.innerHTML = ''
      }
    }
  }, [hasMounted, isDarkMode])

  return (
    <div className={styles.commentsContainer}>
      <div className={styles.commentsWrapper}>
        <div ref={commentsRef} />
      </div>
    </div>
  )
}
