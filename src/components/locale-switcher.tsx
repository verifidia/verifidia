import {
  IconBangladesh,
  IconChina,
  IconFrance,
  IconGermany,
  IconIndia,
  IconIndonesia,
  IconIran,
  IconItaly,
  IconJapan,
  IconMalaysia,
  IconNetherlands,
  IconPhilippines,
  IconPoland,
  IconPortugal,
  IconRussia,
  IconSaudiArabia,
  IconSouthKorea,
  IconSpain,
  IconThailand,
  IconTurkey,
  IconUkraine,
  IconUnitedStates,
  IconVietnam,
} from 'nucleo-flags'
import { IconChevronDownOutline18 } from 'nucleo-ui-outline-18'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { m } from '#/paraglide/messages'
import { getLocale, locales, setLocale } from '#/paraglide/runtime'

const LOCALE_CONFIG: Record<
  string,
  { flag: React.FC<{ className?: string }>; label: string }
> = {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={m.locale_label()}
          className="inline-flex h-7 items-center gap-1 rounded-sm px-1.5 font-medium text-muted-foreground text-xs transition-colors hover:bg-accent hover:text-foreground"
          size="sm"
          variant="ghost"
        >
          {CurrentFlag && <CurrentFlag className="h-3 w-4 shrink-0" />}
          <span className="hidden sm:inline">{current?.label}</span>
          <IconChevronDownOutline18 className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
        {locales.map((locale: string) => {
          const config = LOCALE_CONFIG[locale]
          if (!config) {
            return null
          }
          const Flag = config.flag
          const isActive = locale === currentLocale
          return (
            <DropdownMenuItem
              className={isActive ? 'bg-accent' : ''}
              key={locale}
              onSelect={() => setLocale(locale as (typeof locales)[number])}
            >
              <Flag className="h-3 w-4 shrink-0" />
              <span>{config.label}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
