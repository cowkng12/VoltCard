import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Plus,
  Settings,
  Shield,
  Snowflake,
  Wallet
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type CardProduct = {
  id: 'subscriptions' | 'wallet-pay';
  name: string;
  tag: string;
  description: string;
};

type IssuedCard = {
  product: CardProduct;
  holderName: string;
  deposit: number;
  number: string;
  expiry: string;
  cvv: string;
};

type Step = 'home' | 'holder' | 'deposit' | 'issued' | 'manage';

const products: CardProduct[] = [
  {
    id: 'subscriptions',
    name: 'Subscription Virtual Card',
    tag: 'Digital services',
    description:
      'Built for subscriptions and digital products like ChatGPT, Spotify, Cursor, Netflix, Adobe, YouTube Premium and more.'
  },
  {
    id: 'wallet-pay',
    name: 'Apple Pay / Google Pay Card',
    tag: 'Everyday spend',
    description:
      'Designed for Apple Pay and Google Pay, with a clean setup for daily purchases and mobile-first payments.'
  }
];

const transactions = [
  { name: 'OpenAI ChatGPT', type: 'Subscription', amount: -20, icon: 'AI' },
  { name: 'Top up', type: 'Balance deposit', amount: 250, icon: '+' },
  { name: 'Spotify', type: 'Music', amount: -10.99, icon: 'SP' }
];

const page = {
  initial: { opacity: 0, y: 18, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -18, filter: 'blur(8px)' },
  transition: { duration: 0.28, ease: 'easeOut' as const }
};

function generateCard(product: CardProduct, holderName: string, deposit: number): IssuedCard {
  const suffix = product.id === 'subscriptions' ? '8429' : '3817';

  return {
    product,
    holderName: holderName.toUpperCase(),
    deposit,
    number: `4786 11${product.id === 'subscriptions' ? '24' : '98'} 90${product.id === 'subscriptions' ? '73' : '45'} ${suffix}`,
    expiry: '08/29',
    cvv: product.id === 'subscriptions' ? '294' : '731'
  };
}

function App() {
  const [step, setStep] = useState<Step>('home');
  const [selectedProduct, setSelectedProduct] = useState<CardProduct>(products[0]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [deposit, setDeposit] = useState('');
  const [issuedCard, setIssuedCard] = useState<IssuedCard | null>(null);
  const [showCvv, setShowCvv] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);

  const telegramName = useMemo(() => {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    return user?.first_name ?? 'Alex';
  }, []);

  const holderName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const depositValue = Number(deposit);
  const canContinueHolder = firstName.trim().length > 1 && lastName.trim().length > 1;
  const canContinueDeposit = Number.isFinite(depositValue) && depositValue >= 10;

  useEffect(() => {
    window.Telegram?.WebApp?.ready();
    window.Telegram?.WebApp?.expand();
  }, []);

  function haptic() {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
  }

  function selectProduct(product: CardProduct) {
    haptic();
    setSelectedProduct(product);
    setStep('holder');
  }

  function issueCard() {
    const card = generateCard(selectedProduct, holderName, depositValue);
    setIssuedCard(card);
    haptic();
    setStep('issued');
  }

  async function copyCardNumber() {
    if (!issuedCard) return;
    await navigator.clipboard?.writeText(issuedCard.number.replaceAll(' ', ''));
    haptic();
  }

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className="phone-frame">
        <AppHeader step={step} onBack={() => setStep(step === 'holder' ? 'home' : step === 'deposit' ? 'holder' : 'manage')} />

        <AnimatePresence mode="wait">
          {step === 'home' && (
            <motion.div key="home" {...page} className="screen">
              <Hero name={telegramName} />
              <div className="quick-actions">
                <Action icon={<Plus size={18} />} label="Top Up" />
                <Action icon={<ArrowUpRight size={18} />} label="Send" />
                <Action icon={<Shield size={18} />} label="Security" />
              </div>

              <SectionTitle eyebrow="Recommended" title="Virtual cards" />
              <div className="product-list">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} onSelect={() => selectProduct(product)} />
                ))}
              </div>
            </motion.div>
          )}

          {step === 'holder' && (
            <motion.div key="holder" {...page} className="screen flow-screen">
              <FlowIntro step="01" title="Cardholder details" text={`Issue your ${selectedProduct.name} in seconds.`} />
              <div className="glass-panel form-panel">
                <label>
                  First name
                  <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Alex" />
                </label>
                <label>
                  Last name
                  <input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Morgan" />
                </label>
              </div>
              <PrimaryButton disabled={!canContinueHolder} onClick={() => setStep('deposit')}>
                Continue
              </PrimaryButton>
            </motion.div>
          )}

          {step === 'deposit' && (
            <motion.div key="deposit" {...page} className="screen flow-screen">
              <FlowIntro step="02" title="Add initial deposit" text="Choose the amount you want available on this card." />
              <div className="glass-panel form-panel deposit-panel">
                <label>
                  Deposit amount
                  <div className="money-input">
                    <span>$</span>
                    <input
                      inputMode="decimal"
                      value={deposit}
                      onChange={(event) => setDeposit(event.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="100"
                    />
                  </div>
                </label>
                {!canContinueDeposit && deposit.length > 0 && <p className="hint">Minimum deposit: $10</p>}
              </div>
              <PrimaryButton disabled={!canContinueDeposit} onClick={issueCard}>
                Create virtual card
              </PrimaryButton>
            </motion.div>
          )}

          {step === 'issued' && issuedCard && (
            <motion.div key="issued" {...page} className="screen flow-screen issued-screen">
              <FlowIntro step="03" title="Your card is ready" text="VoltCard created a secure virtual card for online payments." />
              <BankCard card={issuedCard} showCvv />
              <PrimaryButton onClick={() => setStep('manage')}>Manage card</PrimaryButton>
            </motion.div>
          )}

          {step === 'manage' && issuedCard && (
            <motion.div key="manage" {...page} className="screen">
              <div className="manage-top">
                <div>
                  <span className="muted">Available balance</span>
                  <h1>${issuedCard.deposit.toFixed(2)}</h1>
                </div>
                <button className={isFrozen ? 'status-pill frozen' : 'status-pill'} onClick={() => setIsFrozen((value) => !value)}>
                  {isFrozen ? 'Frozen' : 'Active'}
                </button>
              </div>

              <BankCard card={issuedCard} showCvv={showCvv} frozen={isFrozen} />

              <div className="card-actions-grid">
                <Action icon={<ArrowDownLeft size={18} />} label="Top Up" />
                <Action icon={<ArrowUpRight size={18} />} label="Withdraw" />
                <Action icon={showCvv ? <EyeOff size={18} /> : <Eye size={18} />} label={showCvv ? 'Hide CVV' : 'Show CVV'} onClick={() => setShowCvv((value) => !value)} />
                <Action icon={<Copy size={18} />} label="Copy" onClick={copyCardNumber} />
                <Action icon={<Snowflake size={18} />} label="Freeze" onClick={() => setIsFrozen((value) => !value)} />
                <Action icon={<Settings size={18} />} label="Settings" />
              </div>

              <div className="glass-panel details-panel">
                <div><span>Cardholder</span><strong>{issuedCard.holderName}</strong></div>
                <div><span>Product</span><strong>{issuedCard.product.name}</strong></div>
                <div><span>Card number</span><strong>{issuedCard.number}</strong></div>
              </div>

              <SectionTitle eyebrow="Recent" title="Operations" />
              <div className="transactions">
                {transactions.map((item) => (
                  <div className="transaction" key={item.name}>
                    <div className="transaction-icon">{item.icon}</div>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.type}</span>
                    </div>
                    <b className={item.amount > 0 ? 'positive' : ''}>{item.amount > 0 ? '+' : '-'}${Math.abs(item.amount).toFixed(2)}</b>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}

function AppHeader({ step, onBack }: { step: Step; onBack: () => void }) {
  return (
    <header className="app-header">
      {step === 'home' ? <div className="brand-mark">V</div> : <button className="icon-button" onClick={onBack}>Back</button>}
      <span>VoltCard</span>
      <button className="icon-button"><Bell size={17} /></button>
    </header>
  );
}

function Hero({ name }: { name: string }) {
  return (
    <div className="hero-card glass-panel">
      <span className="muted">Good evening, {name}</span>
      <h1>$2,480.64</h1>
      <p>Total balance across VoltCard wallets</p>
      <div className="hero-row">
        <span>Premium account</span>
        <b>+4.8%</b>
      </div>
    </div>
  );
}

function ProductCard({ product, onSelect }: { product: CardProduct; onSelect: () => void }) {
  return (
    <article className="product-card glass-panel">
      <div className="mini-card-preview"><Wallet size={22} /><span>{product.tag}</span></div>
      <div className="product-content">
        <span className="tag">{product.tag}</span>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <button onClick={onSelect}>Get Card <ChevronRight size={16} /></button>
      </div>
    </article>
  );
}

function BankCard({ card, showCvv, frozen = false }: { card: IssuedCard; showCvv: boolean; frozen?: boolean }) {
  return (
    <motion.div className={frozen ? 'bank-card frozen-card' : 'bank-card'} initial={{ rotateX: 22, scale: 0.94 }} animate={{ rotateX: 0, scale: 1 }} transition={{ duration: 0.55, ease: 'easeOut' }}>
      <div className="card-glow" />
      <div className="card-top"><span>VoltCard</span><Lock size={18} /></div>
      <div className="chip" />
      <strong className="card-number">{card.number}</strong>
      <div className="card-bottom">
        <div><span>Cardholder</span><b>{card.holderName}</b></div>
        <div><span>Expires</span><b>{card.expiry}</b></div>
        <div><span>CVV</span><b>{showCvv ? card.cvv : '***'}</b></div>
      </div>
    </motion.div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div className="section-title"><span>{eyebrow}</span><h2>{title}</h2></div>;
}

function FlowIntro({ step, title, text }: { step: string; title: string; text: string }) {
  return <div className="flow-intro"><span>{step}</span><h1>{title}</h1><p>{text}</p></div>;
}

function Action({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return <button className="action-button" onClick={onClick}>{icon}<span>{label}</span></button>;
}

function PrimaryButton({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick: () => void }) {
  return <button className="primary-button" disabled={disabled} onClick={onClick}>{children}</button>;
}

export default App;
