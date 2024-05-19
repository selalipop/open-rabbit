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
} from '@clerk/nextjs'
export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider>
       <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
    <Theme>
      <Component {...pageProps} />
    </Theme>
    </ClerkProvider>
  );
}
