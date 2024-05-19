import "@/styles/globals.css";
import "@radix-ui/themes/styles.css";
import type { AppProps } from "next/app";
import { Theme } from '@radix-ui/themes';
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton
} from '@clerk/nextjs';

const Header = () => (
  <header className="header">
    <div className="header-left">
      <img src="/images/open-rabbit-icon.png" alt="Logo" className="logo" />
      <h1 className="app-title">Open Rabbit</h1>
    </div>
    <div className="header-right">
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <SignInButton />
      </SignedOut>
    </div>
  </header>
);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider>
      <Header />
      <Theme>
        <Component {...pageProps} />
      </Theme>
    </ClerkProvider>
  );
}
