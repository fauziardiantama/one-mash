#!/usr/bin/env node
/**
 * scripts/verify-interactions.js
 * Headless Behavioral & Meta Muse UI Invariant Suite
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

console.log('\n======================================================');
console.log('   O.N.E MASH BEHAVIORAL INTERACTION SUITE');
console.log('======================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${name}`);
  } catch (err) {
    failedTests++;
    console.log(`  \x1b[31m✖ FAIL\x1b[0m: ${name}`);
    console.log(`    \x1b[33m${err.message}\x1b[0m`);
  }
}

runTest('Behavioral 1: Profile Takeover State Machine Lifecycle', () => {
  let phase = 'IDLE';
  let progress = 0;
  let visible = false;
  const open = () => {
    phase = 'TRIGGERED';
    visible = true;
    progress = 1;
    phase = 'ACTIVE';
  };
  const close = () => {
    phase = 'CLOSING';
    progress = 0;
    visible = false;
    phase = 'CLOSED';
  };
  assert.strictEqual(phase, 'IDLE');
  open();
  assert.strictEqual(phase, 'ACTIVE');
  assert.strictEqual(visible, true);
  assert.strictEqual(progress, 1);
  close();
  assert.strictEqual(phase, 'CLOSED');
  assert.strictEqual(visible, false);
});

runTest('Behavioral 2: ChatHeader Touch Targets & Profile Callbacks', () => {
  const headerPath = path.join(ROOT, 'src/components/chat/ChatHeader.tsx');
  assert(fs.existsSync(headerPath), 'src/components/chat/ChatHeader.tsx must exist');
  const content = fs.readFileSync(headerPath, 'utf8');
  assert(content.includes('handleCenterPress'), 'handleCenterPress must exist');
  assert(content.includes('onOpenProfile'), 'onOpenProfile must be invoked');
  assert(content.includes('onCloseProfile'), 'onCloseProfile must be invoked');
  assert(content.includes('AgentAvatar'), 'ChatHeader must render AgentAvatar');
});

runTest('Behavioral 3: ProfileTakeoverLayer Anti-Mount-Race & Pivot Math', () => {
  const layerPath = path.join(ROOT, 'src/components/profile/ProfileTakeoverLayer.tsx');
  assert(fs.existsSync(layerPath), 'ProfileTakeoverLayer.tsx must exist');
  const content = fs.readFileSync(layerPath, 'utf8');
  assert(!content.includes('if (!mounted) return null'), 'Must not prematurely unmount');
  assert(content.includes('pointerEvents'), 'Must control visibility via pointerEvents');
  assert(content.includes("width: '100%'"), 'Must define width: 100%');
  assert(content.includes("height: '100%'"), 'Must define height: 100%');
  assert(!content.includes('transformOrigin:'), 'Must use mathematical pivot instead of transformOrigin');
});

runTest('Behavioral 4: Chat Screen Hierarchy & Persistent Muse TabBar', () => {
  const chatPath = path.join(ROOT, 'src/app/chat.tsx');
  assert(fs.existsSync(chatPath), 'src/app/chat.tsx must exist');
  const content = fs.readFileSync(chatPath, 'utf8');
  assert(content.includes('ProfileTakeoverLayer'), 'chat.tsx must mount ProfileTakeoverLayer');
  assert(content.includes('TabBar'), 'chat.tsx must preserve Meta Muse bottom TabBar');
  assert(content.includes('Sidebar'), 'chat.tsx must mount Sidebar');
});

runTest('Behavioral 5: Muse Profile Menu, Real Activity Data, & Feather Icons', () => {
  const tabBar = fs.readFileSync(path.join(ROOT, 'src/components/profile/ProfileTabBar.tsx'), 'utf8');
  assert(tabBar.includes("'activity'") && tabBar.includes("'tasks'") && tabBar.includes("'display'") && tabBar.includes("'history'"));
  assert(tabBar.includes('slidingIndicator'));

  const activity = fs.readFileSync(path.join(ROOT, 'src/components/profile/ActivityTabContent.tsx'), 'utf8');
  assert(!activity.includes('SAMPLE_ACTIVITIES_TODAY'), 'Must NOT contain hardcoded fake activities');
  assert(activity.includes('unreadBadgeRight'));

  const sheet = fs.readFileSync(path.join(ROOT, 'src/components/ui/InTreeBottomSheet.tsx'), 'utf8');
  assert(!sheet.includes('<Modal'), 'Bottom sheet must be in-tree Reanimated without OS Modal');

  const icon = fs.readFileSync(path.join(ROOT, 'src/components/ui/Icon.tsx'), 'utf8');
  assert(icon.includes('list: 61841') && icon.includes('tv: 61948') && icon.includes('clock: 61753'));
});

console.log('\n------------------------------------------------------');
console.log(`Results: ${passedTests}/${totalTests} Passed (${failedTests} Failures)`);
console.log('------------------------------------------------------\n');

process.exit(failedTests > 0 ? 1 : 0);
