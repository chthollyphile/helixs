import { ServiceApp } from './types';

/* 
  HOW TO USE DYNAMIC STATS:
  Add a "statsUrl" property to any service object.
  The URL should point to an API endpoint that returns JSON in this format:
  [
    { "label": "CPU", "value": "20%" },
    { "label": "RAM", "value": "4.2GB" }
  ]
  
  Example:
  {
    ...
    statsUrl: "http://192.168.1.10:3000/api/system-stats"
  }
*/

export const services: ServiceApp[] = [
  {
    id: '1',
    name: 'DASHBOARD',
    description: 'Main system overview and resource monitoring hub.',
    icon: 'LayoutDashboard',
    category: 'system',
    lanUrl: 'http://192.168.1.10:3000',
    wanUrl: 'https://dash.homelab.com',
    status: 'online', // Initial status, will be auto-checked
    stats: [{ label: 'CPU', value: '12%' }, { label: 'RAM', value: '8GB' }]
  },
  {
    id: '2',
    name: 'PLEX MEDIA',
    description: 'Centralized media streaming server for movies and TV.',
    icon: 'Play',
    category: 'media',
    lanUrl: 'http://192.168.1.15:32400',
    wanUrl: 'https://plex.homelab.com',
    status: 'online',
    stats: [{ label: 'Streams', value: '2' }, { label: 'Lib', value: '12TB' }]
  },
  {
    id: '3',
    name: 'HOME ASSISTANT',
    description: 'IoT automation core and smart home controller.',
    icon: 'Home',
    category: 'home',
    lanUrl: 'http://192.168.1.20:8123',
    wanUrl: 'https://hass.homelab.com',
    status: 'online',
    stats: [{ label: 'Devices', value: '42' }, { label: 'Auto', value: 'Active' }]
  },
  {
    id: '4',
    name: 'GRAFANA',
    description: 'Data visualization and metrics analytics platform.',
    icon: 'BarChart3',
    category: 'system',
    lanUrl: 'http://192.168.1.12:3000',
    wanUrl: 'https://grafana.homelab.com',
    status: 'online',
    stats: [{ label: 'Panels', value: '15' }, { label: 'Alerts', value: '0' }]
  },
  {
    id: '5',
    name: 'PI-HOLE',
    description: 'Network-wide ad blocking and DNS sinkhole.',
    icon: 'Shield',
    category: 'network',
    lanUrl: 'http://192.168.1.5/admin',
    wanUrl: 'https://dns.homelab.com',
    status: 'online',
    stats: [{ label: 'Blocked', value: '24k' }, { label: 'Rate', value: '14%' }]
  },
  {
    id: '6',
    name: 'TRUE NAS',
    description: 'Enterprise-grade storage and ZFS management.',
    icon: 'Database',
    category: 'system',
    lanUrl: 'http://192.168.1.8',
    wanUrl: 'https://nas.homelab.com',
    status: 'maintenance',
    stats: [{ label: 'Pool', value: 'Healthy' }, { label: 'Free', value: '4TB' }]
  },
  {
    id: '7',
    name: 'VS CODE SERVER',
    description: 'Remote development environment in browser.',
    icon: 'Code',
    category: 'dev',
    lanUrl: 'http://192.168.1.50:8080',
    wanUrl: 'https://code.homelab.com',
    status: 'offline',
    stats: [{ label: 'Workspace', value: 'Idle' }]
  },
  {
    id: '8',
    name: 'DOCKER PORTAINER',
    description: 'Container management and orchestration UI.',
    icon: 'Box',
    category: 'system',
    lanUrl: 'http://192.168.1.10:9000',
    wanUrl: 'https://docker.homelab.com',
    status: 'online',
    stats: [{ label: 'Containers', value: '18' }, { label: 'Images', value: '45' }]
  },
  {
    id: '9',
    name: 'JELLYFIN',
    description: 'Open source media system alternative.',
    icon: 'Film',
    category: 'media',
    lanUrl: 'http://192.168.1.16:8096',
    wanUrl: 'https://jelly.homelab.com',
    status: 'online',
    stats: []
  },
  {
    id: '10',
    name: 'NEXTCLOUD',
    description: 'Self-hosted productivity platform and file sync.',
    icon: 'Cloud',
    category: 'home',
    lanUrl: 'http://192.168.1.30',
    wanUrl: 'https://cloud.homelab.com',
    status: 'online',
    stats: [{ label: 'Storage', value: '500GB' }]
  }
];