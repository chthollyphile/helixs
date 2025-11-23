export interface ServiceApp {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name or image url
  category: 'media' | 'system' | 'network' | 'dev' | 'home';
  lanUrl: string;
  wanUrl: string;
  status: 'online' | 'offline' | 'maintenance';
  stats?: {
    label: string;
    value: string;
  }[];
}

export type NetworkMode = 'LAN' | 'WAN';

export interface Point3D {
  x: number;
  y: number;
  z: number;
  id: string;
  app: ServiceApp;
}