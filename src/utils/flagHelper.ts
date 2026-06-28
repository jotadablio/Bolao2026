const flagMapping: Record<string, string> = {
  "África do Sul": "za",
  "Canadá": "ca",
  "Brasil": "br",
  "Japão": "jp",
  "Alemanha": "de",
  "Paraguai": "py",
  "Holanda": "nl",
  "Marrocos": "ma",
  "Costa do Marfim": "ci",
  "Noruega": "no",
  "França": "fr",
  "Suécia": "se",
  "México": "mx",
  "Equador": "ec",
  "Inglaterra": "gb",
  "RD Congo": "cd",
  "Bélgica": "be",
  "Senegal": "sn",
  "Estados Unidos": "us",
  "Bósnia": "ba",
  "Espanha": "es",
  "Áustria": "at",
  "Portugal": "pt",
  "Croácia": "hr",
  "Suíça": "ch",
  "Argélia": "dz",
  "Austrália": "au",
  "Egito": "eg",
  "Argentina": "ar",
  "Cabo Verde": "cv",
  "Colômbia": "co",
  "Gana": "gh"
};

export function getFlagUrl(countryName: string): string | null {
  const code = flagMapping[countryName];
  if (code) {
    return `https://flagcdn.com/w80/${code}.png`;
  }
  return null;
}
