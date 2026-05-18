export function generateSecurePassword(): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*';
  const all = upper + lower + digits + special;

  const randomIndex = (max: number) => {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    return bytes[0] % max;
  };

  // Guarantee at least one character from each required set
  const required = [
    upper[randomIndex(upper.length)],
    lower[randomIndex(lower.length)],
    digits[randomIndex(digits.length)],
    special[randomIndex(special.length)],
  ];

  const rest = Array.from({ length: 8 }, () => all[randomIndex(all.length)]);

  // Fisher-Yates shuffle using crypto randomness
  const chars = [...required, ...rest];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}