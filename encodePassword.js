// encodePassword.js
const password = "92h14VpQimwjYGh8"; // Votre mot de passe actuel

const encoded = encodeURIComponent(password);

console.log("Mot de passe original :", password);
console.log("Mot de passe encodé   :", encoded);
console.log("\nURI complète :");
console.log(`mongodb+srv://aminiroland01_db_user:${encoded}@cluster0.6npjt8l.mongodb.net/revelation?retryWrites=true&w=majority&appName=Cluster0`);