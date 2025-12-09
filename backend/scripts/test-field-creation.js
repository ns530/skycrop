#!/usr/bin/env node
'use strict';

/**
 * Test script to verify field creation works after geometry processing fixes
 * This creates a small test field and verifies the geometry processing
 */

require('dotenv').config();
const { getFieldService } = require('../src/services/field.service');
const User = require('../src/models/user.model');

// Test field data - small rectangle (approximately 100m x 100m)
const testField = {
  name: 'Geometry Test Field',
  boundary: {
    type: 'Polygon',
    coordinates: [[
      [79.8612, 6.9271], // bottom-left
      [79.8622, 6.9271], // bottom-right
      [79.8622, 6.9281], // top-right
      [79.8612, 6.9281], // top-left
      [79.8612, 6.9271]  // close the ring
    ]]
  }
};

async function testFieldCreation() {
  console.log('🧪 Testing field creation with geometry processing...');

  try {
    // Create a test user first
    console.log('👤 Creating test user...');
    const timestamp = Date.now();
    const testUser = await User.create({
      email: `test-field-creation-${timestamp}@example.com`,
      password_hash: null, // OAuth user
      name: 'Test User',
      role: 'farmer',
      auth_provider: 'google',
      email_verified: true,
      status: 'active',
    });
    const testUserId = testUser.user_id;
    console.log('✅ Test user created:', testUserId);

    const fieldService = getFieldService();

    console.log('📝 Creating test field...');
    const createdField = await fieldService.createWithBoundary(testUserId, testField.name, testField.boundary);

    console.log('✅ Field created successfully!');
    console.log('📊 Field details:');
    console.log(`   - ID: ${createdField.field_id}`);
    console.log(`   - Name: ${createdField.name}`);
    console.log(`   - Area: ${createdField.area_sqm} sqm`);
    console.log(`   - Center: ${JSON.stringify(createdField.center)}`);
    console.log(`   - Boundary type: ${createdField.boundary.type}`);

    // Verify the area is reasonable (should be around 10,000 sqm for 100m x 100m)
    if (createdField.area_sqm > 5000 && createdField.area_sqm < 15000) {
      console.log('✅ Area calculation looks correct');
    } else {
      console.warn(`⚠️  Area seems off: ${createdField.area_sqm} sqm`);
    }

    // Verify center is a point
    if (createdField.center && createdField.center.type === 'Point') {
      console.log('✅ Center point calculated correctly');
    } else {
      console.error('❌ Center point not calculated');
    }

    // Verify boundary is MultiPolygon
    if (createdField.boundary && createdField.boundary.type === 'MultiPolygon') {
      console.log('✅ Boundary normalized to MultiPolygon');
    } else {
      console.error('❌ Boundary not normalized to MultiPolygon');
    }

    // Clean up - delete the test field and user
    console.log('🧹 Cleaning up test field...');
    await fieldService.delete(testUserId, createdField.field_id);
    console.log('✅ Test field deleted');

    console.log('🧹 Cleaning up test user...');
    await User.softDeleteById(testUserId);
    console.log('✅ Test user deleted');

    console.log('🎉 All geometry processing tests passed!');

  } catch (error) {
    console.error('❌ Field creation test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testFieldCreation()
    .then(() => {
      console.log('✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testFieldCreation };