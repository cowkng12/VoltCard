# VoltCard

VoltCard is a premium Telegram Mini App prototype for issuing and managing virtual payment cards. The interface is built in English and follows a black, Electric Blue fintech visual language inspired by modern products like Revolut, Wise, Stripe and Monzo.

## Stack

- React, TypeScript and Vite for the Mini App
- Framer Motion for smooth page transitions and card animations
- Express and Zod for the API foundation
- Telegraf for the Telegram bot entrypoint

## Features

- Premium home dashboard with total balance and quick actions
- Two recommended card products: Subscription Virtual Card and Apple Pay / Google Pay Card
- Cardholder form with validation
- Deposit step with a minimum `$10` rule
- Animated virtual card issue screen
- Card management page with balance, operations, top up, withdrawal, card details, CVV visibility, copy card number, freeze state, settings and owner details
- Responsive mobile-first layout suitable for Telegram Mini Apps

## Getting Started

```bash
npm install
npm run dev
```

Run the API in a second terminal:

```bash
npm run dev:api
```

Run the Telegram bot after creating `.env` from `.env.example`:

```bash
npm run dev:bot
```

## Environment

Copy `.env.example` to `.env` and set:

- `BOT_TOKEN`: token from BotFather
- `MINI_APP_URL`: public HTTPS URL for the deployed Mini App
- `PORT`: API port, defaults to `4000`

## Next Architecture Steps

- Move demo card issuing from client state to `/api/cards`
- Add persistent database models for users, cards, transactions and referrals
- Add Telegram init data validation on the API
- Add admin panel routes and role-based access control
- Add crypto top ups, cashback, analytics, premium plans and notifications
