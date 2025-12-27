'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';
import LanguageToggle from '@/components/LanguageToggle';
import UserMenu from '@/components/UserMenu';
import { useLanguage } from '@/lib/i18n/context';

export default function TermsPage() {
  const { lang } = useLanguage();

  const content = {
    en: {
      title: 'Terms of Service',
      lastUpdated: 'Last updated: December 2025',
      sections: [
        {
          title: '1. Acceptance of Terms',
          content: 'By accessing and using Quality Metrics, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.'
        },
        {
          title: '2. Description of Service',
          content: 'Quality Metrics provides stock analysis tools and information based on fundamental metrics. Our service is intended for educational and informational purposes only.'
        },
        {
          title: '3. Not Financial Advice',
          content: 'THE INFORMATION PROVIDED BY QUALITY METRICS IS NOT FINANCIAL, INVESTMENT, OR TRADING ADVICE. We are not registered investment advisors. All information is provided "as is" for educational purposes. You should consult with qualified financial professionals before making investment decisions.'
        },
        {
          title: '4. Accuracy of Information',
          content: 'While we strive to provide accurate information, we make no guarantees about the completeness, accuracy, or reliability of any data or analysis. Financial data is sourced from third-party providers and may contain errors or delays.'
        },
        {
          title: '5. User Accounts',
          content: 'You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.'
        },
        {
          title: '6. Subscription and Payments',
          content: 'Premium subscriptions are billed monthly. You may cancel at any time, and your access will continue until the end of the current billing period. Refunds are not provided for partial months.'
        },
        {
          title: '7. Limitation of Liability',
          content: 'Quality Metrics shall not be liable for any investment losses, damages, or other liabilities resulting from the use of our service. Use of our platform is at your own risk.'
        },
        {
          title: '8. Changes to Terms',
          content: 'We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.'
        },
        {
          title: '9. Termination',
          content: 'We reserve the right to terminate or suspend access to our service at any time, without notice, for conduct that we believe violates these terms or is harmful to other users.'
        }
      ]
    },
    fi: {
      title: 'Käyttöehdot',
      lastUpdated: 'Päivitetty: Joulukuu 2025',
      sections: [
        {
          title: '1. Ehtojen hyväksyminen',
          content: 'Käyttämällä Quality Metrics -palvelua hyväksyt nämä käyttöehdot. Jos et hyväksy näitä ehtoja, älä käytä palveluamme.'
        },
        {
          title: '2. Palvelun kuvaus',
          content: 'Quality Metrics tarjoaa osakeanalyysityökaluja ja -tietoja, jotka perustuvat fundamentaalisiin mittareihin. Palvelumme on tarkoitettu vain opetus- ja tiedotustarkoituksiin.'
        },
        {
          title: '3. Ei sijoitusneuvontaa',
          content: 'QUALITY METRICSIN TARJOAMA TIETO EI OLE TALOUS-, SIJOITUS- TAI KAUPANKÄYNTINEUVONTAA. Emme ole rekisteröityjä sijoitusneuvojia. Kaikki tiedot tarjotaan "sellaisenaan" opetustarkoituksiin. Sinun tulisi konsultoida päteviä talousalan ammattilaisia ennen sijoituspäätöksiä.'
        },
        {
          title: '4. Tietojen tarkkuus',
          content: 'Vaikka pyrimme tarjoamaan tarkkaa tietoa, emme takaa minkään datan tai analyysin täydellisyyttä, tarkkuutta tai luotettavuutta. Taloudelliset tiedot ovat peräisin kolmansien osapuolten toimittajilta ja voivat sisältää virheitä tai viiveitä.'
        },
        {
          title: '5. Käyttäjätilit',
          content: 'Olet vastuussa tilisi kirjautumistietojen luottamuksellisuuden säilyttämisestä. Sitoudut ilmoittamaan meille välittömästi tilisi luvattomasta käytöstä.'
        },
        {
          title: '6. Tilaukset ja maksut',
          content: 'Premium-tilaukset laskutetaan kuukausittain. Voit peruuttaa milloin tahansa, ja pääsysi jatkuu nykyisen laskutuskauden loppuun asti. Hyvityksiä ei myönnetä osittaisista kuukausista.'
        },
        {
          title: '7. Vastuunrajoitus',
          content: 'Quality Metrics ei ole vastuussa mistään sijoitustappioista, vahingoista tai muista vastuista, jotka johtuvat palvelumme käytöstä. Alustamme käyttö on omalla vastuullasi.'
        },
        {
          title: '8. Ehtojen muutokset',
          content: 'Pidätämme oikeuden muuttaa näitä ehtoja milloin tahansa. Palvelun jatkuva käyttö muutosten jälkeen merkitsee uusien ehtojen hyväksymistä.'
        },
        {
          title: '9. Palvelun päättäminen',
          content: 'Pidätämme oikeuden lopettaa tai keskeyttää pääsyn palveluumme milloin tahansa ilman ennakkoilmoitusta toiminnasta, joka mielestämme rikkoo näitä ehtoja tai on haitallista muille käyttäjille.'
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
