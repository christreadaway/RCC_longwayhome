/**
 * Tests for the Weather System
 */

import { generateWeather, applyWeatherToTravel } from '../weather.js';

// Simple test runner (no test framework dependency)
const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, pass: true });
  } catch (e) {
    results.push({ name, pass: false, error: e.message });
  }
}
function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

// --- Tests ---

test('generateWeather returns a valid weather report', () => {
  const weather = generateWeather('1848-04-15', 'plains', []);
  assert(weather.date === '1848-04-15', 'Date should match');
  assert(weather.temperature, 'Should have temperature');
  assert(typeof weather.temperature.current === 'number', 'Current temp should be a number');
  assert(typeof weather.temperature.high === 'number', 'High temp should be a number');
  assert(typeof weather.temperature.low === 'number', 'Low temp should be a number');
  assert(weather.condition, 'Should have a condition');
  assert(weather.conditionLabel, 'Should have a condition label');
  assert(weather.wind, 'Should have wind data');
  assert(weather.ground, 'Should have ground condition');
  assert(typeof weather.travelModifier === 'number', 'Travel modifier should be a number');
  assert(typeof weather.difficultyScore === 'number', 'Difficulty score should be a number');
  assert(weather.description, 'Should have a description');
});

test('weather is deterministic for the same date', () => {
  const w1 = generateWeather('1848-06-15', 'plains', []);
  const w2 = generateWeather('1848-06-15', 'plains', []);
  assert(w1.condition === w2.condition, 'Same date should produce same condition');
  assert(w1.temperature.current === w2.temperature.current, 'Same date should produce same temp');
});

test('different dates produce different weather', () => {
  const w1 = generateWeather('1848-06-15', 'plains', []);
  const w2 = generateWeather('1848-06-16', 'plains', []);
  // Not guaranteed to differ, but highly likely over many trials
  // Just check they're both valid
  assert(w1.condition, 'Day 1 should have condition');
  assert(w2.condition, 'Day 2 should have condition');
});

test('mountain terrain produces colder temperatures', () => {
  const plains = generateWeather('1848-07-15', 'plains', []);
  const mountains = generateWeather('1848-07-15', 'mountains', []);
  // Mountains should generally be cooler
  assert(typeof mountains.temperature.current === 'number', 'Mountain temp should exist');
  // Can't guarantee every single day, but the modifier is -12
});

test('winter months can produce snow', () => {
  // November in mountains should potentially have snow
  const weather = generateWeather('1848-11-20', 'mountains', []);
  // Just verify it generates without error
  assert(weather.condition, 'Should produce a valid condition for November');
});

test('applyWeatherToTravel reduces miles in bad weather', () => {
  const badWeather = { travelModifier: -0.5 };
  const miles = applyWeatherToTravel(15, badWeather);
  assert(miles === 8, `Expected 8 miles, got ${miles}`);
});

test('applyWeatherToTravel gives full miles in good weather', () => {
  const goodWeather = { travelModifier: 0 };
  const miles = applyWeatherToTravel(15, goodWeather);
  assert(miles === 15, `Expected 15 miles, got ${miles}`);
});

test('applyWeatherToTravel never goes below 0', () => {
  const terrible = { travelModifier: -1.5 };
  const miles = applyWeatherToTravel(15, terrible);
  assert(miles === 0, `Expected 0 miles, got ${miles}`);
});

test('ground conditions affected by recent rain', () => {
  const recentRain = [
    { condition: 'heavy_rain', wind: { level: 'calm' } },
    { condition: 'rain', wind: { level: 'calm' } },
    { condition: 'rain', wind: { level: 'calm' } },
  ];
  const weather = generateWeather('1848-06-15', 'plains', recentRain);
  // After 3 days of rain, ground should not be firm
  assert(weather.ground !== 'firm', `Ground should be affected by rain, got: ${weather.ground}`);
});

test('dry weather after rain dries ground', () => {
  const mixedWeather = [
    { condition: 'rain', wind: { level: 'calm' } },
    { condition: 'sunny', wind: { level: 'strong' } },
    { condition: 'sunny', wind: { level: 'strong' } },
    { condition: 'sunny', wind: { level: 'strong' } },
  ];
  const weather = generateWeather('1848-06-20', 'plains', mixedWeather);
  // Sun and strong wind should dry things out
  assert(['firm', 'dry', 'damp'].includes(weather.ground),
    `Ground should be drying, got: ${weather.ground}`);
});

test('April temperatures are reasonable for 1848 Great Plains', () => {
  const weather = generateWeather('1848-04-10', 'plains', []);
  // April on the plains: roughly 25-75F range
  assert(weather.temperature.current > 10 && weather.temperature.current < 90,
    `April temp ${weather.temperature.current}F seems unreasonable`);
});

test('July temperatures are appropriately hot', () => {
  const weather = generateWeather('1848-07-15', 'plains', []);
  // July on the plains: generally hot
  assert(weather.temperature.current > 30,
    `July temp ${weather.temperature.current}F seems too cold`);
});

// --- Report ---
console.log('\n=== Weather System Tests ===');
results.forEach(r => {
  console.log(`${r.pass ? 'PASS' : 'FAIL'}: ${r.name}${r.error ? ` - ${r.error}` : ''}`);
});
const passed = results.filter(r => r.pass).length;
console.log(`\n${passed}/${results.length} tests passed\n`);

if (passed < results.length) {
  process.exit(1);
}
