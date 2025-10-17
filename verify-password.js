const bcrypt = require('bcryptjs');

const hash = "$2a$10$X3bxdmHkZmJtHkXxIFz6Ru7y4/Gzv3qvGZx4BjjGlm2bJzM2UxuCa";

const possiblePasswords = [
  "admin123",
  "Admin123",
  "Revelation2025",
  "MonMotDePasseAdmin123", // Remplacez par le mot de passe que vous essayez
];

possiblePasswords.forEach(pwd => {
  bcrypt.compare(pwd, hash).then(isMatch => {
    console.log(`"${pwd}": ${isMatch ? '✅ CORRECT' : '❌ incorrect'}`);
  });
});