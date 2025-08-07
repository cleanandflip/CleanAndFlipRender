import React from 'react';

// NUCLEAR TEST COMPONENT - ABSOLUTE SIMPLEST POSSIBLE ADMIN PAGE
export default function AdminTest() {
  return (
    <div style={{
      backgroundColor: '#FF0000',
      color: '#FFFFFF',
      fontSize: '48px',
      fontWeight: 'bold',
      textAlign: 'center',
      padding: '100px',
      minHeight: '100vh'
    }}>
      🚨 ADMIN TEST PAGE - {Date.now()} 🚨
      <br />
      THIS IS THE SIMPLEST POSSIBLE ADMIN COMPONENT
      <br />
      IF YOU SEE THIS, THE PROBLEM IS WITH THE MAIN ADMIN FILE
    </div>
  );
}