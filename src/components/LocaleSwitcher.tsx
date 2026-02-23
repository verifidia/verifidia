import { getLocale, locales, setLocale } from '#/paraglide/runtime'
import { m } from '#/paraglide/messages'
import { IconGlobeOutline24 } from 'nucleo-core-outline-24'

export default function ParaglideLocaleSwitcher() {
  const currentLocale = getLocale()

  return (
    <div className="relative flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors">
      <div className="absolute left-1.5 pointer-events-none flex items-center">
        <IconGlobeOutline24 className="w-3.5 h-3.5" />
      </div>
      <select
        value={currentLocale}
        onChange={(e) => setLocale(e.target.value as typeof locales[number])}
        aria-label={m.locale_label()}
        className="appearance-none bg-transparent border-none rounded-sm py-1 pl-6 pr-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer hover:bg-accent transition-colors font-medium"
      >
        {locales.map((locale: string) => (
          <option key={locale} value={locale} className="bg-background text-foreground">
            {locale.toUpperCase()}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-1.5 flex items-center opacity-50">
        <svg className="fill-current h-2.5 w-2.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  )
}
