import { getLocale, locales, setLocale } from '#/paraglide/runtime'
import { m } from '#/paraglide/messages'
import {
  IconUnitedStates,
  IconGermany,
  IconSpain,
  IconFrance,
  IconPortugal,
  IconRussia,
  IconJapan,
  IconSouthKorea,
  IconChina,
  IconSaudiArabia,
  IconIndia,
  IconBangladesh,
  IconIndonesia,
  IconMalaysia,
  IconTurkey,
  IconVietnam,
  IconThailand,
  IconPoland,
  IconUkraine,
  IconNetherlands,
  IconItaly,
  IconIran,
  IconPhilippines,
} from 'nucleo-flags'

const LOCALE_CONFIG: Record<string, { flag: React.FC<{ className?: string }>; label: string }> = {
  en: { flag: IconUnitedStates, label: 'English' },
  de: { flag: IconGermany, label: 'Deutsch' },
  es: { flag: IconSpain, label: 'Español' },
  fr: { flag: IconFrance, label: 'Français' },
  pt: { flag: IconPortugal, label: 'Português' },
  ru: { flag: IconRussia, label: 'Русский' },
  ja: { flag: IconJapan, label: '日本語' },
  ko: { flag: IconSouthKorea, label: '한국어' },
  zh: { flag: IconChina, label: '中文' },
  ar: { flag: IconSaudiArabia, label: 'العربية' },
  hi: { flag: IconIndia, label: 'हिन्दी' },
  bn: { flag: IconBangladesh, label: 'বাংলা' },
  id: { flag: IconIndonesia, label: 'Indonesia' },
  ms: { flag: IconMalaysia, label: 'Melayu' },
  tr: { flag: IconTurkey, label: 'Türkçe' },
  vi: { flag: IconVietnam, label: 'Tiếng Việt' },
  th: { flag: IconThailand, label: 'ไทย' },
  pl: { flag: IconPoland, label: 'Polski' },
  uk: { flag: IconUkraine, label: 'Українська' },
  nl: { flag: IconNetherlands, label: 'Nederlands' },
  it: { flag: IconItaly, label: 'Italiano' },
  fa: { flag: IconIran, label: 'فارسی' },
  tl: { flag: IconPhilippines, label: 'Filipino' },
}

export default function ParaglideLocaleSwitcher() {
  const currentLocale = getLocale()
  const current = LOCALE_CONFIG[currentLocale]
  const CurrentFlag = current?.flag

  return (
    <div className="relative flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors">
      {CurrentFlag ? (
        <div className="absolute left-1.5 pointer-events-none flex items-center">
          <CurrentFlag className="w-4 h-4" />
        </div>
      ) : null}
      <select
        value={currentLocale}
        onChange={(e) => setLocale(e.target.value as typeof locales[number])}
        aria-label={m.locale_label()}
        className="appearance-none bg-transparent border-none rounded-sm py-1 pl-7 pr-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer hover:bg-accent transition-colors font-medium"
      >
        {locales.map((locale: string) => {
          const config = LOCALE_CONFIG[locale]
          return (
            <option key={locale} value={locale} className="bg-background text-foreground">
              {config?.label ?? locale.toUpperCase()}
            </option>
          )
        })}
      </select>
      <div className="pointer-events-none absolute right-1.5 flex items-center opacity-50">
        <svg className="fill-current h-2.5 w-2.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  )
}
