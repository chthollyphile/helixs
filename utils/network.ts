import { NetworkMode, ServiceApp } from '../types';

export const detectNetworkMode = (): NetworkMode => {
  const hostname = window.location.hostname;
  
  // Basic private IP detection regex
  const isLocal = 
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    (hostname.startsWith('172.') && parseInt(hostname.split('.')[1], 10) >= 16 && parseInt(hostname.split('.')[1], 10) <= 31) ||
    hostname.endsWith('.local');

  return isLocal ? 'LAN' : 'WAN';
};

export const getActiveUrl = (app: ServiceApp, mode: NetworkMode): string => {
  return mode === 'LAN' ? app.lanUrl : app.wanUrl;
};

export const checkServiceStatus = async (url: string): Promise<'online' | 'offline'> => {
  try {
    const response = await fetch(`/api/status?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    return data.status === 'online' ? 'online' : 'offline';
  } catch (error) {
    return 'offline';
  }
};
