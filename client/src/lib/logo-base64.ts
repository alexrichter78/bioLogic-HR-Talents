import logoUrl from "@assets/LOGO_bio_1773853681939.png";

let cachedDataUrl: string | null = null;

export async function getLogoDataUrl(): Promise<string> {
  if (cachedDataUrl) return cachedDataUrl;
  const resp = await fetch(logoUrl);
  const blob = await resp.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      cachedDataUrl = reader.result as string;
      resolve(cachedDataUrl);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
