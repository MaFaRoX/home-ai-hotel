/**
 * Quick App Switcher - Development Helper
 * 
 * Copy and paste these functions into your browser console (F12)
 * to quickly switch between apps during testing.
 */

// Switch to Hotel App
function switchToHotel() {
  console.log('🏨 Switching to Hotel App...');
  localStorage.clear();
  console.log('✅ localStorage cleared');
  console.log('📝 Now edit /App.tsx to: export { default } from "./App-Hotel";');
  console.log('🔄 Then reload the page');
}

// Switch to Guest House App
function switchToGuestHouse() {
  console.log('🏠 Switching to Guest House App...');
  localStorage.clear();
  console.log('✅ localStorage cleared');
  console.log('📝 Now edit /App.tsx to: export { default } from "./App-GuestHouse";');
  console.log('🔄 Then reload the page');
}

// Switch to Boarding House App
function switchToBoardingHouse() {
  console.log('🏘️ Switching to Boarding House App...');
  localStorage.clear();
  console.log('✅ localStorage cleared');
  console.log('📝 Now edit /App.tsx to: export { default } from "./App-BoardingHouse";');
  console.log('🔄 Then reload the page');
}

// Check current business model
function checkCurrentModel() {
  const model = localStorage.getItem('hotel-app-business-model');
  const hotel = localStorage.getItem('hotel-app-hotel');
  
  console.log('🔍 Current State:');
  console.log('Business Model:', model ? JSON.parse(model) : 'Not set');
  
  if (hotel) {
    const hotelData = JSON.parse(hotel);
    console.log('Hotel Name:', hotelData.name);
    console.log('Hotel Model:', hotelData.businessModel);
  } else {
    console.log('Hotel:', 'Not setup yet');
  }
}

// Clear all data
function clearAll() {
  localStorage.clear();
  console.log('✅ All localStorage data cleared!');
  console.log('🔄 Reload page to start fresh');
}

// Show help
function help() {
  console.log('🎯 Quick App Switcher Commands:');
  console.log('');
  console.log('switchToHotel()         - Switch to Hotel App');
  console.log('switchToGuestHouse()    - Switch to Guest House App');
  console.log('switchToBoardingHouse() - Switch to Boarding House App');
  console.log('checkCurrentModel()     - Check current business model');
  console.log('clearAll()              - Clear all localStorage data');
  console.log('help()                  - Show this help');
}

console.log('🚀 App Switcher loaded! Type help() for commands.');
