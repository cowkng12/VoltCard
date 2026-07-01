import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ChevronRight,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  Plus,
  Settings,
  Shield,
  Snowflake
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

type Step = 'home' | 'holder' | 'deposit' | 'issued' | 'manage' | 'profile' | 'notifications';

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
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [issuedCard, setIssuedCard] = useState<IssuedCard | null>(null);
  const [issuedCards, setIssuedCards] = useState<IssuedCard[]>([]);
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

  function setCarouselProduct(index: number) {
    setCarouselIndex(index);
    haptic();
  }

  function swipeCarousel(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.x < -45) setCarouselProduct((carouselIndex + 1) % products.length);
    if (info.offset.x > 45) setCarouselProduct((carouselIndex - 1 + products.length) % products.length);
  }

  function issueCard() {
    const card = generateCard(selectedProduct, holderName, depositValue);
    setIssuedCard(card);
    setIssuedCards((cards) => [card, ...cards]);
    haptic();
    setStep('issued');
  }

  function goBack() {
    if (step === 'holder') setStep('home');
    else if (step === 'deposit') setStep('holder');
    else if (step === 'profile' || step === 'notifications') setStep('home');
    else setStep('manage');
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
        <AppHeader
          step={step}
          hasUnread={issuedCards.length > 0}
          onBack={goBack}
          onProfile={() => setStep('profile')}
          onNotifications={() => setStep('notifications')}
        />

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
              <ProductCarousel
                activeIndex={carouselIndex}
                products={products}
                onSelectProduct={selectProduct}
                onSwipe={swipeCarousel}
                onSetActive={setCarouselProduct}
              />
            </motion.div>
          )}

          {step === 'profile' && (
            <motion.div key="profile" {...page} className="screen">
              <FlowIntro step="Profile" title="Your cards" text="Manage purchased VoltCard products and jump back into card controls." />
              <div className="profile-summary glass-panel">
                <div className="profile-avatar">V</div>
                <div>
                  <strong>{telegramName}</strong>
                  <span>{issuedCards.length} active card{issuedCards.length === 1 ? '' : 's'}</span>
                </div>
              </div>

              <SectionTitle eyebrow="Purchased" title="Cards" />
              <div className="owned-cards">
                {issuedCards.length === 0 && <EmptyState title="No cards yet" text="Issued virtual cards will appear here after purchase." />}
                {issuedCards.map((card) => (
                  <button className="owned-card glass-panel" key={`${card.product.id}-${card.number}`} onClick={() => { setIssuedCard(card); setStep('manage'); }}>
                    <CardArtwork product={card.product} compact />
                    <div>
                      <strong>{card.product.name}</strong>
                      <span>{card.number.slice(-4).padStart(card.number.length, '*')}</span>
                    </div>
                    <ChevronRight size={18} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'notifications' && (
            <motion.div key="notifications" {...page} className="screen">
              <FlowIntro step="Messages" title="Activity" text="Card updates and purchase notifications will appear here." />
              <div className="notifications-list">
                {issuedCards.length === 0 && <EmptyState title="No messages" text="After you issue a card and make purchases, VoltCard will show messages here." />}
                {issuedCards.length > 0 && (
                  <NotificationItem title="Card issued" text={`${issuedCards[0].product.name} is active and ready for online payments.`} amount={`$${issuedCards[0].deposit.toFixed(2)}`} />
                )}
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
                <EmptyState title="No operations yet" text="Real purchases, top ups and withdrawals will appear here after they happen." />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}

function AppHeader({
  step,
  hasUnread,
  onBack,
  onProfile,
  onNotifications
}: {
  step: Step;
  hasUnread: boolean;
  onBack: () => void;
  onProfile: () => void;
  onNotifications: () => void;
}) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  function openMyCards() {
    setIsProfileMenuOpen(false);
    onProfile();
  }

  return (
    <header className="app-header">
      {step === 'home' ? <button className="icon-button notification-button" onClick={onNotifications}><Bell size={17} />{hasUnread && <i />}</button> : <button className="icon-button" onClick={onBack}>Back</button>}
      <span>VoltCard</span>
      <div className="header-actions">
        {step !== 'home' && <button className="icon-button notification-button" onClick={onNotifications}><Bell size={17} />{hasUnread && <i />}</button>}
        <div className={`profile-menu-wrap ${isProfileMenuOpen ? 'menu-open' : ''}`}>
          <button className="brand-mark" onClick={() => setIsProfileMenuOpen((value) => !value)}>V</button>
          <div className="profile-menu glass-panel">
            <button onClick={openMyCards}><CreditCard size={15} />My Cards</button>
          </div>
        </div>
      </div>
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

function ProductCarousel({
  products,
  activeIndex,
  onSelectProduct,
  onSwipe,
  onSetActive
}: {
  products: CardProduct[];
  activeIndex: number;
  onSelectProduct: (product: CardProduct) => void;
  onSwipe: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  onSetActive: (index: number) => void;
}) {
  const activeProduct = products[activeIndex];

  return (
    <div className="product-carousel">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeProduct.id}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={onSwipe}
          initial={{ opacity: 0, x: 28, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -28, scale: 0.98 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
        >
          <ProductCard product={activeProduct} onSelect={() => onSelectProduct(activeProduct)} />
        </motion.div>
      </AnimatePresence>

      <div className="carousel-dots" aria-label="Virtual card carousel">
        {products.map((product, index) => (
          <button
            key={product.id}
            className={index === activeIndex ? 'active' : ''}
            aria-label={`Show ${product.name}`}
            onClick={() => onSetActive(index)}
          />
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product, onSelect }: { product: CardProduct; onSelect: () => void }) {
  return (
    <article className="product-card glass-panel">
      <CardArtwork product={product} />
      <div className="product-content">
        <span className="tag">{product.tag}</span>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <button onClick={onSelect}>Get Card <ChevronRight size={16} /></button>
      </div>
    </article>
  );
}

function CardArtwork({ product, compact = false }: { product: CardProduct; compact?: boolean }) {
  return (
    <div className={`card-art ${product.id === 'wallet-pay' ? 'wallet-art' : 'subscription-art'} ${compact ? 'compact-art' : ''}`}>
      <div className="art-brand"><span>Volt</span><b>Card</b></div>
      {product.id === 'wallet-pay' && <div className="pay-label">Apple Pay / Google Pay</div>}
      <div className="art-chip" />
      <div className="art-contactless" />
      <div className="art-number">4578 1234 5678 9012</div>
      <div className="art-footer">
        <span>{product.id === 'subscriptions' ? 'SUBSCRIPTIONS' : 'WALLET PAY'}</span>
        <b>VISA</b>
      </div>
      <div className="art-bolt" />
    </div>
  );
}

function BankCard({ card, showCvv, frozen = false }: { card: IssuedCard; showCvv: boolean; frozen?: boolean }) {
  return (
    <motion.div className={`${frozen ? 'bank-card frozen-card' : 'bank-card'} ${card.product.id === 'wallet-pay' ? 'wallet-bank-card' : ''}`} initial={{ rotateX: 22, scale: 0.94 }} animate={{ rotateX: 0, scale: 1 }} transition={{ duration: 0.55, ease: 'easeOut' }}>
      <div className="card-glow" />
      <div className="card-lightning" />
      <div className="card-top"><span>Volt<b>Card</b></span><Lock size={18} /></div>
      {card.product.id === 'wallet-pay' && <div className="wallet-pay-copy">Apple Pay / Google Pay</div>}
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

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state glass-panel"><CreditCard size={24} /><strong>{title}</strong><span>{text}</span></div>;
}

function NotificationItem({ title, text, amount }: { title: string; text: string; amount: string }) {
  return (
    <div className="notification-item glass-panel">
      <div className="notification-dot"><Bell size={16} /></div>
      <div><strong>{title}</strong><span>{text}</span></div>
      <b>{amount}</b>
    </div>
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
