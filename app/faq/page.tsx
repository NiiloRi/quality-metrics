'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';
import LanguageToggle from '@/components/LanguageToggle';
import UserMenu from '@/components/UserMenu';
import { useLanguage } from '@/lib/i18n/context';

const faqItems = {
  en: [
    {
      question: "What is Quality Metrics?",
      answer: "Quality Metrics is a stock analysis platform that evaluates companies using fundamental quality metrics. We help investors find undervalued quality stocks by analyzing profitability, growth, balance sheet strength, and valuation."
    },
    {
      question: "How is the QM Score calculated?",
      answer: "The QM Score is based on 8 fundamental criteria: Return on Capital (ROIC > 10%), Gross Margin (> 40%), Operating Margin (> 15%), Free Cash Flow positive, Revenue Growth (> 5%), EPS Growth (> 5%), low Debt-to-Equity (< 0.5), and positive Buybacks. Each passing criterion adds 1 point, for a maximum score of 8."
    },
    {
      question: "What does 'Undervalued' mean?",
      answer: "A stock is considered undervalued when its current P/E ratio is lower than our calculated Fair P/E. Fair P/E is determined by quality score - higher quality companies deserve higher valuations. The Value Gap percentage shows how much the stock is under or overvalued."
    },
    {
      question: "What are Crown Jewels?",
      answer: "Crown Jewels are our curated selection of high-quality stocks that meet strict quality and valuation criteria. These are potential 'hidden gems' with strong fundamentals and attractive valuations."
    },
    {
      question: "How often is data updated?",
      answer: "Stock prices and basic data are updated throughout the trading day. Fundamental metrics are updated quarterly when companies report earnings."
    },
    {
      question: "Is this financial advice?",
      answer: "No. Quality Metrics provides educational information and analysis tools only. We are not financial advisors. Always do your own research and consult with a qualified financial advisor before making investment decisions."
    },
    {
      question: "What's included in the free tier?",
      answer: "Free users can view basic stock information, overall QM scores, and valuation status. Premium features include detailed metric breakdowns, Crown Jewels access, and advanced screener filters."
    },
    {
      question: "How does the 14-day trial work?",
      answer: "When you sign up, you get full access to all premium features for 14 days, no credit card required. After the trial, you can upgrade to premium or continue with the free tier."
    }
  ],
  fi: [
    {
      question: "Mikä on Quality Metrics?",
      answer: "Quality Metrics on osakeanalyysialusta, joka arvioi yrityksiä fundamentaalisilla laatumittareilla. Autamme sijoittajia löytämään aliarvostettuja laatuosakkeita analysoimalla kannattavuutta, kasvua, taseen vahvuutta ja arvostusta."
    },
    {
      question: "Miten QM-pisteet lasketaan?",
      answer: "QM-pisteet perustuvat 8 fundamenttikriteeriin: Pääoman tuotto (ROIC > 10%), Bruttokate (> 40%), Liikevoittomarginaali (> 15%), Positiivinen vapaa kassavirta, Liikevaihdon kasvu (> 5%), EPS-kasvu (> 5%), Alhainen velkaantuneisuus (< 0.5), ja Positiiviset takaisinostot. Jokainen täytetty kriteeri antaa 1 pisteen, maksimi on 8."
    },
    {
      question: "Mitä 'Aliarvostettu' tarkoittaa?",
      answer: "Osake katsotaan aliarvostetuksi, kun sen nykyinen P/E-luku on alhaisempi kuin laskettu Oikea P/E. Oikea P/E määräytyy laatupisteiden perusteella - korkeamman laadun yritykset ansaitsevat korkeamman arvostuksen. Arvoero-prosentti näyttää, kuinka paljon osake on ali- tai yliarvostettu."
    },
    {
      question: "Mitä ovat Kruununjalokivet?",
      answer: "Kruununjalokivet ovat kuratoitu valikoima korkealaatuisia osakkeita, jotka täyttävät tiukat laatu- ja arvostuskriteerit. Nämä ovat potentiaalisia 'piilotettuja helmiä' vahvoilla fundamenteilla ja houkuttelevilla arvostuksilla."
    },
    {
      question: "Kuinka usein data päivitetään?",
      answer: "Osakekurssit ja perustiedot päivittyvät kaupankäyntipäivän aikana. Fundamenttimittarit päivitetään neljännesvuosittain, kun yritykset raportoivat tuloksensa."
    },
    {
      question: "Onko tämä sijoitusneuvontaa?",
      answer: "Ei. Quality Metrics tarjoaa vain opetuksellista tietoa ja analyysityökaluja. Emme ole sijoitusneuvojia. Tee aina oma tutkimuksesi ja konsultoi pätevää sijoitusneuvojaa ennen sijoituspäätöksiä."
    },
    {
      question: "Mitä ilmaiseen tasoon sisältyy?",
      answer: "Ilmaiskäyttäjät näkevät osakkeiden perustiedot, kokonais-QM-pisteet ja arvostustilan. Premium-ominaisuuksiin kuuluvat yksityiskohtaiset mittarierittelyt, Kruununjalokivet-pääsy ja edistyneet screener-suodattimet."
    },
    {
      question: "Miten 14 päivän kokeilu toimii?",
      answer: "Rekisteröityessäsi saat täyden pääsyn kaikkiin premium-ominaisuuksiin 14 päiväksi, luottokorttia ei tarvita. Kokeilun jälkeen voit päivittää premiumiin tai jatkaa ilmaisella tasolla."
    }
  ]
};

export default function FAQPage() {
  const { lang, t } = useLanguage();
  const items = faqItems[lang];

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
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-[var(--foreground)] mb-4">
            {t('faq.title')}
          </h1>
          <p className="text-[var(--foreground-muted)]">
            {t('faq.subtitle')}
          </p>
        </div>

        <div className="space-y-6">
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
                {item.question}
              </h3>
              <p className="text-[var(--foreground-muted)] leading-relaxed">
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
