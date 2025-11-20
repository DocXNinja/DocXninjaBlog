/* eslint-disable simple-import-sort/imports */
import Link from 'next/link'
import NextImage from 'next/image'
import type * as types from 'notion-types'
import { IoMoonSharp } from '@react-icons/all-files/io5/IoMoonSharp'
import { IoSunnyOutline } from '@react-icons/all-files/io5/IoSunnyOutline'
import { IoHome } from '@react-icons/all-files/io5/IoHome'
import { IoMenu } from '@react-icons/all-files/io5/IoMenu'
import { IoClose } from '@react-icons/all-files/io5/IoClose'
import { IoSearchOutline } from '@react-icons/all-files/io5/IoSearchOutline'
import cs from 'classnames'
import * as React from 'react'
import { Header, Search, useNotionContext } from 'react-notion-x'

import { isSearchEnabled, navigationLinks, navigationStyle } from '@/lib/config'
import { useDarkMode } from '@/lib/use-dark-mode'

import styles from './styles.module.css'

function ToggleThemeButton() {
  const [hasMounted, setHasMounted] = React.useState(false)
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  const onToggleTheme = React.useCallback(() => {
    toggleDarkMode()
  }, [toggleDarkMode])

  return (
    <button
      type='button'
      className={cs(
        'breadcrumb',
        'button',
        styles.toggleThemeButton,
        !hasMounted && styles.hidden
      )}
      onClick={onToggleTheme}
      aria-label={hasMounted && isDarkMode ? 'Activate light mode' : 'Activate dark mode'}
    >
      {hasMounted && isDarkMode ? <IoMoonSharp /> : <IoSunnyOutline />}
    </button>
  )
}

export function NotionPageHeader({
  block
}: {
  block: types.CollectionViewPageBlock | types.PageBlock
}) {
  const { components, mapPageUrl } = useNotionContext()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)
  const searchButtonRef = React.useRef<HTMLButtonElement | null>(null)

  React.useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches)
    }

    updateIsMobile()
    window.addEventListener('resize', updateIsMobile)

    return () => {
      window.removeEventListener('resize', updateIsMobile)
    }
  }, [])

  React.useEffect(() => {
    searchButtonRef.current = document.querySelector(
      '.notion-search-button'
    ) as HTMLButtonElement | null
  }, [isMobile])

  const toggleMobileMenu = React.useCallback(() => {
    setIsMobileMenuOpen(prev => !prev)
  }, [])

  const closeMobileMenu = React.useCallback(() => {
    setIsMobileMenuOpen(false)
  }, [])

  if (navigationStyle === 'default') {
    return <Header block={block} />
  }

  return (
    <header className='notion-header'>
      <div className='notion-nav-header'>
        <div className='notion-nav-header-left breadcrumbs'>
          <Link
            href='https://docxninja.com/'
            className={cs('breadcrumb', 'button')}
            aria-label='Blog Home'
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {isDarkMode ? (
              <NextImage
                src='/LogoLight.svg'
                alt='DocXninja'
                width={180}
                height={45}
                className='header-logo'
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <NextImage
                src='/LogoDark.svg'
                alt='DocXninja'
                width={180}
                height={45}
                className='header-logo'
                style={{ objectFit: 'contain' }}
              />
            )}
          </Link>
        </div>

        {!isMobile && (
          <div className={cs('notion-nav-header-rhs breadcrumbs', styles.desktopNav)}>
            {navigationLinks
              ?.map((link, index) => {
                if (!link?.pageId && !link?.url) {
                  return null
                }

                if (link.pageId) {
                  return (
                    <components.PageLink
                      href={mapPageUrl(link.pageId)}
                      key={index}
                      className={cs(styles.navLink, 'breadcrumb', 'button')}
                    >
                      {link.title}
                    </components.PageLink>
                  )
                }

                return (
                  <components.Link
                    href={link.url}
                    key={index}
                    className={cs(styles.navLink, 'breadcrumb', 'button')}
                  >
                    {link.title}
                  </components.Link>
                )
              })
              .filter(Boolean)}

            <Link
              href='/'
              className={cs('breadcrumb', 'button')}
              aria-label='Home'
              style={{ marginRight: '0.5rem' }}
            >
              <IoHome />
            </Link>

            <ToggleThemeButton />

            {isSearchEnabled && <Search block={block} title={null} />}
          </div>
        )}

        {isMobile && (
          <div className={styles.mobileNav}>
            <button
              type='button'
              className={cs('breadcrumb', 'button', styles.hamburgerButton)}
              onClick={toggleMobileMenu}
              aria-label='Toggle mobile menu'
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <IoClose /> : <IoMenu />}
            </button>
          </div>
        )}
      </div>

      {isMobile && isMobileMenuOpen && (
        <>
          <div
            className={cs(styles.mobileMenuBackdrop, isDarkMode && 'dark-mode')}
            onClick={closeMobileMenu}
            aria-hidden='true'
          />

          <div className={cs(styles.mobileMenuDropdown, isDarkMode && 'dark-mode')}>
            <div className={cs(styles.menuHeader, isDarkMode && 'dark-mode')}>
              <h3 className={cs(styles.menuTitle, isDarkMode && 'dark-mode')}>Navigation</h3>
              <div className={cs(styles.menuSubtitle, isDarkMode && 'dark-mode')}>Quick access</div>
            </div>

            <Link
              href='/'
              className={cs('breadcrumb', 'button', styles.mobileMenuItem, isDarkMode && 'dark-mode')}
              aria-label='Home'
              onClick={closeMobileMenu}
            >
              <IoHome />
              <span>Home</span>
            </Link>

            <button
              type='button'
              className={cs('breadcrumb', 'button', styles.mobileMenuItem, isDarkMode && 'dark-mode')}
              onClick={() => {
                toggleDarkMode()
                closeMobileMenu()
              }}
            >
              <IoMoonSharp />
              <span>Toggle Theme</span>
            </button>

            {isSearchEnabled && (
              <button
                type='button'
                className={cs('breadcrumb', 'button', styles.mobileMenuItem, isDarkMode && 'dark-mode')}
                onClick={() => {
                  searchButtonRef.current?.click()
                  closeMobileMenu()
                }}
              >
                <IoSearchOutline />
                <span>Search</span>
              </button>
            )}
          </div>
        </>
      )}

      {isMobile && isSearchEnabled && (
        <div className={styles.hiddenSearchTrigger} aria-hidden='true'>
          <Search block={block} title={null} />
        </div>
      )}
    </header>
  )
}
