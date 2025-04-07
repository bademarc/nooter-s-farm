"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Accessibility, X } from "lucide-react";
import Cookies from 'js-cookie';

export function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    colorblindMode: 'none' // 'none', 'protanopia', 'deuteranopia', 'tritanopia'
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('accessibility-settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    }
  }, []);

  // Apply settings when they change
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply high contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Apply large text
    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    
    // Apply reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    
    // Apply colorblind modes
    root.setAttribute('data-colorblind-mode', settings.colorblindMode);
    
    // Apply colorblind filter to the body
    const body = document.body;
    // Remove any existing color filter classes
    body.classList.remove('color-filter-protanopia', 'color-filter-deuteranopia', 'color-filter-tritanopia');
    
    // Add the appropriate filter class if a colorblind mode is selected
    if (settings.colorblindMode !== 'none') {
      body.classList.add(`color-filter-${settings.colorblindMode}`);
      
      // Also save to cookie for server rendering
      Cookies.set('colorblind-mode', settings.colorblindMode, { expires: 365 });
    } else {
      // Remove the cookie if no colorblind mode is selected
      Cookies.remove('colorblind-mode');
    }
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    }
  }, [settings]);

  return (
    <div className="relative z-50">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="icon"
        className="rounded-none border border-[#333] bg-black text-white hover:bg-[#222]"
        aria-label="Accessibility settings"
      >
        <Accessibility className="h-5 w-5" />
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-black border border-[#333] p-4 slide-in noot-text">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-white">Accessibility</h3>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-white hover:bg-[#222]" 
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="high-contrast" className="text-sm text-white">High Contrast</label>
              <input 
                id="high-contrast"
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => setSettings({...settings, highContrast: e.target.checked})}
                className="h-4 w-4 border border-[#333]"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label htmlFor="large-text" className="text-sm text-white">Large Text</label>
              <input 
                id="large-text"
                type="checkbox"
                checked={settings.largeText}
                onChange={(e) => setSettings({...settings, largeText: e.target.checked})}
                className="h-4 w-4 border border-[#333]"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label htmlFor="reduced-motion" className="text-sm text-white">Reduced Motion</label>
              <input 
                id="reduced-motion"
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) => setSettings({...settings, reducedMotion: e.target.checked})}
                className="h-4 w-4 border border-[#333]"
              />
            </div>
            
            <div className="space-y-1">
              <label htmlFor="colorblind-mode" className="block text-sm text-white">Colorblind Mode</label>
              <select
                id="colorblind-mode"
                value={settings.colorblindMode}
                onChange={(e) => setSettings({...settings, colorblindMode: e.target.value})}
                className="w-full bg-[#111] border border-[#333] p-1.5 text-sm text-white rounded-none"
              >
                <option value="none">None</option>
                <option value="protanopia" className="text-red-500">Protanopia (Red-Blind)</option>
                <option value="deuteranopia" className="text-green-500">Deuteranopia (Green-Blind)</option>
                <option value="tritanopia" className="text-blue-500">Tritanopia (Blue-Blind)</option>
              </select>
            </div>
            
            {/* Colorblind mode preview */}
            <div className="mt-3 pt-3 border-t border-[#333]">
              <div className="text-sm text-white mb-2">Preview:</div>
              <div className={`grid grid-cols-4 gap-2 ${settings.colorblindMode !== 'none' ? `color-filter-${settings.colorblindMode}` : ''}`}>
                <div className="h-5 bg-red-500" title="Red"></div>
                <div className="h-5 bg-green-500" title="Green"></div>
                <div className="h-5 bg-blue-500" title="Blue"></div>
                <div className="h-5 bg-yellow-500" title="Yellow"></div>
              </div>
              <div className="mt-2 text-xs text-white/60">
                {settings.colorblindMode === 'none' && "Normal color vision"}
                {settings.colorblindMode === 'protanopia' && "Red colors appear darker"}
                {settings.colorblindMode === 'deuteranopia' && "Green colors appear differently"}
                {settings.colorblindMode === 'tritanopia' && "Blue colors appear differently"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 