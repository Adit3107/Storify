"use client";

import type { ThemeProviderProps } from "next-themes";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ImageKitProvider } from "imagekitio-next";
import { createContext, useContext } from "react";
import { Toaster } from "@/components/ui/sonner";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

// Create a context for ImageKit authentication
export const ImageKitAuthContext = createContext<{
  authenticate: () => Promise<{
    signature: string;
    token: string;
    expire: number;
  }>;
}>({
  authenticate: async () => ({ signature: "", token: "", expire: 0 }),
});

export const useImageKitAuth = () => useContext(ImageKitAuthContext);

// ImageKit authentication function
const authenticator = async () => {
  try {
    const response = await fetch("/api/imagekit-auth");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Authentication error:", error);
    throw error;
  }
};

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <ImageKitProvider
      authenticator={authenticator}
      publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || ""}
      urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || ""}
    >
      <ImageKitAuthContext.Provider value={{ authenticate: authenticator }}>
        <NextThemesProvider {...themeProps}>
          {children}
          <Toaster />
        </NextThemesProvider>
      </ImageKitAuthContext.Provider>
    </ImageKitProvider>
  );
}