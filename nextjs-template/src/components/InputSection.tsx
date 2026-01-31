'use client';

import { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';
import { Box, TextField, Button, Paper, Typography, Chip, Stack, List, ListItem, ListItemText } from '@mui/material';
import { Send, Delete, Circle } from '@mui/icons-material';

// --- CONFIGURATION ---

// OPTION 1: Local Broker (Run 'node local-broker.js' in terminal)
const MQTT_HOST = 'ws://localhost:8884';
const MQTT_USERNAME = undefined;
const MQTT_PASSWORD = undefined;

// OPTION 2: HiveMQ Cloud (Reference)
// const MQTT_HOST = 'wss://<YOUR_ID>.s1.eu.hivemq.cloud:8884/mqtt';
// const MQTT_USERNAME = '...';
// const MQTT_PASSWORD = '...';

const MQTT_TOPIC = 'my/test/topic';

export default function InputSection() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'Disconnected' | 'Connecting' | 'Connected'>('Disconnected');
  const clientRef = useRef<mqtt.MqttClient | null>(null);

  useEffect(() => {
    // Prevent double connection in React Strict Mode
    if (clientRef.current) return;

    setConnectionStatus('Connecting');
    
    console.log('Connecting to MQTT broker...');
    const client = mqtt.connect(MQTT_HOST, {
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,
      // protocol: 'wss', // Let URL decide (ws:// or wss://)
    });

    clientRef.current = client;

    client.on('connect', () => {
      console.log('Connected to MQTT Broker');
      setConnectionStatus('Connected');
      client.subscribe(MQTT_TOPIC, (err) => {
        if (!err) {
          console.log(`Subscribed to ${MQTT_TOPIC}`);
        } else {
            console.error('Subscription error:', err);
        }
      });
    });

    client.on('message', (topic, message) => {
      const msg = message.toString();
      console.log(`Received message: ${msg} on topic: ${topic}`);
      setMessages((prev) => [msg, ...prev]);
    });

    client.on('error', (err) => {
      console.error('Connection error: ', err);
      // setConnectionStatus('Disconnected'); // Optional: update status on error
    });

    client.on('close', () => {
        console.log('Connection closed');
        // setConnectionStatus('Disconnected'); 
    });
    
    // Cleanup on unmount
    return () => {
      if (client.connected) {
          client.end();
      }
      clientRef.current = null;
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      if (clientRef.current && clientRef.current.connected) {
        clientRef.current.publish(MQTT_TOPIC, inputValue);
        console.log('Published:', inputValue);
        setInputValue('');
      } else {
        alert('Not connected to MQTT broker!');
      }
    }
  };

  const handleClear = () => {
    setInputValue('');
  };

  return (
    <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', background: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
                MQTT Messaging
            </Typography>
            <Chip 
                icon={<Circle sx={{ fontSize: 12, color: connectionStatus === 'Connected' ? 'success.main' : 'error.main' }} />} 
                label={connectionStatus} 
                variant="outlined" 
                size="small"
                color={connectionStatus === 'Connected' ? 'success' : 'default'}
            />
        </Box>

      <Box component="form" onSubmit={handleSubmit} noValidate autoComplete="off" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TextField 
          label="Message" 
          variant="outlined" 
          fullWidth 
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button type="submit" variant="contained" size="large" endIcon={<Send />} disableElevation disabled={!inputValue.trim() || connectionStatus !== 'Connected'}>
            Publish
          </Button>
           <Button variant="outlined" size="large" startIcon={<Delete />} color="error" onClick={handleClear} disabled={!inputValue}>
            Clear Input
          </Button>
        </Box>
      </Box>

      {messages.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>
                Received Messages ({MQTT_TOPIC}):
            </Typography>
            <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'grey.50' }}>
                <List dense>
                    {messages.map((msg, index) => (
                        <ListItem key={index} divider={index !== messages.length - 1}>
                            <ListItemText primary={msg} />
                        </ListItem>
                    ))}
                </List>
            </Paper>
          </Box>
      )}
    </Paper>
  );
}
