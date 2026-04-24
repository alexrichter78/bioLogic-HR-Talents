import { createContext, useContext, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ALL_TRANSLATIONS } from "./all-translations";
import { apiRequest } from "./queryClient";

export interface DbTranslation {
  key: string;
  section: string;
  de: string;
  en: string;
  fr: string;
  it: string;
  updatedAt: string;
}

interface TranslationContextValue {
  translations: Map<string, DbTranslation>;
  isLoaded: boolean;
  get(key: string, lang: "de" | "en" | "fr" | "it"): string | undefined;
  updateField(key: string, lang: "de" | "en" | "fr" | "it", value: string): Promise<void>;
}

const TranslationContext = createContext<TranslationContextValue>({
  translations: new Map(),
  isLoaded: false,
  get: () => undefined,
  updateField: async () => {},
});

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const seededRef = useRef(false);

  const { data: rows = [], isSuccess } = useQuery<DbTranslation[]>({
    queryKey: ["/api/translations"],
    staleTime: 60_000,
    retry: false,
  });

  const seedMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/translations/seed", ALL_TRANSLATIONS),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/translations"] });
    },
  });

  useEffect(() => {
    if (isSuccess && rows.length === 0 && !seededRef.current) {
      seededRef.current = true;
      seedMutation.mutate();
    }
  }, [isSuccess, rows.length]);

  const translationMap = new Map<string, DbTranslation>(rows.map(r => [r.key, r]));

  const updateField = async (key: string, lang: "de" | "en" | "fr" | "it", value: string) => {
    await apiRequest("PATCH", `/api/translations/${encodeURIComponent(key)}`, { lang, value });
    queryClient.invalidateQueries({ queryKey: ["/api/translations"] });
  };

  const get = (key: string, lang: "de" | "en" | "fr" | "it"): string | undefined => {
    const entry = translationMap.get(key);
    if (!entry) return undefined;
    return entry[lang] || undefined;
  };

  return (
    <TranslationContext.Provider value={{
      translations: translationMap,
      isLoaded: isSuccess && rows.length > 0,
      get,
      updateField,
    }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslationContext() {
  return useContext(TranslationContext);
}
