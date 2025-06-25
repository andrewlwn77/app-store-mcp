#!/usr/bin/env node

// Quick test to verify the MCP server is working
import { spawn } from 'child_process';

console.log('Testing App Store MCP Server...\n');

const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let hasInitialized = false;

server.stderr.on('data', (data) => {
  const message = data.toString();
  console.log('Server:', message.trim());
  
  if (message.includes('App Store MCP server running')) {
    hasInitialized = true;
    
    // Send initialize request
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {}
      }
    };
    
    server.stdin.write(JSON.stringify(initRequest) + '\n');
  }
});

server.stdout.on('data', (data) => {
  try {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      const response = JSON.parse(line);
      console.log('Response:', JSON.stringify(response, null, 2));
      
      if (response.id === 1) {
        // Send list tools request
        const listToolsRequest = {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list',
          params: {}
        };
        server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
      } else if (response.id === 2) {
        console.log('\n✅ Server is working! Found', response.result.tools.length, 'tools:');
        response.result.tools.forEach(tool => {
          console.log(`  - ${tool.name}: ${tool.description}`);
        });
        
        // Clean exit
        server.kill();
        process.exit(0);
      }
    });
  } catch (e) {
    // Ignore parse errors for partial data
  }
});

server.on('error', (err) => {
  console.error('❌ Error starting server:', err);
  process.exit(1);
});

setTimeout(() => {
  if (!hasInitialized) {
    console.error('❌ Server did not initialize within 5 seconds');
    server.kill();
    process.exit(1);
  }
}, 5000);