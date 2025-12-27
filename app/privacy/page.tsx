'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';
import LanguageToggle from '@/components/LanguageToggle';
import UserMenu from '@/components/UserMenu';
import { useLanguage } from '@/lib/i18n/context';

export default function PrivacyPage() {
  const { lang } = useLanguage();

  const content = {
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: December 2025',
      sections: [
        {
          title: 'Information We Collect',
          content: 'When you create an account, we collect your email address, name, and profile picture from your Google account. We also collect usage data to improve our service.'
        },
        {
          title: 'How We Use Your Information',
          content: 'We use your information to provide and maintain the Quality Metrics service, manage your account and subscription, send important updates about the service, and improve our platform.'
        },
        {
          title: 'Data Storage',
          content: 'Your data is stored securely and we implement appropriate security measures to protect against unauthorized access, alteration, or destruction.'
        },
        {
          title: 'Third-Party Services',
          content: 'We use Google OAuth for authentication. Financial data is provided by Financial Modeling Prep and other third-party data providers. These services have their own privacy policies.'
        },
        {
          title: 'Cookies',
          content: 'We use essential cookies to maintain your session and preferences. You can manage cookie preferences through our cookie consent banner.'
        },
        {
          title: 'Your Rights',
          content: 'You have the right to access, correct, or delete your personal data. You can delete your account at any time, which will remove all your data from our systems.'
        },
        {
          title: 'Contact',
          content: 'If you have questions about this Privacy Policy, please contact us at support@qualitymetrics.com.'
        }
      ]
    },
    fi: {
      title: 'Tietosuojakäytäntö',
      lastUpdated: 'Päivitetty: Joulukuu 2025',
      sections: [
        {
          title: 'Keräämämme tiedot',
          content: 'Kun luot tilin, keräämme sähköpostiosoitteesi, nimesi ja profiilikuvasi Google-tililtäsi. Keräämme myös käyttötietoja palvelun parantamiseksi.'
        },
        {
          title: 'Miten käytämme tietojasi',
          content: 'Käytämme tietojasi Quality Metrics -palvelun tarjoamiseen ja ylläpitämiseen, tilisi ja tilauksesi hallintaan, tärkeiden palvelupäivitysten lähettämiseen ja alustamme parantamiseen.'
        },
        {
          title: 'Tietojen tallentaminen',
          content: 'Tietosi tallennetaan turvallisesti ja toteutamme asianmukaiset turvatoimet luvattoman pääsyn, muuttamisen tai tuhoamisen estämiseksi.'
        },
        {
          title: 'Kolmansien osapuolten palvelut',
          content: 'Käytämme Google OAuth -todennusta. Taloustiedot tarjoaa Financial Modeling Prep ja muut kolmannen osapuolen datapalvelut. Näillä palveluilla on omat tietosuojakäytäntönsä.'
        },
        {
          title: 'Evästeet',
          content: 'Käytämme välttämättömiä evästeitä istuntosi ja asetustesi ylläpitämiseen. Voit hallita evästeasetuksia evästesuostumusbannerin kautta.'
        },
        {
          title: 'Oikeutesi',
          content: 'Sinulla on oikeus käyttää, korjata tai poistaa henkilötietojasi. Voit poistaa tilisi milloin tahansa, mikä poistaa kaikki tietosi järjestelmistämme.'
        },
        {
          title: 'Yhteystiedot',
          content: 'Jos sinulla on kysyttävää tästä tietosuojakäytännöstä, ota yhteyttä osoitteeseen support@qualitymetrics.com.'
        }
      ]
    }
  };

  const c = content[lang];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 nav-glass">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Logo size="md" />
            </Link>
            <div className="flex items-center gap-4">
              <LanguageToggle />
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-[var(--foreground)] mb-2">
            {c.title}
          </h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            {c.lastUpdated}
          </p>
        </div>

        <div className="space-y-8">
          {c.sections.map((section, index) => (
            <div key={index}>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-3">
                {section.title}
              </h2>
              <p className="text-[var(--foreground-muted)] leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
