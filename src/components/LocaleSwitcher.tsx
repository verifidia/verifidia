import { getLocale, locales, setLocale } from '#/paraglide/runtime'
import { m } from '#/paraglide/messages'
import { IconGlobeOutline24 } from 'nucleo-core-outline-24'

export default function ParaglideLocaleSwitcher() {
  const currentLocale = getLocale()

  return (
    <div className="flex items-center gap-2 text-sm text-foreground">
      <IconGlobeOutline24 className="w-4 h-4 opacity-70" />
      <div className="relative">
        <select
          value={currentLocale}
          onChange={(e) => setLocale(e.target.value as typeof locales[number])}
          aria-label={m.locale_label()}
          className="appearance-none bg-transparent border border-border rounded-md py-1 pl-2 pr-6 focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {locales.map((locale: string) => (
            <option key={locale} value={locale} className="bg-background text-foreground">
              {locale.toUpperCase()}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-foreground opacity-50">
          <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <title>Dropdown arrow</title>
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </div>
  )
}
