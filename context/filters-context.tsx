'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ViolationType, ViolationSeverity, ViolationStatus } from '@/lib/types';

interface FiltersContextType {
  dateRange: { start: Date; end: Date };
  selectedZones: string[];
  violationType?: ViolationType;
  severity?: ViolationSeverity;
  status?: ViolationStatus;
  setDateRange: (range: { start: Date; end: Date }) => void;
  setSelectedZones: (zones: string[]) => void;
  setViolationType: (type?: ViolationType) => void;
  setSeverity: (severity?: ViolationSeverity) => void;
  setStatus: (status?: ViolationStatus) => void;
  reset: () => void;
}

const FiltersContext = createContext<FiltersContextType | undefined>(undefined);

const DEFAULT_DATE_RANGE = {
  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  end: new Date()
};

const DEFAULT_ZONES = ['Financial District', 'SOMA', 'Mission District', 'Marina', 'Richmond', 'Sunset', 'Tenderloin'];

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [dateRange, setDateRange] = useState(DEFAULT_DATE_RANGE);
  const [selectedZones, setSelectedZones] = useState(DEFAULT_ZONES);
  const [violationType, setViolationType] = useState<ViolationType | undefined>();
  const [severity, setSeverity] = useState<ViolationSeverity | undefined>();
  const [status, setStatus] = useState<ViolationStatus | undefined>();

  const reset = useCallback(() => {
    setDateRange(DEFAULT_DATE_RANGE);
    setSelectedZones(DEFAULT_ZONES);
    setViolationType(undefined);
    setSeverity(undefined);
    setStatus(undefined);
  }, []);

  const value: FiltersContextType = {
    dateRange,
    selectedZones,
    violationType,
    severity,
    status,
    setDateRange,
    setSelectedZones,
    setViolationType,
    setSeverity,
    setStatus,
    reset
  };

  return (
    <FiltersContext.Provider value={value}>
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters(): FiltersContextType {
  const context = useContext(FiltersContext);
  if (!context) {
    throw new Error('useFilters must be used within FiltersProvider');
  }
  return context;
}
