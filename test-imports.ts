import { roomRepo } from './src/server/repositories/room';
import { gameSessionRepo } from './src/server/repositories/gameSession';
import { wordRepo } from './src/server/repositories/word';

console.log('roomRepo methods:', Object.keys(roomRepo));
console.log('gameSessionRepo methods:', Object.keys(gameSessionRepo));
console.log('wordRepo methods:', Object.keys(wordRepo));
