// Générer un mot de passe sécurisé
export function generateSecurePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  
  // Assurer au moins une majuscule, une minuscule, un chiffre et un caractère spécial
  password += chars.charAt(Math.floor(Math.random() * 26)); // Majuscule
  password += chars.charAt(26 + Math.floor(Math.random() * 26)); // Minuscule
  password += chars.charAt(52 + Math.floor(Math.random() * 10)); // Chiffre
  password += chars.charAt(62 + Math.floor(Math.random() * 8)); // Caractère spécial
  
  // Compléter avec des caractères aléatoires
  for (let i = 4; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Mélanger le mot de passe
  return password.split('').sort(() => Math.random() - 0.5).join('');
} 