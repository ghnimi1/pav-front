// Script pour reinitialiser les jeux et partages pour les tests

// Simuler localStorage pour Node.js
const fs = require('fs');

// Ce script doit etre execute cote client
// On va plutot modifier le fichier loyalty_game_plays directement

console.log("Pour reinitialiser les jeux, executez ce code dans la console du navigateur:");
console.log(`
// Reinitialiser les jeux et partages
localStorage.setItem("loyalty_game_plays", "[]");
Object.keys(localStorage).filter(k => k.includes("chichbich_share")).forEach(k => localStorage.removeItem(k));
location.reload();
`);
